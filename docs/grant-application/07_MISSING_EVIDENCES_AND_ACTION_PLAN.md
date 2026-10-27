# 07. Preuves Manquantes & Plan d'Action d'Obtention

Pour maintenir une transparence totale et une crédibilité irréprochable vis-à-vis des comités de sélection de subventions (Grants), ce document recense les preuves qui ne sont **pas encore finalisées on-chain** et décrit la procédure exacte pour les obtenir avant la revue formelle.

---

## 1. Tableau Récapitulatif des Preuves et Statuts

| Réf | Élément de Preuve | Statut Actuel | Impact sur la Candidature | Priorité |
| :---: | :--- | :---: | :--- | :---: |
| **P-01** | Déploiement vérifié de `BatchSellExecutor` sur BSC Testnet | Simulation locale / Mock | Moyen : Le code est prêt mais doit être déployé sur le Testnet public officiel (Chain ID: 97). | **P1 (Immédiate)** |
| **P-02** | Rapport d'audit de sécurité indépendant par un tiers | Absent (Revue technique interne uniquement) | Élevé : Normal à ce stade, justifie précisément 50% de la demande de subvention. | **P1 (Objectif Grant)** |
| **P-03** | Données chiffrées réelles de benchmark de gas (`gasUsed`) | Protocole défini, valeurs marquées « à mesurer » | Moyen : Permet de prouver mathématiquement l'économie d'échelle du batch. | **P2 (Court terme)** |
| **P-04** | ABI formellement certifiée du contrat de production four.meme | Rétro-ingénierie / Interface isolée par flag de sécurité | Faible pour le MVP : PancakeSwap V2 est déjà vérifié et fonctionnel. | **P2 (Court terme)** |
| **P-05** | Intégration native dans le chat de Binance AI Pro | Compatibilité Web3 EIP-1193 prouvée | Nul : Dépend de l'ouverture par Binance d'une API publique d'agents. | **P3 (Roadmap)** |

---

## 2. Procédure Pas-à-Pas pour Obtenir Chaque Preuve Manquante

### Preuve P-01 : Déploiement et Vérification sur BSC Testnet
* **Objectif** : Disposer d'une adresse de contrat publique `0x...` vérifiée avec code source en clair sur [https://testnet.bscscan.com](https://testnet.bscscan.com).
* **Marche à suivre** :
  1. Obtenir des tBNB de test sur le faucet officiel : [https://www.bnbchain.org/en/testnet-faucet](https://www.bnbchain.org/en/testnet-faucet).
  2. Configurer une clé privée de déploiement de test (sans aucun fond réel) dans l'environnement local.
  3. Exécuter la commande Foundry de déploiement avec vérification automatique :
     ```bash
     forge create contracts/src/BatchSellExecutor.sol:BatchSellExecutor \
       --rpc-url https://data-seed-prebsc-1-s1.binance.org:8545 \
       --private-key $TESTNET_DEPLOYER_PRIVATE_KEY \
       --constructor-args \
         $ADMIN_TESTNET_ADDRESS \
         0x2514897e0F1b05F999D59E71F4259b3B15a81617 \
         0xD99D1c33F9fC3444f8101754aBC46c52416550D1 \
         true \
       --verify \
       --etherscan-api-key $BSCSCAN_API_KEY
     ```
  4. Récupérer l'adresse déployée et le hash de transaction de création, puis les consigner dans `docs/DEPLOYMENT.md` et dans les variables d'environnement frontend (`VITE_BATCHSELL_EXECUTOR_TESTNET`).

---

### Preuve P-02 : Devis et Conduite de l'Audit Indépendant
* **Objectif** : Obtenir un rapport d'audit tiers signé sans vulnérabilité critique ou haute non corrigée.
* **Marche à suivre** :
  1. Préparer un dossier de cadrage d'audit (taille du repo : `contracts/src/BatchSellExecutor.sol` = ~320 SLoC).
  2. Soumettre une demande de devis à au moins 3 cabinets reconnus sur BSC (ex: Salus Security, PeckShield, Zellic).
  3. Joindre les devis obtenus en annexe financière du dossier de grant.
  4. Dès versement du jalon M2 de la subvention, mandater le cabinet retenu et publier le rapport d'audit complet en open source.

---

### Preuve P-03 : Exécution du Protocole de Benchmark de Gas
* **Objectif** : Remplir le tableau comparatif de `03_TESTING_AND_BENCHMARKS.md` avec des chiffres réels issus de reçus de transactions (`gasUsed`).
* **Marche à suivre** :
  1. Sur le contrat testnet déployé (Preuve P-01), créer un script d'automatisation (`scripts/run_gas_benchmark.ts`) utilisant `viem`.
  2. Créer 10 paires de test avec liquidité sur PancakeSwap Testnet.
  3. Exécuter les ventes 1 par 1 et relever le cumul de gas utilisé.
  4. Exécuter un appel `executeBatchSell` pour 2, 3, 5 et 10 tokens et relever le gas consommé.
  5. Calculer le différentiel exact et publier les transactions BSCScan correspondantes à titre de preuve reproductible.

---

### Preuve P-04 : Confirmation On-Chain de l'ABI four.meme
* **Objectif** : Valider que la fonction de vente de la courbe de production correspond strictement à `sellToken(address,uint256,uint256)` ou adapter le sélecteur.
* **Marche à suivre** :
  1. Identifier sur BSCScan Mainnet une transaction récente de vente réussie sur le contrat four.meme (`0x5c952063c7fc8610FFDB798152D69F0B9550762b`).
  2. Décompiler ou inspecter les 4 premiers octets des calldata (Function Selector).
  3. Valider que les types de paramètres correspondent aux types attendus (`address,uint256,uint256`).
  4. Une fois confirmé, documenter l'ABI complète dans `docs/FEASIBILITY.md` et activer le flag `allowFourMemeExecution` lors du déploiement.
