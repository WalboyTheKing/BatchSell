import React from 'react';
import { 
  Zap, 
  ShieldCheck, 
  Layers, 
  Coins, 
  ArrowRight, 
  CheckCircle2, 
  AlertCircle, 
  Flame, 
  Cpu, 
  ExternalLink 
} from 'lucide-react';
import { TokenInfo, WalletState } from '../types';
import { CHAINS_CONFIG } from '../config/chains';

interface DashboardViewProps {
  tokens: TokenInfo[];
  walletState: WalletState;
  onNavigate: (tab: string) => void;
  onSelectToken: (token: TokenInfo) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  tokens,
  walletState,
  onNavigate,
}) => {
  const chainConfig = CHAINS_CONFIG[walletState.chainId];
  const fourMemeCount = tokens.filter((t) => t.isFourMeme).length;
  const needsApprovalCount = tokens.filter((t) => t.allowance === 0n && t.balance > 0n).length;
  const readyToBatchCount = tokens.filter((t) => t.balance > 0n).length;

  const totalPortfolioBnb = tokens.reduce(
    (acc, t) => acc + (Number(t.balance) / 10 ** t.decimals) * t.priceBnb,
    0
  );

  return (
    <div className="space-y-6">
      {/* Hero Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-slate-900 to-amber-950/30 border border-slate-800 p-6 sm:p-8">
        <div className="relative z-10 max-w-3xl">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-semibold mb-4">
            <Cpu className="w-3.5 h-3.5" />
            <span>Infrastructure Optimisée pour Binance AI Pro & Agentic Wallets</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight leading-tight">
            Exécutez vos ventes multi-tokens fourMeme en <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-yellow-300">un seul batch atomique</span>.
          </h1>
          <p className="mt-3 text-sm sm:text-base text-slate-300 leading-relaxed">
            Supprimez l'enfer des 2N confirmations manuelles sur BNB Chain. BatchSell inspecte les allowances, simule les slippages sur les bonding curves et PancakeSwap, puis regroupe vos transactions en toute sécurité non-custodiale.
          </p>

          <div className="mt-6 flex flex-wrap items-center gap-3">
            <button
              onClick={() => onNavigate('tokens')}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 text-slate-950 font-bold text-sm shadow-lg shadow-amber-500/20 transition flex items-center space-x-2"
            >
              <span>Préparer une Vente Groupée</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              onClick={() => onNavigate('docs')}
              className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-medium text-sm transition flex items-center space-x-2"
            >
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Consulter l'Audit & Architecture</span>
            </button>
          </div>
        </div>

        {/* Decorative background glow */}
        <div className="absolute right-0 top-0 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20"></div>
      </div>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1 */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 hover:border-slate-700 transition">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium uppercase tracking-wider">Tokens Découverts</span>
            <Coins className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-bold text-white font-mono">{tokens.length}</div>
          <div className="text-xs text-slate-400 mt-1 flex items-center space-x-1">
            <span className="text-amber-400 font-semibold">{fourMemeCount} tokens fourMeme</span>
            <span>détectés</span>
          </div>
        </div>

        {/* Card 2 */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 hover:border-slate-700 transition">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium uppercase tracking-wider">Valeur Estimée</span>
            <Flame className="w-4 h-4 text-yellow-400" />
          </div>
          <div className="text-2xl font-bold text-white font-mono">
            {totalPortfolioBnb.toFixed(4)} <span className="text-xs text-amber-400">BNB</span>
          </div>
          <div className="text-xs text-slate-400 mt-1">
            ≈ ${(totalPortfolioBnb * 580).toFixed(2)} USD
          </div>
        </div>

        {/* Card 3 */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 hover:border-slate-700 transition">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium uppercase tracking-wider">Statut des Allowances</span>
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold text-white font-mono">
            {needsApprovalCount > 0 ? (
              <span className="text-amber-400">{needsApprovalCount} à autoriser</span>
            ) : (
              <span className="text-emerald-400">100% Prêt</span>
            )}
          </div>
          <div className="text-xs text-slate-400 mt-1">
            Approvals stricts (montant exact requis)
          </div>
        </div>

        {/* Card 4 */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 hover:border-slate-700 transition">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium uppercase tracking-wider">Moteur d'Exécution</span>
            <Layers className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-base font-bold text-white">Batch Atomique</div>
          <div className="text-xs text-slate-400 mt-1 flex items-center space-x-1">
            <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
            <span className="text-emerald-400 font-medium">Revert global protecteur</span>
          </div>
        </div>
      </div>

      {/* System Status and Architecture Highlights */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Why BatchSell solves the Agentic UX bottleneck */}
        <div className="lg:col-span-2 bg-slate-900/80 border border-slate-800 rounded-xl p-6">
          <h2 className="text-base font-bold text-white flex items-center space-x-2">
            <Zap className="w-5 h-5 text-amber-400" />
            <span>Résolution du Goulot d'Étranglement Agentic Wallet</span>
          </h2>
          <p className="text-xs text-slate-300 mt-2 leading-relaxed">
            Lorsque Binance AI Pro exécute un ordre de liquidation sur plusieurs tokens fourMeme, le protocole standard déclenche une cascade de pop-ups successives.
          </p>

          <div className="mt-5 grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Standard Flow */}
            <div className="p-4 rounded-xl bg-slate-950/60 border border-rose-500/20">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-rose-400">Parcours Classique (Sans BatchSell)</span>
                <span className="text-[10px] bg-rose-500/10 text-rose-400 px-2 py-0.5 rounded-full font-mono">2N signatures</span>
              </div>
              <ul className="space-y-2 text-xs text-slate-400">
                <li className="flex items-start space-x-2">
                  <span className="text-rose-400 font-bold">1.</span>
                  <span>Signature Approval Token 1</span>
                </li>
                <li className="flex items-start space-x-2">
                  <span className="text-rose-400 font-bold">2.</span>
                  <span>Signature Vente Token 1 (FourMeme)</span>
                </li>
                <li className="flex items-start space-x-2">
                  <span className="text-rose-400 font-bold">3.</span>
                  <span>Signature Approval Token 2...</span>
                </li>
                <li className="flex items-start space-x-2">
                  <span className="text-rose-400 font-bold">4.</span>
                  <span>Risque d'échec asymétrique et perte de temps</span>
                </li>
              </ul>
            </div>

            {/* BatchSell Flow */}
            <div className="p-4 rounded-xl bg-amber-500/5 border border-amber-500/30">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-amber-400">Parcours BatchSell Atomique</span>
                <span className="text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded-full font-mono">1 Transaction Vente</span>
              </div>
              <ul className="space-y-2 text-xs text-slate-300">
                <li className="flex items-start space-x-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                  <span>Vérification automatique des allowances existantes</span>
                </li>
                <li className="flex items-start space-x-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                  <span>Simulation pré-vol de slippage et impact prix</span>
                </li>
                <li className="flex items-start space-x-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                  <span>Vente groupée en une transaction atomique</span>
                </li>
                <li className="flex items-start space-x-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                  <span>Option de révocation immédiate post-exécution</span>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Right Column: Verified Smart Contracts info */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-6 flex flex-col justify-between">
          <div>
            <h2 className="text-base font-bold text-white flex items-center space-x-2">
              <ShieldCheck className="w-5 h-5 text-emerald-400" />
              <span>Contrats & Protocoles</span>
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Adresses officielles vérifiées sur {chainConfig.name}
            </p>

            <div className="mt-4 space-y-3 text-xs">
              <div className="p-2.5 rounded-lg bg-slate-950/50 border border-slate-800">
                <div className="text-slate-400 font-medium">FourMeme Bonding Curve Router</div>
                <div className="font-mono text-amber-300 text-[11px] truncate mt-0.5">
                  {chainConfig.fourMemeRouter}
                </div>
              </div>
              <div className="p-2.5 rounded-lg bg-slate-950/50 border border-slate-800">
                <div className="text-slate-400 font-medium">PancakeSwap V2 Router (Graduated)</div>
                <div className="font-mono text-slate-300 text-[11px] truncate mt-0.5">
                  {chainConfig.pancakeRouter}
                </div>
              </div>
              <div className="p-2.5 rounded-lg bg-slate-950/50 border border-slate-800">
                <div className="text-slate-400 font-medium">BatchSellExecutor (Non-Custodial)</div>
                <div className="font-mono text-emerald-400 text-[11px] truncate mt-0.5">
                  {chainConfig.batchSellExecutor}
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-800">
            <button
              onClick={() => onNavigate('tokens')}
              className="w-full py-2 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded-lg text-xs font-semibold transition flex items-center justify-center space-x-1.5"
            >
              <span>Accéder à la sélection des tokens</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
