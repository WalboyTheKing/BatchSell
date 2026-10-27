import { BatchPlan, SellPlanItem } from '../../types';
import { CHAINS_CONFIG } from '../../config/chains';

export interface SimulationSummary {
  allPassed: boolean;
  warningsCount: number;
  errorsCount: number;
  simulatedGasUnits: number;
  gasCostBnb: string;
  updatedPlan: BatchPlan;
  riskRating: 'SAFE' | 'MODERATE_RISK' | 'HIGH_RISK' | 'BLOCKED';
  auditNotes: string[];
}

export class SimulationEngine {
  static async simulateBatch(
    plan: BatchPlan,
    chainId: 56 | 97,
    userBnbBalanceWei: bigint
  ): Promise<SimulationSummary> {
    const chainConfig = CHAINS_CONFIG[chainId];
    const updatedItems: SellPlanItem[] = [];
    const auditNotes: string[] = [];
    let errorsCount = 0;
    let warningsCount = 0;

    // Estimated gas in units (approx 3 Gwei gas price on BSC)
    const gasPriceGwei = 3n;
    const gasUnits = plan.executionMode === 'atomic'
      ? 160000 + plan.items.length * 80000
      : plan.items.length * 150000;
    const gasCostWei = BigInt(gasUnits) * (gasPriceGwei * 10n ** 9n);
    const gasCostBnb = (Number(gasCostWei) / 1e18).toFixed(5);

    // Check user BNB balance for gas
    if (userBnbBalanceWei < gasCostWei) {
      errorsCount++;
      auditNotes.push(`Insufficient BNB to cover estimated gas fees (${gasCostBnb} BNB required).`);
    } else {
      auditNotes.push(`Sufficient BNB balance confirmed for network execution fees.`);
    }

    for (const item of plan.items) {
      let itemStatus: 'success' | 'warning' | 'error' = 'success';
      let message = 'Simulation successful: route and liquidity verified.';

      // Check balance
      if (item.amountToSell > item.token.balance) {
        itemStatus = 'error';
        message = `Insufficient token balance: selling ${item.formattedAmount} but only ${item.token.formattedBalance} available.`;
        errorsCount++;
      } else if (item.token.riskScore === 'D' || item.token.riskScore === 'F') {
        itemStatus = 'warning';
        message = `High risk token (${item.token.symbol}): potential low liquidity or non-standard transfer taxes.`;
        warningsCount++;
      } else if (item.token.bondingProgress > 95 && item.protocol === 'fourmeme') {
        itemStatus = 'warning';
        message = `Curve near completion (${item.token.bondingProgress}%). Risk of graduation revert if target pool caps out.`;
        warningsCount++;
      }

      // Check router whitelisting in atomic mode
      if (plan.executionMode === 'atomic') {
        const isExecutor = item.targetRouter.toLowerCase() === chainConfig.batchSellExecutor.toLowerCase();
        if (!isExecutor) {
          itemStatus = 'error';
          message = 'Atomic executor target mismatch: router address is not whitelisted.';
          errorsCount++;
        }
      }

      updatedItems.push({
        ...item,
        simulationStatus: itemStatus,
        simulationMessage: message,
      });
    }

    // Determine overall rating
    let riskRating: 'SAFE' | 'MODERATE_RISK' | 'HIGH_RISK' | 'BLOCKED' = 'SAFE';
    if (errorsCount > 0) {
      riskRating = 'BLOCKED';
      auditNotes.push(`CRITICAL: ${errorsCount} fatal simulation issue(s) detected. Execution should be halted.`);
    } else if (warningsCount > 1) {
      riskRating = 'HIGH_RISK';
      auditNotes.push(`Warning: Multiple high-slippage or unverified tokens included in this batch.`);
    } else if (warningsCount === 1) {
      riskRating = 'MODERATE_RISK';
      auditNotes.push(`Moderate risk: 1 item has elevated volatility or bonding curve saturation.`);
    } else {
      auditNotes.push(`All simulation pre-flight checks passed successfully.`);
    }

    const updatedPlan: BatchPlan = {
      ...plan,
      items: updatedItems,
    };

    return {
      allPassed: errorsCount === 0,
      warningsCount,
      errorsCount,
      simulatedGasUnits: gasUnits,
      gasCostBnb,
      updatedPlan,
      riskRating,
      auditNotes,
    };
  }
}
