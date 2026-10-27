import { encodeFunctionData, parseAbi, formatUnits } from 'viem';
import { TokenInfo } from '../../types';

export const ERC20_ABI = parseAbi([
  'function approve(address spender, uint256 amount) external returns (bool)',
  'function allowance(address owner, address spender) external view returns (uint256)',
  'function balanceOf(address account) external view returns (uint256)',
]);

export interface ApprovalAction {
  tokenAddress: `0x${string}`;
  tokenSymbol: string;
  spender: `0x${string}`;
  spenderName: string;
  currentAllowance: bigint;
  requiredAmount: bigint;
  isSufficient: boolean;
  proposedAllowance: bigint;
  allowanceMode: 'strict_exact' | 'unlimited';
  requiresZeroResetFirst: boolean;
  calldata: `0x${string}`;
}

export class ApprovalEngine {
  /**
   * Evaluates if approval is needed for a token sale
   */
  static evaluateApproval(
    token: TokenInfo,
    amountToSell: bigint,
    spender: `0x${string}`,
    spenderName: string,
    mode: 'strict_exact' | 'unlimited' = 'strict_exact'
  ): ApprovalAction {
    const isSufficient = token.allowance >= amountToSell;
    const requiresZeroResetFirst = token.allowance > 0n && !isSufficient;

    // Strict exact amount avoids exposing wallet to infinite approval drain
    const proposedAllowance = mode === 'strict_exact'
      ? amountToSell
      : 115792089237316195423570985008687907853269984665640564039457584007913129639935n; // 2^256 - 1

    const calldata = encodeFunctionData({
      abi: ERC20_ABI,
      functionName: 'approve',
      args: [spender, proposedAllowance],
    });

    return {
      tokenAddress: token.address,
      tokenSymbol: token.symbol,
      spender,
      spenderName,
      currentAllowance: token.allowance,
      requiredAmount: amountToSell,
      isSufficient,
      proposedAllowance,
      allowanceMode: mode,
      requiresZeroResetFirst,
      calldata,
    };
  }

  /**
   * Generates calldata to safely revoke an allowance to 0
   */
  static buildRevokeCalldata(
    spender: `0x${string}`
  ): `0x${string}` {
    return encodeFunctionData({
      abi: ERC20_ABI,
      functionName: 'approve',
      args: [spender, 0n],
    });
  }

  /**
   * Helper to format allowance nicely
   */
  static formatAllowanceDisplay(allowance: bigint, decimals: number): string {
    if (allowance >= 10n ** 30n) {
      return 'Unlimited (Max)';
    }
    if (allowance === 0n) {
      return '0.00 (None)';
    }
    const formatted = formatUnits(allowance, decimals);
    const num = parseFloat(formatted);
    return num.toLocaleString('en-US', { maximumFractionDigits: 4 });
  }
}
