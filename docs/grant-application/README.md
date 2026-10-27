# Dossier de Candidature Grant : BatchSell
## Infrastructure de Transactions Groupées Sécurisées pour Wallets & Agents Web3 sur BNB Chain

Ce répertoire contient l'ensemble des pièces constitutives du dossier de candidature pour un programme de financement (Grant / Accélérateur) dans l'écosystème **BNB Chain**.

---

### Principes Directeurs du Dossier
1. **Transparence Absolue** : Aucune affirmation n'est formulée sans distinction rigoureuse entre ce qui est prouvé, ce qui est testé sur testnet/local, et ce qui relève de la roadmap future.
2. **Revue Technique Interne vs Audit Indépendant** : Le contrat `BatchSellExecutor.sol` a fait l'objet d'une revue technique interne approfondie avec tests de sécurité automatisés. Il n'a **pas** encore fait l'objet d'un audit indépendant par un cabinet tiers ; cet audit constitue le premier poste de dépense de la subvention demandée.
3. **Réalisme MEV & Slippage** : Les contrôles de slippage (individuel et global) protègent contre les dérapages de prix excessifs et le subventionnement croisé, mais ne constituent **pas** une garantie absolue contre l'extraction MEV dans le mempool public BSC sans RPC privé.
4. **Distinction Approbations vs Exécution** : Sur les comptes EOA standards, les transactions d'approbation ERC-20 (`approve`) restent distinctes de la transaction d'exécution du batch (`executeBatchSell`). L'exécution d'un batch de $N$ tokens sans allowance préalable requiert $N$ signatures d'approbation + 1 signature d'exécution, sauf en cas d'utilisation d'allowances préexistantes ou d'implémentation future d'Account Abstraction / EIP-7702.

---

### Sommaire des Pièces du Dossier

| Document | Titre | Description |
| :--- | :--- | :--- |
| [`01_PROJECT_OVERVIEW.md`](./01_PROJECT_OVERVIEW.md) | **Vue d'Ensemble du Projet** | Fiche d'identité, problème résolu, proposition de valeur, statut réel et périmètre fonctionnel. |
| [`02_TECHNICAL_ARCHITECTURE_AND_SECURITY.md`](./02_TECHNICAL_ARCHITECTURE_AND_SECURITY.md) | **Architecture & Revue Technique Interne** | Spécifications des smart contracts, gestion non-custodiale, analyse de sécurité et limites documentées. |
| [`03_TESTING_AND_BENCHMARKS.md`](./03_TESTING_AND_BENCHMARKS.md) | **Validation des Tests & Protocole de Benchmark** | Résultats réels des tests TypeScript (26/26), guide d'exécution Foundry (33 tests) et protocole de mesure de gas. |
| [`04_INDICATIVE_BUDGET_AND_ROADMAP.md`](./04_INDICATIVE_BUDGET_AND_ROADMAP.md) | **Budget Indicatif (20 000 $) & Roadmap** | Justification poste par poste, devis à obtenir, jalons de livraison et exclusion stricte des dépenses de spéculation. |
| [`05_GRANT_PROGRAMS_EVALUATION.md`](./05_GRANT_PROGRAMS_EVALUATION.md) | **Évaluation des Programmes de Financement** | Liens officiels BNB Chain, critères d'éligibilité vérifiés et statut d'ouverture des candidatures. |
| [`06_TWO_MINUTE_VIDEO_SCRIPT.md`](./06_TWO_MINUTE_VIDEO_SCRIPT.md) | **Script Vidéo de Démonstration (2 min)** | Script bilingue (anglais / français) avec guide phonétique, minutage précis et protocole de sécurité testnet. |
| [`07_MISSING_EVIDENCES_AND_ACTION_PLAN.md`](./07_MISSING_EVIDENCES_AND_ACTION_PLAN.md) | **Preuves Manquantes & Plan d'Action** | Recensement des éléments encore non vérifiés on-chain et méthode détaillée pour les obtenir avant soumission. |
| [`08_APPLICATION_CHECKLIST.md`](./08_APPLICATION_CHECKLIST.md) | **Checklist de Candidature Finale** | Grille de vérification préalable avant dépôt officiel du dossier. |
