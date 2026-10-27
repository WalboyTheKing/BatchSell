import React, { useState } from 'react';
import { 
  ShieldCheck, 
  AlertTriangle, 
  CheckCircle2, 
  XCircle, 
  ExternalLink, 
  Layers, 
  Fuel, 
  ArrowLeft, 
  Lock, 
  RefreshCw,
  Coins
} from 'lucide-react';
import { BatchPlan, ExecutionMode, ChainId } from '../types';
import { CHAINS_CONFIG } from '../config/chains';
import { SimulationSummary } from '../lib/simulation/simulator';

interface SimulationViewProps {
  batchPlan: BatchPlan;
  simulation: SimulationSummary | null;
  chainId: ChainId;
  onExecute: () => Promise<void>;
  onReSimulate: () => void;
  onBackToBuilder: () => void;
  isExecuting: boolean;
}

export const SimulationView: React.FC<SimulationViewProps> = ({
  batchPlan,
  simulation,
  chainId,
  onExecute,
  onReSimulate,
  onBackToBuilder,
  isExecuting,
}) => {
  const [activeStepTab, setActiveStepTab] = useState<'all' | 'approvals' | 'sells'>('all');
  const blockExplorer = CHAINS_CONFIG[chainId].blockExplorer;

  const isBlocked = simulation?.riskRating === 'BLOCKED' || simulation?.errorsCount! > 0;
  const approvalsNeeded = batchPlan.items.filter((item) => item.needsApproval);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <button
            onClick={onBackToBuilder}
            className="text-xs text-slate-400 hover:text-white flex items-center space-x-1 mb-1 transition"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Modifier la sélection</span>
          </button>
          <h2 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight flex items-center space-x-2">
            <ShieldCheck className="w-6 h-6 text-emerald-400" />
            <span>Simulation Pré-Vol & Revue du Plan</span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Vérification cryptographique des calldata, liquidités des courbes et conformité anti-reentrancy avant signature.
          </p>
        </div>

        <button
          onClick={onReSimulate}
          className="px-3.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold flex items-center space-x-1.5 transition self-start sm:self-center"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Rafraîchir Simulation</span>
        </button>
      </div>

      {/* Safety Score Banner */}
      {simulation && (
        <div
          className={`p-4 sm:p-5 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
            simulation.riskRating === 'SAFE'
              ? 'bg-emerald-500/10 border-emerald-500/40'
              : simulation.riskRating === 'MODERATE_RISK'
              ? 'bg-amber-500/10 border-amber-500/40'
              : simulation.riskRating === 'HIGH_RISK'
              ? 'bg-yellow-500/10 border-yellow-500/40'
              : 'bg-rose-500/10 border-rose-500/40'
          }`}
        >
          <div className="flex items-start space-x-3">
            <div className="p-2 rounded-xl bg-slate-900/60 shrink-0">
              {simulation.riskRating === 'SAFE' ? (
                <CheckCircle2 className="w-6 h-6 text-emerald-400" />
              ) : simulation.riskRating === 'BLOCKED' ? (
                <XCircle className="w-6 h-6 text-rose-400" />
              ) : (
                <AlertTriangle className="w-6 h-6 text-amber-400" />
              )}
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-extrabold text-base text-white">
                  Évaluation Globale : {simulation.riskRating}
                </span>
                <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-slate-900 font-mono text-slate-200">
                  {batchPlan.executionMode === 'atomic' ? 'Batch Atomique' : 'Séquentiel'}
                </span>
              </div>
              <ul className="text-xs text-slate-300 mt-1 space-y-0.5">
                {simulation.auditNotes.map((note, idx) => (
                  <li key={idx} className="flex items-center space-x-1.5">
                    <span className="text-slate-400">•</span>
                    <span>{note}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="text-right sm:border-l sm:border-slate-800/80 sm:pl-6 shrink-0 text-xs">
            <div className="text-slate-400">Frais de Gas Estimés</div>
            <div className="font-mono text-white font-bold text-sm flex items-center justify-end space-x-1 mt-0.5">
              <Fuel className="w-3.5 h-3.5 text-amber-400" />
              <span>{simulation.gasCostBnb} BNB</span>
            </div>
            <div className="text-[10px] text-slate-500 mt-0.5">
              ≈ {simulation.simulatedGasUnits.toLocaleString()} gas units
            </div>
          </div>
        </div>
      )}

      {/* Execution Roadmap Notice */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 text-xs">
        <div className="font-bold text-white mb-2 flex items-center space-x-2">
          <Layers className="w-4 h-4 text-amber-400" />
          <span>Déroulement des Confirmations</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-slate-300">
          <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800">
            <div className="font-semibold text-amber-300 mb-1">
              Étape 1 : Autorisations ERC-20 ({approvalsNeeded.length} requise{approvalsNeeded.length > 1 ? 's' : ''})
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              {approvalsNeeded.length === 0
                ? 'Aucune autorisation nécessaire ! Les allowances existantes couvrent déjà 100% des montants.'
                : 'Autorisation stricte au montant exact demandé, limitant toute exposition de votre wallet.'}
            </p>
          </div>

          <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800">
            <div className="font-semibold text-emerald-300 mb-1">
              Étape 2 : Exécution de la Vente (1 Transaction Unique)
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Le contrat BatchSellExecutor vend tous les tokens en un appel atomique et vous transfère immédiatement 100% des BNB générés.
            </p>
          </div>
        </div>
      </div>

      {/* Individual Operations Detailed List */}
      <div className="space-y-3">
        <h3 className="text-sm font-bold text-white flex items-center justify-between">
          <span>Détail des Opérations Prévues ({batchPlan.items.length})</span>
          <span className="text-xs font-normal text-slate-400">
            Slippage configuré : {(batchPlan.slippageBps / 100).toFixed(1)}%
          </span>
        </h3>

        {batchPlan.items.map((item, idx) => (
          <div
            key={item.id}
            className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 text-xs space-y-3"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center space-x-3">
                <span className="w-5 h-5 rounded-full bg-slate-800 text-slate-400 flex items-center justify-center font-mono font-bold text-[10px]">
                  {idx + 1}
                </span>
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="font-bold text-white text-sm">{item.token.symbol}</span>
                    <span className="text-slate-400 text-[11px]">({item.token.name})</span>
                    <span className="bg-slate-800 text-slate-300 px-1.5 py-0.2 rounded text-[10px] font-mono">
                      {item.percentToSell}% du solde
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-400 mt-0.5">
                    Quantité vendue : <span className="font-mono text-slate-200">{item.formattedAmount}</span>
                  </div>
                </div>
              </div>

              <div className="text-right sm:text-right">
                <div className="font-mono font-bold text-amber-300 text-sm">
                  + {item.estimatedBnbReceived} BNB
                </div>
                <div className="text-[10px] text-slate-500">
                  Min. garanti : {item.minBnbExpected} BNB
                </div>
              </div>
            </div>

            {/* Technical Target Call & Decoded Param Details */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2 pt-2 border-t border-slate-800/80 text-[11px]">
              <div className="bg-slate-950/50 p-2 rounded border border-slate-800">
                <div className="text-slate-500 text-[10px] uppercase font-semibold">Contrat Cible</div>
                <div className="font-mono text-slate-300 truncate mt-0.5">
                  {item.targetRouter}
                </div>
                <div className="text-[10px] text-amber-400/80">{item.routerName}</div>
              </div>

              <div className="bg-slate-950/50 p-2 rounded border border-slate-800">
                <div className="text-slate-500 text-[10px] uppercase font-semibold">Fonction & Protocole</div>
                <div className="font-mono text-emerald-400 truncate mt-0.5">
                  {item.protocol === 'fourmeme' ? 'sellToken(address,uint,uint)' : 'swapExactTokensForETH(...)'}
                </div>
                <div className="text-[10px] text-slate-400">
                  {item.protocol === 'fourmeme' ? 'Bonding curve native' : 'PancakeSwap V2 Pool'}
                </div>
              </div>

              <div className="bg-slate-950/50 p-2 rounded border border-slate-800">
                <div className="text-slate-500 text-[10px] uppercase font-semibold">Statut Simulation</div>
                <div className="mt-0.5 flex items-center space-x-1.5 font-medium">
                  {item.simulationStatus === 'success' ? (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="text-emerald-400">Solvabilité confirmée</span>
                    </>
                  ) : item.simulationStatus === 'warning' ? (
                    <>
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                      <span className="text-amber-400">Avertissement liquidité</span>
                    </>
                  ) : (
                    <>
                      <XCircle className="w-3.5 h-3.5 text-rose-400" />
                      <span className="text-rose-400">Erreur de simulation</span>
                    </>
                  )}
                </div>
                <div className="text-[10px] text-slate-400 truncate mt-0.5">
                  {item.simulationMessage}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Sticky Execution Confirmation Footer */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-2xl flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <div className="text-xs text-slate-400">Net total garanti à recevoir :</div>
          <div className="text-2xl font-extrabold text-white font-mono">
            {batchPlan.minTotalBnbOut} <span className="text-sm text-amber-400">BNB</span>
          </div>
          <div className="text-[11px] text-slate-500">
            Tolérance de slippage maximale : {(batchPlan.slippageBps / 100).toFixed(1)}%
          </div>
        </div>

        <div className="flex items-center space-x-3 w-full sm:w-auto">
          <button
            onClick={onBackToBuilder}
            className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition"
          >
            Annuler / Modifier
          </button>

          <button
            onClick={onExecute}
            disabled={isExecuting || isBlocked}
            className={`flex-1 sm:flex-none px-8 py-3 rounded-xl font-bold text-xs transition shadow-lg flex items-center justify-center space-x-2 ${
              isBlocked
                ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
                : 'bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 text-slate-950 shadow-amber-500/20'
            }`}
          >
            {isExecuting ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin text-slate-950" />
                <span>Exécution du Batch en cours...</span>
              </>
            ) : isBlocked ? (
              <span>Exécution Bloquée (Risque Critique)</span>
            ) : (
              <span>Confirmer & Diffuser le Batch ({batchPlan.items.length})</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
