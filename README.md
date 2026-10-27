# BatchSell — Agentic Wallet Transaction Batching Infrastructure

Infrastructure de transactions groupées sécurisées et non-custodiales pour les wallets IA (Binance AI Pro, Binance Agentic Wallet) et traders sur BNB Smart Chain.

Dépôt officiel : [https://github.com/WalboyTheKing/BatchSell](https://github.com/WalboyTheKing/BatchSell)

---

## 1. Vue d'ensemble du Produit

BatchSell résout la friction critique des $2N$ confirmations manuelles successives rencontrée par les utilisateurs d'agents IA souhaitant liquider ou rééquilibrer un portefeuille de memecoins sur BNB Chain.

Le système propose deux modes d'exécution :
1. **Mode Batch Atomique (`BatchSellExecutor.sol`)** : Regroupe l'ensemble des ventes en une transaction unique avec vérification de slippage individuel et global. Si une opération échoue ou dérape, la transaction complète est annulée (aucun actif perdu).
2. **Mode Séquentiel Contrôlé** : Exécute les transactions de manière indépendante avec suivi du statut par token.

---

## 2. Architecture des Smart Contracts

### Source de Vérité Canonique
* **Contrat Canonique** : `contracts/src/BatchSellExecutor.sol` (défini par `src = "contracts/src"` dans `foundry.toml`).
* **Suite de Tests Canonique** : `contracts/test/BatchSellExecutor.t.sol` (défini par `test = "contracts/test"` dans `foundry.toml`).
* **Suppression des Fichiers Miroirs** : Les fichiers redondants à la racine de `/contracts/` (`contracts/BatchSellExecutor.sol` et `contracts/BatchSellExecutor.t.sol`) ont été supprimés pour garantir une source de vérité unique et inaltérable.

### Spécifications Techniques du Contrat
* **Sécurité & Dépendances** : Construit sur **OpenZeppelin Contracts v5** (`ReentrancyGuard`, `SafeERC20`, `Ownable`).
* **Non-Custodial Strict** : Le contrat ne conserve aucun token ni BNB résiduel. 100% des BNB générés sont transférés au destinataire dans la même transaction.
* **Support des Tokens à Taxe (Fee-On-Transfer)** : Mesure dynamique du solde réel reçu (`actualTokensReceived = tokenBalAfter - tokenBalBefore`) avant de router l'ordre, assurant une exécution sans échec avec les memecoins à taxe sur BSC.
* **Double Protection de Slippage** :
  - **Slippage Individuel Strict** : Mesure du delta de BNB généré par chaque ordre pour empêcher qu'un gain sur un token ne masque une perte par slippage sur un autre (anti cross-subsidization).
  - **Slippage Global** : Contrôle du montant net total reçu (`totalBnbReceived >= minTotalBnbOut`).
* **Protection contre les Dépôts Directs** : La fonction `receive()` rejette tout envoi direct de BNB en dehors d'une exécution de swap active (`DirectBnbDepositNotAllowed`).
* **Plafond de Sécurité** : Taille de lot limitée à 25 opérations (`MAX_BATCH_SIZE`) pour prévenir les dépassements de limite de gas par bloc.
* **Hygiène des Allowances** : Réinitialisation systématique de l'approbation du routeur à 0 (`forceApprove(router, 0)`) après chaque vente.

---

## 3. Statut des Intégrations & Vérifications

| Protocole / Composant | Statut | Adresse BSC Mainnet (56) | Détail & Condition |
| :--- | :--- | :--- | :--- |
| **PancakeSwap V2 Router** | **Vérifié & Opérationnel** | `0x10ED43C718714eb63d5aA57B78B54704E256024E` | Routeur officiel vérifié sur BSCScan. |
| **PancakeSwap WBNB** | **Vérifié & Opérationnel** | `0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c` | Contrat natif WBNB. |
| **FourMeme Curve** | **Isolé / Non-Vérifié en Prod** | `0x5c952063c7fc8610FFDB798152D69F0B9550762b` | Interrupteur `allowFourMemeExecution` désactivé par défaut. Réactivation soumise à la confirmation on-chain de l'ABI de vente. |
| **Binance Agentic Wallet** | **Layer EIP-1193** | N/A | Compatible via le connecteur Web3 standard injecté. Pas de SDK propriétaire fictif. |
| **EIP-7702** | **Expérimental** | N/A | Spécifications prêtes mais en attente du support dans les wallets mobiles de production. |

---

## 4. Guide des Commandes & Tests

### Prérequis
- Node.js >= 18
- Foundry (`forge`, `cast`)

### Compilation Solidity & Frontend
```bash
# Compiler les smart contracts
forge build

# Vérifier le formatage Solidity
forge fmt --check

# Compiler l'application frontend
npm run build
```

### Exécution des Tests
```bash
# Lancer les 33 tests unitaires et de sécurité Foundry
forge test -vvv

# Lancer la suite d'intégration TypeScript (26 cas)
npm run test:ts

# Lancer le pipeline complet
npm test
```

### Résultats des Tests
* **TypeScript Tests** : **26 passés sur 26** vérifiés (`npm test` / `npm run test:ts`).
* **Foundry Tests** : **33 tests unitaires et d'invariants** rédigés dans `contracts/test/BatchSellExecutor.t.sol` (exécutables avec la CLI Foundry locale via `forge test -vvv`).
* **Linter TypeScript** : `tsc --noEmit` sans aucune erreur.

---

## 5. Documentation Détaillée & Dossier de Candidature

* 📁 **[Dossier de Candidature Grant (Subvention)](./docs/grant-application/README.md)** : Dossier complet et transparent (vue d'ensemble, architecture & revue technique interne, protocole de benchmark, budget indicatif de 20 000 $, script vidéo bilingue et checklist).
* [`docs/FEASIBILITY.md`](./docs/FEASIBILITY.md) : Analyse technique de fourMeme, limitation de Multicall3 et étude EIP-7702.
* [`docs/ARCHITECTURE.md`](./docs/ARCHITECTURE.md) : Schéma des flux de données et architecture modulaire.
* [`docs/SECURITY.md`](./docs/SECURITY.md) : Politique de sécurité et revue technique interne.
* [`docs/TESTING.md`](./docs/TESTING.md) : Matrice des 33 tests Foundry et des mocks.
* [`docs/DEPLOYMENT.md`](./docs/DEPLOYMENT.md) : Guide de déploiement et paramètres de constructeur.
* [`docs/KNOWN_LIMITATIONS.md`](./docs/KNOWN_LIMITATIONS.md) : Frontières techniques et statut d'authentification.
* [`docs/BINANCE_INTEGRATION.md`](./docs/BINANCE_INTEGRATION.md) : Rapport d'intégration Binance AI Pro et Agentic Wallet.

---

## 6. Avertissement de Sécurité & Non-Responsabilité

Ce contrat et cette application n'ont **pas encore fait l'objet d'un audit de sécurité externe et indépendant** par un cabinet tiers (ex: OpenZeppelin, CertiK). Il est formellement déconseillé de déployer ce contrat sur le réseau principal (BSC Mainnet) avec des fonds réels sans un audit préalable complet.
