import React, { useState } from 'react';
import { 
  Search, 
  Plus, 
  ExternalLink, 
  CheckCircle2, 
  AlertTriangle, 
  Flame, 
  ShieldAlert, 
  Copy, 
  Check, 
  Layers, 
  Coins, 
  ArrowRight,
  Filter
} from 'lucide-react';
import { TokenInfo, ChainId } from '../types';
import { CHAINS_CONFIG } from '../config/chains';

interface TokensViewProps {
  tokens: TokenInfo[];
  selectedTokenAddresses: string[];
  onToggleToken: (token: TokenInfo) => void;
  onSelectAll: () => void;
  onDeselectAll: () => void;
  onImportCustomToken: (address: string) => Promise<{ success: boolean; error?: string }>;
  onProceedToBatch: () => void;
  chainId: ChainId;
}

export const TokensView: React.FC<TokensViewProps> = ({
  tokens,
  selectedTokenAddresses,
  onToggleToken,
  onSelectAll,
  onDeselectAll,
  onImportCustomToken,
  onProceedToBatch,
  chainId,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<'all' | 'curve' | 'graduated' | 'unapproved'>('all');
  const [customAddressInput, setCustomAddressInput] = useState('');
  const [importLoading, setImportLoading] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);
  const [copiedAddress, setCopiedAddress] = useState<string | null>(null);

  const blockExplorer = CHAINS_CONFIG[chainId].blockExplorer;

  const handleCopy = (address: string) => {
    navigator.clipboard.writeText(address);
    setCopiedAddress(address);
    setTimeout(() => setCopiedAddress(null), 1500);
  };

  const handleImportSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customAddressInput.trim()) return;
    setImportLoading(true);
    setImportError(null);

    const res = await onImportCustomToken(customAddressInput.trim());
    setImportLoading(false);
    if (!res.success) {
      setImportError(res.error || 'Erreur lors de l\'importation');
    } else {
      setCustomAddressInput('');
    }
  };

  // Filter tokens
  const filteredTokens = tokens.filter((token) => {
    const matchesSearch =
      token.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
      token.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      token.address.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;

    if (activeFilter === 'curve') return token.status === 'bonding_curve';
    if (activeFilter === 'graduated') return token.status === 'graduated';
    if (activeFilter === 'unapproved') return token.allowance === 0n && token.balance > 0n;
    return true;
  });

  const selectedCount = selectedTokenAddresses.length;

  return (
    <div className="space-y-6">
      {/* Header & Description */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight flex items-center space-x-2">
            <Coins className="w-6 h-6 text-amber-400" />
            <span>Découverte des Tokens & Portefeuille</span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Identifiez vos memecoins fourMeme, vérifiez leur statut (Bonding Curve vs DEX) et leurs autorisations.
          </p>
        </div>

        {/* Custom token import form */}
        <form onSubmit={handleImportSubmit} className="flex items-center space-x-2">
          <div className="relative">
            <input
              type="text"
              placeholder="Ajouter contrat 0x..."
              value={customAddressInput}
              onChange={(e) => setCustomAddressInput(e.target.value)}
              className="bg-slate-900 border border-slate-700 text-xs text-slate-200 placeholder-slate-500 rounded-lg px-3 py-2 w-48 sm:w-64 focus:outline-none focus:border-amber-500"
            />
          </div>
          <button
            type="submit"
            disabled={importLoading || !customAddressInput}
            className="px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-300 border border-amber-500/30 text-xs font-semibold disabled:opacity-50 transition flex items-center space-x-1"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Importer</span>
          </button>
        </form>
      </div>

      {importError && (
        <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center space-x-2">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>{importError}</span>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-900/60 p-3 rounded-xl border border-slate-800">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Rechercher par symbole, nom ou adresse 0x..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-amber-500"
          />
        </div>

        {/* Filter Pills */}
        <div className="flex items-center space-x-1 overflow-x-auto pb-1 sm:pb-0">
          <button
            onClick={() => setActiveFilter('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition ${
              activeFilter === 'all'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                : 'text-slate-400 hover:bg-slate-800'
            }`}
          >
            Tous ({tokens.length})
          </button>
          <button
            onClick={() => setActiveFilter('curve')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition ${
              activeFilter === 'curve'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                : 'text-slate-400 hover:bg-slate-800'
            }`}
          >
            FourMeme Curve
          </button>
          <button
            onClick={() => setActiveFilter('graduated')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition ${
              activeFilter === 'graduated'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                : 'text-slate-400 hover:bg-slate-800'
            }`}
          >
            Diplômés DEX (Pancake)
          </button>
          <button
            onClick={() => setActiveFilter('unapproved')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition ${
              activeFilter === 'unapproved'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                : 'text-slate-400 hover:bg-slate-800'
            }`}
          >
            À autoriser
          </button>
        </div>
      </div>

      {/* Selection Utility Row */}
      <div className="flex items-center justify-between text-xs text-slate-400 px-1">
        <div>
          <span>{filteredTokens.length} tokens affichés</span>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={onSelectAll}
            className="text-amber-400 hover:text-amber-300 font-medium hover:underline"
          >
            Sélectionner tout
          </button>
          <span>•</span>
          <button
            onClick={onDeselectAll}
            className="text-slate-400 hover:text-slate-300 font-medium hover:underline"
          >
            Désélectionner tout
          </button>
        </div>
      </div>

      {/* Tokens Table / Cards */}
      <div className="space-y-3">
        {filteredTokens.map((token) => {
          const isSelected = selectedTokenAddresses.includes(token.address.toLowerCase());
          const isApproved = token.allowance > 0n;

          return (
            <div
              key={token.address}
              onClick={() => onToggleToken(token)}
              className={`p-4 rounded-xl border transition cursor-pointer select-none ${
                isSelected
                  ? 'bg-amber-500/10 border-amber-500/50 shadow-md shadow-amber-500/5'
                  : 'bg-slate-900/70 border-slate-800 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center justify-between gap-4">
                {/* Left: Checkbox & Token Identity */}
                <div className="flex items-center space-x-3 min-w-0">
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => {}} // controlled by card click
                    className="w-4 h-4 rounded border-slate-700 bg-slate-900 text-amber-500 focus:ring-0 focus:ring-offset-0 cursor-pointer accent-amber-500"
                  />

                  <div className="w-10 h-10 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-amber-400 text-xs shrink-0">
                    {token.symbol.slice(0, 3)}
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center space-x-2">
                      <span className="font-extrabold text-sm text-white truncate">{token.symbol}</span>
                      <span className="text-xs text-slate-400 truncate hidden sm:inline">{token.name}</span>

                      {/* Risk score pill */}
                      <span
                        className={`text-[10px] font-bold px-1.5 py-0.2 rounded font-mono ${
                          token.riskScore === 'A'
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                            : token.riskScore === 'B'
                            ? 'bg-blue-500/10 text-blue-400 border border-blue-500/30'
                            : token.riskScore === 'C'
                            ? 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/30'
                            : 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
                        }`}
                        title={token.riskFlags.join(', ')}
                      >
                        Audit: {token.riskScore}
                      </span>
                    </div>

                    {/* Address with copy & explorer */}
                    <div className="flex items-center space-x-2 text-[11px] text-slate-400 mt-0.5">
                      <span className="font-mono">{token.address.slice(0, 6)}...{token.address.slice(-4)}</span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCopy(token.address);
                        }}
                        className="hover:text-amber-400"
                        title="Copier l'adresse"
                      >
                        {copiedAddress === token.address ? (
                          <Check className="w-3 h-3 text-emerald-400" />
                        ) : (
                          <Copy className="w-3 h-3" />
                        )}
                      </button>
                      <a
                        href={`${blockExplorer}/token/${token.address}`}
                        target="_blank"
                        rel="noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="hover:text-amber-400"
                        title="Voir sur BSCScan"
                      >
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  </div>
                </div>

                {/* Middle: Bonding curve & Protocol status */}
                <div className="hidden md:flex flex-col items-center justify-center text-xs">
                  {token.status === 'bonding_curve' ? (
                    <div className="w-36">
                      <div className="flex justify-between text-[10px] text-slate-400 mb-1">
                        <span className="flex items-center space-x-1">
                          <Flame className="w-3 h-3 text-amber-400" />
                          <span>Curve fourMeme</span>
                        </span>
                        <span className="font-mono font-bold text-amber-400">{token.bondingProgress}%</span>
                      </div>
                      <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                        <div
                          className="bg-gradient-to-r from-amber-500 to-yellow-400 h-1.5 rounded-full"
                          style={{ width: `${token.bondingProgress}%` }}
                        ></div>
                      </div>
                    </div>
                  ) : token.status === 'graduated' ? (
                    <div className="px-2.5 py-1 rounded bg-blue-500/10 border border-blue-500/30 text-blue-300 text-[11px] font-semibold">
                      Diplômé sur PancakeSwap V2
                    </div>
                  ) : (
                    <div className="px-2.5 py-1 rounded bg-slate-800 border border-slate-700 text-slate-400 text-[11px]">
                      Token Non Vérifié
                    </div>
                  )}
                </div>

                {/* Right: Balances & Allowance status */}
                <div className="text-right shrink-0">
                  <div className="font-mono font-bold text-white text-sm">
                    {token.formattedBalance} <span className="text-xs text-amber-400">{token.symbol}</span>
                  </div>
                  <div className="text-[11px] text-slate-400">
                    ≈ {token.quoteBnb} BNB <span className="text-slate-500">(${(parseFloat(token.quoteBnb) * 580).toFixed(2)})</span>
                  </div>

                  <div className="mt-1">
                    {isApproved ? (
                      <span className="inline-flex items-center space-x-1 text-[10px] text-emerald-400 font-medium">
                        <CheckCircle2 className="w-3 h-3" />
                        <span>Autorisé</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center space-x-1 text-[10px] text-amber-400 font-medium">
                        <AlertTriangle className="w-3 h-3" />
                        <span>Approval requis</span>
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Floating Bottom Bar when tokens are selected */}
      {selectedCount > 0 && (
        <div className="sticky bottom-4 z-40 bg-slate-900/95 border border-amber-500/40 rounded-2xl p-4 shadow-2xl backdrop-blur-md flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold text-xs">
              {selectedCount}
            </div>
            <div>
              <div className="text-sm font-bold text-white">
                {selectedCount} token{selectedCount > 1 ? 's' : ''} sélectionné{selectedCount > 1 ? 's' : ''}
              </div>
              <div className="text-xs text-slate-400">
                Prêt pour la configuration du batch de vente
              </div>
            </div>
          </div>

          <button
            onClick={onProceedToBatch}
            className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 text-slate-950 font-bold text-sm shadow-lg shadow-amber-500/20 transition flex items-center justify-center space-x-2"
          >
            <span>Configurer le Batch ({selectedCount})</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
};
