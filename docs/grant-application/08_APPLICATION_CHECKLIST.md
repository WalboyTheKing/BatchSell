# 08. Checklist Finale de Candidature Grant

Cette grille de contrôle doit être vérifiée point par point avant toute soumission formelle d'un dossier de subvention (BNB Chain Builder Grant, MVB Accelerator ou autre programme écosystème).

---

## 1. Conformité & Transparence Technique

- [ ] **Qualification de Sécurité** : Le projet utilise exclusivement l'expression « revue technique interne » et ne se prévaut d'aucun « audit indépendant certifié » tant qu'un tiers n'a pas signé de rapport formel.
- [ ] **Contrôle de Slippage & MEV** : Aucune « garantie MEV absolue » n'est promise. Le document explique avec clarté ce que font les seuils `minBnbOut` / `minTotalBnbOut` (protection contre le slippage et le subventionnement croisé) et ce qu'ils ne font pas (absence d'invisibilité dans le mempool public).
- [ ] **Chiffrage de Gas** : Aucun pourcentage forfaitaire d'économie de gas non prouvé (ex: « 65% ») n'apparaît. Le tableau de benchmark indique honnêtement « à mesurer » selon le protocole publié.
- [ ] **Parcours de Signature** : Le dossier distingue explicitement les approbations ERC-20 (`approve`) de la transaction de batch (`executeBatchSell`). Il précise qu'un EOA standard sans EIP-7702 nécessite $N-k$ approbations + 1 transaction d'exécution.
- [ ] **Tests Logiciels Vérifiés** : Les commandes et résultats exacts sont indiqués :
  - TypeScript : 26 tests passés sur 26 (`npm test`).
  - Foundry : 33 tests unitaires et de sécurité rédigés dans `contracts/test/BatchSellExecutor.t.sol` avec commande documentée (`forge test -vvv`).
- [ ] **Statut des Intégrations** :
  - PancakeSwap V2 Router : Vérifié et opérationnel (`0x10ED43C718714eb63d5aA57B78B54704E256024E`).
  - four.meme : Isolé derrière un interrupteur de sécurité désactivé par défaut (`allowFourMemeExecution = false`).
  - EIP-7702 & Binance AI Pro : Présentés en toute transparence comme compatibilité de standards ou projets de roadmap future, sans allégations de SDK propriétaire fictif.

---

## 2. Rigueur Budgétaire

- [ ] **Montant Total Indicatif** : Fixé à 20 000 USD (ou équivalent BNB/USDT).
- [ ] **Justification Poste par Poste** :
  - 10 000 $ pour l'audit tiers indépendant (50% du budget).
  - 5 000 $ pour l'ingénierie smart contract et intégration multi-DEX.
  - 2 500 $ pour l'infrastructure RPC et tests continus.
  - 2 500 $ pour le SDK open source et documentation développeur.
- [ ] **Exclusion de la Spéculation** : Zéro dollar alloué à de la « liquidité mainnet » ou du trading.
- [ ] **Devis** : Mention explicite de l'obligation d'obtenir 3 devis formels de cabinets reconnus avant engagement des fonds.

---

## 3. Matériel Vidéo & Démonstration

- [ ] **Durée Respectée** : Vidéo calibrée pour exactement 2 minutes (120 secondes).
- [ ] **Environnement Strict** : Démonstration filmée exclusivement sur **BSC Testnet (Chain ID: 97)**.
- [ ] **Sécurité des Clés & Fonds** : Aucune clé privée, phrase de récupération (seed phrase), fichier de configuration secret ni fond réel n'est visible à l'écran.
- [ ] **Scénario Bilingue** : Script disponible en anglais simple avec prononciation approximative francophone et traduction française intégrale.
- [ ] **Fonctionnalités Démontrées** : Uniquement les briques qui fonctionnent réellement (connexion, détection d'allowances, politique stricte, simulation pré-vol, exécution atomique, reçu de transaction).

---

## 4. Dépôt & Liens Publics

- [ ] Dépôt GitHub public accessible : `https://github.com/WalboyTheKing/BatchSell`.
- [ ] Code propre sans fichiers temporaires ni verrous de paquet incompatibles (`bun.lock` supprimé).
- [ ] Build applicatif vérifié sans avertissement (`npm run build`).
- [ ] Linter TypeScript sans aucune erreur (`npm run lint` ou `tsc --noEmit`).
- [ ] Pièce des preuves manquantes (`07_MISSING_EVIDENCES_AND_ACTION_PLAN.md`) consultable en annexe.
