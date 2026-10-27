// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

/**
 * @dev Interface for FourMeme bonding curve router
 */
interface IFourMemeRouter {
    function sellToken(address token, uint256 amount, uint256 minBnbExpected) external returns (uint256 bnbReceived);
}

/**
 * @dev Minimal interface for PancakeSwap Router
 */
interface IPancakeRouter02 {
    function swapExactTokensForETHSupportingFeeOnTransferTokens(
        uint256 amountIn,
        uint256 amountOutMin,
        address[] calldata path,
        address to,
        uint256 deadline
    ) external;

    function WETH() external view returns (address);
}

/**
 * @title BatchSellExecutor
 * @notice Secure, non-custodial batch sell executor for BNB Chain.
 * Enables atomic multi-token sales on verified routers (PancakeSwap DEX and FourMeme bonding curve).
 * @dev Strictly adheres to Checks-Effects-Interactions, reentrancy guards, fee-on-transfer token accounting,
 * and router whitelisting. Holds ZERO custody: all output BNB is immediately forwarded to the validated recipient.
 */
contract BatchSellExecutor is ReentrancyGuard, Ownable {
    using SafeERC20 for IERC20;

    // Safety limits
    uint256 public constant MAX_BATCH_SIZE = 25;

    // Circuit breaker pause
    bool public paused;

    // Execution safety switch for FourMeme bonding curve (disabled by default until verified)
    bool public allowFourMemeExecution;

    // Whitelisted execution targets to prevent arbitrary external calls
    mapping(address => bool) public isWhitelistedRouter;

    enum ProtocolType {
        FourMemeCurve,
        PancakeSwapV2
    }

    struct SellOrder {
        address token;
        ProtocolType protocol;
        address routerTarget;
        uint256 tokenAmount;
        uint256 minBnbOut;
    }

    // Events
    event BatchExecuted(
        address indexed seller,
        address indexed recipient,
        uint256 totalBnbReceived,
        uint256 successfulOrders,
        uint256 timestamp
    );
    event SingleSellExecuted(
        address indexed seller,
        address indexed recipient,
        address indexed token,
        uint256 tokenAmount,
        uint256 bnbReceived,
        uint256 timestamp
    );
    event RouterWhitelistUpdated(address indexed router, bool isWhitelisted);
    event FourMemeExecutionToggled(bool isEnabled);
    event PausedStateChanged(bool isPaused);

    // Custom Errors
    error ContractIsPaused();
    error EmptyBatch();
    error BatchSizeExceeded(uint256 size, uint256 max);
    error DeadlineExpired(uint256 deadline, uint256 currentTimestamp);
    error RouterNotWhitelisted(address router);
    error InvalidRecipient(address recipient);
    error ZeroAddressProvided();
    error ZeroAmountProvided();
    error SlippageExceeded(uint256 totalReceived, uint256 minExpected);
    error IndividualSlippageExceeded(address token, uint256 received, uint256 minExpected);
    error InsufficientTokenAllowance(address token, uint256 currentAllowance, uint256 required);
    error InsufficientTokenBalance(address token, uint256 currentBalance, uint256 required);
    error FourMemeExecutionDisabled();
    error BnbTransferFailed(address recipient, uint256 amount);
    error DirectBnbDepositNotAllowed();
    error ProtocolNotSupported(ProtocolType protocol);

    modifier whenNotPaused() {
        if (paused) revert ContractIsPaused();
        _;
    }

    /**
     * @notice Contract constructor
     * @param _initialOwner Address receiving ownership for administration
     * @param _fourMemeRouter FourMeme bonding curve router (or address(0) if unconfigured)
     * @param _pancakeRouter PancakeSwap V2 router address
     * @param _enableFourMeme Initial state for FourMeme curve execution (defaults to false in production)
     */
    constructor(address _initialOwner, address _fourMemeRouter, address _pancakeRouter, bool _enableFourMeme)
        Ownable(_initialOwner)
    {
        if (_initialOwner == address(0)) revert ZeroAddressProvided();

        allowFourMemeExecution = _enableFourMeme;

        if (_fourMemeRouter != address(0)) {
            isWhitelistedRouter[_fourMemeRouter] = true;
            emit RouterWhitelistUpdated(_fourMemeRouter, true);
        }
        if (_pancakeRouter != address(0)) {
            isWhitelistedRouter[_pancakeRouter] = true;
            emit RouterWhitelistUpdated(_pancakeRouter, true);
        }
    }

    /**
     * @notice Rejects any arbitrary or accidental native BNB deposits outside of active swaps
     */
    receive() external payable {
        if (!_reentrancyGuardEntered()) {
            revert DirectBnbDepositNotAllowed();
        }
    }

    /**
     * @notice Execute an atomic batch of token sales across verified routers
     * @param orders List of tokens and execution parameters
     * @param minTotalBnbOut Minimum aggregate BNB expected across the entire batch
     * @param recipient Target account receiving the proceeds (defaults to msg.sender if address(0))
     * @param deadline Unix timestamp after which the transaction reverts
     */
    function executeBatchSell(SellOrder[] calldata orders, uint256 minTotalBnbOut, address recipient, uint256 deadline)
        external
        nonReentrant
        whenNotPaused
        returns (uint256 totalBnbReceived)
    {
        if (block.timestamp > deadline) revert DeadlineExpired(deadline, block.timestamp);

        uint256 length = orders.length;
        if (length == 0) revert EmptyBatch();
        if (length > MAX_BATCH_SIZE) revert BatchSizeExceeded(length, MAX_BATCH_SIZE);

        address targetRecipient = recipient == address(0) ? msg.sender : recipient;
        uint256 initialBnbBalance = address(this).balance;

        for (uint256 i = 0; i < length;) {
            SellOrder calldata order = orders[i];
            _executeSellOrder(order, deadline);

            unchecked {
                ++i;
            }
        }

        totalBnbReceived = address(this).balance - initialBnbBalance;

        // Global aggregate slippage check
        if (totalBnbReceived < minTotalBnbOut) {
            revert SlippageExceeded(totalBnbReceived, minTotalBnbOut);
        }

        // Emit batch event prior to transfer (Checks-Effects-Interactions)
        emit BatchExecuted(msg.sender, targetRecipient, totalBnbReceived, length, block.timestamp);

        // Immediate forward of 100% BNB to recipient (Strict Non-Custodial)
        _sendBnb(targetRecipient, totalBnbReceived);
    }

    /**
     * @notice Execute a single token sale (used by sequential execution mode)
     * @param order Single token sell order
     * @param recipient Target account receiving the BNB
     * @param deadline Unix timestamp after which transaction reverts
     */
    function executeSingleSell(SellOrder calldata order, address recipient, uint256 deadline)
        external
        nonReentrant
        whenNotPaused
        returns (uint256 bnbReceived)
    {
        if (block.timestamp > deadline) revert DeadlineExpired(deadline, block.timestamp);

        address targetRecipient = recipient == address(0) ? msg.sender : recipient;
        uint256 initialBnbBalance = address(this).balance;

        _executeSellOrder(order, deadline);

        bnbReceived = address(this).balance - initialBnbBalance;
        if (bnbReceived < order.minBnbOut) {
            revert IndividualSlippageExceeded(order.token, bnbReceived, order.minBnbOut);
        }

        emit SingleSellExecuted(
            msg.sender, targetRecipient, order.token, order.tokenAmount, bnbReceived, block.timestamp
        );

        _sendBnb(targetRecipient, bnbReceived);
    }

    /**
     * @dev Internal helper executing a single order with strict fee-on-transfer accounting
     * and individual slippage validation.
     */
    function _executeSellOrder(SellOrder calldata order, uint256 deadline) internal {
        if (order.token == address(0)) revert ZeroAddressProvided();
        if (order.tokenAmount == 0) revert ZeroAmountProvided();
        if (!isWhitelistedRouter[order.routerTarget]) {
            revert RouterNotWhitelisted(order.routerTarget);
        }

        // Validate allowance and user balance
        uint256 allowance = IERC20(order.token).allowance(msg.sender, address(this));
        if (allowance < order.tokenAmount) {
            revert InsufficientTokenAllowance(order.token, allowance, order.tokenAmount);
        }
        uint256 balance = IERC20(order.token).balanceOf(msg.sender);
        if (balance < order.tokenAmount) {
            revert InsufficientTokenBalance(order.token, balance, order.tokenAmount);
        }

        // Accurately measure tokens received to support fee-on-transfer tokens
        uint256 tokenBalBefore = IERC20(order.token).balanceOf(address(this));
        IERC20(order.token).safeTransferFrom(msg.sender, address(this), order.tokenAmount);
        uint256 actualTokensReceived = IERC20(order.token).balanceOf(address(this)) - tokenBalBefore;
        if (actualTokensReceived == 0) revert ZeroAmountProvided();

        // Approve router for exact amount received
        IERC20(order.token).forceApprove(order.routerTarget, actualTokensReceived);

        uint256 bnbBefore = address(this).balance;

        if (order.protocol == ProtocolType.FourMemeCurve) {
            if (!allowFourMemeExecution) {
                revert FourMemeExecutionDisabled();
            }
            IFourMemeRouter(order.routerTarget).sellToken(order.token, actualTokensReceived, order.minBnbOut);
        } else if (order.protocol == ProtocolType.PancakeSwapV2) {
            address weth = IPancakeRouter02(order.routerTarget).WETH();
            address[] memory path = new address[](2);
            path[0] = order.token;
            path[1] = weth;

            IPancakeRouter02(order.routerTarget)
                .swapExactTokensForETHSupportingFeeOnTransferTokens(
                    actualTokensReceived, order.minBnbOut, path, address(this), deadline
                );
        } else {
            revert ProtocolNotSupported(order.protocol);
        }

        uint256 bnbAfter = address(this).balance;
        uint256 orderReceived = bnbAfter - bnbBefore;

        // Strict individual slippage check prevents any one trade from subsidizing another
        if (orderReceived < order.minBnbOut) {
            revert IndividualSlippageExceeded(order.token, orderReceived, order.minBnbOut);
        }

        // Clean router approval hygiene
        IERC20(order.token).forceApprove(order.routerTarget, 0);
    }

    /**
     * @dev Safe BNB forwarding with explicit error reporting
     */
    function _sendBnb(address recipient, uint256 amount) internal {
        if (amount == 0) return;
        (bool sent,) = payable(recipient).call{value: amount}("");
        if (!sent) revert BnbTransferFailed(recipient, amount);
    }

    // ========================================================
    // Administrative Functions (Principle of Least Privilege)
    // ========================================================

    /**
     * @notice Whitelist or remove an execution router
     */
    function setRouterWhitelist(address router, bool isWhitelisted) external onlyOwner {
        if (router == address(0)) revert ZeroAddressProvided();
        isWhitelistedRouter[router] = isWhitelisted;
        emit RouterWhitelistUpdated(router, isWhitelisted);
    }

    /**
     * @notice Toggle FourMeme bonding curve execution safety switch
     */
    function setFourMemeExecution(bool isEnabled) external onlyOwner {
        allowFourMemeExecution = isEnabled;
        emit FourMemeExecutionToggled(isEnabled);
    }

    /**
     * @notice Emergency circuit breaker pause
     */
    function setPaused(bool _paused) external onlyOwner {
        paused = _paused;
        emit PausedStateChanged(_paused);
    }
}
