# ARCHITECTURE TECHNIQUE : BATCHSELL

## 1. VUE D'ENSEMBLE DU SYSTÈME

BatchSell résout la friction des ventes répétées de tokens ERC-20 / fourMeme sur BNB Chain pour les utilisateurs d'agents IA (Binance AI Pro, Binance Agentic Wallet) et les traders Web3.

```
                      +------------------------------------------+
                      |         INTERFACE UTILISATEUR &          |
                      |        AGENTIC WALLET CONNECTOR          |
                      +------------------------------------------+
                                           |
                                           v
+-----------------------------------------------------------------------------------+
|                            BATCHSELL CLIENT ENGINE                                |
|                                                                                   |
|  +------------------------+  +----------------------+  +-----------------------+  |
|  | Token Discovery Module |  | Approval Manager     |  | FourMeme Adapter      |  |
|  | - Balances & Decimals  |  | - Check Allowance    |  | - Internal Curve      |  |
|  | - Curve vs DEX status  |  | - Strict vs Infinite |  | - PancakeSwap Router  |  |
|  | - Risk / Honey checks  |  | - Zero Reset Support |  | - Quotes & Slippage   |  |
|  +------------------------+  +----------------------+  +-----------------------+  |
|                                           |                                       |
|                                           v                                       |
|  +-----------------------------------------------------------------------------+  |
|  | BATCH BUILDER & ESTIMATOR                                                   |  |
|  | - Construit la séquence optimisée (Approvals minimales + Ventes groupées)   |  |
|  | - Calcule le slippage agrégé, l'impact prix et le gas estimé               |  |
|  +-----------------------------------------------------------------------------+  |
|                                           |                                       |
|                                           v                                       |
|  +-----------------------------------------------------------------------------+  |
|  | PRE-FLIGHT SIMULATION & RISK AUDITOR                                        |  |
|  | - Dry-run via RPC eth_call / multicall simulate                             |  |
|  | - Détection des reverts potentiels et alertes de liquidité                  |  |
|  +-----------------------------------------------------------------------------+  |
+-----------------------------------------------------------------------------------+
                                           |
                    +----------------------+----------------------+
                    |                                             |
                    v (Mode Batch Atomique)                       v (Mode Séquentiel Contrôlé)
    +-------------------------------+             +-------------------------------+
    |  BatchSellExecutor.sol        |             |  Direct Protocol Execution    |
    |  - Exécution atomique         |             |  - 1 transaction par vente    |
    |  - Sécurité non-custodiale    |             |  - Compatible avec tous les   |
    |  - Transfert immédiat des BNB |             |    wallets sans contrat tiers |
    +-------------------------------+             +-------------------------------+
                    |                                             |
                    +----------------------+----------------------+
                                           |
                                           v
                              +-------------------------+
                              |   BNB SMART CHAIN (BSC) |
                              |   - FourMeme Curve      |
                              |   - PancakeSwap V2/V3   |
                              +-------------------------+
```

---

## 2. MODULES FONCTIONNELS

### 2.1. Module de Connexion Wallet (`lib/wallet/`)
- Support universel EIP-1193 (`window.ethereum`, Binance Web3 Wallet, MetaMask, Trust Wallet, Rabby).
- Support d'un mode Agentic Simulator (démonstration interactive fidèle pour inspecter le flux sans clé privée).
- Gestion de bascule de réseau transparente (BNB Smart Chain 56 vs Testnet 97).
- Détection des déconnexions et rejets de signature.

### 2.2. Module de Découverte des Tokens (`lib/tokens/`)
- Indexation des tokens connus de l'utilisateur (tokens FourMeme populaires et tokens détenus).
- Capacité d'importation manuelle d'adresse de token avec validation ERC-20 (`name`, `symbol`, `decimals`, `balanceOf`).
- Détection du statut du token :
  - `BondingCurveActive` : Négociable sur la courbe interne fourMeme.
  - `Graduated` : Transféré sur PancakeSwap.
  - `Unverified` : Token standard ou non identifié avec avertissement de sécurité.

### 2.3. Adaptateur de Protocole FourMeme (`lib/protocols/fourmeme/`)
- Implémente l'interface `TradingProtocolAdapter`.
- Méthodes :
  - `getQuote(token, amount)` : Estimation du retour en BNB.
  - `buildSellCalldata(token, amount, minBnbOut, recipient)` : Préparation du payload exact pour fourMeme ou PancakeSwap.
  - `getContractTarget(token)` : Détermine l'adresse cible (Curve fourMeme ou PancakeSwap Router).

### 2.4. Approval Engine (`lib/batch/approvalEngine.ts`)
- Vérifie si l'allowance actuelle est supérieure ou égale au montant à vendre.
- Règle de sécurité stricte :
  - Propose l'allowance **exacte** par défaut pour limiter l'exposition du wallet.
  - Option d'allowance maximale avec avertissement explicite.
  - Support du reset à 0 avant mise à jour pour les tokens incompatibles avec la modification directe d'allowance (ex: USDT pattern).
  - Fournit la fonction de révocation immédiate après exécution.

### 2.5. Batch Builder & Exécuteur Atomique (`lib/batch/batchBuilder.ts`)
- Classe les opérations nécessaires :
  - Phase 1 : Autorisations requises (seulement pour les tokens dont l'allowance est insuffisante).
  - Phase 2 : Ventes groupées.
- Offre deux modes d'exécution :
  - **Atomic Batch (Recommandé via `BatchSellExecutor`)** : Regroupe toutes les ventes en un seul appel de contrat. Si l'une des ventes échoue ou si le slippage global n'est pas respecté, l'ensemble est annulé, protégeant l'utilisateur de pertes asymétriques.
  - **Sequential Controlled** : Exécute les transactions de manière séquentielle avec vérification continue de l'état entre chaque vente.

### 2.6. Moteur de Simulation (`lib/simulation/`)
- Simule l'exécution off-chain avant toute soumission au wallet.
- Vérifie :
  - La balance réelle de l'utilisateur.
  - Le respect du seuil de slippage minimal.
  - Les taxes de transfert éventuelles.
  - L'estimation de gas pour éviter les transactions "Out of Gas".
  - Les risques de honeypot ou de contrat bloquant la vente.

---

## 3. CONTRAT ON-CHAIN : `contracts/src/BatchSellExecutor.sol`

### Source Canonique :
Le contrat unique canonique se situe dans `contracts/src/BatchSellExecutor.sol` (configuré via `foundry.toml`).

### Spécifications :
1. **Non-custodial strict :** Le contrat ne conserve AUCUN fond. Tous les BNB perçus lors des ventes sont renvoyés au `recipient` dans la même transaction.
2. **ReentrancyGuard OpenZeppelin v5 :** Protection absolue contre les réentrances.
3. **SafeERC20 :** Transferts sécurisés et support des tokens non standards (sans valeur de retour booléenne, ex: USDT).
4. **Support Fee-on-Transfer :** Calcul dynamique du montant net reçu (`tokenBalAfter - tokenBalBefore`) avant de passer l'ordre au DEX.
5. **Whitelist de routeurs autorisés :** Seuls les contrats officiels vérifiés de fourMeme et PancakeSwap sont appelables.
6. **Double protection de slippage :** 
   - Vérification individuelle par token (`minBnbExpected`) anti-cross-subsidization.
   - Vérification globale agrégée (`minTotalBnbOut`).
7. **Hygiène des allowances :** Révocation automatique de l'approbation à 0 après chaque ordre.
8. **Rejet des BNB directs :** Rejet de tout BNB natif envoyé directement hors exécution de swap.
9. **Plafond de lot :** Limité à 25 opérations maximum par lot (`MAX_BATCH_SIZE`).
