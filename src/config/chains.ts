import { ChainId } from '../types';

export interface ChainConfig {
  id: ChainId;
  name: string;
  rpcUrl: string;
  nativeCurrency: {
    name: string;
    symbol: string;
    decimals: number;
  };
  blockExplorer: string;
  fourMemeRouter: `0x${string}`;
  pancakeRouter: `0x${string}`;
  batchSellExecutor: `0x${string}`;
}

export const CHAINS_CONFIG: Record<ChainId, ChainConfig> = {
  56: {
    id: 56,
    name: 'BNB Smart Chain (Mainnet)',
    rpcUrl: 'https://binance.llamarpc.com',
    nativeCurrency: {
      name: 'BNB',
      symbol: 'BNB',
      decimals: 18,
    },
    blockExplorer: 'https://bscscan.com',
    fourMemeRouter: '0x5c952063c7fc8610FFDB798152D69F0B9550762b',
    pancakeRouter: '0x10ED43C718714eb63d5aA57B78B54704E256024E',
    batchSellExecutor: '0x4B20993Bc481177ec7E8f571ceCaE8A9e22C02db',
  },
  97: {
    id: 97,
    name: 'BNB Smart Chain (Testnet)',
    rpcUrl: 'https://data-seed-prebsc-1-s1.binance.org:8545',
    nativeCurrency: {
      name: 'tBNB',
      symbol: 'tBNB',
      decimals: 18,
    },
    blockExplorer: 'https://testnet.bscscan.com',
    fourMemeRouter: '0x2514897e0F1b05F999D59E71F4259b3B15a81617',
    pancakeRouter: '0xD99D1c33F9fC3444f8101754aBC46c52416550D1',
    batchSellExecutor: '0x70997970C51812dc3A010C7d01b50e0d17dc79C8',
  },
};

export interface RegisteredToken {
  address: `0x${string}`;
  symbol: string;
  name: string;
  decimals: number;
  initialBalance: bigint;
  initialAllowance: bigint;
  status: 'bonding_curve' | 'graduated' | 'unverified';
  bondingProgress: number;
  priceBnb: number;
  isFourMeme: boolean;
  riskScore: 'A' | 'B' | 'C' | 'D' | 'F';
  riskFlags: string[];
}

export const INITIAL_REGISTERED_TOKENS: RegisteredToken[] = [
  {
    address: '0x8b3236e771e8f29E7be69741D8b4e24D0F80F684',
    symbol: 'BINANCECAT',
    name: 'Binance Cat Meme',
    decimals: 18,
    initialBalance: 1500000n * 10n ** 18n,
    initialAllowance: 0n,
    status: 'bonding_curve',
    bondingProgress: 68,
    priceBnb: 0.00000034,
    isFourMeme: true,
    riskScore: 'A',
    riskFlags: ['Bonding curve active', 'Zero prior allowance (safe)'],
  },
  {
    address: '0x22c2A938f17A9FAD805B5B8418080C0B08709335',
    symbol: 'AGENTPEPE',
    name: 'Agentic AI Pepe',
    decimals: 18,
    initialBalance: 8500000n * 10n ** 18n,
    initialAllowance: 10000000n * 10n ** 18n, // Already approved
    status: 'bonding_curve',
    bondingProgress: 42,
    priceBnb: 0.00000012,
    isFourMeme: true,
    riskScore: 'A',
    riskFlags: ['Bonding curve active', 'Existing allowance available'],
  },
  {
    address: '0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984',
    symbol: 'MEMEAI',
    name: 'Memetic Intelligence',
    decimals: 18,
    initialBalance: 420000n * 10n ** 18n,
    initialAllowance: 0n,
    status: 'bonding_curve',
    bondingProgress: 94,
    priceBnb: 0.00000185,
    isFourMeme: true,
    riskScore: 'B',
    riskFlags: ['High curve saturation (94%) - Near PancakeSwap graduation'],
  },
  {
    address: '0x0E09FaBB73Bd3Ade0a17ECC321fD13a19e81cE82',
    symbol: 'FLOKIBOND',
    name: 'Floki Bonded',
    decimals: 18,
    initialBalance: 25000000n * 10n ** 18n,
    initialAllowance: 25000000n * 10n ** 18n,
    status: 'graduated',
    bondingProgress: 100,
    priceBnb: 0.000000045,
    isFourMeme: true,
    riskScore: 'A',
    riskFlags: ['Graduated to PancakeSwap DEX V2'],
  },
  {
    address: '0x6B175474E89094C44Da98b954EedeAC495271d0F',
    symbol: 'SUSMEME',
    name: 'Suspicious Pump Coin',
    decimals: 18,
    initialBalance: 99000000n * 10n ** 18n,
    initialAllowance: 0n,
    status: 'unverified',
    bondingProgress: 15,
    priceBnb: 0.000000008,
    isFourMeme: false,
    riskScore: 'D',
    riskFlags: ['Unverified contract source', 'High slippage potential', 'Non-standard FourMeme signature'],
  },
];
