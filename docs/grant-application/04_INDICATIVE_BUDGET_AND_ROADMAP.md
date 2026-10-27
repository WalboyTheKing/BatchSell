# 04. Budget Indicatif (20 000 $) & Feuille de Route par Jalons

## 1. Demande de Subvention Indicative : 20 000 $

La demande de subvention est formulée pour un montant indicatif total de **20 000 USD** (ou équivalent en BNB / USDT).

### Principe d'Allocation Budgétaire
* **Zéro fonds alloué à la spéculation ou à la liquidité de marché** : Aucun fond n'est alloué à la création de pools de liquidité de tokens sur le mainnet. Le contrat `BatchSellExecutor.sol` étant strictement non-custodial et agissant en tant qu'agrégateur d'exécution sur des routeurs existants (PancakeSwap, etc.), il ne requiert aucun capital bloqué pour fonctionner.
* **Priorité absolue à la sécurité et à l'auditabilité** : 50% du budget est affecté à l'audit de sécurité indépendant par un cabinet tiers reconnu.
* **Paiement par jalons vérifiables** : Les décaissements sont conditionnés à la validation de livrables techniques transparents et publics sur GitHub.

---

## 2. Décomposition Justifiée des Postes de Dépense

| Poste de Dépense | Montant Indicatif | Justification Détaillée | Devis / Estimations à Obtenir |
| :--- | :---: | :--- | :--- |
| **1. Audit de Sécurité Indépendant (Tiers)** | **10 000 $** | Audit complet du smart contract `BatchSellExecutor.sol` (~320 lignes de Solidity), analyse formelle des invariants (zéro solde résiduel, réentrance, fee-on-transfer, vérification des routeurs). Indispensable avant tout déploiement en production avec des fonds réels. | 3 devis formels à solliciter auprès de cabinets spécialisés EVM / BSC (ex: Salus Security, PeckShield, Zellic, CertiK). Fourchette constatée pour cette taille de contrat : 8 000 $ à 12 000 $. |
| **2. Ingénierie Smart Contract & Intégration Routeurs** | **5 000 $** | Finalisation de l'adaptateur PancakeSwap V3 / Universal Router, intégration de la signature formelle four.meme dès stabilisation publique de son contrat de trading, gestion avancée des erreurs personnalisées et optimisation du gas EVM. | Taux horaire ingénieur senior Web3 / Solidity (estimation : ~60 à 70 heures d'ingénierie ciblée). |
| **3. Infrastructure de Test, RPC Dédiés & Benchmarks** | **2 500 $** | Abonnement à des nœuds RPC BSC premium (QuickNode, NodeReal ou Ankr) avec support archive et logs websocket pour la simulation temps réel, serveurs de CI/CD pour l'exécution automatisée des suites de tests et des benchmarks de gas comparatifs. | Estimations des forfaits RPC annuels (plan développeur NodeReal / QuickNode : ~150 $/mois) + hébergement CI/CD. |
| **4. SDK Open Source, Documentation Développeur & Tutoriels** | **2 500 $** | Packaging du SDK TypeScript autonome (`@batchsell/sdk`), rédaction d'une documentation technique bilingue détaillée, création d'exemples d'intégration pour agents IA (LangChain, Eliza, Binance Agentic Intent). | Travail de rédaction technique, publication sur npm et maintenance de la documentation développeur open-source. |
| **TOTAL INDICATIF** | **20 000 $** | **100% orienté sécurité, robustesse technique et adoption écosystème.** | — |

---

## 3. Feuille de Route par Jalons (Milestones)

L'exécution du projet est séquencée en 4 jalons bimestriels vérifiables :

### Jalon 1 (M1) : Déploiement Testnet Public & Protocole de Benchmark Finalisé
* **Durée** : 4 semaines
* **Livrables vérifiables** :
  1. Déploiement vérifié du contrat `BatchSellExecutor` sur BSC Testnet avec code source vérifié sur BSCScan Testnet.
  2. Rapport d'exécution officiel de la suite de 33 tests Foundry avec couverture de code (`forge coverage`).
  3. Publication du rapport de benchmark de gas reproductible (comparatif ventes unitaires vs batch atomique pour 2, 3, 5 et 10 tokens sur testnet).
* **Part budgétaire** : 3 500 $

### Jalon 2 (M2) : Audit de Sécurité Indépendant & Remédiations
* **Durée** : 6 semaines
* **Livrables vérifiables** :
  1. Sélection du cabinet d'audit parmi les devis obtenus et contractualisation.
  2. Conduite de l'audit externe.
  3. Publication du rapport d'audit complet dans le répertoire public `docs/audit/`.
  4. Mise en œuvre et validation de toutes les remédiations recommandées par les auditeurs.
* **Part budgétaire** : 10 000 $ (dont règlement direct du cabinet auditeur)

### Jalon 3 (M3) : Déploiement Mainnet Sécurisé & Intégration DEX
* **Durée** : 4 semaines
* **Livrables vérifiables** :
  1. Déploiement du contrat audité sur BSC Mainnet avec paramétrage multi-signature (Gnosis Safe) pour la propriété d'administration.
  2. Support opérationnel complet de PancakeSwap V2 et V3.
  3. Vérification formelle et mise à jour de l'interrupteur `allowFourMemeExecution` en fonction de la validation technique de la bonding curve.
* **Part budgétaire** : 4 000 $

### Jalon 4 (M4) : SDK Développeur & Adaptateurs pour Agents IA
* **Durée** : 4 semaines
* **Livrables vérifiables** :
  1. Publication du package npm `@batchsell/sdk` avec documentation d'API complète.
  2. Guide d'intégration et connecteur pour agents autonomes (agents d'IA de trading et wallets agentiques).
  3. Tableau de bord de suivi open source des transactions exécutées.
* **Part budgétaire** : 2 500 $
