// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/**
 * @dev Minimal interface for ERC20
 */
interface IERC20 {
    function balanceOf(address account) external view returns (uint256);
    function transfer(address to, uint256 amount) external returns (bool);
    function transferFrom(address from, address to, uint256 amount) external returns (bool);
    function approve(address spender, uint256 amount) external returns (bool);
}

/**
 * @dev Interface for FourMeme bonding curve router
 */
interface IFourMemeRouter {
    function sellToken(
        address token,
        uint256 amount,
        uint256 minBnbExpected
    ) external returns (uint256 bnbReceived);
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

    function WETH() external pure returns (address);
}

/**
 * @title BatchSellExecutor
 * @notice Smart contract enabling atomic multi-token batch selling on BNB Chain for FourMeme and PancakeSwap
 * @dev Strict non-custodial architecture: never holds funds, refunds all BNB in the same call.
 */
contract BatchSellExecutor {
    // Contract Owner / Admin
    address public owner;
    
    // Circuit breaker pause
    bool public paused;

    // Whitelisted execution targets to prevent arbitrary external calls
    mapping(address => bool) public isWhitelistedRouter;

    // Mutex reentrancy guard
    uint256 private _status;
    uint256 private constant _NOT_ENTERED = 1;
    uint256 private constant _ENTERED = 2;

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

    event BatchExecuted(
        address indexed seller,
        uint256 totalBnbReceived,
        uint256 successfulOrders,
        uint256 timestamp
    );
    event RouterWhitelistUpdated(address indexed router, bool isWhitelisted);
    event PausedStateChanged(bool isPaused);

    error ReentrancyGuardTriggered();
    error ContractIsPaused();
    error NotOwner();
    error EmptyBatch();
    error RouterNotWhitelisted(address router);
    error SlippageExceeded(uint256 totalReceived, uint256 minExpected);
    error ZeroAddressProvided();
    error EthTransferFailed();

    modifier nonReentrant() {
        if (_status == _ENTERED) revert ReentrancyGuardTriggered();
        _status = _ENTERED;
        _;
        _status = _NOT_ENTERED;
    }

    modifier whenNotPaused() {
        if (paused) revert ContractIsPaused();
        _;
    }

    modifier onlyOwner() {
        if (msg.sender != owner) revert NotOwner();
        _;
    }

    constructor(
        address _fourMemeRouter,
        address _pancakeRouter
    ) {
        owner = msg.sender;
        _status = _NOT_ENTERED;

        if (_fourMemeRouter != address(0)) {
            isWhitelistedRouter[_fourMemeRouter] = true;
            emit RouterWhitelistUpdated(_fourMemeRouter, true);
        }
        if (_pancakeRouter != address(0)) {
            isWhitelistedRouter[_pancakeRouter] = true;
            emit RouterWhitelistUpdated(_pancakeRouter, true);
        }
    }

    receive() external payable {}

    /**
     * @notice Execute an atomic batch of token sales
     * @param orders List of tokens and execution parameters
     * @param minTotalBnbOut Minimum aggregate BNB expected to prevent MEV / sandwich losses
     * @param deadline Unix timestamp after which transaction reverts
     */
    function executeBatchSell(
        SellOrder[] calldata orders,
        uint256 minTotalBnbOut,
        uint256 deadline
    ) external nonReentrant whenNotPaused returns (uint256 totalBnbReceived) {
        if (block.timestamp > deadline) revert("BatchSell: Transaction expired");
        uint256 length = orders.length;
        if (length == 0) revert EmptyBatch();

        uint256 initialBnbBalance = address(this).balance;

        for (uint256 i = 0; i < length; ) {
            SellOrder calldata order = orders[i];

            if (!isWhitelistedRouter[order.routerTarget]) {
                revert RouterNotWhitelisted(order.routerTarget);
            }

            // Pull tokens from user to executor
            bool pulled = IERC20(order.token).transferFrom(
                msg.sender,
                address(this),
                order.tokenAmount
            );
            require(pulled, "BatchSell: Token transferFrom failed");

            // Approve router to spend pulled tokens
            IERC20(order.token).approve(order.routerTarget, 0); // Safe reset
            IERC20(order.token).approve(order.routerTarget, order.tokenAmount);

            if (order.protocol == ProtocolType.FourMemeCurve) {
                // Execute FourMeme curve sell
                IFourMemeRouter(order.routerTarget).sellToken(
                    order.token,
                    order.tokenAmount,
                    order.minBnbOut
                );
            } else if (order.protocol == ProtocolType.PancakeSwapV2) {
                // Execute PancakeSwap V2 sell
                address weth = IPancakeRouter02(order.routerTarget).WETH();
                address[] memory path = new address[](2);
                path[0] = order.token;
                path[1] = weth;

                IPancakeRouter02(order.routerTarget)
                    .swapExactTokensForETHSupportingFeeOnTransferTokens(
                        order.tokenAmount,
                        order.minBnbOut,
                        path,
                        address(this),
                        deadline
                    );
            }

            unchecked {
                ++i;
            }
        }

        totalBnbReceived = address(this).balance - initialBnbBalance;

        // Global slippage check
        if (totalBnbReceived < minTotalBnbOut) {
            revert SlippageExceeded(totalBnbReceived, minTotalBnbOut);
        }

        // Refund all received BNB immediately to msg.sender (non-custodial)
        (bool sent, ) = payable(msg.sender).call{value: totalBnbReceived}("");
        if (!sent) revert EthTransferFailed();

        emit BatchExecuted(msg.sender, totalBnbReceived, length, block.timestamp);
    }

    // Owner management functions
    function setRouterWhitelist(address router, bool isWhitelisted) external onlyOwner {
        if (router == address(0)) revert ZeroAddressProvided();
        isWhitelistedRouter[router] = isWhitelisted;
        emit RouterWhitelistUpdated(router, isWhitelisted);
    }

    function setPaused(bool _paused) external onlyOwner {
        paused = _paused;
        emit PausedStateChanged(_paused);
    }

    function transferOwnership(address newOwner) external onlyOwner {
        if (newOwner == address(0)) revert ZeroAddressProvided();
        owner = newOwner;
    }
}
