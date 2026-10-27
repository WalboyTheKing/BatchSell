# POLITIQUE ET AUDIT DE SÉCURITÉ : BATCHSELL

## 1. MENACES IDENTIFIÉES ET MESURES DE PROTECTION

### 1.1. Tokens Malveillants & Honeypots
- **Menace :** Des créateurs de faux tokens créent des contrats ERC-20 où les fonctions de transfert ou de vente sont bloquées (honeypots), ou appliquent une taxe de vente de 99%.
- **Protection BatchSell :**
  - Audit pré-vol (simulation de vente) avec calcul effectif du delta de BNB reçu.
  - Détection automatique des taxes de vente supérieures à 10%.
  - Alerte visuelle immédiate et blocage du token dans le batch si une condition de revert est détectée.
  - Badge de vérification : Seuls les tokens indexés avec liquidité prouvée ou vérifiés manuellement peuvent être inclus sans avertissement renforcé.

### 1.2. Contrats de Trading Falsifiés (Phishing / Fake Routers)
- **Menace :** Tentative d'injection d'une fausse adresse de contrat de trading détournant les fonds des utilisateurs.
- **Protection BatchSell :**
  - Liste blanche stricte et immuable dans le contrat `BatchSellExecutor` des routeurs et contrats de bonding curve autorisés (`fourMeme` officiel et `PancakeSwap Router`).
  - Toute opération ciblant une adresse hors de la whitelist est rejetée au niveau du smart contract (`InvalidRouterTarget`).

### 1.3. Autorisations Excessives (Infinite Approvals)
- **Menace :** Accorder une approbation `uint256.max` expose l'utilisateur à un drain ultérieur si le protocole ou le contrat intermédiaire est compromis.
- **Protection BatchSell :**
  - Politique de montants stricts par défaut : L'approbation proposée correspond exactement au montant de tokens mis en vente (`exact amount`).
  - Bouton de révocation d'allowance intégré directement dans l'interface post-exécution.

### 1.4. Slippage et Front-Running (Attaques Sandwich / MEV)
- **Menace :** Les transactions de vente sur les bonding curves et AMMs de memecoins sont vulnérables aux bots MEV observant le mempool BSC.
- **Protection BatchSell :**
  - Seuil de slippage paramétrable par l'utilisateur (défaut : 2.0%, max configurable : 10.0%).
  - Le contrat `BatchSellExecutor` applique deux niveaux de vérification :
    1. Slippage individuel par token (`minBnbExpected`).
    2. Slippage global agrégé sur le lot total (`minTotalBnbOut`). Si le marché bouge défavorablement, la transaction complète revert avant de subir une perte anormale.

### 1.5. Atomicité et Échecs Partiels
- **Menace :** Dans un batch séquentiel, si le token 1 est vendu mais le token 2 échoue, l'utilisateur se retrouve dans un état incomplet avec des frais de gas dépensés en pure perte.
- **Protection BatchSell :**
  - Le mode Atomic Batch assure que soit 100% des ventes sélectionnées réussissent et rapportent au moins le montant minimum convenu, soit la transaction est annulée en totalité sans modification des soldes.
  - Mode séquentiel réservé uniquement aux utilisateurs souhaitant délibérément isoler les ventes avec gestion d'erreur au cas par cas.

### 1.6. Confidentialité des Clés Privées
- **Engagement absolu :** BatchSell est une application 100% côté client et non-custodiale.
- **Zéro clé privée :** L'application ne demande, ne stocke et ne transmet jamais de clé privée ou de phrase de récupération (seed phrase). Toutes les signatures transitent obligatoirement par le fournisseur EIP-1193 standard du wallet de l'utilisateur.

---

## 2. MATRICE DE RISQUES ET CONTRÔLES

| Risque | Gravité | Probabilité | Mesure de mitigation | Statut |
| :--- | :--- | :--- | :--- | :--- |
| Honeypot token bloquant le batch | Haute | Moyenne | Simulation préalable `eth_call` + exclusion préventive | Implémenté |
| Reentrancy sur l'exécuteur de batch | Critique | Faible | `ReentrancyGuard` sur toutes les fonctions d'exécution | Implémenté |
| Vol de fonds résiduels dans l'exécuteur | Critique | Très faible | Contrat sans stockage de fonds : balance renvoyée en totalité à `msg.sender` | Implémenté |
| Écart de prix entre simulation et signature | Moyenne | Haute | Contrôle strict du slippage + deadline d'expiration | Implémenté |
| Approbation d'un contrat tiers frauduleux | Critique | Faible | Adresses de contrats figées et validées par signature | Implémenté |
