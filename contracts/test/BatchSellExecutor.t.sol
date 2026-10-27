// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Test.sol";
import "../src/BatchSellExecutor.sol";

// ==========================================
// MOCKS & TEST HARNESS CONTRACTS
// ==========================================

/**
 * @dev Standard Mock ERC-20
 */
contract MockERC20 is IERC20 {
    string public name;
    string public symbol;
    uint8 public decimals = 18;

    mapping(address => uint256) public override balanceOf;
    mapping(address => mapping(address => uint256)) public override allowance;

    constructor(string memory _name, string memory _symbol) {
        name = _name;
        symbol = _symbol;
    }

    function totalSupply() external pure override returns (uint256) {
        return 1_000_000_000 * 1e18;
    }

    function mint(address to, uint256 amount) external {
        balanceOf[to] += amount;
    }

    function transfer(address to, uint256 amount) external override returns (bool) {
        require(balanceOf[msg.sender] >= amount, "ERC20: low balance");
        balanceOf[msg.sender] -= amount;
        balanceOf[to] += amount;
        return true;
    }

    function transferFrom(address from, address to, uint256 amount) external override returns (bool) {
        require(balanceOf[from] >= amount, "ERC20: low balance");
        require(allowance[from][msg.sender] >= amount, "ERC20: low allowance");
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

/**
 * @dev Mock ERC-20 that fails on transfer/transferFrom
 */
contract MockFailingERC20 is IERC20 {
    mapping(address => uint256) public override balanceOf;
    mapping(address => mapping(address => uint256)) public override allowance;

    function totalSupply() external pure override returns (uint256) {
        return 1_000_000_000 * 1e18;
    }

    function mint(address to, uint256 amount) external {
        balanceOf[to] += amount;
    }

    function transfer(address, uint256) external pure override returns (bool) {
        return false;
    }

    function transferFrom(address, address, uint256) external pure override returns (bool) {
        return false;
    }

    function approve(address spender, uint256 amount) external override returns (bool) {
        allowance[msg.sender][spender] = amount;
        return true;
    }
}

/**
 * @dev Mock Non-Standard ERC20 (USDT style: no bool return)
 */
contract MockNonStandardERC20 {
    mapping(address => uint256) public balanceOf;
    mapping(address => mapping(address => uint256)) public allowance;

    function mint(address to, uint256 amount) external {
        balanceOf[to] += amount;
    }

    function transfer(address to, uint256 amount) external {
        require(balanceOf[msg.sender] >= amount, "low balance");
        balanceOf[msg.sender] -= amount;
        balanceOf[to] += amount;
    }

    function transferFrom(address from, address to, uint256 amount) external {
        require(balanceOf[from] >= amount, "low balance");
        require(allowance[from][msg.sender] >= amount, "low allowance");
        allowance[from][msg.sender] -= amount;
        balanceOf[from] -= amount;
        balanceOf[to] += amount;
    }

    function approve(address spender, uint256 amount) external {
        allowance[msg.sender][spender] = amount;
    }
}

/**
 * @dev Mock Fee-On-Transfer ERC20 (e.g. 5% transfer fee common in BSC memecoins)
 */
contract MockFeeOnTransferERC20 is IERC20 {
    string public name = "Fee Token";
    string public symbol = "FEE";
    uint8 public decimals = 18;
    uint256 public feeBps = 500; // 5% fee

    mapping(address => uint256) public override balanceOf;
    mapping(address => mapping(address => uint256)) public override allowance;

    function totalSupply() external pure override returns (uint256) {
        return 1_000_000_000 * 1e18;
    }

    function mint(address to, uint256 amount) external {
        balanceOf[to] += amount;
    }

    function transfer(address to, uint256 amount) external override returns (bool) {
        uint256 fee = (amount * feeBps) / 10000;
        uint256 net = amount - fee;
        require(balanceOf[msg.sender] >= amount, "low balance");
        balanceOf[msg.sender] -= amount;
        balanceOf[to] += net;
        return true;
    }

    function transferFrom(address from, address to, uint256 amount) external override returns (bool) {
        uint256 fee = (amount * feeBps) / 10000;
        uint256 net = amount - fee;
        require(balanceOf[from] >= amount, "low balance");
        require(allowance[from][msg.sender] >= amount, "low allowance");
        allowance[from][msg.sender] -= amount;
        balanceOf[from] -= amount;
        balanceOf[to] += net;
        return true;
    }

    function approve(address spender, uint256 amount) external override returns (bool) {
        allowance[msg.sender][spender] = amount;
        return true;
    }
}

/**
 * @dev Mock FourMeme Bonding Curve Router
 */
contract MockFourMemeRouter is IFourMemeRouter {
    using SafeERC20 for IERC20;

    uint256 public rate = 1000; // 1000 tokens = 1 BNB
    bool public enforceInternalSlippage = true;

    receive() external payable {}

    function setRate(uint256 _rate) external {
        rate = _rate;
    }

    function setEnforceInternalSlippage(bool _enforce) external {
        enforceInternalSlippage = _enforce;
    }

    function sellToken(address token, uint256 amount, uint256 minBnbExpected)
        external
        override
        returns (uint256 bnbReceived)
    {
        IERC20(token).safeTransferFrom(msg.sender, address(this), amount);
        bnbReceived = (amount * 1 ether) / (rate * 1e18);
        if (enforceInternalSlippage) {
            require(bnbReceived >= minBnbExpected, "MockFourMeme: Slippage exceeded");
        }
        (bool sent,) = msg.sender.call{value: bnbReceived}("");
        require(sent, "BNB send failed");
    }
}

/**
 * @dev Mock PancakeSwap V2 Router
 */
contract MockPancakeRouter is IPancakeRouter02 {
    address public immutable mockWeth;
    uint256 public rate = 2000; // 2000 tokens = 1 BNB

    constructor(address _mockWeth) {
        mockWeth = _mockWeth;
    }

    receive() external payable {}

    function WETH() external view override returns (address) {
        return mockWeth;
    }

    function swapExactTokensForETHSupportingFeeOnTransferTokens(
        uint256 amountIn,
        uint256 amountOutMin,
        address[] calldata path,
        address to,
        uint256
    ) external override {
        IERC20(path[0]).transferFrom(msg.sender, address(this), amountIn);
        uint256 bnbOut = (amountIn * 1 ether) / (rate * 1e18);
        require(bnbOut >= amountOutMin, "MockPancake: Slippage exceeded");
        (bool sent,) = to.call{value: bnbOut}("");
        require(sent, "Pancake BNB transfer failed");
    }
}

/**
 * @dev Recipient that rejects native BNB
 */
contract MockRejectingRecipient {
    // Has no receive() or fallback(), rejects any native BNB transfers
}

/**
 * @dev Reentrancy Attacker Contract
 */
contract MockReentrantAttacker {
    BatchSellExecutor public target;
    BatchSellExecutor.SellOrder[] public storedOrders;

    constructor(BatchSellExecutor _target) {
        target = _target;
    }

    function setAttackOrders(BatchSellExecutor.SellOrder[] calldata orders) external {
        delete storedOrders;
        for (uint256 i = 0; i < orders.length; i++) {
            storedOrders.push(orders[i]);
        }
    }

    receive() external payable {
        if (storedOrders.length > 0) {
            // Attempt reentrancy during BNB receipt
            target.executeBatchSell(storedOrders, 0, address(this), block.timestamp + 100);
        }
    }
}

// ==========================================
// TEST SUITE: 14 FUNCTIONAL + 12 SECURITY
// ==========================================

contract BatchSellExecutorComprehensiveTest is Test {
    BatchSellExecutor public executor;
    MockFourMemeRouter public fourMemeRouter;
    MockPancakeRouter public pancakeRouter;
    MockERC20 public wbnb;
    MockERC20 public tokenA;
    MockERC20 public tokenB;
    MockERC20 public tokenC;

    address public owner = address(0xAA11);
    address public user = address(0xBB22);
    address public user2 = address(0xCC33);
    address public recipient = address(0xDD44);

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

    function setUp() public {
        wbnb = new MockERC20("Wrapped BNB", "WBNB");
        fourMemeRouter = new MockFourMemeRouter();
        pancakeRouter = new MockPancakeRouter(address(wbnb));

        // Fund routers with 50 BNB
        vm.deal(address(fourMemeRouter), 50 ether);
        vm.deal(address(pancakeRouter), 50 ether);

        // Deploy executor
        vm.prank(owner);
        executor = new BatchSellExecutor(
            owner,
            address(fourMemeRouter),
            address(pancakeRouter),
            true // Enable FourMeme
        );

        // Tokens setup
        tokenA = new MockERC20("Token A", "TKNA");
        tokenB = new MockERC20("Token B", "TKNB");
        tokenC = new MockERC20("Token C", "TKNC");

        tokenA.mint(user, 100_000 * 1e18);
        tokenB.mint(user, 100_000 * 1e18);
        tokenC.mint(user, 100_000 * 1e18);

        // User approvals to executor
        vm.startPrank(user);
        tokenA.approve(address(executor), type(uint256).max);
        tokenB.approve(address(executor), type(uint256).max);
        tokenC.approve(address(executor), type(uint256).max);
        vm.stopPrank();
    }

    // ----------------------------------------------------------------
    // 14 FUNCTIONAL TESTS
    // ----------------------------------------------------------------

    // 1. Déploiement avec paramètres valides
    function test_01_Deployment_ValidParameters() public view {
        assertEq(executor.owner(), owner);
        assertTrue(executor.isWhitelistedRouter(address(fourMemeRouter)));
        assertTrue(executor.isWhitelistedRouter(address(pancakeRouter)));
        assertTrue(executor.allowFourMemeExecution());
        assertFalse(executor.paused());
    }

    // 2. Rejet des paramètres invalides (zero address owner)
    function test_02_Deployment_RevertOnZeroOwner() public {
        vm.expectRevert(abi.encodeWithSelector(Ownable.OwnableInvalidOwner.selector, address(0)));
        new BatchSellExecutor(address(0), address(0), address(0), false);
    }

    // 3. Enregistrement et utilisation d'un routeur autorisé
    function test_03_Router_RegisterAndUseAuthorizedRouter() public {
        MockFourMemeRouter newRouter = new MockFourMemeRouter();
        vm.deal(address(newRouter), 10 ether);

        vm.prank(owner);
        executor.setRouterWhitelist(address(newRouter), true);
        assertTrue(executor.isWhitelistedRouter(address(newRouter)));

        BatchSellExecutor.SellOrder[] memory orders = new BatchSellExecutor.SellOrder[](1);
        orders[0] = BatchSellExecutor.SellOrder({
            token: address(tokenA),
            protocol: BatchSellExecutor.ProtocolType.FourMemeCurve,
            routerTarget: address(newRouter),
            tokenAmount: 1000 * 1e18,
            minBnbOut: 0.9 ether
        });

        vm.prank(user);
        uint256 bnbOut = executor.executeBatchSell(orders, 0.9 ether, user, block.timestamp + 100);
        assertEq(bnbOut, 1 ether);
    }

    // 4. Rejet d'un routeur non autorisé
    function test_04_Router_RevertOnUnauthorizedRouter() public {
        address unwhitelisted = address(0x9999);
        BatchSellExecutor.SellOrder[] memory orders = new BatchSellExecutor.SellOrder[](1);
        orders[0] = BatchSellExecutor.SellOrder({
            token: address(tokenA),
            protocol: BatchSellExecutor.ProtocolType.FourMemeCurve,
            routerTarget: unwhitelisted,
            tokenAmount: 1000 * 1e18,
            minBnbOut: 0.5 ether
        });

        vm.prank(user);
        vm.expectRevert(abi.encodeWithSelector(BatchSellExecutor.RouterNotWhitelisted.selector, unwhitelisted));
        executor.executeBatchSell(orders, 0.5 ether, user, block.timestamp + 100);
    }

    // 5. Vente d'un token mock avec sortie attendue
    function test_05_SellMock_ExpectedOutput() public {
        BatchSellExecutor.SellOrder memory order = BatchSellExecutor.SellOrder({
            token: address(tokenA),
            protocol: BatchSellExecutor.ProtocolType.FourMemeCurve,
            routerTarget: address(fourMemeRouter),
            tokenAmount: 2000 * 1e18,
            minBnbOut: 1.9 ether
        });

        uint256 userBnbBefore = user.balance;
        vm.prank(user);
        uint256 bnbReceived = executor.executeSingleSell(order, user, block.timestamp + 100);

        assertEq(bnbReceived, 2 ether);
        assertEq(user.balance - userBnbBefore, 2 ether);
    }

    // 6. Respect du montant minimal de sortie
    function test_06_Slippage_RespectMinBnbOut() public {
        BatchSellExecutor.SellOrder[] memory orders = new BatchSellExecutor.SellOrder[](1);
        orders[0] = BatchSellExecutor.SellOrder({
            token: address(tokenA),
            protocol: BatchSellExecutor.ProtocolType.FourMemeCurve,
            routerTarget: address(fourMemeRouter),
            tokenAmount: 1000 * 1e18,
            minBnbOut: 1 ether // exact return
        });

        vm.prank(user);
        uint256 bnbReceived = executor.executeBatchSell(orders, 1 ether, user, block.timestamp + 100);
        assertEq(bnbReceived, 1 ether);
    }

    // 7. Rejet lorsque le slippage est dépassé
    function test_07_Slippage_RevertWhenSlippageExceeded() public {
        fourMemeRouter.setEnforceInternalSlippage(false); // Let router return calculated amount so executor enforces check

        BatchSellExecutor.SellOrder[] memory orders = new BatchSellExecutor.SellOrder[](1);
        orders[0] = BatchSellExecutor.SellOrder({
            token: address(tokenA),
            protocol: BatchSellExecutor.ProtocolType.FourMemeCurve,
            routerTarget: address(fourMemeRouter),
            tokenAmount: 1000 * 1e18,
            minBnbOut: 1.5 ether // Router will yield 1.0 ether -> Executor reverts with IndividualSlippageExceeded
        });

        vm.prank(user);
        vm.expectRevert(
            abi.encodeWithSelector(
                BatchSellExecutor.IndividualSlippageExceeded.selector, address(tokenA), 1 ether, 1.5 ether
            )
        );
        executor.executeBatchSell(orders, 1.5 ether, user, block.timestamp + 100);
    }

    // 8. Rejet d'une allowance insuffisante
    function test_08_Allowance_RevertOnInsufficientAllowance() public {
        vm.prank(user);
        tokenA.approve(address(executor), 500 * 1e18); // only 500 approved

        BatchSellExecutor.SellOrder[] memory orders = new BatchSellExecutor.SellOrder[](1);
        orders[0] = BatchSellExecutor.SellOrder({
            token: address(tokenA),
            protocol: BatchSellExecutor.ProtocolType.FourMemeCurve,
            routerTarget: address(fourMemeRouter),
            tokenAmount: 1000 * 1e18,
            minBnbOut: 0.8 ether
        });

        vm.prank(user);
        vm.expectRevert(
            abi.encodeWithSelector(
                BatchSellExecutor.InsufficientTokenAllowance.selector, address(tokenA), 500 * 1e18, 1000 * 1e18
            )
        );
        executor.executeBatchSell(orders, 0.8 ether, user, block.timestamp + 100);
    }

    // 9. Rejet d'un solde insuffisant
    function test_09_Balance_RevertOnInsufficientBalance() public {
        address poorUser = address(0x7777);
        tokenA.mint(poorUser, 100 * 1e18);

        vm.startPrank(poorUser);
        tokenA.approve(address(executor), 1000 * 1e18);

        BatchSellExecutor.SellOrder[] memory orders = new BatchSellExecutor.SellOrder[](1);
        orders[0] = BatchSellExecutor.SellOrder({
            token: address(tokenA),
            protocol: BatchSellExecutor.ProtocolType.FourMemeCurve,
            routerTarget: address(fourMemeRouter),
            tokenAmount: 1000 * 1e18,
            minBnbOut: 0.5 ether
        });

        vm.expectRevert(
            abi.encodeWithSelector(
                BatchSellExecutor.InsufficientTokenBalance.selector, address(tokenA), 100 * 1e18, 1000 * 1e18
            )
        );
        executor.executeBatchSell(orders, 0.5 ether, poorUser, block.timestamp + 100);
        vm.stopPrank();
    }

    // 10. Vérification du destinataire des fonds
    function test_10_Recipient_VerifyCustomRecipientReceivesBnb() public {
        uint256 recipientBnbBefore = recipient.balance;

        BatchSellExecutor.SellOrder[] memory orders = new BatchSellExecutor.SellOrder[](1);
        orders[0] = BatchSellExecutor.SellOrder({
            token: address(tokenA),
            protocol: BatchSellExecutor.ProtocolType.FourMemeCurve,
            routerTarget: address(fourMemeRouter),
            tokenAmount: 1000 * 1e18,
            minBnbOut: 0.9 ether
        });

        vm.prank(user);
        executor.executeBatchSell(orders, 0.9 ether, recipient, block.timestamp + 100);

        assertEq(recipient.balance - recipientBnbBefore, 1 ether);
    }

    // 11. Exécution d'un batch valide multi-tokens
    function test_11_Batch_ValidMultiTokenExecution() public {
        BatchSellExecutor.SellOrder[] memory orders = new BatchSellExecutor.SellOrder[](2);
        // Token A on FourMeme: 1000 tokens = 1 BNB
        orders[0] = BatchSellExecutor.SellOrder({
            token: address(tokenA),
            protocol: BatchSellExecutor.ProtocolType.FourMemeCurve,
            routerTarget: address(fourMemeRouter),
            tokenAmount: 1000 * 1e18,
            minBnbOut: 0.9 ether
        });
        // Token B on PancakeSwap: 2000 tokens = 1 BNB
        orders[1] = BatchSellExecutor.SellOrder({
            token: address(tokenB),
            protocol: BatchSellExecutor.ProtocolType.PancakeSwapV2,
            routerTarget: address(pancakeRouter),
            tokenAmount: 2000 * 1e18,
            minBnbOut: 0.9 ether
        });

        uint256 userBefore = user.balance;
        vm.prank(user);
        uint256 totalBnb = executor.executeBatchSell(orders, 1.8 ether, user, block.timestamp + 100);

        assertEq(totalBnb, 2 ether);
        assertEq(user.balance - userBefore, 2 ether);
    }

    // 12. Échec atomique si une opération du batch échoue
    function test_12_Batch_AtomicFailureRollsBackAll() public {
        uint256 userTokenABefore = tokenA.balanceOf(user);
        uint256 userTokenBBefore = tokenB.balanceOf(user);

        BatchSellExecutor.SellOrder[] memory orders = new BatchSellExecutor.SellOrder[](2);
        orders[0] = BatchSellExecutor.SellOrder({
            token: address(tokenA),
            protocol: BatchSellExecutor.ProtocolType.FourMemeCurve,
            routerTarget: address(fourMemeRouter),
            tokenAmount: 1000 * 1e18,
            minBnbOut: 0.9 ether // would succeed
        });
        orders[1] = BatchSellExecutor.SellOrder({
            token: address(tokenB),
            protocol: BatchSellExecutor.ProtocolType.PancakeSwapV2,
            routerTarget: address(pancakeRouter),
            tokenAmount: 2000 * 1e18,
            minBnbOut: 999 ether // will fail slippage!
        });

        vm.prank(user);
        vm.expectRevert();
        executor.executeBatchSell(orders, 1.8 ether, user, block.timestamp + 100);

        // Invariant: Alice still has ALL original tokens (no state changed)
        assertEq(tokenA.balanceOf(user), userTokenABefore);
        assertEq(tokenB.balanceOf(user), userTokenBBefore);
    }

    // 13. Gestion des erreurs de transfert
    function test_13_Transfer_RevertOnFailingToken() public {
        MockFailingERC20 failingToken = new MockFailingERC20();
        failingToken.mint(user, 1000 * 1e18);

        vm.prank(user);
        failingToken.approve(address(executor), 1000 * 1e18);

        BatchSellExecutor.SellOrder[] memory orders = new BatchSellExecutor.SellOrder[](1);
        orders[0] = BatchSellExecutor.SellOrder({
            token: address(failingToken),
            protocol: BatchSellExecutor.ProtocolType.FourMemeCurve,
            routerTarget: address(fourMemeRouter),
            tokenAmount: 1000 * 1e18,
            minBnbOut: 0.5 ether
        });

        vm.prank(user);
        vm.expectRevert();
        executor.executeBatchSell(orders, 0.5 ether, user, block.timestamp + 100);
    }

    // 14. Émission et vérification des événements
    function test_14_Events_BatchExecutedEmission() public {
        BatchSellExecutor.SellOrder[] memory orders = new BatchSellExecutor.SellOrder[](1);
        orders[0] = BatchSellExecutor.SellOrder({
            token: address(tokenA),
            protocol: BatchSellExecutor.ProtocolType.FourMemeCurve,
            routerTarget: address(fourMemeRouter),
            tokenAmount: 1000 * 1e18,
            minBnbOut: 0.9 ether
        });

        vm.expectEmit(true, true, false, true);
        emit BatchExecuted(user, user, 1 ether, 1, block.timestamp);

        vm.prank(user);
        executor.executeBatchSell(orders, 0.9 ether, user, block.timestamp);
    }

    // ----------------------------------------------------------------
    // 12 SECURITY TESTS
    // ----------------------------------------------------------------

    // 15. Tentative de réentrance
    function test_15_Security_ReentrancyBlocked() public {
        MockReentrantAttacker attacker = new MockReentrantAttacker(executor);

        BatchSellExecutor.SellOrder[] memory attackOrders = new BatchSellExecutor.SellOrder[](1);
        attackOrders[0] = BatchSellExecutor.SellOrder({
            token: address(tokenA),
            protocol: BatchSellExecutor.ProtocolType.FourMemeCurve,
            routerTarget: address(fourMemeRouter),
            tokenAmount: 1000 * 1e18,
            minBnbOut: 0.5 ether
        });
        attacker.setAttackOrders(attackOrders);

        // User initiates sell with recipient = attacker
        vm.prank(user);
        // The attacker receives BNB and triggers executeBatchSell -> ReentrancyGuard reverts
        vm.expectRevert();
        executor.executeBatchSell(attackOrders, 0.5 ether, address(attacker), block.timestamp + 100);
    }

    // 16. Appel non autorisé d'une fonction administrative
    function test_16_Security_UnauthorizedAdminCall() public {
        vm.prank(user);
        vm.expectRevert(abi.encodeWithSelector(Ownable.OwnableUnauthorizedAccount.selector, user));
        executor.setRouterWhitelist(address(0x123), true);

        vm.prank(user);
        vm.expectRevert(abi.encodeWithSelector(Ownable.OwnableUnauthorizedAccount.selector, user));
        executor.setPaused(true);

        vm.prank(user);
        vm.expectRevert(abi.encodeWithSelector(Ownable.OwnableUnauthorizedAccount.selector, user));
        executor.setFourMemeExecution(false);
    }

    // 17. Tentative d'utilisation d'un routeur malveillant
    function test_17_Security_MaliciousRouterRejected() public {
        address maliciousRouter = address(0xDEADBEEF);
        BatchSellExecutor.SellOrder[] memory orders = new BatchSellExecutor.SellOrder[](1);
        orders[0] = BatchSellExecutor.SellOrder({
            token: address(tokenA),
            protocol: BatchSellExecutor.ProtocolType.FourMemeCurve,
            routerTarget: maliciousRouter,
            tokenAmount: 500 * 1e18,
            minBnbOut: 0.1 ether
        });

        vm.prank(user);
        vm.expectRevert(abi.encodeWithSelector(BatchSellExecutor.RouterNotWhitelisted.selector, maliciousRouter));
        executor.executeBatchSell(orders, 0.1 ether, user, block.timestamp + 100);
    }

    // 18. Tentative de détournement du destinataire
    function test_18_Security_RecipientIsolation() public {
        // User specifies Bob as recipient explicitly. Alice cannot hijack Bob's funds.
        address bob = address(0x9876);
        uint256 bobBefore = bob.balance;

        BatchSellExecutor.SellOrder[] memory orders = new BatchSellExecutor.SellOrder[](1);
        orders[0] = BatchSellExecutor.SellOrder({
            token: address(tokenA),
            protocol: BatchSellExecutor.ProtocolType.FourMemeCurve,
            routerTarget: address(fourMemeRouter),
            tokenAmount: 1000 * 1e18,
            minBnbOut: 0.9 ether
        });

        vm.prank(user);
        executor.executeBatchSell(orders, 0.9 ether, bob, block.timestamp + 100);

        assertEq(bob.balance - bobBefore, 1 ether);
        assertEq(user.balance, 0); // user did not receive Bob's BNB
    }

    // 19. Paramètres de slippage invalides (anti cross-subsidization)
    function test_19_Security_IndividualSlippageProtectsAgainstCrossSubsidization() public {
        fourMemeRouter.setEnforceInternalSlippage(false); // Router returns calculated bnb, executor enforces individual slippage
        fourMemeRouter.setRate(1000); // 1000 tokens = 1 BNB

        BatchSellExecutor.SellOrder[] memory orders = new BatchSellExecutor.SellOrder[](2);
        orders[0] = BatchSellExecutor.SellOrder({
            token: address(tokenA),
            protocol: BatchSellExecutor.ProtocolType.FourMemeCurve,
            routerTarget: address(fourMemeRouter),
            tokenAmount: 2000 * 1e18,
            minBnbOut: 1.0 ether // will yield 2.0 ether
        });
        orders[1] = BatchSellExecutor.SellOrder({
            token: address(tokenB),
            protocol: BatchSellExecutor.ProtocolType.FourMemeCurve,
            routerTarget: address(fourMemeRouter),
            tokenAmount: 100 * 1e18,
            minBnbOut: 0.5 ether // will only yield 0.1 ether!
        });

        vm.prank(user);
        vm.expectRevert(
            abi.encodeWithSelector(
                BatchSellExecutor.IndividualSlippageExceeded.selector, address(tokenB), 0.1 ether, 0.5 ether
            )
        );
        executor.executeBatchSell(orders, 1.5 ether, user, block.timestamp + 100);
    }

    // 20. Tokens ERC-20 non standards (ex: USDT sans return bool)
    function test_20_Security_NonStandardERC20_USDTStyle() public {
        MockNonStandardERC20 usdt = new MockNonStandardERC20();
        usdt.mint(user, 1000 * 1e18);

        vm.prank(user);
        usdt.approve(address(executor), 1000 * 1e18);

        BatchSellExecutor.SellOrder[] memory orders = new BatchSellExecutor.SellOrder[](1);
        orders[0] = BatchSellExecutor.SellOrder({
            token: address(usdt),
            protocol: BatchSellExecutor.ProtocolType.FourMemeCurve,
            routerTarget: address(fourMemeRouter),
            tokenAmount: 1000 * 1e18,
            minBnbOut: 0.9 ether
        });

        // SafeERC20 handles non-standard ERC-20 return seamlessly
        vm.prank(user);
        uint256 bnbReceived = executor.executeBatchSell(orders, 0.9 ether, user, block.timestamp + 100);
        assertEq(bnbReceived, 1 ether);
    }

    // 21. Échec du transfert de BNB (destinataire refusant les fonds)
    function test_21_Security_BnbTransferFailureReverts() public {
        MockRejectingRecipient rejector = new MockRejectingRecipient();

        BatchSellExecutor.SellOrder[] memory orders = new BatchSellExecutor.SellOrder[](1);
        orders[0] = BatchSellExecutor.SellOrder({
            token: address(tokenA),
            protocol: BatchSellExecutor.ProtocolType.FourMemeCurve,
            routerTarget: address(fourMemeRouter),
            tokenAmount: 1000 * 1e18,
            minBnbOut: 0.9 ether
        });

        vm.prank(user);
        vm.expectRevert(
            abi.encodeWithSelector(BatchSellExecutor.BnbTransferFailed.selector, address(rejector), 1 ether)
        );
        executor.executeBatchSell(orders, 0.9 ether, address(rejector), block.timestamp + 100);
    }

    // 22. Tentative de vente avec autorisations insuffisantes
    function test_22_Security_ZeroAllowanceRevert() public {
        address stranger = address(0x4444);
        tokenA.mint(stranger, 5000 * 1e18);

        BatchSellExecutor.SellOrder[] memory orders = new BatchSellExecutor.SellOrder[](1);
        orders[0] = BatchSellExecutor.SellOrder({
            token: address(tokenA),
            protocol: BatchSellExecutor.ProtocolType.FourMemeCurve,
            routerTarget: address(fourMemeRouter),
            tokenAmount: 1000 * 1e18,
            minBnbOut: 0.5 ether
        });

        vm.prank(stranger);
        vm.expectRevert(
            abi.encodeWithSelector(
                BatchSellExecutor.InsufficientTokenAllowance.selector, address(tokenA), 0, 1000 * 1e18
            )
        );
        executor.executeBatchSell(orders, 0.5 ether, stranger, block.timestamp + 100);
    }

    // 23. Tentative d'exploitation des limites du batch (BatchSizeExceeded)
    function test_23_Security_BatchSizeExceeded() public {
        uint256 oversized = 26; // MAX_BATCH_SIZE is 25
        BatchSellExecutor.SellOrder[] memory orders = new BatchSellExecutor.SellOrder[](oversized);
        for (uint256 i = 0; i < oversized; i++) {
            orders[i] = BatchSellExecutor.SellOrder({
                token: address(tokenA),
                protocol: BatchSellExecutor.ProtocolType.FourMemeCurve,
                routerTarget: address(fourMemeRouter),
                tokenAmount: 10 * 1e18,
                minBnbOut: 0.001 ether
            });
        }

        vm.prank(user);
        vm.expectRevert(abi.encodeWithSelector(BatchSellExecutor.BatchSizeExceeded.selector, oversized, 25));
        executor.executeBatchSell(orders, 0.01 ether, user, block.timestamp + 100);
    }

    // 24. Tentative de transfert arbitraire de tokens
    function test_24_Security_ArbitraryTransferBlocked() public {
        // User cannot execute order for token they don't own
        address victim = address(0x5555);
        tokenA.mint(victim, 10_000 * 1e18);

        BatchSellExecutor.SellOrder[] memory orders = new BatchSellExecutor.SellOrder[](1);
        orders[0] = BatchSellExecutor.SellOrder({
            token: address(tokenA),
            protocol: BatchSellExecutor.ProtocolType.FourMemeCurve,
            routerTarget: address(fourMemeRouter),
            tokenAmount: 1000 * 1e18,
            minBnbOut: 0.5 ether
        });

        // Attacker calls, expecting victim's tokens to be taken
        vm.prank(user2);
        vm.expectRevert();
        executor.executeBatchSell(orders, 0.5 ether, user2, block.timestamp + 100);
    }

    // 25. Vérification de l'isolation entre deux utilisateurs
    function test_25_Security_UserIsolation() public {
        tokenA.mint(user2, 5000 * 1e18);
        vm.prank(user2);
        tokenA.approve(address(executor), 5000 * 1e18);

        uint256 user2InitialToken = tokenA.balanceOf(user2);

        // User 1 executes their batch
        BatchSellExecutor.SellOrder[] memory orders = new BatchSellExecutor.SellOrder[](1);
        orders[0] = BatchSellExecutor.SellOrder({
            token: address(tokenA),
            protocol: BatchSellExecutor.ProtocolType.FourMemeCurve,
            routerTarget: address(fourMemeRouter),
            tokenAmount: 1000 * 1e18,
            minBnbOut: 0.9 ether
        });

        vm.prank(user);
        executor.executeBatchSell(orders, 0.9 ether, user, block.timestamp + 100);

        // User 2's balance is untouched!
        assertEq(tokenA.balanceOf(user2), user2InitialToken);
    }

    // 26. Invariant de conservation des fonds (Zéro résiduel dans le contrat)
    function test_26_Security_ZeroResidualContractBalance() public {
        BatchSellExecutor.SellOrder[] memory orders = new BatchSellExecutor.SellOrder[](2);
        orders[0] = BatchSellExecutor.SellOrder({
            token: address(tokenA),
            protocol: BatchSellExecutor.ProtocolType.FourMemeCurve,
            routerTarget: address(fourMemeRouter),
            tokenAmount: 1000 * 1e18,
            minBnbOut: 0.9 ether
        });
        orders[1] = BatchSellExecutor.SellOrder({
            token: address(tokenB),
            protocol: BatchSellExecutor.ProtocolType.PancakeSwapV2,
            routerTarget: address(pancakeRouter),
            tokenAmount: 2000 * 1e18,
            minBnbOut: 0.9 ether
        });

        vm.prank(user);
        executor.executeBatchSell(orders, 1.8 ether, user, block.timestamp + 100);

        // Strict invariant: Contract holds 0 BNB and 0 Tokens
        assertEq(address(executor).balance, 0, "Executor must not hold residual BNB");
        assertEq(tokenA.balanceOf(address(executor)), 0, "Executor must not hold residual tokenA");
        assertEq(tokenB.balanceOf(address(executor)), 0, "Executor must not hold residual tokenB");
    }

    // 27. Prise en charge des tokens à frais de transfert (Fee-On-Transfer)
    function test_27_Security_FeeOnTransferTokenHandledCorrectly() public {
        MockFeeOnTransferERC20 feeToken = new MockFeeOnTransferERC20();
        feeToken.mint(user, 10_000 * 1e18);

        vm.prank(user);
        feeToken.approve(address(executor), 10_000 * 1e18);

        // Sending 2000 tokens with 5% tax -> executor receives 1900 tokens
        // With rate=2000 tokens/BNB on pancakeRouter, 1900 tokens = 0.95 BNB
        BatchSellExecutor.SellOrder[] memory orders = new BatchSellExecutor.SellOrder[](1);
        orders[0] = BatchSellExecutor.SellOrder({
            token: address(feeToken),
            protocol: BatchSellExecutor.ProtocolType.PancakeSwapV2,
            routerTarget: address(pancakeRouter),
            tokenAmount: 2000 * 1e18,
            minBnbOut: 0.9 ether
        });

        vm.prank(user);
        uint256 bnbOut = executor.executeBatchSell(orders, 0.9 ether, user, block.timestamp + 100);
        assertEq(bnbOut, 0.95 ether);
    }

    // 28. Rejet des dépôts directs de BNB hors exécution
    function test_28_Security_DirectBnbDepositReverts() public {
        vm.deal(user, 5 ether);
        vm.prank(user);
        (bool sent,) = address(executor).call{value: 1 ether}("");
        assertFalse(sent);
    }

    // 29. Rejet si FourMeme est désactivé
    function test_29_Security_FourMemeDisabledRevert() public {
        vm.prank(owner);
        executor.setFourMemeExecution(false); // disable FourMeme

        BatchSellExecutor.SellOrder[] memory orders = new BatchSellExecutor.SellOrder[](1);
        orders[0] = BatchSellExecutor.SellOrder({
            token: address(tokenA),
            protocol: BatchSellExecutor.ProtocolType.FourMemeCurve,
            routerTarget: address(fourMemeRouter),
            tokenAmount: 1000 * 1e18,
            minBnbOut: 0.5 ether
        });

        vm.prank(user);
        vm.expectRevert(BatchSellExecutor.FourMemeExecutionDisabled.selector);
        executor.executeBatchSell(orders, 0.5 ether, user, block.timestamp + 100);
    }

    // 30. Rejet d'un lot vide (EmptyBatch)
    function test_30_Security_EmptyBatchRevert() public {
        BatchSellExecutor.SellOrder[] memory emptyOrders = new BatchSellExecutor.SellOrder[](0);

        vm.prank(user);
        vm.expectRevert(BatchSellExecutor.EmptyBatch.selector);
        executor.executeBatchSell(emptyOrders, 0, user, block.timestamp + 100);
    }

    // 31. Rejet si la date limite est expirée (DeadlineExpired)
    function test_31_Security_DeadlineExpiredRevert() public {
        BatchSellExecutor.SellOrder[] memory orders = new BatchSellExecutor.SellOrder[](1);
        orders[0] = BatchSellExecutor.SellOrder({
            token: address(tokenA),
            protocol: BatchSellExecutor.ProtocolType.FourMemeCurve,
            routerTarget: address(fourMemeRouter),
            tokenAmount: 1000 * 1e18,
            minBnbOut: 0.5 ether
        });

        uint256 expiredDeadline = block.timestamp - 1;
        vm.prank(user);
        vm.expectRevert(
            abi.encodeWithSelector(BatchSellExecutor.DeadlineExpired.selector, expiredDeadline, block.timestamp)
        );
        executor.executeBatchSell(orders, 0.5 ether, user, expiredDeadline);
    }

    // 32. Rejet si montant nul (ZeroAmountProvided)
    function test_32_Security_ZeroAmountRevert() public {
        BatchSellExecutor.SellOrder[] memory orders = new BatchSellExecutor.SellOrder[](1);
        orders[0] = BatchSellExecutor.SellOrder({
            token: address(tokenA),
            protocol: BatchSellExecutor.ProtocolType.FourMemeCurve,
            routerTarget: address(fourMemeRouter),
            tokenAmount: 0,
            minBnbOut: 0
        });

        vm.prank(user);
        vm.expectRevert(BatchSellExecutor.ZeroAmountProvided.selector);
        executor.executeBatchSell(orders, 0, user, block.timestamp + 100);
    }

    // 33. Conservation du solde préexistant (aucun détournement de fonds tiers)
    function test_33_Security_PreExistingContractBalancePreserved() public {
        vm.deal(address(executor), 2 ether);

        BatchSellExecutor.SellOrder[] memory orders = new BatchSellExecutor.SellOrder[](1);
        orders[0] = BatchSellExecutor.SellOrder({
            token: address(tokenA),
            protocol: BatchSellExecutor.ProtocolType.FourMemeCurve,
            routerTarget: address(fourMemeRouter),
            tokenAmount: 1000 * 1e18,
            minBnbOut: 0.9 ether
        });

        uint256 userBefore = user.balance;
        vm.prank(user);
        uint256 bnbOut = executor.executeBatchSell(orders, 0.9 ether, user, block.timestamp + 100);

        assertEq(bnbOut, 1 ether);
        assertEq(user.balance - userBefore, 1 ether);
        assertEq(address(executor).balance, 2 ether);
    }
}
