export type ChainId = 56 | 97;

export type TokenStatus = 'bonding_curve' | 'graduated' | 'unverified';
export type RiskGrade = 'A' | 'B' | 'C' | 'D' | 'F';

export interface TokenInfo {
  address: `0x${string}`;
  symbol: string;
  name: string;
  decimals: number;
  balance: bigint;
  formattedBalance: string;
  allowance: bigint;
  formattedAllowance: string;
  status: TokenStatus;
  quoteBnb: string;
  priceBnb: number;
  priceUsd: number;
  isFourMeme: boolean;
  bondingProgress: number; // 0 to 100%
  riskScore: RiskGrade;
  riskFlags: string[];
}

export type ExecutionMode = 'atomic' | 'sequential';

export interface SellPlanItem {
  id: string;
  token: TokenInfo;
  amountToSell: bigint;
  formattedAmount: string;
  percentToSell: number;
  estimatedBnbReceived: string;
  minBnbExpected: string;
  targetRouter: `0x${string}`;
  routerName: string;
  protocol: 'fourmeme' | 'pancakeswap';
  needsApproval: boolean;
  approvalAmount: bigint;
  currentAllowance: bigint;
  calldata: string;
  simulationStatus: 'untested' | 'success' | 'warning' | 'error';
  simulationMessage?: string;
}

export interface BatchPlan {
  items: SellPlanItem[];
  totalTokensCount: number;
  totalEstimatedBnb: string;
  minTotalBnbOut: string;
  slippageBps: number; // e.g. 200 = 2.0%
  executionMode: ExecutionMode;
  estimatedGasGwei: number;
  approvalsCount: number;
  risksIdentified: {
    level: 'low' | 'medium' | 'high' | 'critical';
    message: string;
  }[];
  atomicExecutorAddress: `0x${string}`;
}

export interface ExecutionReceipt {
  id: string;
  txHash: `0x${string}`;
  bscscanUrl: string;
  timestamp: number;
  status: 'pending' | 'success' | 'failed';
  method: string;
  tokensCount: number;
  soldTokens: {
    symbol: string;
    amount: string;
    bnbReceived: string;
  }[];
  totalBnbReceived: string;
  gasUsed: string;
  errorMessage?: string;
  activeAllowanceRemaining: boolean;
}

export interface WalletState {
  address: `0x${string}` | null;
  isConnected: boolean;
  isConnecting: boolean;
  chainId: ChainId;
  chainName: string;
  bnbBalance: string;
  walletName: string;
  isAgenticSimulated: boolean;
}

export interface TestCaseResult {
  id: string;
  category: 'functional' | 'security';
  title: string;
  passed: boolean;
  description: string;
  detail?: string;
}
