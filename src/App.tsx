import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Navbar } from './components/Navbar';
import { DashboardView } from './components/DashboardView';
import { TokensView } from './components/TokensView';
import { BatchBuilderView } from './components/BatchBuilderView';
import { SimulationView } from './components/SimulationView';
import { ReceiptsView } from './components/ReceiptsView';
import { DocsView } from './components/DocsView';

import { 
  TokenInfo, 
  WalletState, 
  BatchPlan, 
  ExecutionMode, 
  ExecutionReceipt, 
  TestCaseResult,
  ChainId 
} from './types';
import { WalletAdapter } from './lib/wallet/adapter';
import { TokenDiscoveryService } from './lib/tokens/tokenDiscovery';
import { BatchBuilder } from './lib/batch/batchBuilder';
import { SimulationEngine, SimulationSummary } from './lib/simulation/simulator';
import { runAllTests } from './test/batchSell.test';
import { CHAINS_CONFIG } from './config/chains';

export default function App() {
  // Singletons
  const wallet = useMemo(() => new WalletAdapter(), []);
  const discovery = useMemo(() => new TokenDiscoveryService(56), []);
  const builder = useMemo(() => new BatchBuilder(56), []);

  // Application State
  const [activeTab, setActiveTab] = useState<'dashboard' | 'tokens' | 'batch' | 'simulation' | 'receipts' | 'docs'>('dashboard');
  const [walletState, setWalletState] = useState<WalletState>(wallet.getState());
  const [tokens, setTokens] = useState<TokenInfo[]>([]);
  const [selectedTokenAddresses, setSelectedTokenAddresses] = useState<string[]>([]);
  const [tokenPercents, setTokenPercents] = useState<Record<string, number>>({});
  
  const [executionMode, setExecutionMode] = useState<ExecutionMode>('atomic');
  const [slippageBps, setSlippageBps] = useState<number>(200); // 2.0%
  const [approvalMode, setApprovalMode] = useState<'strict_exact' | 'unlimited'>('strict_exact');
  
  const [batchPlan, setBatchPlan] = useState<BatchPlan | null>(null);
  const [simulation, setSimulation] = useState<SimulationSummary | null>(null);
  const [isExecuting, setIsExecuting] = useState(false);
  const [receipts, setReceipts] = useState<ExecutionReceipt[]>([]);
  
  // Test suite results
  const [testResults, setTestResults] = useState<TestCaseResult[]>([]);
  const [isRunningTests, setIsRunningTests] = useState(false);

  // Initialize wallet listener & tokens
  useEffect(() => {
    const unsubscribe = wallet.subscribe((newState) => {
      setWalletState(newState);
      discovery.setChainId(newState.chainId);
      builder.setChainId(newState.chainId);
      setTokens(discovery.getAllTokens());
    });

    setTokens(discovery.getAllTokens());

    // Auto-connect with agentic simulated session by default for instant interactivity
    wallet.connectAgenticSimulated();

    // Run tests on mount
    handleRunTests();

    return () => unsubscribe();
  }, [wallet, discovery, builder]);

  // Execute test suite
  const handleRunTests = async () => {
    setIsRunningTests(true);
    try {
      const results = await runAllTests();
      setTestResults(results);
    } finally {
      setIsRunningTests(false);
    }
  };

  // Re-build batch plan when selection or parameters change
  const buildCurrentPlan = useCallback(async () => {
    if (selectedTokenAddresses.length === 0) {
      setBatchPlan(null);
      return;
    }

    const selectedTokensData = selectedTokenAddresses
      .map((addr) => {
        const token = tokens.find((t) => t.address.toLowerCase() === addr.toLowerCase());
        if (!token) return null;
        const pct = tokenPercents[addr.toLowerCase()] || 100;
        return { token, percentToSell: pct };
      })
      .filter((item): item is { token: TokenInfo; percentToSell: number } => item !== null);

    const userAddr = walletState.address || '0x71C8360d843F80dACb2a5e4b6B47C1f1F5787989';
    const plan = await builder.buildPlan({
      selectedTokens: selectedTokensData,
      executionMode,
      slippageBps,
      chainId: walletState.chainId,
      userAddress: userAddr,
    });

    setBatchPlan(plan);
  }, [selectedTokenAddresses, tokens, tokenPercents, executionMode, slippageBps, walletState.chainId, walletState.address, builder]);

  useEffect(() => {
    buildCurrentPlan();
  }, [buildCurrentPlan]);

  // Selection handlers
  const handleToggleToken = (token: TokenInfo) => {
    const addr = token.address.toLowerCase();
    setSelectedTokenAddresses((prev) => {
      if (prev.includes(addr)) {
        return prev.filter((a) => a !== addr);
      } else {
        return [...prev, addr];
      }
    });
    if (!tokenPercents[addr]) {
      setTokenPercents((prev) => ({ ...prev, [addr]: 100 }));
    }
  };

  const handleSelectAll = () => {
    const addrs = tokens.filter((t) => t.balance > 0n).map((t) => t.address.toLowerCase());
    setSelectedTokenAddresses(addrs);
    const percents: Record<string, number> = {};
    addrs.forEach((a) => {
      percents[a] = tokenPercents[a] || 100;
    });
    setTokenPercents(percents);
  };

  const handleDeselectAll = () => {
    setSelectedTokenAddresses([]);
  };

  const handleUpdatePercent = (address: string, percent: number) => {
    setTokenPercents((prev) => ({
      ...prev,
      [address.toLowerCase()]: percent,
    }));
  };

  const handleSetGlobalPercent = (percent: number) => {
    const updated: Record<string, number> = {};
    selectedTokenAddresses.forEach((addr) => {
      updated[addr] = percent;
    });
    setTokenPercents(updated);
  };

  const handleRemoveToken = (address: string) => {
    setSelectedTokenAddresses((prev) => prev.filter((a) => a !== address.toLowerCase()));
  };

  // Custom token import
  const handleImportCustomToken = async (address: string) => {
    const res = await discovery.importCustomToken(address);
    if (res.success && res.token) {
      setTokens(discovery.getAllTokens());
      // Explicitly do not auto-select, allow user to review
    }
    return res;
  };

  // Simulation
  const handleRunSimulation = async () => {
    if (!batchPlan) return;
    const userBnbWei = BigInt(Math.floor(parseFloat(walletState.bnbBalance || '0') * 1e18));
    const simSummary = await SimulationEngine.simulateBatch(batchPlan, walletState.chainId, userBnbWei);
    setSimulation(simSummary);
    setBatchPlan(simSummary.updatedPlan);
    setActiveTab('simulation');
  };

  // Execution
  const handleExecuteBatch = async () => {
    if (!batchPlan) return;
    setIsExecuting(true);

    try {
      // Step 1: Execute approvals for any token that needs approval
      const approvalsNeeded = batchPlan.items.filter((item) => item.needsApproval);
      for (const item of approvalsNeeded) {
        // Update allowance on chain / discovery
        discovery.updateAllowance(item.token.address, item.approvalAmount);
      }

      // Step 2: Execute atomic batch sale
      await new Promise((resolve) => setTimeout(resolve, 1400)); // Simulating network confirmation

      // Generate random valid tx hash
      const randomBytes = Array.from({ length: 32 }, () =>
        Math.floor(Math.random() * 256).toString(16).padStart(2, '0')
      ).join('');
      const txHash = `0x${randomBytes}` as `0x${string}`;

      // Calculate BNB delta received and update token balances
      const totalBnbFloat = parseFloat(batchPlan.minTotalBnbOut);
      const soldTokensInfo = batchPlan.items.map((item) => {
        discovery.updateBalanceAfterSale(item.token.address, item.amountToSell);
        return {
          symbol: item.token.symbol,
          amount: item.formattedAmount,
          bnbReceived: item.minBnbExpected,
        };
      });

      // Update native BNB in wallet balance
      wallet.updateBnbBalance(totalBnbFloat);

      // Refresh tokens state
      setTokens(discovery.getAllTokens());

      // Create Receipt
      const receipt: ExecutionReceipt = {
        id: `rcpt-${Date.now()}`,
        txHash,
        bscscanUrl: `${CHAINS_CONFIG[walletState.chainId].blockExplorer}/tx/${txHash}`,
        timestamp: Date.now(),
        status: 'success',
        method: executionMode === 'atomic' ? 'executeBatchSell' : 'individualSwaps',
        tokensCount: batchPlan.items.length,
        soldTokens: soldTokensInfo,
        totalBnbReceived: batchPlan.minTotalBnbOut,
        gasUsed: simulation ? `${simulation.simulatedGasUnits.toLocaleString()} units` : '285,420 units',
        activeAllowanceRemaining: approvalMode === 'unlimited',
      };

      setReceipts((prev) => [receipt, ...prev]);

      // Reset selection
      setSelectedTokenAddresses([]);
      setBatchPlan(null);
      setSimulation(null);

      // Move to Receipts view
      setActiveTab('receipts');
    } catch (err: any) {
      alert(`Erreur d'exécution: ${err.message || 'Transaction annulée'}`);
    } finally {
      setIsExecuting(false);
    }
  };

  // Revoke Allowance
  const handleRevokeAllowance = async (tokenAddress: string) => {
    await new Promise((resolve) => setTimeout(resolve, 800));
    discovery.updateAllowance(tokenAddress, 0n);
    setTokens(discovery.getAllTokens());
  };

  const testPassCount = {
    passed: testResults.filter((t) => t.passed).length,
    total: testResults.length,
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-amber-500 selection:text-slate-950">
      <Navbar
        walletState={walletState}
        onConnectInjected={() => wallet.connectInjected()}
        onConnectSimulated={() => wallet.connectAgenticSimulated()}
        onDisconnect={() => wallet.disconnect()}
        onSwitchChain={(chainId: ChainId) => wallet.switchChain(chainId)}
        activeTab={activeTab}
        setActiveTab={(t: any) => setActiveTab(t)}
        testSuitePassCount={testPassCount}
      />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'dashboard' && (
          <DashboardView
            tokens={tokens}
            walletState={walletState}
            onNavigate={(tab) => setActiveTab(tab as any)}
            onSelectToken={handleToggleToken}
          />
        )}

        {activeTab === 'tokens' && (
          <TokensView
            tokens={tokens}
            selectedTokenAddresses={selectedTokenAddresses}
            onToggleToken={handleToggleToken}
            onSelectAll={handleSelectAll}
            onDeselectAll={handleDeselectAll}
            onImportCustomToken={handleImportCustomToken}
            onProceedToBatch={() => setActiveTab('batch')}
            chainId={walletState.chainId}
          />
        )}

        {activeTab === 'batch' && (
          <BatchBuilderView
            selectedTokens={selectedTokenAddresses
              .map((addr) => {
                const token = tokens.find((t) => t.address.toLowerCase() === addr.toLowerCase());
                if (!token) return null;
                return {
                  token,
                  percentToSell: tokenPercents[addr.toLowerCase()] || 100,
                };
              })
              .filter((item): item is { token: TokenInfo; percentToSell: number } => item !== null)}
            onUpdatePercent={handleUpdatePercent}
            onSetGlobalPercent={handleSetGlobalPercent}
            onRemoveToken={handleRemoveToken}
            executionMode={executionMode}
            onSetExecutionMode={setExecutionMode}
            slippageBps={slippageBps}
            onSetSlippageBps={setSlippageBps}
            approvalMode={approvalMode}
            onSetApprovalMode={setApprovalMode}
            batchPlan={batchPlan}
            onRunSimulation={handleRunSimulation}
            onBackToTokens={() => setActiveTab('tokens')}
          />
        )}

        {activeTab === 'simulation' && batchPlan && (
          <SimulationView
            batchPlan={batchPlan}
            simulation={simulation}
            chainId={walletState.chainId}
            onExecute={handleExecuteBatch}
            onReSimulate={handleRunSimulation}
            onBackToBuilder={() => setActiveTab('batch')}
            isExecuting={isExecuting}
          />
        )}

        {activeTab === 'receipts' && (
          <ReceiptsView
            receipts={receipts}
            tokens={tokens}
            chainId={walletState.chainId}
            onRevokeAllowance={handleRevokeAllowance}
            onStartNewBatch={() => setActiveTab('tokens')}
          />
        )}

        {activeTab === 'docs' && (
          <DocsView
            testResults={testResults}
            isRunningTests={isRunningTests}
            onRunTests={handleRunTests}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950 py-6 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div>
            BatchSell v1.0.0 • Infrastructure de transactions groupées sécurisées sur BNB Chain (fourMeme & DEX)
          </div>
          <div className="flex items-center space-x-4">
            <span className="text-emerald-400 font-mono">100% Non-Custodial</span>
            <span>•</span>
            <span className="text-amber-400 font-mono">Anti-MEV Slippage Guard</span>
            <span>•</span>
            <button onClick={() => setActiveTab('docs')} className="hover:text-white underline">
              Spécifications & Audits
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}
