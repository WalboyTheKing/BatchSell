import { formatUnits } from 'viem';
import { TokenInfo, ChainId } from '../../types';
import { INITIAL_REGISTERED_TOKENS, RegisteredToken } from '../../config/chains';

export class TokenDiscoveryService {
  private tokens: Map<string, TokenInfo> = new Map();
  private chainId: ChainId;

  constructor(chainId: ChainId = 56) {
    this.chainId = chainId;
    this.initTokens();
  }

  setChainId(chainId: ChainId) {
    this.chainId = chainId;
    this.initTokens();
  }

  private initTokens() {
    this.tokens.clear();
    for (const reg of INITIAL_REGISTERED_TOKENS) {
      const formattedBalance = this.formatBal(reg.initialBalance, reg.decimals);
      const formattedAllowance = this.formatBal(reg.initialAllowance, reg.decimals);
      const quoteBnb = (
        (Number(reg.initialBalance) / 10 ** reg.decimals) *
        reg.priceBnb
      ).toFixed(4);

      this.tokens.set(reg.address.toLowerCase(), {
        address: reg.address,
        symbol: reg.symbol,
        name: reg.name,
        decimals: reg.decimals,
        balance: reg.initialBalance,
        formattedBalance,
        allowance: reg.initialAllowance,
        formattedAllowance,
        status: reg.status,
        quoteBnb,
        priceBnb: reg.priceBnb,
        priceUsd: reg.priceBnb * 580, // Approx BNB price in USD
        isFourMeme: reg.isFourMeme,
        bondingProgress: reg.bondingProgress,
        riskScore: reg.riskScore,
        riskFlags: reg.riskFlags,
      });
    }
  }

  getAllTokens(): TokenInfo[] {
    return Array.from(this.tokens.values());
  }

  getToken(address: string): TokenInfo | undefined {
    return this.tokens.get(address.toLowerCase());
  }

  /**
   * Import custom token address with ERC-20 inspection
   */
  async importCustomToken(address: string): Promise<{ success: boolean; token?: TokenInfo; error?: string }> {
    if (!address.startsWith('0x') || address.length !== 42) {
      return { success: false, error: 'Invalid EVM token address format (must start with 0x and be 42 characters).' };
    }

    const lower = address.toLowerCase();
    if (this.tokens.has(lower)) {
      return { success: false, error: 'Token is already in your portfolio list.' };
    }

    // Inspect token: generate deterministic mock or on-chain attributes for custom imported token
    const shortSymbol = 'CUST-' + address.substring(2, 6).toUpperCase();
    const mockBalance = 500000n * 10n ** 18n;
    const formattedBalance = this.formatBal(mockBalance, 18);
    const priceBnb = 0.00000021;
    const quoteBnb = ((Number(mockBalance) / 1e18) * priceBnb).toFixed(4);

    const newToken: TokenInfo = {
      address: address as `0x${string}`,
      symbol: shortSymbol,
      name: `Custom Token (${shortSymbol})`,
      decimals: 18,
      balance: mockBalance,
      formattedBalance,
      allowance: 0n,
      formattedAllowance: '0.00',
      status: 'unverified',
      quoteBnb,
      priceBnb,
      priceUsd: priceBnb * 580,
      isFourMeme: false,
      bondingProgress: 25,
      riskScore: 'C',
      riskFlags: ['Custom imported token', 'Source unverified on explorer', 'Requires approval'],
    };

    this.tokens.set(lower, newToken);
    return { success: true, token: newToken };
  }

  updateAllowance(tokenAddress: string, newAllowance: bigint) {
    const token = this.tokens.get(tokenAddress.toLowerCase());
    if (token) {
      token.allowance = newAllowance;
      token.formattedAllowance = this.formatBal(newAllowance, token.decimals);
    }
  }

  updateBalanceAfterSale(tokenAddress: string, soldAmount: bigint) {
    const token = this.tokens.get(tokenAddress.toLowerCase());
    if (token) {
      const remaining = token.balance > soldAmount ? token.balance - soldAmount : 0n;
      token.balance = remaining;
      token.formattedBalance = this.formatBal(remaining, token.decimals);
      token.quoteBnb = (
        (Number(remaining) / 10 ** token.decimals) *
        token.priceBnb
      ).toFixed(4);
    }
  }

  private formatBal(amount: bigint, decimals: number): string {
    const val = formatUnits(amount, decimals);
    const num = parseFloat(val);
    return num.toLocaleString('en-US', { maximumFractionDigits: 2 });
  }
}
