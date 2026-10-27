import { TokenInfo } from '../../types';

export interface QuoteResult {
  tokenAddress: `0x${string}`;
  amountIn: bigint;
  expectedBnbOut: bigint;
  minBnbOut: bigint;
  priceImpactPercent: number;
  routerTarget: `0x${string}`;
  routerName: string;
  protocol: 'fourmeme' | 'pancakeswap';
}

export interface TradingProtocolAdapter {
  readonly protocolId: string;
  readonly name: string;

  isSupportedToken(token: TokenInfo): Promise<{
    supported: boolean;
    reason?: string;
  }>;

  getQuote(
    token: TokenInfo,
    amountIn: bigint,
    slippageBps: number
  ): Promise<QuoteResult>;

  buildSellCalldata(
    tokenAddress: `0x${string}`,
    amountIn: bigint,
    minBnbOut: bigint,
    recipient: `0x${string}`,
    protocol: 'fourmeme' | 'pancakeswap'
  ): {
    target: `0x${string}`;
    functionName: string;
    calldata: `0x${string}`;
  };
}
