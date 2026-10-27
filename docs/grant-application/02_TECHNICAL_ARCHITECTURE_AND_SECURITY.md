# 02. Architecture Technique & Revue Technique Interne

> **AVERTISSEMENT DE TRANSPARENCE :**  
> Ce document constitue une **revue technique interne** rédigée par l'équipe de conception de BatchSell. Il **ne doit en aucun cas être assimilé à un rapport d'audit indépendant**. Un audit formel réalisé par un cabinet tiers indépendant spécialisé en sécurité blockchain constitue précisément l'un des livrables clés prévus dans le cadre de la demande de subvention.

---

## 1. Architecture Globale du Système

BatchSell adopte une architecture modulaire et découplée garantissant la sécurité des opérations on-chain et le contrôle direct de l'utilisateur.

```
+-------------------------------------------------------------------------+
|                  COUCHE CLIENT & PORTEFEUILLE (FRONTEND)                |
|                                                                         |
|  [Interface Utilisateur / Agent IA]                                     |
|         |                                                               |
|         +--> Token Discovery Service : lecture des soldes & métadonnées |
|         +--> Approval Engine : évaluation des allowances nécessaires    |
|         +--> Simulation Engine : simulation RPC sans état (eth_call)     |
|         +--> Batch Builder : encodage des calldata & gestion slippage   |
+-------------------------------------------------------------------------+
                                    |
          1 à N Signatures d'Approbation (si nécessaire)
          + 1 Signature de Transaction Atomique
                                    v
+-------------------------------------------------------------------------+
|                   SMART CONTRACTS ON-CHAIN (BNB CHAIN)                  |
|                                                                         |
|   +-----------------------------------------------------------------+   |
|   |                  BatchSellExecutor.sol                          |   |
|   |                                                                 |   |
|   |  - ReentrancyGuard (OpenZeppelin v5)                            |   |
|   |  - Ownable (Administration minimale : pause, whitelist)        |   |
|   |  - Whitelist de Routeurs stricts (aucun appel arbitraire)       |   |
|   |  - Accounting Fee-On-Transfer dynamique                         |   |
|   |  - Double barrière de slippage (individuel + global)            |   |
|   |  - Solde résiduel = 0 BNB / 0 Token (Non-Custodial strict)      |   |
|   +-----------------------------------------------------------------+   |
|                 |                                    |                  |
|                 v                                    v                  |
|   [PancakeSwap V2 Router]             [FourMeme Curve Router]           |
|   (Officiel & Opérationnel)           (Isolé / allowFourMemeExecution)  |
+-------------------------------------------------------------------------+
```

---

## 2. Spécifications du Smart Contract `BatchSellExecutor.sol`

### 2.1. Principes de Conception
1. **Zéro Custodie (Non-Custodial Strict)** :
   Le contrat ne dispose d'aucune fonction de dépôt, de séquestre ou de retrait par un tiers (`no withdraw()`). À l'issue de l'exécution, la totalité des BNB générés par les ventes est immédiatement transférée à l'adresse destinataire (`targetRecipient`) spécifiée ou à `msg.sender`.
2. **Rejet des Dépôts Directs** :
   La fonction `receive() external payable` interdit explicitement tout versement spontané de BNB natif (`DirectBnbDepositNotAllowed`) en dehors d'une exécution de swap active identifiée par le verrou de réentrance.
3. **Plafond de Taille de Lot (`MAX_BATCH_SIZE`)** :
   Le nombre maximal d'opérations exécutées au sein d'un même batch est fixé de manière immuable à **25 ordres** afin de prévenir les échecs par dépassement de limite de gas par bloc (`Block Gas Limit`).
4. **Circuits de Coupure d'Urgence (Circuit Breakers)** :
   - Fonction `paused` activable par l'administrateur en cas de comportement anormal détecté sur un protocole sous-jacent.
   - Interrupteur `allowFourMemeExecution` : désactivé par défaut en environnement de production tant que l'ABI officielle de la courbe four.meme n'a pas été formellement certifiée par son équipe ou validée on-chain.

### 2.2. Prise en Charge des Tokens à Taxe (Fee-On-Transfer)
Sur BNB Chain, de nombreux memecoins prélèvent des frais à chaque transfert. Une intégration naïve appelant `transferFrom(user, contract, amount)` puis tentant de swapper `amount` échoue inévitablement car le contrat reçoit `amount - taxe`.

BatchSell implémente une mesure différentielle exacte :
```solidity
uint256 tokenBalBefore = IERC20(order.token).balanceOf(address(this));
IERC20(order.token).safeTransferFrom(msg.sender, address(this), order.tokenAmount);
uint256 actualTokensReceived = IERC20(order.token).balanceOf(address(this)) - tokenBalBefore;
if (actualTokensReceived == 0) revert ZeroAmountProvided();

// Approbation du routeur au montant exact réellement reçu
IERC20(order.token).forceApprove(order.routerTarget, actualTokensReceived);
```
Après l'exécution du swap, l'allowance accordée au routeur est immédiatement réinitialisée à zéro (`forceApprove(order.routerTarget, 0)`), respectant les standards les plus stricts d'hygiène des autorisations.

---

## 3. Analyse Réaliste du Slippage et de la Protection MEV

### 3.1. Double Vérification du Slippage (Anti-Cross-Subsidization)
Dans un batch multi-ordres, le risque classique est qu'un ordre très rentable compense une perte inadmissible sur un autre ordre. BatchSell neutralise ce risque par deux contrôles cumulatifs :
1. **Contrôle Individuel par Ordre** :
   Pour chaque token $i$ vendu, le delta de BNB produit est mesuré :
   $$\Delta \text{BNB}_i = \text{Balance}_{\text{après}} - \text{Balance}_{\text{avant}}$$
   Si $\Delta \text{BNB}_i < \text{minBnbOut}_i$, la transaction est rejetée immédiatement avec l'erreur `IndividualSlippageExceeded`.
2. **Contrôle Global du Lot** :
   La somme globale perçue doit respecter le montant plancher fixé par l'utilisateur :
   $$\sum \Delta \text{BNB} \ge \text{minTotalBnbOut}$$

### 3.2. Ce que les Contrôles de Slippage Font et Ne Font Pas (Frontières MEV)
* **Ce qu'ils font :**
  - Ils garantissent contractuellement que l'utilisateur ne recevra jamais un montant inférieur au minimum calculé avec le pourcentage de slippage toléré (ex: 2%).
  - Ils empêchent les pertes silently acceptées à l'intérieur du panier d'actifs.
* **Ce qu'ils ne font PAS :**
  - Ils ne masquent pas la transaction dans le mempool public de BNB Chain.
  - Si un utilisateur autorise un slippage de 2% sur une transaction de fort volume dans un pool peu profond, un bot MEV (recherche de sandwich attack) peut toujours déplacer le cours jusqu'à la limite autorisée par le slippage.
  - Ils ne se substituent pas à une route privée anti-MEV (type Flashbots / MEVBlocker). L'utilisation conjointe d'un endpoint RPC privé reste la seule méthode pour garantir l'absence totale de visibilité mempool.

---

## 4. Distinction des Approbations et Exécution Multi-Signatures

Pour dissiper toute ambiguïté sur l'expérience utilisateur :

| Étape | Rôle | Nombre de Transactions | Type d'Opération |
| :--- | :--- | :--- | :--- |
| **Étape 1 : Approbations ERC-20** | Autoriser le contrat `BatchSellExecutor` à transférer le montant exact de tokens | $N - k$ transactions (où $k$ est le nombre de tokens disposant déjà d'une allowance suffisante) | Interaction standard EOA vers Contrat de Token |
| **Étape 2 : Exécution Atomique** | Exécuter l'ensemble des $N$ ventes dans PancakeSwap / FourMeme | **1 seule transaction** | Appel `executeBatchSell` sur `BatchSellExecutor` |

**Conclusion ergonomique** : Sur un wallet standard, BatchSell ramène le besoin d'interaction de $2N$ transactions distinctes à **$N+1$ transactions au pire des cas** (zéro allowance préalable), et à **1 seule transaction** dans le cas optimal où les autorisations sont déjà actives.

---

## 5. Statut des Intégrations & Protocoles Externes

| Protocole | Statut Réel | Implémentation |
| :--- | :--- | :--- |
| **PancakeSwap V2** | Vérifié & Opérationnel | Routeur officiel testé via interface standard `IPancakeRouter02`. |
| **four.meme** | Modélisé / Non-certifié | ABI basée sur la rétro-ingénierie des interactions de bonding curve. Isolée derrière l'interrupteur `allowFourMemeExecution` désactivé par défaut. |
| **EIP-7702** | Roadmap Future | Prise en compte dans l'architecture théorique, mais désactivée en pratique car les wallets mobiles et extensions de production ne supportent pas encore les transactions de type 4. |
| **Binance AI Pro / Agentic Wallet** | Compatible via Web3 standard (EIP-1193) | Aucune dépendance envers un SDK fermé fictif. L'intégration repose sur le standard ouvert `window.ethereum` et l'architecture par intentions. |
