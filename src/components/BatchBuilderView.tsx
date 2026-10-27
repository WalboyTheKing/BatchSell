import React from 'react';
import { 
  Sliders, 
  Trash2, 
  ShieldCheck, 
  Zap, 
  AlertTriangle, 
  Layers, 
  Info, 
  ArrowRight,
  Flame,
  CheckCircle2,
  Lock
} from 'lucide-react';
import { TokenInfo, ExecutionMode, BatchPlan } from '../types';

interface BatchBuilderViewProps {
  selectedTokens: { token: TokenInfo; percentToSell: number }[];
  onUpdatePercent: (tokenAddress: string, percent: number) => void;
  onSetGlobalPercent: (percent: number) => void;
  onRemoveToken: (tokenAddress: string) => void;
  executionMode: ExecutionMode;
  onSetExecutionMode: (mode: ExecutionMode) => void;
  slippageBps: number;
  onSetSlippageBps: (bps: number) => void;
  approvalMode: 'strict_exact' | 'unlimited';
  onSetApprovalMode: (mode: 'strict_exact' | 'unlimited') => void;
  batchPlan: BatchPlan | null;
  onRunSimulation: () => void;
  onBackToTokens: () => void;
}

export const BatchBuilderView: React.FC<BatchBuilderViewProps> = ({
  selectedTokens,
  onUpdatePercent,
  onSetGlobalPercent,
  onRemoveToken,
  executionMode,
  onSetExecutionMode,
  slippageBps,
  onSetSlippageBps,
  approvalMode,
  onSetApprovalMode,
  batchPlan,
  onRunSimulation,
  onBackToTokens,
}) => {
  if (selectedTokens.length === 0) {
    return (
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-12 text-center max-w-lg mx-auto">
        <div className="w-12 h-12 rounded-full bg-slate-800 text-slate-400 flex items-center justify-center mx-auto mb-4">
          <Sliders className="w-6 h-6" />
        </div>
        <h3 className="text-lg font-bold text-white">Aucun token sélectionné</h3>
        <p className="text-xs text-slate-400 mt-2 mb-6">
          Veuillez sélectionner au moins un token dans l'onglet Découverte pour construire votre plan de vente groupée.
        </p>
        <button
          onClick={onBackToTokens}
          className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition"
        >
          Retourner au portefeuille
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight flex items-center space-x-2">
            <Sliders className="w-6 h-6 text-amber-400" />
            <span>Configuration du Batch de Vente</span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Définissez les quotas de vente, ajustez les protections de slippage et choisissez le mode d'atomicité.
          </p>
        </div>

        {/* Global Percentage Buttons */}
        <div className="flex items-center space-x-1.5 bg-slate-900 border border-slate-800 p-1 rounded-xl">
          <span className="text-[11px] text-slate-400 px-2 font-medium">Tout vendre à :</span>
          {[25, 50, 75, 100].map((pct) => (
            <button
              key={pct}
              onClick={() => onSetGlobalPercent(pct)}
              className="px-2.5 py-1 rounded-lg text-xs font-semibold text-amber-300 hover:bg-slate-800 transition"
            >
              {pct}%
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Selected Tokens List & Per-token sliders */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between text-xs text-slate-400 px-1">
            <span>Tokens inclus dans le batch ({selectedTokens.length})</span>
            <button
              onClick={onBackToTokens}
              className="text-amber-400 hover:underline font-medium"
            >
              + Ajouter d'autres tokens
            </button>
          </div>

          <div className="space-y-3">
            {selectedTokens.map(({ token, percentToSell }) => {
              const amountToSell = (token.balance * BigInt(percentToSell)) / 100n;
              const formattedToSell = (Number(amountToSell) / 10 ** token.decimals).toLocaleString('en-US', {
                maximumFractionDigits: 2,
              });
              const bnbQuote = ((Number(amountToSell) / 10 ** token.decimals) * token.priceBnb).toFixed(4);

              return (
                <div
                  key={token.address}
                  className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-9 h-9 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-amber-400 text-xs">
                        {token.symbol.slice(0, 3)}
                      </div>
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="font-bold text-white text-sm">{token.symbol}</span>
                          <span className="text-xs text-slate-400">
                            {token.status === 'bonding_curve' ? 'FourMeme Curve' : 'PancakeSwap V2'}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-400">
                          Solde total: {token.formattedBalance}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-3">
                      <div className="text-right">
                        <div className="font-mono font-bold text-white text-sm">
                          {formattedToSell} <span className="text-xs text-amber-400">{token.symbol}</span>
                        </div>
                        <div className="text-[11px] text-slate-400">
                          ≈ {bnbQuote} BNB
                        </div>
                      </div>

                      <button
                        onClick={() => onRemoveToken(token.address)}
                        className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition"
                        title="Retirer du batch"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Percentage Slider */}
                  <div className="pt-2 border-t border-slate-800/80">
                    <div className="flex items-center justify-between text-xs mb-1.5">
                      <span className="text-slate-400">Part à liquider :</span>
                      <span className="font-mono font-bold text-amber-400">{percentToSell}%</span>
                    </div>

                    <div className="flex items-center space-x-3">
                      <input
                        type="range"
                        min="10"
                        max="100"
                        step="5"
                        value={percentToSell}
                        onChange={(e) => onUpdatePercent(token.address, parseInt(e.target.value, 10))}
                        className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
                      />

                      <div className="flex space-x-1 shrink-0">
                        {[25, 50, 75, 100].map((p) => (
                          <button
                            key={p}
                            onClick={() => onUpdatePercent(token.address, p)}
                            className={`px-2 py-0.5 rounded text-[10px] font-semibold transition ${
                              percentToSell === p
                                ? 'bg-amber-500 text-slate-950'
                                : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                            }`}
                          >
                            {p}%
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Col: Parameters & Execution Mode */}
        <div className="space-y-4">
          {/* Execution Mode Card */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center space-x-2">
              <Layers className="w-4 h-4 text-amber-400" />
              <span>Mécanisme d'Exécution</span>
            </h3>

            {/* Atomic vs Sequential Options */}
            <div className="space-y-2">
              <label
                onClick={() => onSetExecutionMode('atomic')}
                className={`p-3 rounded-xl border block cursor-pointer transition ${
                  executionMode === 'atomic'
                    ? 'bg-amber-500/10 border-amber-500/50'
                    : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center space-x-1.5">
                      <input
                        type="radio"
                        checked={executionMode === 'atomic'}
                        onChange={() => {}}
                        className="accent-amber-500"
                      />
                      <span className="font-bold text-xs text-white">Batch Atomique (Recommandé)</span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-1 pl-5">
                      Une seule transaction pour l'ensemble des ventes. Annulation complète si une vente échoue.
                    </p>
                  </div>
                  <span className="text-[9px] bg-emerald-500/20 text-emerald-300 px-1.5 py-0.5 rounded font-mono font-bold">
                    1 Tx Vente
                  </span>
                </div>
              </label>

              <label
                onClick={() => onSetExecutionMode('sequential')}
                className={`p-3 rounded-xl border block cursor-pointer transition ${
                  executionMode === 'sequential'
                    ? 'bg-amber-500/10 border-amber-500/50'
                    : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center space-x-1.5">
                      <input
                        type="radio"
                        checked={executionMode === 'sequential'}
                        onChange={() => {}}
                        className="accent-amber-500"
                      />
                      <span className="font-bold text-xs text-white">Séquentiel Contrôlé</span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-1 pl-5">
                      Une transaction individuelle par token. Permet des ventes partielles indépendantes.
                    </p>
                  </div>
                  <span className="text-[9px] bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded font-mono">
                    N Txs
                  </span>
                </div>
              </label>
            </div>

            {/* Slippage Settings */}
            <div className="pt-3 border-t border-slate-800">
              <div className="flex justify-between items-center text-xs mb-2">
                <span className="text-slate-300 font-medium">Tolérance de Slippage</span>
                <span className="font-mono font-bold text-amber-400">{(slippageBps / 100).toFixed(1)}%</span>
              </div>
              <div className="grid grid-cols-4 gap-1.5">
                {[50, 100, 200, 300].map((bps) => (
                  <button
                    key={bps}
                    onClick={() => onSetSlippageBps(bps)}
                    className={`py-1.5 rounded-lg text-xs font-semibold transition ${
                      slippageBps === bps
                        ? 'bg-amber-500 text-slate-950'
                        : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                    }`}
                  >
                    {(bps / 100).toFixed(1)}%
                  </button>
                ))}
              </div>
            </div>

            {/* Approval Strategy (Anti-Infinite Approval) */}
            <div className="pt-3 border-t border-slate-800">
              <div className="flex items-center space-x-1 text-xs text-slate-300 font-medium mb-2">
                <Lock className="w-3.5 h-3.5 text-amber-400" />
                <span>Politique d'Allowance</span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-[11px]">
                <button
                  onClick={() => onSetApprovalMode('strict_exact')}
                  className={`p-2 rounded-lg border text-left transition ${
                    approvalMode === 'strict_exact'
                      ? 'bg-amber-500/10 border-amber-500/40 text-amber-300 font-semibold'
                      : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:bg-slate-800'
                  }`}
                >
                  <div>Montant Strict (Recommandé)</div>
                  <div className="text-[9px] text-slate-500 mt-0.5">Zéro risque de drain</div>
                </button>
                <button
                  onClick={() => onSetApprovalMode('unlimited')}
                  className={`p-2 rounded-lg border text-left transition ${
                    approvalMode === 'unlimited'
                      ? 'bg-amber-500/10 border-amber-500/40 text-amber-300 font-semibold'
                      : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:bg-slate-800'
                  }`}
                >
                  <div>Illimité (Max)</div>
                  <div className="text-[9px] text-slate-500 mt-0.5">Évite ré-approbation</div>
                </button>
              </div>
            </div>
          </div>

          {/* Batch Summary & Simulation CTA Card */}
          {batchPlan && (
            <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 space-y-4">
              <h3 className="text-sm font-bold text-white">Estimation Totale</h3>

              <div className="space-y-2 text-xs">
                <div className="flex justify-between text-slate-400">
                  <span>Tokens dans le lot :</span>
                  <span className="font-mono text-white font-semibold">{batchPlan.totalTokensCount}</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Approvals requis :</span>
                  <span className="font-mono text-amber-400 font-semibold">{batchPlan.approvalsCount}</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Montant brut estimé :</span>
                  <span className="font-mono text-white font-bold">{batchPlan.totalEstimatedBnb} BNB</span>
                </div>
                <div className="flex justify-between text-emerald-400 font-medium">
                  <span>Minimum net garanti :</span>
                  <span className="font-mono font-bold">{batchPlan.minTotalBnbOut} BNB</span>
                </div>
              </div>

              <button
                onClick={onRunSimulation}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 text-slate-950 font-bold text-xs shadow-lg shadow-amber-500/20 transition flex items-center justify-center space-x-2"
              >
                <span>Lancer la Simulation Pré-Vol</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
