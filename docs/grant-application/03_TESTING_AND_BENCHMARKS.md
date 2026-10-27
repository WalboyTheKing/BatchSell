# 03. Validation des Tests & Protocole de Benchmark de Gas

Ce document présente l'état réel et vérifié des tests logiciels du projet BatchSell ainsi que le protocole rigoureux de benchmark de gas.

---

## 1. Résultats Réels des Tests Automatisés

### 1.1. Suite de Tests TypeScript (Moteur d'Intégration Client)

* **Commande exacte exécutée** :
  ```bash
  npm run test:ts
  # ou commande racine standard :
  npm test
  ```
* **Résultat vérifié** :
  ```text
  > react-example@0.0.0 test:ts
  > tsx -e "import('./src/test/batchSell.test.ts').then(m => m.runAllTests()).then(r => console.log('Passed:', r.filter(x => x.passed).length, '/', r.length))"

  Passed: 26 / 26
  ```
* **Bilan** : **26 tests exécutés, 26 passés, 0 échec** (Taux de succès : 100%).

#### Détail des 26 Cas Testés dans `src/test/batchSell.test.ts` :

**Tests Fonctionnels (14 Cas) :**
1. `FUNC-01` : Initialisation et connexion du wallet (récupération adresse et solde natif).
2. `FUNC-02` : Détection de réseau et bascule de chaîne (BSC Mainnet 56 <-> BSC Testnet 97).
3. `FUNC-03` : Gestion des soldes nuls (exclusion automatique des tokens sans solde).
4. `FUNC-04` : Reconnaissance de la compatibilité des tokens fourMeme (bonding curve).
5. `FUNC-05` : Rejet et blocage des tokens non compatibles ou classés à haut risque.
6. `FUNC-06` : Évaluation des allowances suffisantes (aucune demande d'approbation superflue).
7. `FUNC-07` : Évaluation des allowances insuffisantes (génération d'approbation au montant exact requis).
8. `FUNC-08` : Construction d'un plan de batch pour deux tokens avec calcul du total estimé en BNB.
9. `FUNC-09` : Simulation pré-vol réussie avec calldata valides et solde de gas suffisant.
10. `FUNC-10` : Simulation échouée par manque de BNB pour couvrir les frais de réseau (blocage préventif).
11. `FUNC-11` : Gestion propre du rejet utilisateur lors de la demande de signature (erreur EIP-1193 code 4001).
12. `FUNC-12` : Formatage et génération du reçu de transaction avec lien explorateur BSCScan.
13. `FUNC-13` : Décodage et traitement d'un revert de transaction (`SlippageExceeded`).
14. `FUNC-14` : Mise à jour immédiate des soldes vendables en mémoire post-exécution.

**Tests de Sécurité (12 Cas) :**
1. `SEC-01` : Rejet immédiat de toute adresse cible hors whitelist (Whitelist Guard).
2. `SEC-02` : Interdiction d'invoquer des fonctions arbitraires non autorisées.
3. `SEC-03` : Contrôle de format et validation stricte des adresses hexadécimales de 42 caractères.
4. `SEC-04` : Blocage systématique de tout ordre dont le montant dépasse le solde réel détenu.
5. `SEC-05` : Plafond de slippage de sécurité (rejet des tolérances supérieures à 10%).
6. `SEC-06` : Protection contre les injections d'appels arbitraires externes.
7. `SEC-07` : Garantie d'atomicité (si un token échoue, aucun token n'est prélevé).
8. `SEC-08` : Vérification du caractère non-custodial (zéro fonction de retrait custodial).
9. `SEC-09` : Règle d'approbation stricte au montant exact (anti-infinite allowance).
10. `SEC-10` : Détection d'altération de prix (> 5%) post-simulation imposant une reconfirmation.
11. `SEC-11` : Fallback gracieux en l'absence de support d'EIP-7702 par le wallet.
12. `SEC-12` : Module de révocation d'allowance (génération de calldata d'approbation à zéro).

---

### 1.2. Suite de Tests Foundry Solidity (Smart Contracts)

* **Emplacement du code de test** : `contracts/test/BatchSellExecutor.t.sol`
* **Nombre de tests rédigés** : **33 tests formels**
* **Contrats mocks implémentés** : `MockERC20`, `MockFailingERC20`, `MockNonStandardERC20`, `MockFeeOnTransferERC20`, `MockFourMemeRouter`, `MockPancakeRouter`, `MockRejectingRecipient`, `MockReentrantAttacker`.

#### Exécution des Tests Foundry
Dans les environnements conteneurisés légers (Node.js slim sans binaire Rust/Foundry préinstallé), la commande `forge` n'est pas nativement disponible :
```bash
which forge
# Sortie : forge not found
```
Pour exécuter la suite Foundry sur une machine de développement locale :
```bash
# 1. Installer Foundry si nécessaire :
curl -L https://foundry.paradigm.xyz | bash
foundryup

# 2. Compiler les contrats :
forge build

# 3. Lancer la suite complète avec traces d'erreurs :
forge test -vvv
```

#### Couverture des 33 Tests Solidity :
- **Déploiement et Whitelist (5 tests)** : vérification du propriétaire initial, interdiction d'owner nul, ajout et retrait de routeurs autorisés, rejet des cibles non autorisées.
- **Exécution Simple et Slippage (6 tests)** : respect du montant minimum `minBnbOut`, rejet si slippage dépassé, vérification de la réception directe par le vendeur ou un destinataire tiers.
- **Exécution Groupée et Atomicité (4 tests)** : vente multi-tokens sur routeurs mixtes, rollback intégral en cas d'échec d'un seul ordre, émission des événements `BatchExecuted`.
- **Résistance aux Attaques et Invariants (18 tests)** :
  * Blocage strict de la réentrance (`ReentrancyGuard`) lors du transfert de BNB.
  * Isolation absolue : impossibilité pour un tiers d'exploiter les allowances d'un autre utilisateur.
  * Invariant de conservation absolue : le contrat termine systématiquement avec **strictement 0 BNB et 0 token résiduel**.
  * Prise en charge des tokens non standard ne retournant pas de booléen (style USDT).
  * Prise en charge des tokens à taxe de transfert (`MockFeeOnTransferERC20`).
  * Rejet catégorique des versements directs de BNB en dehors des swaps (`DirectBnbDepositNotAllowed`).
  * Rejet des batches vides (`EmptyBatch`) ou dépassant la taille maximale autorisée (`BatchSizeExceeded > 25`).

---

## 2. Protocole de Benchmark de Gas

Afin de proscrire toute affirmation marketing non étayée (ex: "65% de gas économisé"), BatchSell définit un protocole expérimental reproductible permettant de quantifier le coût réel en gas.

### 2.1. Hypothèses et Décomposition des Coûts
Une transaction sur l'EVM comporte :
- **Un coût de base fixe** : 21 000 unités de gas par transaction (signature, nonce, transfert d'en-tête).
- **Le coût d'exécution d'un swap DEX standard** : environ 100 000 à 140 000 unités de gas selon les pools et les chemins.
- **Le surcoût du contrat de batch** : boucles, vérifications d'invariants et transferts internes.

### 2.2. Méthodologie du Protocole
Le benchmark compare deux scénarios pour $N \in \{2, 3, 5, 10\}$ tokens :

1. **Scénario A : Ventes Séquentielles Unitaires**  
   Pour chaque token $i$ :
   $$\text{Gas}_{\text{Total A}} = \sum_{i=1}^N \left( \text{Gas}(\text{approve}_i) + \text{Gas}(\text{swap}_i) \right)$$
   Dans le cas où les approbations sont déjà actives :
   $$\text{Gas}_{\text{Swaps A}} = \sum_{i=1}^N \text{Gas}(\text{swap}_i)$$

2. **Scénario B : Batch Atomique BatchSell**  
   $$\text{Gas}_{\text{Total B}} = \sum_{i=1}^N \text{Gas}(\text{approve}_i) + \text{Gas}(\text{executeBatchSell}(N))$$
   Dans le cas où les approbations sont déjà actives :
   $$\text{Gas}_{\text{Swaps B}} = \text{Gas}(\text{executeBatchSell}(N))$$

### 2.3. Tableau de Mesure (Résultats : « À mesurer »)

| Nombre de Tokens ($N$) | Gas Cumulé Ventes Unitaires ($N \times \text{swap}$) | Gas Batch Atomique (`executeBatchSell`) | Différentiel Net (Unités de Gas) | Économie Relative (%) |
| :---: | :---: | :---: | :---: | :---: |
| **$N = 2$** | *À mesurer* | *À mesurer* | *À mesurer* | *À mesurer* |
| **$N = 3$** | *À mesurer* | *À mesurer* | *À mesurer* | *À mesurer* |
| **$N = 5$** | *À mesurer* | *À mesurer* | *À mesurer* | *À mesurer* |
| **$N = 10$** | *À mesurer* | *À mesurer* | *À mesurer* | *À mesurer* |

### 2.4. Étapes de Réalisation du Benchmark
1. Déployer `BatchSellExecutor` sur un fork local de BSC ou sur BSC Testnet.
2. Déployer $N$ tokens ERC-20 de test avec liquidité sur PancakeSwap V2 Testnet.
3. Exécuter un script automatisé Foundry ou viem enregistrant avec précision `receipt.gasUsed`.
4. Publier le rapport de benchmark complet au format JSON et Markdown dans le dépôt GitHub avec les traces transactionnelles.
