import React, { useState } from 'react';
import { Shield, Zap, Wallet, ExternalLink, ChevronDown, Check, RefreshCw } from 'lucide-react';
import { WalletState, ChainId } from '../types';
import { CHAINS_CONFIG } from '../config/chains';

interface NavbarProps {
  walletState: WalletState;
  onConnectInjected: () => void;
  onConnectSimulated: () => void;
  onDisconnect: () => void;
  onSwitchChain: (chainId: ChainId) => void;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  testSuitePassCount?: { passed: number; total: number };
}

export const Navbar: React.FC<NavbarProps> = ({
  walletState,
  onConnectInjected,
  onConnectSimulated,
  onDisconnect,
  onSwitchChain,
  activeTab,
  setActiveTab,
  testSuitePassCount,
}) => {
  const [showNetworkMenu, setShowNetworkMenu] = useState(false);
  const [showWalletMenu, setShowWalletMenu] = useState(false);

  const shortenAddress = (addr: string | null) => {
    if (!addr) return '';
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  return (
    <header className="sticky top-0 z-50 bg-slate-900/90 backdrop-blur-md border-b border-slate-800 text-slate-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Project Title */}
          <div className="flex items-center space-x-3 cursor-pointer" onClick={() => setActiveTab('dashboard')}>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 to-yellow-300 flex items-center justify-center shadow-lg shadow-amber-500/20 text-slate-950 font-bold">
              <Zap className="w-6 h-6 fill-current text-slate-950" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-extrabold text-lg tracking-tight text-white">BatchSell</span>
                <span className="text-[10px] font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20 px-2 py-0.5 rounded-full uppercase tracking-wider">
                  BNB Chain
                </span>
              </div>
              <p className="text-xs text-slate-400 hidden sm:block">Agentic Wallet Batching Infrastructure</p>
            </div>
          </div>

          {/* Navigation Tabs */}
          <nav className="hidden md:flex items-center space-x-1">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                activeTab === 'dashboard'
                  ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              Tableau de bord
            </button>
            <button
              onClick={() => setActiveTab('tokens')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                activeTab === 'tokens'
                  ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              Découverte Tokens
            </button>
            <button
              onClick={() => setActiveTab('batch')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                activeTab === 'batch'
                  ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              Batch Builder
            </button>
            <button
              onClick={() => setActiveTab('docs')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center space-x-1.5 ${
                activeTab === 'docs'
                  ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              <span>Audit & Documentation</span>
              {testSuitePassCount && (
                <span className="bg-emerald-500/20 text-emerald-400 text-[10px] px-1.5 py-0.2 rounded-full font-mono">
                  {testSuitePassCount.passed}/{testSuitePassCount.total} tests
                </span>
              )}
            </button>
          </nav>

          {/* Right controls: Network selector & Wallet Connect */}
          <div className="flex items-center space-x-2.5">
            {/* Chain Selector */}
            <div className="relative">
              <button
                onClick={() => setShowNetworkMenu(!showNetworkMenu)}
                className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-slate-200 border border-slate-700 transition"
              >
                <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></div>
                <span className="font-medium hidden sm:inline">
                  {walletState.chainId === 56 ? 'BSC Mainnet (56)' : 'BSC Testnet (97)'}
                </span>
                <span className="sm:hidden">{walletState.chainId}</span>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </button>

              {showNetworkMenu && (
                <div className="absolute right-0 mt-2 w-52 bg-slate-800 border border-slate-700 rounded-xl shadow-xl py-1 z-50">
                  <div className="px-3 py-1.5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                    Changer de réseau
                  </div>
                  <button
                    onClick={() => {
                      onSwitchChain(56);
                      setShowNetworkMenu(false);
                    }}
                    className="w-full px-3 py-2 text-left text-xs text-slate-200 hover:bg-slate-700 flex items-center justify-between"
                  >
                    <div className="flex items-center space-x-2">
                      <span className="w-2 h-2 rounded-full bg-amber-400"></span>
                      <span>BNB Smart Chain (56)</span>
                    </div>
                    {walletState.chainId === 56 && <Check className="w-4 h-4 text-amber-400" />}
                  </button>
                  <button
                    onClick={() => {
                      onSwitchChain(97);
                      setShowNetworkMenu(false);
                    }}
                    className="w-full px-3 py-2 text-left text-xs text-slate-200 hover:bg-slate-700 flex items-center justify-between"
                  >
                    <div className="flex items-center space-x-2">
                      <span className="w-2 h-2 rounded-full bg-yellow-500"></span>
                      <span>BNB Testnet (97)</span>
                    </div>
                    {walletState.chainId === 97 && <Check className="w-4 h-4 text-amber-400" />}
                  </button>
                </div>
              )}
            </div>

            {/* Wallet Button */}
            {walletState.isConnected ? (
              <div className="relative">
                <button
                  onClick={() => setShowWalletMenu(!showWalletMenu)}
                  className="flex items-center space-x-2 px-3 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/30 hover:bg-amber-500/20 text-xs text-amber-300 font-medium transition"
                >
                  <div className="flex items-center space-x-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                    <span>{shortenAddress(walletState.address)}</span>
                  </div>
                  <span className="text-slate-400">|</span>
                  <span className="font-mono text-white font-semibold">{walletState.bnbBalance} BNB</span>
                </button>

                {showWalletMenu && (
                  <div className="absolute right-0 mt-2 w-64 bg-slate-800 border border-slate-700 rounded-xl shadow-xl p-3 z-50 text-xs">
                    <div className="text-slate-400 text-[11px] font-semibold mb-1">Session Wallet Connectée</div>
                    <div className="font-mono text-slate-200 break-all bg-slate-900/60 p-2 rounded border border-slate-700/60 mb-2">
                      {walletState.address}
                    </div>
                    <div className="text-[11px] text-amber-400/90 mb-3 bg-amber-500/10 p-2 rounded border border-amber-500/20">
                      {walletState.walletName}
                    </div>
                    <div className="flex justify-between items-center mb-3 text-slate-300">
                      <span>Solde BNB Natif :</span>
                      <span className="font-mono font-bold text-white">{walletState.bnbBalance} BNB</span>
                    </div>
                    <div className="border-t border-slate-700 pt-2 flex space-x-2">
                      <a
                        href={`${CHAINS_CONFIG[walletState.chainId].blockExplorer}/address/${walletState.address}`}
                        target="_blank"
                        rel="noreferrer"
                        className="flex-1 py-1.5 bg-slate-700 hover:bg-slate-600 rounded text-center text-[11px] text-slate-200 flex items-center justify-center space-x-1"
                      >
                        <span>Explorer</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                      <button
                        onClick={() => {
                          onDisconnect();
                          setShowWalletMenu(false);
                        }}
                        className="flex-1 py-1.5 bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/30 rounded text-center text-[11px]"
                      >
                        Déconnexion
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <button
                  onClick={onConnectSimulated}
                  className="px-3.5 py-1.5 rounded-lg bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 text-slate-950 font-bold text-xs shadow-md shadow-amber-500/20 transition flex items-center space-x-1.5"
                >
                  <Wallet className="w-3.5 h-3.5" />
                  <span>Connecter Agentic Wallet</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
