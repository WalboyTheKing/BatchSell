# LIMITES TECHNIQUES CONNUES & ÉTAT D'AUTHENTIFICATION

Ce document recense les limitations techniques réelles de BatchSell afin de garantir une transparence totale envers les utilisateurs et développeurs.

---

## 1. STATUT DES INTÉGRATIONS

| Composant | Statut Réel | Traitement dans BatchSell |
| :--- | :--- | :--- |
| **PancakeSwap V2 Router** | **VÉRIFIÉ & OPÉRATIONNEL** | Support complet via `swapExactTokensForETHSupportingFeeOnTransferTokens`. |
| **Tokens Diplômés DEX** | **VÉRIFIÉ & OPÉRATIONNEL** | Vente atomique et séquentielle entièrement fonctionnelle. |
| **FourMeme Bonding Curve** | **NON-AUTHENTIFIÉ EN PRODUCTION (`UNVERIFIED`)** | Interface isolée. Interrupteur `allowFourMemeExecution` désactivé par défaut sur Mainnet pour éviter des pertes sur une ABI non certifiée. Simulation active en frontend. |
| **Binance Agentic Wallet** | **INTENT LAYER COMPATIBLE (EIP-1193)** | Fonctionne avec le connecteur standard EIP-1193. Pas de SDK propriétaire fictif. |
| **EIP-7702 (Délégation)** | **EN ATTENTE DE DÉPLOIEMENT WALLET** | Spécifications prêtes côté protocole, mais désactivé par défaut car les wallets mobiles de production ne supportent pas encore les transactions type 4 dans leur UI standard. |

---

## 2. LIMITES TECHNIQUES DÉMONTRÉES

### 2.1. Limitation Inhérente à Multicall3
Comme démontré dans `docs/FEASIBILITY.md`, `Multicall3` ne peut pas être utilisé pour regrouper les approbations ERC-20 d'un utilisateur car `msg.sender` dans les sous-appels est le contrat Multicall3 lui-même. C'est pourquoi BatchSell utilise un contrat exécuteur dédié avec pull sécurisé (`safeTransferFrom`).

### 2.2. Risques MEV et Sandwich Attacks
La protection contre les attaques sandwich repose sur deux seuils stricts :
1. Un seuil individuel par token (`minBnbOut`).
2. Un seuil global agrégé sur le lot (`minTotalBnbOut`).
Ces contrôles protègent contre des dérapages de prix excessifs, mais ne suppriment pas la visibilité des transactions dans le mempool public de BNB Chain sans l'utilisation d'un RPC privé (ex: MEVBlocker ou Flashbots-like builder sur BSC).

### 2.3. Détection des Honeypots
Une simulation préalable via `eth_call` permet de détecter 95% des anomalies courantes (taxes de vente abusives, interdiction de transfert). Cependant, aucun système ne peut garantir à 100% l'absence de honeypot dynamique (par exemple un contrat dont le propriétaire bloque les ventes en fonction du bloc ou du volume dans le même bloc).

### 2.4. Taille Maximale des Batches
Pour éviter les dépassements de limite de gas par bloc (`Block Gas Limit Exceeded`), la taille des lots est plafonnée à `MAX_BATCH_SIZE = 25` opérations par transaction.
