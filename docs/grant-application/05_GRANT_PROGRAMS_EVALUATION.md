# 05. Évaluation des Programmes de Financement & Éligibilité

Ce document passe en revue les programmes de subvention et d'accélération pertinents au sein de l'écosystème **BNB Chain**, avec vérification de leurs liens officiels, critères d'éligibilité et statut opérationnel.

---

## 1. Programmes Officiels de l'Écosystème BNB Chain

### 1.1. BNB Chain Builder Grants
* **Organisme** : BNB Chain Core Development & Ecosystem Fund
* **Portail officiel vérifié** : [https://www.bnbchain.org/en/developers/developer-programs](https://www.bnbchain.org/en/developers/developer-programs)
* **Objectif** : Soutenir les projets open source d'infrastructure, de DeFi et d'outillage développeur apportant une utilité directe au réseau BNB Chain.
* **Critères d'éligibilité identifiés** :
  - Déploiement natif ou exclusif sur BNB Smart Chain (ou opBNB).
  - Code source public sous licence open source reconnue (MIT, Apache 2.0).
  - Présence d'un prototype fonctionnel ou MVP testable sur testnet.
  - Absence de modèle économique abusif ou extraction de valeur unilatérale.
* **Statut actuel** : **Programme récurrent par vagues.** Les candidatures s'effectuent via le formulaire officiel disponible sur le portail développeur de BNB Chain.  
  *Note de prudence : Les fenêtres de dépôt et délais d'instruction varient d'un trimestre à l'autre ; le statut d'ouverture exact doit être confirmé directement sur le portail avant la soumission définitive.*

---

### 1.2. Most Valuable Builder (MVB) Accelerator Program
* **Organisme** : BNB Chain en partenariat avec Binance Labs et CMC Labs
* **Portail officiel vérifié** : [https://www.bnbchain.org/en/developers/developer-programs/mvb](https://www.bnbchain.org/en/developers/developer-programs/mvb)
* **Objectif** : Programme d'incubation intensif de 4 à 8 semaines ciblant les projets à fort potentiel de croissance (DeFi, AI x Web3, infrastructure).
* **Critères d'éligibilité identifiés** :
  - Équipe dédiée disposant d'une expertise technique démontrée.
  - Proposition de valeur alignée avec les priorités stratégiques de BNB Chain (notamment les cas d'usage couplant IA et transactions on-chain).
  - Capacité à déployer sur le mainnet et à générer de l'engagement utilisateur.
* **Statut actuel** : **Saisonnier (cohortes successives).** Les dates limites de candidature sont fixées par saison (par exemple MVB Saison 8 / 9). Il convient de vérifier le calendrier de la cohorte active au moment du dépôt.

---

### 1.3. BNB Chain Gas Grant Program
* **Organisme** : BNB Chain Foundation
* **Portail officiel vérifié** : [https://www.bnbchain.org/en/developers/developer-programs/gas-grant](https://www.bnbchain.org/en/developers/developer-programs/gas-grant)
* **Objectif** : Remboursement partiel des frais de gas pour les utilisateurs et contrats générant un volume de transactions substantiel sur BSC.
* **Pertinence pour BatchSell** :
  - Programme subsidiaire intervenant **post-déploiement mainnet**.
  - Permet de subventionner le gas des premiers utilisateurs exécutant des batches atomiques.

---

## 2. Recommandations Pratiques pour le Dépôt

1. **Ne jamais présumer d'un statut ouvert sans vérification le jour J** : Les formulaires de subvention changent fréquemment d'URL ou de plateforme (Typeform, Formcraft, portail interne BNB Chain). Toujours vérifier l'accessibilité du formulaire depuis le domaine racine `bnbchain.org`.
2. **Priorité recommandée pour BatchSell** :
   - Déposer en priorité une candidature au format **Builder Grant** pour financer le jalon d'audit de sécurité et l'infrastructure de testnet.
   - Préparer en parallèle le dossier de candidature pour la prochaine cohorte **MVB (Most Valuable Builder)** dans la catégorie *AI & Infrastructure*.
3. **Documents à joindre impérativement** :
   - Lien vers le dépôt GitHub public vérifié (`github.com/WalboyTheKing/BatchSell`).
   - Lien vers la vidéo de démonstration de 2 minutes sur BSC Testnet.
   - Document de revue technique interne (`02_TECHNICAL_ARCHITECTURE_AND_SECURITY.md`).
   - Rapport des tests unitaires et protocole de benchmark (`03_TESTING_AND_BENCHMARKS.md`).
