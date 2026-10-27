// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "../src/BatchSellExecutor.sol";

// Minimal test harness
contract MockERC20 is IERC20 {
    string public name;
    string public symbol;
    uint8 public decimals = 18;
    mapping(address => uint256) public override balanceOf;
    mapping(address => mapping(address => uint256)) public allowance;

    constructor(string memory _name, string memory _symbol) {
        name = _name;
        symbol = _symbol;
    }

    function mint(address to, uint256 amount) external {
        balanceOf[to] += amount;
    }

    function transfer(address to, uint256 amount) external override returns (bool) {
        require(balanceOf[msg.sender] >= amount, "Balance too low");
        balanceOf[msg.sender] -= amount;
        balanceOf[to] += amount;
        return true;
    }

    function transferFrom(address from, address to, uint256 amount) external override returns (bool) {
        require(balanceOf[from] >= amount, "Balance too low");
        require(allowance[from][msg.sender] >= amount, "Allowance too low");
        allowance[from][msg.sender] -= amount;
        balanceOf[from] -= amount;
        balanceOf[to] += amount;
        return true;
    }

    function approve(address spender, uint256 amount) external override returns (bool) {
        allowance[msg.sender][spender] = amount;
        return true;
    }
}

contract MockFourMemeRouter is IFourMemeRouter {
    uint256 public rate = 1000; // 1000 tokens = 1 ether BNB

    receive() external payable {}

    function sellToken(
        address token,
        uint256 amount,
        uint256 minBnbExpected
    ) external override returns (uint256 bnbReceived) {
        // Pull token from caller (BatchSellExecutor)
        IERC20(token).transferFrom(msg.sender, address(this), amount);
        bnbReceived = (amount * 1 ether) / (rate * 1e18);
        require(bnbReceived >= minBnbExpected, "MockFourMeme: Slippage exceeded");
        (bool sent, ) = msg.sender.call{value: bnbReceived}("");
        require(sent, "BNB send failed");
    }
}

contract BatchSellExecutorTest {
    BatchSellExecutor public executor;
    MockFourMemeRouter public fourMemeRouter;
    MockERC20 public tokenA;
    MockERC20 public tokenB;
    address public user = address(0x1234);

    function setUp() public {
        fourMemeRouter = new MockFourMemeRouter();
        // Fund mock router with 10 BNB
        (bool funded, ) = address(fourMemeRouter).call{value: 10 ether}("");
        require(funded, "Funding router failed");

        executor = new BatchSellExecutor(address(fourMemeRouter), address(0));
        tokenA = new MockERC20("MemeAlpha", "ALPHA");
        tokenB = new MockERC20("MemeBeta", "BETA");

        tokenA.mint(user, 10_000 * 1e18);
        tokenB.mint(user, 20_000 * 1e18);
    }
}
