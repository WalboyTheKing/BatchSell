import React, { useState } from 'react';
import { 
  CheckCircle2, 
  ExternalLink, 
  ShieldCheck, 
  Copy, 
  Check, 
  ArrowRight, 
  Lock, 
  RotateCcw,
  RefreshCw,
  Coins
} from 'lucide-react';
import { ExecutionReceipt, TokenInfo, ChainId } from '../types';
import { CHAINS_CONFIG } from '../config/chains';

interface ReceiptsViewProps {
  receipts: ExecutionReceipt[];
  tokens: TokenInfo[];
  chainId: ChainId;
  onRevokeAllowance: (tokenAddress: string) => Promise<void>;
  onStartNewBatch: () => void;
}

export const ReceiptsView: React.FC<ReceiptsViewProps> = ({
  receipts,
  tokens,
  chainId,
  onRevokeAllowance,
  onStartNewBatch,
}) => {
  const [copiedTx, setCopiedTx] = useState<string | null>(null);
  const [revokingMap, setRevokingMap] = useState<Record<string, boolean>>({});

  const blockExplorer = CHAINS_CONFIG[chainId].blockExplorer;

  const handleCopy = (tx: string) => {
    navigator.clipboard.writeText(tx);
    setCopiedTx(tx);
    setTimeout(() => setCopiedTx(null), 1500);
  };

  const handleRevoke = async (tokenAddress: string) => {
    setRevokingMap((prev) => ({ ...prev, [tokenAddress]: true }));
    try {
      await onRevokeAllowance(tokenAddress);
    } finally {
      setRevokingMap((prev) => ({ ...prev, [tokenAddress]: false }));
    }
  };

  // Find tokens with remaining non-zero allowance
  const activeAllowanceTokens = tokens.filter((t) => t.allowance > 0n);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight flex items-center space-x-2">
            <CheckCircle2 className="w-6 h-6 text-emerald-400" />
            <span>Rapports d'Exécution & Reçus On-Chain</span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Consultez les hashes de vos transactions sur BSCScan, les deltas de solde et gérez la révocation de vos allowances.
          </p>
        </div>

        <button
          onClick={onStartNewBatch}
          className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 text-slate-950 font-bold text-xs shadow-md transition flex items-center space-x-1.5 self-start sm:self-center"
        >
          <span>Préparer une Nouvelle Vente</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {receipts.length === 0 ? (
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-12 text-center max-w-lg mx-auto">
          <div className="w-12 h-12 rounded-full bg-slate-800 text-slate-400 flex items-center justify-center mx-auto mb-4">
            <Coins className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-white">Aucun reçu de vente pour le moment</h3>
          <p className="text-xs text-slate-400 mt-2 mb-6">
            Vos transactions d'exécution groupée confirmées apparaîtront ici avec leurs liens officiels BSCScan.
          </p>
          <button
            onClick={onStartNewBatch}
            className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition"
          >
            Lancer un premier batch
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {receipts.map((rcpt) => (
            <div
              key={rcpt.id}
              className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 space-y-4"
            >
              {/* Receipt Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800/80 pb-3">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 rounded-full bg-emerald-500/10 text-emerald-400 flex items-center justify-center font-bold">
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="font-bold text-white text-sm">
                        Batch Atomique Confirmé avec Succès
                      </span>
                      <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 px-2 py-0.2 rounded text-[10px] font-mono">
                        {rcpt.tokensCount} Tokens Vendus
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-400 mt-0.5">
                      {new Date(rcpt.timestamp).toLocaleTimeString()} • Gas consommé : {rcpt.gasUsed}
                    </div>
                  </div>
                </div>

                {/* Hash with BSCScan link */}
                <div className="flex items-center space-x-2 bg-slate-950 p-2 rounded-lg border border-slate-800 text-xs self-start sm:self-center">
                  <span className="font-mono text-amber-300">
                    {rcpt.txHash.slice(0, 10)}...{rcpt.txHash.slice(-8)}
                  </span>
                  <button
                    onClick={() => handleCopy(rcpt.txHash)}
                    className="text-slate-400 hover:text-white"
                    title="Copier le hash"
                  >
                    {copiedTx === rcpt.txHash ? (
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>
                  <a
                    href={`${blockExplorer}/tx/${rcpt.txHash}`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-amber-400 hover:text-amber-300 flex items-center space-x-1"
                    title="Voir sur BSCScan"
                  >
                    <span>BSCScan</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>

              {/* Sold Tokens List */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {rcpt.soldTokens.map((st, i) => (
                  <div key={i} className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 text-xs">
                    <div className="text-slate-400 text-[10px] uppercase font-bold">{st.symbol}</div>
                    <div className="font-mono font-bold text-white mt-1">{st.amount}</div>
                    <div className="text-emerald-400 font-mono text-[11px] mt-0.5">
                      + {st.bnbReceived} BNB
                    </div>
                  </div>
                ))}
              </div>

              {/* Total Received summary */}
              <div className="pt-2 flex justify-between items-center text-xs">
                <span className="text-slate-400">Total BNB Natif Crédité :</span>
                <span className="font-mono font-bold text-white text-base text-amber-400">
                  + {rcpt.totalBnbReceived} BNB
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Active Allowances Hygiene Manager */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center space-x-2">
              <Lock className="w-4 h-4 text-amber-400" />
              <span>Hygiène des Allowances ERC-20</span>
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Consultez et révoquez immédiatement les autorisations restantes pour empêcher tout risque de dépense non désirée.
            </p>
          </div>
          <span className="text-xs text-slate-400 font-mono">
            {activeAllowanceTokens.length} allowance{activeAllowanceTokens.length > 1 ? 's' : ''} active{activeAllowanceTokens.length > 1 ? 's' : ''}
          </span>
        </div>

        {activeAllowanceTokens.length === 0 ? (
          <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs flex items-center space-x-2">
            <ShieldCheck className="w-4 h-4 shrink-0" />
            <span>Sécurité optimale : Aucune allowance ERC-20 résiduelle ouverte. Votre wallet est 100% protégé.</span>
          </div>
        ) : (
          <div className="space-y-2">
            {activeAllowanceTokens.map((token) => (
              <div
                key={token.address}
                className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 flex items-center justify-between text-xs"
              >
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="font-bold text-white">{token.symbol}</span>
                    <span className="text-slate-500 font-mono text-[11px]">{token.address.slice(0, 6)}...{token.address.slice(-4)}</span>
                  </div>
                  <div className="text-[11px] text-slate-400 mt-0.5">
                    Allowance active : <span className="font-mono text-amber-300">{token.formattedAllowance}</span>
                  </div>
                </div>

                <button
                  onClick={() => handleRevoke(token.address)}
                  disabled={revokingMap[token.address]}
                  className="px-3 py-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 font-semibold text-xs transition flex items-center space-x-1"
                >
                  {revokingMap[token.address] ? (
                    <>
                      <RefreshCw className="w-3 h-3 animate-spin" />
                      <span>Révocation...</span>
                    </>
                  ) : (
                    <>
                      <RotateCcw className="w-3 h-3" />
                      <span>Révoquer à 0</span>
                    </>
                  )}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
