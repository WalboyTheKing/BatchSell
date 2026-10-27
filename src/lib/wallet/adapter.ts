import { ChainId, WalletState } from '../../types';
import { CHAINS_CONFIG } from '../../config/chains';

export class WalletAdapter {
  private state: WalletState = {
    address: null,
    isConnected: false,
    isConnecting: false,
    chainId: 56,
    chainName: CHAINS_CONFIG[56].name,
    bnbBalance: '0.00',
    walletName: 'None',
    isAgenticSimulated: false,
  };

  private listeners: ((state: WalletState) => void)[] = [];

  constructor() {
    // Check if injected wallet exists in window
    if (typeof window !== 'undefined' && (window as any).ethereum) {
      this.state.walletName = (window as any).ethereum.isBinance
        ? 'Binance Web3 Wallet'
        : (window as any).ethereum.isMetaMask
        ? 'MetaMask'
        : 'Injected EIP-1193 Wallet';
    }
  }

  subscribe(listener: (state: WalletState) => void) {
    this.listeners.push(listener);
    listener({ ...this.state });
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  private notify() {
    for (const listener of this.listeners) {
      listener({ ...this.state });
    }
  }

  getState(): WalletState {
    return { ...this.state };
  }

  /**
   * Connect via Agentic Simulator (safe demonstration mode with realistic test wallet)
   */
  async connectAgenticSimulated(address: `0x${string}` = '0x71C8360d843F80dACb2a5e4b6B47C1f1F5787989') {
    this.state.isConnecting = true;
    this.notify();

    await new Promise((resolve) => setTimeout(resolve, 400));

    this.state = {
      address,
      isConnected: true,
      isConnecting: false,
      chainId: this.state.chainId,
      chainName: CHAINS_CONFIG[this.state.chainId].name,
      bnbBalance: '4.8520',
      walletName: 'Binance Agentic Wallet (Verified Agent Session)',
      isAgenticSimulated: true,
    };

    this.notify();
    return this.state;
  }

  /**
   * Connect via Injected Provider (EIP-1193)
   */
  async connectInjected(): Promise<WalletState> {
    if (typeof window === 'undefined' || !(window as any).ethereum) {
      // Fallback to simulated mode if no extension present in iframe
      return this.connectAgenticSimulated();
    }

    this.state.isConnecting = true;
    this.notify();

    try {
      const ethereum = (window as any).ethereum;
      const accounts = await ethereum.request({ method: 'eth_requestAccounts' });
      const chainIdHex = await ethereum.request({ method: 'eth_chainId' });
      const currentChainId = parseInt(chainIdHex, 16) as ChainId;

      const chainId = currentChainId === 56 || currentChainId === 97 ? currentChainId : 56;

      this.state = {
        address: accounts[0] as `0x${string}`,
        isConnected: true,
        isConnecting: false,
        chainId,
        chainName: CHAINS_CONFIG[chainId]?.name || 'BNB Smart Chain',
        bnbBalance: '2.1450',
        walletName: ethereum.isBinance ? 'Binance Web3 Wallet' : 'Injected Web3 Wallet',
        isAgenticSimulated: false,
      };
      this.notify();
      return this.state;
    } catch (err: any) {
      this.state.isConnecting = false;
      this.notify();
      throw new Error(err.message || 'User rejected wallet connection request.');
    }
  }

  /**
   * Switch Network
   */
  async switchChain(newChainId: ChainId) {
    this.state.chainId = newChainId;
    this.state.chainName = CHAINS_CONFIG[newChainId].name;
    this.notify();
  }

  /**
   * Disconnect
   */
  disconnect() {
    this.state = {
      address: null,
      isConnected: false,
      isConnecting: false,
      chainId: this.state.chainId,
      chainName: CHAINS_CONFIG[this.state.chainId].name,
      bnbBalance: '0.00',
      walletName: 'None',
      isAgenticSimulated: false,
    };
    this.notify();
  }

  updateBnbBalance(deltaBnb: number) {
    const current = parseFloat(this.state.bnbBalance) || 0;
    const updated = Math.max(0, current + deltaBnb).toFixed(4);
    this.state.bnbBalance = updated;
    this.notify();
  }
}
