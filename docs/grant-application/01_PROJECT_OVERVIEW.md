# 01. Vue d'Ensemble du Projet : BatchSell

## 1. Fiche d'Identité du Projet

* **Nom du Projet** : BatchSell
* **Sous-titre descriptif** : Infrastructure de transactions groupées non-custodiale pour portefeuilles Web3 et agents d'IA sur BNB Smart Chain.
* **Dépôt Open Source** : [https://github.com/WalboyTheKing/BatchSell](https://github.com/WalboyTheKing/BatchSell)
* **Réseau Principal Ciblé** : BNB Smart Chain (BSC Mainnet - Chain ID: 56, BSC Testnet - Chain ID: 97)
* **Domaine Technologique** : DeFi Infrastructure, Account Ergonomics, Smart Contracts Solidity, ERC-20, Trading DEX/Bonding Curves.
* **Licence** : MIT

---

## 2. Problématique Résolue

### Le Constat Terrain
Lorsqu'un utilisateur (ou un agent d'IA opérant via un portefeuille comme Binance Agentic Wallet, Binance AI Pro, Rabby ou MetaMask) gère un portefeuille diversifié de memecoins ou de tokens émergents sur BNB Chain (notamment via des plateformes comme four.meme ou PancakeSwap), la liquidation ou le rééquilibrage de plusieurs positions entraîne une friction majeure :
1. **Multiplication des confirmations manuelles** : Pour chaque token sans autorisation préalable, l'utilisateur doit soumettre une transaction `approve(spender, amount)`, puis une transaction d'échange `swap` ou `sell`. Pour $N$ tokens, cela peut exiger jusqu'à $2N$ signatures séparées.
2. **Risque de subventionnement croisé (Cross-Subsidization)** : Dans les transactions groupées naïves, un gain inattendu sur un token A peut masquer une perte sévère due au slippage sur un token B si seul le montant total en sortie est contrôlé.
3. **Absence d'atomicité dans les exécutions séquentielles** : Si les ventes sont exécutées une par une de manière séquentielle, une défaillance à mi-parcours (chute brutale de liquidité, honeypot imprévu, spike de gas) laisse le portefeuille dans un état partiellement liquidé avec des frais de réseau dépensés en pure perte.

---

## 3. Solution Technique Proposée par BatchSell

BatchSell apporte une couche d'infrastructure composée de deux briques complémentaires :

### Brique 1 : Le Moteur d'Intention & Simulation Client (TypeScript / Web3)
* **Détection automatique d'allowances** : Le moteur scanne les approbations déjà accordées par le wallet de l'utilisateur. Si une allowance suffisante existe déjà, aucune transaction d'approbation superflue n'est demandée.
* **Politique d'approbation stricte au montant exact** : Lorsque l'approbation est nécessaire, elle est par défaut calibrée au montant exact de la vente (`exact amount`), évitant l'exposition aux risques d'approbations infinies (`type(uint256).max`).
* **Simulation pré-vol (`eth_call`)** : Avant toute signature, la composition du batch est vérifiée pour évaluer le solde réel, le solde de BNB requis pour le gas, et identifier les éventuels tokens défaillants ou honeypots.

### Brique 2 : Le Smart Contract d'Exécution Atomique (`BatchSellExecutor.sol`)
* **Atomicité stricte (Tout ou Rien)** : Toutes les ventes incluses dans le lot sont exécutées au sein de la même transaction blockchain. Si un seul ordre dépasse son seuil de slippage ou échoue, l'intégralité du lot est annulée : aucun token n'est prélevé et aucun fond n'est perdu.
* **Double rempart de slippage** :
  - **Slippage individuel par token (`minBnbOut`)** : Mesure du delta réel de BNB dégagé par chaque vente unitaire pour interdire tout subventionnement croisé.
  - **Slippage global agrégé (`minTotalBnbOut`)** : Vérification du montant net total reversé à l'utilisateur.
* **Support natif des tokens à taxe (Fee-On-Transfer)** : Mesure dynamique du solde réel reçu dans le contrat (`tokenBalAfter - tokenBalBefore`) avant de déclencher la vente, évitant les reverts liés aux taxes de transfert.
* **Architecture 100% Non-Custodiale** : Le contrat ne conserve aucun solde. 100% des BNB générés sont transférés directement au destinataire validé au terme de l'exécution, avec rejet strict de tout dépôt accidentel hors swap (`DirectBnbDepositNotAllowed`).

---

## 4. Ce que le Système Fait et Ne Fait Pas (Clarifications Majeures)

### Concernant les Approbations et le Nombre de Signatures
* **Ce qu'il fait** : Il regroupe l'ensemble des $N$ ventes en **une seule transaction d'exécution blockchain**.
* **Ce qu'il ne fait pas sur un compte EOA standard** : Sans standard d'Account Abstraction (ERC-4337) ou sans délégation EIP-7702 (qui n'est pas encore activée dans les interfaces mobiles de production), les transactions d'approbation ERC-20 ne peuvent **pas** être regroupées magiquement avec la transaction d'exécution si l'utilisateur utilise un compte EOA classique.
* **Règle exacte** :
  - Si $k$ tokens ont déjà une allowance suffisante : $N - k$ signatures d'approbation + **1 signature de batch d'exécution**.
  - Si tous les tokens sont déjà approuvés ($k = N$) : **1 seule et unique signature d'exécution**.
  - Si aucun token n'est approuvé ($k = 0$) : **$N$ approbations + 1 signature d'exécution** (soit $N+1$ transactions au total, au lieu des $2N$ transactions individuelles requises par une approche unitaire séquentielle).

### Concernant le Slippage et le MEV
* **Ce que le contrôle de slippage fait** : Il garantit que l'utilisateur ne recevra jamais moins que le seuil de BNB qu'il a explicitement autorisé (`minBnbExpected` et `minTotalBnbOut`).
* **Ce qu'il ne fait pas** : Il ne garantit **pas** l'élimination des attaques sandwich (MEV) sur le mempool public de BNB Chain si la marge de slippage paramétrée par l'utilisateur laisse un profit extractible à un bot de front-running. Pour éliminer complètement le MEV, l'utilisateur doit router sa transaction via un RPC privé protégeant les transactions de la visibilité mempool.

### Concernant les Économies de Gas
* **Principe théorique** : Le regroupement de plusieurs ventes au sein d'une même transaction permet d'amortir les 21 000 unités de gas fixes de base d'une transaction Ethereum/BSC.
* **Position de rigueur** : Aucune affirmation de pourcentage forfaitaire (ex: "65% de gas économisé") n'est mise en avant sans benchmark comparatif on-chain certifié. Un protocole de benchmark standardisé est défini dans la pièce `03_TESTING_AND_BENCHMARKS.md` et les résultats finaux sont indiqués comme **« à mesurer »** sur le réseau de test.

---

## 5. Statut Réel du Développement

| Composant | Statut Actuel | Environnement Validé | Prochaine Étape |
| :--- | :--- | :--- | :--- |
| Smart Contract `BatchSellExecutor.sol` | **Terminé & Documenté** | 33 tests Foundry rédigés (`contracts/test/`) | Audit indépendant par un tiers |
| Adaptateur PancakeSwap V2 | **Opérationnel** | BSC Mainnet & Testnet | Test de volume sur testnet |
| Adaptateur FourMeme Bonding Curve | **Modélisé / Isolé** | Simulateur & Contrat Mock | Confirmation formelle de l'ABI de prod |
| Suite de Tests TypeScript | **26/26 Tests Passés** | Node.js 22 (`npm test`) | Intégration continue CI/CD |
| Interface Web Réactive | **Opérationnelle** | AI Studio Preview / Navigateur | Raccordement BSC Testnet live |
| Intégration Binance AI Pro | **Architecture d'Intention prête** | Spécifications EIP-1193 | Déploiement en extension/plugin quand API dispo |
| Support EIP-7702 | **Recherche / Spécifications** | Modélisation théorique | En attente de l'activation réseau et wallet |
