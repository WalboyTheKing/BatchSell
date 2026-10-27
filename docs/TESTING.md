# GUIDE DE TEST : BATCHSELL

Ce document détaille la méthodologie de test, la structure des contrats mocks et les commandes pour exécuter la suite de tests complète de BatchSell.

---

## 1. ENVIRONNEMENT DE TEST

Le projet utilise **Foundry** (`forge`) pour la validation unitaire et de sécurité des smart contracts Solidity, complété par une suite TypeScript pour les tests d'intégration du moteur client.

### Commandes d'exécution et Environnements

#### 1. Suite TypeScript (Intégration & Sécurité Moteur Client - 26 Cas)
Exécutable directement dans tout environnement Node.js :
```bash
npm test
# ou équivalent :
npm run test:ts
```
*Résultat vérifié : 26 passés sur 26 (0 échec).*

#### 2. Suite Foundry Solidity (Smart Contracts & Invariants - 33 Cas)
Située dans `contracts/test/BatchSellExecutor.t.sol`. Requiert l'outil CLI Foundry (`forge`) installé sur la machine :
```bash
# Installation de Foundry (si non présent) :
curl -L https://foundry.paradigm.xyz | bash && foundryup

# Compilation des smart contracts et des mocks :
forge build

# Exécution des 33 tests avec traces d'exécution complètes :
forge test -vvv
```

---

## 2. MATRICE DES TESTS DE VALIDATION (33 CAS)

### 2.1. Tests Fonctionnels (14 Cas)

| ID | Nom du Test | Description & Assertion |
| :--- | :--- | :--- |
| `test_01` | `test_01_Deployment_ValidParameters` | Vérifie que le déploiement initialise correctement l'owner, les routeurs whitelistés et l'état de pause. |
| `test_02` | `test_02_Deployment_RevertOnZeroOwner` | Vérifie le revert `OwnableInvalidOwner` si l'adresse de l'administrateur est `address(0)`. |
| `test_03` | `test_03_Router_RegisterAndUseAuthorizedRouter` | Vérifie que l'administrateur peut enregistrer un nouveau routeur et exécuter une vente avec succès. |
| `test_04` | `test_04_Router_RevertOnUnauthorizedRouter` | Vérifie le revert `RouterNotWhitelisted` si une cible non autorisée est soumise. |
| `test_05` | `test_05_SellMock_ExpectedOutput` | Valide une vente unique (`executeSingleSell`) et la réception exacte des BNB par le vendeur. |
| `test_06` | `test_06_Slippage_RespectMinBnbOut` | Confirme l'exécution lorsque le montant reçu est exactement supérieur ou égal au minimum requis. |
| `test_07` | `test_07_Slippage_RevertWhenSlippageExceeded` | Valide le revert `IndividualSlippageExceeded` lorsque la sortie réelle est inférieure au minimum spécifié. |
| `test_08` | `test_08_Allowance_RevertOnInsufficientAllowance` | Valide le revert `InsufficientTokenAllowance` si l'utilisateur n'a pas approuvé l'exécuteur. |
| `test_09` | `test_09_Balance_RevertOnInsufficientBalance` | Valide le revert `InsufficientTokenBalance` si le solde utilisateur est inférieur au montant à vendre. |
| `test_10` | `test_10_Recipient_VerifyCustomRecipientReceivesBnb` | Valide qu'un destinataire explicite reçoit l'intégralité des BNB sans fuite vers l'initiateur. |
| `test_11` | `test_11_Batch_ValidMultiTokenExecution` | Valide la vente atomique groupée de plusieurs tokens sur différents routeurs (FourMeme + PancakeSwap). |
| `test_12` | `test_12_Batch_AtomicFailureRollsBackAll` | Démontre l'atomicité stricte : si 1 token échoue au slippage, l'ensemble du lot revert et aucun token n'est prélevé. |
| `test_13` | `test_13_Transfer_RevertOnFailingToken` | Vérifie la gestion d'erreur SafeERC20 sur un token dont les transferts échouent. |
| `test_14` | `test_14_Events_BatchExecutedEmission` | Vérifie l'émission de l'événement `BatchExecuted` avec les paramètres exacts. |

### 2.2. Tests de Sécurité (19 Cas)

| ID | Nom du Test | Description & Assertion |
| :--- | :--- | :--- |
| `test_15` | `test_15_Security_ReentrancyBlocked` | Un attaquant tentant de réentrer `executeBatchSell` lors de la réception des BNB est bloqué par `ReentrancyGuard`. |
| `test_16` | `test_16_Security_UnauthorizedAdminCall` | Un utilisateur non-propriétaire ne peut pas modifier la whitelist, mettre en pause ou activer fourMeme. |
| `test_17` | `test_17_Security_MaliciousRouterRejected` | Une tentative d'appel vers un contrat tiers malveillant est immédiatement rejetée. |
| `test_18` | `test_18_Security_RecipientIsolation` | Empêche tout détournement : les fonds sont strictement isolés et acheminés au destinataire validé. |
| `test_19` | `test_19_Security_IndividualSlippageProtectsAgainstCrossSubsidization` | Prouve qu'un gain anormal sur le token A ne peut pas masquer une perte par slippage sur le token B. |
| `test_20` | `test_20_Security_NonStandardERC20_USDTStyle` | Prise en charge éprouvée des tokens ne renvoyant pas de valeur booléenne (ex: USDT pattern) via `SafeERC20`. |
| `test_21` | `test_21_Security_BnbTransferFailureReverts` | Si un contrat destinataire refuse le transfert natif de BNB, la transaction complète revert en sécurité. |
| `test_22` | `test_22_Security_ZeroAllowanceRevert` | Blocage systématique si l'allowance est nulle. |
| `test_23` | `test_23_Security_BatchSizeExceeded` | Rejet avec `BatchSizeExceeded` au-delà de la limite de sécurité `MAX_BATCH_SIZE = 25`. |
| `test_24` | `test_24_Security_ArbitraryTransferBlocked` | Impossibilité pour un utilisateur de liquider les tokens d'un tiers sans son accord direct. |
| `test_25` | `test_25_Security_UserIsolation` | Prouve que les autorisations accordées par Bob ne peuvent en aucun cas être exploitées lors d'un batch d'Alice. |
| `test_26` | `test_26_Security_ZeroResidualContractBalance` | **Invariant de conservation absolue** : Le contrat `BatchSellExecutor` conserve strictement 0 BNB et 0 token résiduel. |
| `test_27` | `test_27_Security_FeeOnTransferTokenHandledCorrectly` | Mesure du solde réel pour les tokens à taxe de transfert (`actualTokensReceived`), prévenant les échecs de swap. |
| `test_28` | `test_28_Security_DirectBnbDepositReverts` | Rejet strict des envois directs de BNB via `receive()` en dehors de l'exécution d'un swap (`DirectBnbDepositNotAllowed`). |
| `test_29` | `test_29_Security_FourMemeDisabledRevert` | Vérifie le revert `FourMemeExecutionDisabled` lorsque le flag `allowFourMemeExecution` est à false en production. |
| `test_30` | `test_30_Security_EmptyBatchRevert` | Rejet systématique avec `EmptyBatch` si un tableau vide est transmis. |
| `test_31` | `test_31_Security_DeadlineExpiredRevert` | Rejet avec `DeadlineExpired` si la deadline passée en paramètre est déjà écoulée. |
| `test_32` | `test_32_Security_ZeroAmountRevert` | Rejet avec `ZeroAmountProvided` si le montant d'un ordre dans le batch est nul. |
| `test_33` | `test_33_Security_PreExistingContractBalancePreserved` | Vérifie que les BNB natifs préexistants dans le contrat ne sont pas siphonnés ni mélangés avec le swap courant. |

---

## 3. CONTRATS MOCKS IMPLÉMENTÉS

Les contrats mocks utilisés sont situés dans `contracts/test/BatchSellExecutor.t.sol` :
- `MockERC20` : Implémentation standard avec décimales et contrôle d'allowance.
- `MockFailingERC20` : Simule un token défaillant renvoyant `false` lors des transferts.
- `MockNonStandardERC20` : Simule un token ne retournant pas de booléen (style USDT).
- `MockFeeOnTransferERC20` : Simule un token appliquant une taxe de transfert (ex: 5%) avec diminution du montant effectif reçu.
- `MockFourMemeRouter` : Simule la fonction de vente de courbe `sellToken(address,uint256,uint256)`.
- `MockPancakeRouter` : Simule le routeur PancakeSwap V2 `swapExactTokensForETHSupportingFeeOnTransferTokens`.
- `MockRejectingRecipient` : Contrat sans fonction `receive()`, refusant tout BNB natif.
- `MockReentrantAttacker` : Tente de réentrer le contrat exécuteur lors du rappel de réception de BNB.
