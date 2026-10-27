import { formatEther } from 'viem';
import { TokenInfo, BatchPlan, SellPlanItem, ExecutionMode, ChainId } from '../../types';
import { CHAINS_CONFIG } from '../../config/chains';
import { FourMemeAdapter } from '../protocols/fourMemeAdapter';
import { ApprovalEngine } from './approvalEngine';

export interface BuildBatchOptions {
  selectedTokens: {
    token: TokenInfo;
    percentToSell: number; // e.g. 100 for 100%, 50 for 50%
  }[];
  executionMode: ExecutionMode;
  slippageBps: number; // 200 = 2.0%
  chainId: ChainId;
  userAddress: `0x${string}`;
}

export class BatchBuilder {
  private adapter: FourMemeAdapter;

  constructor(chainId: ChainId = 56) {
    this.adapter = new FourMemeAdapter(chainId);
  }

  setChainId(chainId: ChainId) {
    this.adapter.setChainId(chainId);
  }

  async buildPlan(options: BuildBatchOptions): Promise<BatchPlan> {
    const { selectedTokens, executionMode, slippageBps, chainId, userAddress } = options;
    const chainConfig = CHAINS_CONFIG[chainId];

    const items: SellPlanItem[] = [];
    let totalEstimatedBnbWei = 0n;
    let minTotalBnbOutWei = 0n;
    let approvalsCount = 0;
    const risks: { level: 'low' | 'medium' | 'high' | 'critical'; message: string }[] = [];

    for (const { token, percentToSell } of selectedTokens) {
      if (token.balance <= 0n) continue;

      // Compute amount to sell
      const amountToSell = (token.balance * BigInt(percentToSell)) / 100n;
      if (amountToSell <= 0n) continue;

      // Target router or BatchSellExecutor
      const targetRouter = executionMode === 'atomic'
        ? chainConfig.batchSellExecutor
        : (token.status === 'graduated' ? chainConfig.pancakeRouter : chainConfig.fourMemeRouter);

      const routerName = executionMode === 'atomic'
        ? 'BatchSellExecutor (Atomic)'
        : (token.status === 'graduated' ? 'PancakeSwap V2 Router' : 'FourMeme Bonding Curve');

      // Get Quote
      const quote = await this.adapter.getQuote(token, amountToSell, slippageBps);

      totalEstimatedBnbWei += quote.expectedBnbOut;
      minTotalBnbOutWei += quote.minBnbOut;

      // Check approval
      // In atomic mode, user approves the BatchSellExecutor contract
      // In sequential mode, user approves the individual router
      const approvalTarget = executionMode === 'atomic' ? chainConfig.batchSellExecutor : quote.routerTarget;
      const approvalTargetName = executionMode === 'atomic' ? 'BatchSellExecutor' : quote.routerName;

      const approval = ApprovalEngine.evaluateApproval(
        token,
        amountToSell,
        approvalTarget,
        approvalTargetName,
        'strict_exact'
      );

      if (!approval.isSufficient) {
        approvalsCount++;
      }

      // Generate calldata
      const calldataInfo = this.adapter.buildSellCalldata(
        token.address,
        amountToSell,
        quote.minBnbOut,
        userAddress,
        quote.protocol
      );

      // Check risk
      if (token.riskScore === 'D' || token.riskScore === 'F') {
        risks.push({
          level: 'high',
          message: `${token.symbol}: Token has low trust score (${token.riskScore}). Possible honeypot or illiquidity.`,
        });
      }
      if (quote.priceImpactPercent > 5) {
        risks.push({
          level: 'medium',
          message: `${token.symbol}: High price impact of ${quote.priceImpactPercent}% on bonding curve.`,
        });
      }
      if (token.bondingProgress > 92 && token.status === 'bonding_curve') {
        risks.push({
          level: 'medium',
          message: `${token.symbol}: Bonding curve is at ${token.bondingProgress}%. May graduate during execution.`,
        });
      }

      items.push({
        id: `plan-${token.address}-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
        token,
        amountToSell,
        formattedAmount: (Number(amountToSell) / 10 ** token.decimals).toLocaleString('en-US', {
          maximumFractionDigits: 2,
        }),
        percentToSell,
        estimatedBnbReceived: formatEther(quote.expectedBnbOut),
        minBnbExpected: formatEther(quote.minBnbOut),
        targetRouter,
        routerName,
        protocol: quote.protocol,
        needsApproval: !approval.isSufficient,
        approvalAmount: approval.proposedAllowance,
        currentAllowance: token.allowance,
        calldata: calldataInfo.calldata,
        simulationStatus: 'untested',
      });
    }

    // Estimated Gas
    const baseGas = executionMode === 'atomic' ? 180000 : 120000;
    const perTokenGas = executionMode === 'atomic' ? 85000 : 140000;
    const estimatedGasGwei = baseGas + items.length * perTokenGas;

    if (items.length === 0) {
      risks.push({
        level: 'low',
        message: 'No tokens with valid balance selected.',
      });
    }

    return {
      items,
      totalTokensCount: items.length,
      totalEstimatedBnb: formatEther(totalEstimatedBnbWei),
      minTotalBnbOut: formatEther(minTotalBnbOutWei),
      slippageBps,
      executionMode,
      estimatedGasGwei,
      approvalsCount,
      risksIdentified: risks,
      atomicExecutorAddress: chainConfig.batchSellExecutor,
    };
  }
}
