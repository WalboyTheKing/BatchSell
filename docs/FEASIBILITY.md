# ÉTUDE DE FAISABILITÉ TECHNIQUE : BATCHSELL
## Infrastructure de transactions groupées sécurisées pour les wallets IA sur BNB Chain

**Date de réalisation :** Octobre 2026  
**Auteur :** Lead Blockchain Architect & Web3 Security Engineer  
**Projet :** BatchSell (Agentic Wallet Transaction Batching Infrastructure)  
**Réseaux cibles :** BNB Smart Chain (BSC Mainnet - Chain ID: 56, BSC Testnet - Chain ID: 97)

---

## 1. ARCHITECTURE ET MÉCANISMES DU PROTOCOLE FOURMEME

### 1.1. Modèle de fonctionnement et cycle de vie d'un token fourMeme
Le protocole **four.meme** est la plateforme de lancement de memecoins native de BNB Chain (similaire dans son mécanisme économique à pump.fun sur Solana). Le cycle de vie d'un token se décompose en deux phases distinctes :

1. **Phase 1 : Marché Interne (Bonding Curve)**
   - Le token est échangé directement contre du BNB natif (ou WBNB) via le smart contract de trading interne de fourMeme.
   - Le prix est déterminé de façon déterministe selon une courbe logarithmique/exponentielle définie par le contrat : $P = f(S)$ où $S$ est l'offre circulante.
   - La liquidité n'est pas encore sur un AMM externe. Tous les achats augmentent le pool de réserve BNB dans le contrat, et toutes les ventes puisent dans cette réserve.
   - Les tokens vendus sont restitués au contrat ou brûlés/séquestrés selon la logique de la courbe.

2. **Phase 2 : Marché Externe (Graduation vers PancakeSwap)**
   - Dès que la capitalisation cible / le seuil de BNB accumulé est atteint (généralement 24 BNB de réserve), la courbe de bonding se fige.
   - La liquidité accumulée et les tokens restants sont automatiquement migrés vers PancakeSwap (V2 ou V3) et les tokens LP sont brûlés ou verrouillés.
   - Dès cet instant, les fonctions de vente internes échouent systématiquement (`CurveClosed` ou `Graduated`) et toute vente doit obligatoirement transiter via le routeur PancakeSwap (`PancakeRouter02` ou `UniversalRouter`).

### 1.2. Contrats pertinents et adresses vérifiées (BSC)
- **FourMeme Trading Contract (Internal Curve)** :
  - BSC Mainnet : `0x5c952063c7fc8610FFDB798152D69F0B9550762b` (Adresse du routeur/contrat de bonding curve vérifiée sur BSCScan).
  - Testnet : Déploiement spécifique ou mock de bonding curve compatible.
- **PancakeSwap V2 Router (Graduated Tokens)** :
  - BSC Mainnet : `0x10ED43C718714eb63d5aA57B78B54704E256024E`
  - BSC Testnet : `0xD99D1c33F9fC3444f8101754aBC46c52416550D1`
- **WBNB (Wrapped BNB)** :
  - BSC Mainnet : `0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c`
  - BSC Testnet : `0xae13d989daC2f0dEbFf460aC112a837C89BAa7cd`

### 1.3. Fonctions de vente, signatures et paramètres
#### Vente sur le Marché Interne (Bonding Curve) :
La signature standard du contrat fourMeme pour la vente est :
```solidity
function sellToken(
    address token,
    uint256 amount,
    uint256 minBnbExpected
) external returns (uint256 bnbReceived);
```
Certaines versions exposent également :
```solidity
function sell(
    address token,
    uint256 tokenAmount,
    uint256 minBnbOut,
    address recipient
) external returns (uint256);
```
- **Paramètres :**
  - `token` (`address`) : L'adresse du contrat ERC-20 fourMeme.
  - `amount` / `tokenAmount` (`uint256`) : Nombre de tokens vendus (avec 18 décimales standard).
  - `minBnbExpected` / `minBnbOut` (`uint256`) : Seuil minimum de BNB natif à recevoir, calculé en intégrant le slippage toléré par l'utilisateur (ex: 1% à 3%).
  - `recipient` : Adresse recevant les BNB (par défaut `msg.sender`).

#### Vente sur PancakeSwap (Tokens Diplômés) :
```solidity
function swapExactTokensForETHSupportingFeeOnTransferTokens(
    uint amountIn,
    uint amountOutMin,
    address[] calldata path, // [token, WBNB]
    address to,
    uint deadline
) external;
```

### 1.4. Mécanisme d'autorisation ERC-20
Avant d'appeler `sellToken`, le contrat fourMeme effectue un transfert des tokens de l'utilisateur vers lui-même :
```solidity
IERC20(token).transferFrom(msg.sender, address(this), amount);
```
Par conséquent, **l'utilisateur DOIT obligatoirement avoir accordé une allowance suffisante** au contrat fourMeme (`token.approve(fourMemeTradingContract, amount)`).

### 1.5. Événements et conditions d'échec
- **Événements émis :**
  - `TokenSold(address indexed seller, address indexed token, uint256 tokenAmount, uint256 bnbAmount, uint256 fee)`
  - `CurveCompleted(address indexed token, uint256 bnbCollected, uint256 timestamp)`
- **Conditions d'échec typiques :**
  1. `ERC20: insufficient allowance` : L'utilisateur n'a pas approuvé le contrat cible.
  2. `ERC20: transfer amount exceeds balance` : Solde insuffisant.
  3. `SlippageExceeded` ou `ReturnAmountTooLow` : Le prix a chuté pendant la transaction sous le seuil `minBnbExpected`.
  4. `CurveClosed` : Le token a dépassé la bonding curve et doit être échangé sur PancakeSwap.
  5. `TradingPaused` : Vente suspendue par mesure administrative.

---

## 2. ANALYSE DU PROBLÈME MULTICALL (Multicall3)

### 2.1. Comportement de `msg.sender`
Multicall3 (`0xcA11bde05977b3631167028862bE2a173976CA11`, déployé sur BSC) permet de regrouper plusieurs appels en lecture ou écriture via :
```solidity
struct Call3 {
    address target;
    bool allowFailure;
    bytes callData;
}
function aggregate3(Call3[] calldata calls) external payable returns (Result[] memory returnData);
```

### 2.2. Le piège fatal de `msg.sender`
Lorsqu'un utilisateur EOA appelle `Multicall3.aggregate3()` :
1. Pour Multicall3, `msg.sender` = Adresse de l'utilisateur ($EOA$).
2. Multicall3 exécute ensuite un sous-appel vers le contrat cible (par exemple `token.approve(...)` ou `fourMeme.sellToken(...)`).
3. **Pour le contrat cible, `msg.sender` est l'adresse de Multicall3**, et NON PAS l'EOA !

### 2.3. Conséquences pratiques
- Si l'utilisateur inclut `token.approve(fourMeme, amount)` dans Multicall3, c'est **Multicall3** qui approuve fourMeme pour dépenser les tokens appartenant à Multicall3. L'allowance de l'utilisateur reste strictement à 0.
- Si l'utilisateur tente d'appeler `fourMeme.sellToken(...)` via Multicall3, fourMeme exécute `token.transferFrom(msg.sender, address(this), amount)` où `msg.sender` est Multicall3. Multicall3 ne possédant pas les tokens de l'utilisateur, l'appel revert immédiatement avec `ERC20: transfer amount exceeds balance` ou `insufficient allowance`.

**Conclusion Formelle :**  
Multicall3 standard **ne peut pas être utilisé seul** pour regrouper les approbations et ventes d'un utilisateur sans contrat tiers intermédiaire disposant des droits de transfert.

---

## 3. ANALYSE D'EIP-7702

### 3.1. Principe de fonctionnement
EIP-7702 (introduit dans la mise à jour Pectra d'Ethereum et en cours d'intégration dans l'écosystème EVM et BSC) introduit un nouveau type de transaction (Type 4) permettant à un compte externe standard (EOA) de **déléguer temporairement ou de manière persistante son exécution à un smart contract**.

Le format inclut un tableau d'autorisations :
```
authorization_list = [[chain_id, address, nonce, y_parity, r, s], ...]
```
Pendant la transaction, le code situé à l'adresse de délégation s'exécute **dans le contexte de l'EOA (`msg.sender` reste l'EOA)** !

### 3.2. Bénéfices pour le Batching
- Grâce à `DELEGATECALL` ou à l'exécution en contexte d'EOA, le code peut appeler `token.approve` puis `fourMeme.sellToken` en une seule transaction atomique et une seule signature de l'utilisateur.
- `msg.sender` vu par le token et par fourMeme est bel et bien l'EOA.

### 3.3. Limites de disponibilité actuelles (Octobre 2026)
1. **Support réseau BSC :** EIP-7702 requiert le support des hard forks Pectra/Prague sur BSC.
2. **Support Wallet :** Les wallets de production (Binance Web3 Wallet, MetaMask standard, Trust Wallet) ne permettent pas encore tous aux utilisateurs finaux de signer des payloads de type 4 de manière transparente dans leur interface standard sans flags développeurs ou environnements testnet spécifiques.
3. **Risques de sécurité majeurs :** Une délégation vers un code non audité permettrait à un contrat malveillant de drainer l'intégralité des avoirs de l'EOA sans approval préalable.

---

## 4. COMPATIBILITÉ BINANCE AGENTIC WALLET & BINANCE AI PRO

### 4.1. État des lieux vérifié
- **Binance AI Pro** utilise un LLM orchestrateur pour traduire le langage naturel en intentions on-chain (ex: "Vends tous mes memecoins en perte de plus de 20%").
- **Binance Agentic Wallet** repose sur une architecture de gestion de clés sécurisées (MPC / passkey ou EOA encadré) et communique avec les applications via les protocoles standards :
  - **EIP-1193** (`window.ethereum` ou connecteur dédié Binance Web3).
  - Sessions d'approbation granulaires : pour toute transaction touchant des fonds, le wallet intercepte l'appel et demande confirmation à l'utilisateur.

### 4.2. Points de friction identifiés
1. **Absence de SDK de batching propriétaire public :** Il n'existe pas d'API propriétaire documentée `binance.batchSell()` accessible aux dApps tierces sans passer par des propositions de transactions standard.
2. **Multiplication des confirmations :** L'agent soumettant les ventes une par une, l'utilisateur est sollicité pour :
   - Approbation Token A
   - Vente Token A
   - Approbation Token B
   - Vente Token B
   - Soit $2N$ signatures pour $N$ tokens !

---

## 5. DÉCISION TECHNIQUE ET COMPARAISON DES ARCHITECTURES

| Critère | A. Transactions ERC-20 classiques | B. Batch Executor Dédié (Vault/Router) | C. EIP-7702 Délégation | D. Smart Account ERC-4337 |
| :--- | :--- | :--- | :--- | :--- |
| **Nombre de transactions** | $2N$ txs (ou $N+1$ si déjà approuvés) | $N$ approvals + 1 tx de batch sell | **1 transaction unique** | 1 UserOperation |
| **Nombre de confirmations** | $2N$ signatures | $N$ approvals + 1 confirmation de batch | **1 signature** | 1 signature |
| **Compatibilité Wallets** | 100% (Tous les wallets) | **100% (Tous les wallets)** | Restreinte (wallets compatibles Pectra) | Nécessite un bundler & paymaster |
| **Compatibilité Tokens** | 100% | 100% | 100% | 100% |
| **Risque de sécurité** | Très faible | Modéré (auditable, limites claires) | Élevé (contrôle total sur le compte) | Modéré |
| **Atomicité** | Non (échecs partiels possibles) | **Oui (Revert global ou tolérance contrôlée)** | **Oui** | **Oui** |
| **Faisabilité MVP immédiate** | Immédiate | **Excellente & Immédiate** | Préparation / Simulation / Testnet | Lourde (infrastructures bundler) |

### 5.1. Choix Retenu pour BatchSell MVP
Pour offrir une solution immédiatement opérationnelle, hautement sécurisée et compatible avec 100% des wallets (y compris Binance Agentic Wallet et MetaMask), BatchSell adopte une **Architecture Modulaire Hybride à 3 Niveaux** :

1. **Moteur d'Orchestration & Batch Builder Intelligent (Off-Chain Engine)** :
   - Analyse dynamique des allowances existantes.
   - Si des allowances sont déjà accordées (souvent le cas lors d'achats antérieurs), aucune transaction d'approbation n'est requise.
   - Regroupement des approbations nécessaires avec gestion de montants stricts (zéro allowance illimitée aveugle).

2. **Smart Contract `BatchSellExecutor.sol` (On-Chain Atomic Batch Engine)** :
   - Permet à l'utilisateur d'exécuter un batch de ventes en **une seule transaction atomique**.
   - L'utilisateur transfère ou autorise l'exécuteur qui effectue les ventes vers fourMeme/PancakeSwap et redistribue immédiatement 100% des BNB générés à l'utilisateur.
   - Protection anti-réentrance, vérification de slippage global et par opération, annulation atomique en cas de défaillance.

3. **Passerelle EIP-7702 Ready** :
   - Le système intègre la structure de payload EIP-7702 pour les environnements compatibles, activable dès que le wallet connecté expose la capacité de signature de type 4.
