import { encodeFunctionData, parseAbi } from 'viem';
import { TokenInfo, ChainId } from '../../types';
import { CHAINS_CONFIG } from '../../config/chains';
import { TradingProtocolAdapter, QuoteResult } from './TradingProtocolAdapter';

export const FOURMEME_ROUTER_ABI = parseAbi([
  'function sellToken(address token, uint256 amount, uint256 minBnbExpected) external returns (uint256 bnbReceived)',
  'function sell(address token, uint256 tokenAmount, uint256 minBnbOut, address recipient) external returns (uint256)',
  'function getSellQuote(address token, uint256 amount) external view returns (uint256 bnbExpected, uint256 fee)',
]);

export const PANCAKE_ROUTER_ABI = parseAbi([
  'function swapExactTokensForETHSupportingFeeOnTransferTokens(uint256 amountIn, uint256 amountOutMin, address[] calldata path, address to, uint256 deadline) external',
  'function getAmountsOut(uint256 amountIn, address[] calldata path) external view returns (uint256[] memory amounts)',
  'function WETH() external pure returns (address)',
]);

export class FourMemeAdapter implements TradingProtocolAdapter {
  readonly protocolId = 'fourmeme-bsc';
  readonly name = 'FourMeme Bonding Curve & DEX Router';

  private chainId: ChainId;

  constructor(chainId: ChainId = 56) {
    this.chainId = chainId;
  }

  setChainId(chainId: ChainId) {
    this.chainId = chainId;
  }

  async isSupportedToken(token: TokenInfo): Promise<{ supported: boolean; reason?: string }> {
    if (token.riskScore === 'F') {
      return { supported: false, reason: 'Token flagged as malicious or honeypot' };
    }
    if (token.status === 'unverified' && !token.isFourMeme) {
      return {
        supported: true,
        reason: 'Token is unverified: high slippage or fallback router required',
      };
    }
    return { supported: true };
  }

  async getQuote(
    token: TokenInfo,
    amountIn: bigint,
    slippageBps: number
  ): Promise<QuoteResult> {
    const chainConfig = CHAINS_CONFIG[this.chainId];
    const isGraduated = token.status === 'graduated';
    const protocol = isGraduated ? 'pancakeswap' : 'fourmeme';
    const routerTarget = isGraduated
      ? chainConfig.pancakeRouter
      : chainConfig.fourMemeRouter;
    const routerName = isGraduated
      ? 'PancakeSwap V2 Router'
      : 'FourMeme Bonding Curve Router';

    // Calculate base BNB out from token price
    // e.g. amountIn in 1e18 units * priceBnb
    const tokenAmountNumber = Number(amountIn) / 10 ** token.decimals;
    const rawBnbEstimate = tokenAmountNumber * token.priceBnb;

    // Simulate bonding curve price impact: selling pushes price slightly down
    const impactFactor = Math.min(0.25, (tokenAmountNumber / 10_000_000) * 0.05);
    const netBnbEstimate = rawBnbEstimate * (1 - impactFactor);

    // Convert to bigint in wei (1e18)
    const expectedBnbWei = BigInt(Math.max(0, Math.floor(netBnbEstimate * 1e18)));

    // Apply slippage tolerance: minExpected = expected * (1 - slippageBps / 10000)
    const slippageMultiplier = BigInt(10000 - slippageBps);
    const minBnbOut = (expectedBnbWei * slippageMultiplier) / 10000n;

    return {
      tokenAddress: token.address,
      amountIn,
      expectedBnbOut: expectedBnbWei,
      minBnbOut,
      priceImpactPercent: Number((impactFactor * 100).toFixed(2)),
      routerTarget,
      routerName,
      protocol,
    };
  }

  buildSellCalldata(
    tokenAddress: `0x${string}`,
    amountIn: bigint,
    minBnbOut: bigint,
    recipient: `0x${string}`,
    protocol: 'fourmeme' | 'pancakeswap'
  ): { target: `0x${string}`; functionName: string; calldata: `0x${string}` } {
    const chainConfig = CHAINS_CONFIG[this.chainId];

    if (protocol === 'fourmeme') {
      const calldata = encodeFunctionData({
        abi: FOURMEME_ROUTER_ABI,
        functionName: 'sellToken',
        args: [tokenAddress, amountIn, minBnbOut],
      });
      return {
        target: chainConfig.fourMemeRouter,
        functionName: 'sellToken(address,uint256,uint256)',
        calldata,
      };
    } else {
      // PancakeSwap V2 Router
      // Path: [Token, WBNB]
      const wbnb = this.chainId === 56
        ? ('0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c' as `0x${string}`)
        : ('0xae13d989daC2f0dEbFf460aC112a837C89BAa7cd' as `0x${string}`);

      const deadline = BigInt(Math.floor(Date.now() / 1000) + 1200); // 20 minutes
      const calldata = encodeFunctionData({
        abi: PANCAKE_ROUTER_ABI,
        functionName: 'swapExactTokensForETHSupportingFeeOnTransferTokens',
        args: [amountIn, minBnbOut, [tokenAddress, wbnb], recipient, deadline],
      });
      return {
        target: chainConfig.pancakeRouter,
        functionName:
          'swapExactTokensForETHSupportingFeeOnTransferTokens(uint256,uint256,address[],address,uint256)',
        calldata,
      };
    }
  }
}
