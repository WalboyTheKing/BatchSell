# 06. Script Vidéo de Démonstration (2 Minutes Chronométrées)

Ce document fournit le script complet pour enregistrer la vidéo de démonstration de 2 minutes (120 secondes).

---

### Consignes de Sécurité Strictes pour l'Enregistrement
1. **Réseau Exclusif** : Utiliser impérativement **BNB Smart Chain Testnet (Chain ID: 97)** avec des tBNB de test provenant du faucet officiel.
2. **Aucune Clé Privée ni Seed Phrase** : Ne jamais afficher d'écran de création de wallet, de fichier `.env`, de console contenant des clés privées ou de phrase de récupération.
3. **Zéro Fond Réel** : Utiliser un compte de démonstration dédié sans aucun actif mainnet.

---

## Déroulé Séquencé & Script Bilingue

### Séquence 1 (00:00 - 00:20) : Introduction & Définition du Problème

* **Action à l'écran** : Vue d'accueil de BatchSell sur fond sombre, affichage du logo, du slogan et de l'indicateur "BNB Testnet".
* **Timing** : 20 secondes

| Colonne Anglais (Simple) | Prononciation Approximative (Guide Francophone) | Traduction Française |
| :--- | :--- | :--- |
| "Hello BNB Chain community! Selling multiple tokens in Web3 is slow and painful. Traders and AI agents must sign approval after approval, transaction after transaction. BatchSell solves this." | *Hè-lo B-N-B Tchéïne co-miou-ni-ti ! Sè-ling meul-ti-peul to-keunz ine Oueb-sri iz slo end péïne-foule. Tré-deurz end èï-aï éï-djeunts meust saïne ap-prou-veul af-teur ap-prou-veul, trann-zak-cheun af-teur trann-zak-cheun. Batech-Sèl solveuce diz.* | "Bonjour à la communauté BNB Chain ! Vendre plusieurs tokens dans le Web3 est lent et pénible. Les traders et agents d'IA doivent signer approbation après approbation, transaction après transaction. BatchSell résout ce problème." |

---

### Séquence 2 (00:20 - 00:45) : Connexion Wallet Testnet & Découverte des Soldes

* **Action à l'écran** : Clic sur le bouton de connexion du wallet. Sélection de "Connecter Wallet Agentique (Simulé / EIP-1193)". Le dashboard s'affiche immédiatement avec le badge vert "BSC Testnet (Chain ID 97)" et les soldes de tokens testnet.
* **Timing** : 25 secondes

| Colonne Anglais (Simple) | Prononciation Approximative (Guide Francophone) | Traduction Française |
| :--- | :--- | :--- |
| "Here we connect on BNB Chain Testnet. BatchSell reads the wallet balances in real time. It checks existing token approvals so we never submit redundant approval transactions." | *Hi-eur oui co-nèkte on B-N-B Tchéïne Tèste-nète. Batech-Sèl ride-ze ze ouo-lète ba-lann-size ine ri-eul taïme. It tchékse èg-zis-ting to-keun ap-prou-veulz so oui nè-veur seub-mite ri-deun-dante ap-prou-veul trann-zak-cheunz.* | "Ici, nous nous connectons sur le Testnet BNB Chain. BatchSell lit les soldes du portefeuille en temps réel. Il vérifie les approbations de tokens existantes pour ne jamais soumettre de transactions d'approbation redondantes." |

---

### Séquence 3 (00:45 - 01:15) : Sélection, Politique d'Allowance Stricte & Simulation

* **Action à l'écran** : L'utilisateur coche 2 tokens. Il clique sur "Passer au Batch Builder". L'interface affiche le mode d'approbation "Montant Exact Strict" (pas d'approbation infinie). Clic sur "Lancer la Simulation Pré-Vol". Les jauges de contrôle deviennent vertes.
* **Timing** : 30 secondes

| Colonne Anglais (Simple) | Prononciation Approximative (Guide Francophone) | Traduction Française |
| :--- | :--- | :--- |
| "We select two tokens to sell. For safety, BatchSell uses strict exact-amount approvals instead of dangerous infinite allowances. Before sending, our dry-run simulation validates solvency, gas fees, and individual slippage bounds." | *Oui sé-lèkte tou to-keunz tou sèl. For sèf-ti, Batech-Sèl you-zize strikte èg-zakte-a-maounte ap-prou-veulz ine-stèd ov déïn-djeu-reusse ine-fi-naïte a-laou-enn-size. Bi-for senn-ding, a-oeur draï-reune si-miou-léï-cheun va-li-dèïtse sol-veun-si, gasse fize, end ine-di-vi-diou-eul sli-pidje ba-oundze.* | "Nous sélectionnons deux tokens à vendre. Par sécurité, BatchSell utilise des approbations strictes au montant exact plutôt que des autorisations infinies dangereuses. Avant l'envoi, notre simulation à blanc valide la solvabilité, les frais de gas et les limites de slippage individuelles." |

---

### Séquence 4 (01:15 - 01:45) : Exécution Atomique & Reçu Vérifiable

* **Action à l'écran** : Clic sur "Exécuter le Batch Atomique". Une animation d'exécution fluide se produit pendant la confirmation du bloc. L'onglet bascule sur "Reçus & Audit". Le hash de transaction apparaît avec le détail exact des BNB reçus et le statut "100% Non-Custodial".
* **Timing** : 30 secondes

| Colonne Anglais (Simple) | Prononciation Approximative (Guide Francophone) | Traduction Française |
| :--- | :--- | :--- |
| "Now we execute. Our atomic smart contract processes all sales in one single execution transaction. If one token fails its slippage limit, everything reverts safely. Zero tokens lost, and one hundred percent of BNB goes directly to the user." | *Naou oui èg-zé-kioute. A-oeur a-to-mik smarte con-trakte pro-sè-size ol sèïlz ine ouane sing-gueul èg-zé-kiou-cheun trann-zak-cheun. If ouane to-keun fèïlz its sli-pidje li-mite, èv-ri-sing ri-veurtse sèf-li. Zi-ro to-keunz loste, end ouane heun-drèd peur-sènte ov B-N-B goze daï-rèkt-li tou ze you-zeur.* | "Maintenant, nous exécutons. Notre smart contract atomique traite toutes les ventes en une seule transaction d'exécution. Si un token échoue à sa limite de slippage, tout est annulé en sécurité. Zéro token perdu, et cent pour cent des BNB vont directement à l'utilisateur." |

---

### Séquence 5 (01:45 - 02:00) : Conclusion, Open Source & Prochaines Étapes

* **Action à l'écran** : Affichage de l'onglet Documentation / Tests (26/26 tests passés en vert) et affichage du lien vers le dépôt GitHub.
* **Timing** : 15 secondes

| Colonne Anglais (Simple) | Prononciation Approximative (Guide Francophone) | Traduction Française |
| :--- | :--- | :--- |
| "BatchSell has twenty-six verified integration tests, clean non-custodial smart contracts, and full open-source code on GitHub. Thank you for your support, and see you on BNB Chain!" | *Batech-Sèl haz touèn-ti-sikse vé-ri-faïde ine-té-gréï-cheun tèstse, cline none-keus-to-di-eul smarte con-traktse, end foule o-peune-sourse code on Guite-heub. Sank you for yor seu-porte, end si you on B-N-B Tchéïne !* | "BatchSell dispose de vingt-six tests d'intégration vérifiés, de smart contracts non-custodiaux propres et d'un code entièrement open source sur GitHub. Merci pour votre soutien et à bientôt sur BNB Chain !" |

---

### Checklist Pré-Enregistrement Vidéo
- [ ] Résolution d'écran réglée sur 1080p (1920x1080) à 30 ou 60 fps.
- [ ] Microphone réglé avec filtre anti-bruit pour une voix claire et audible.
- [ ] Navigateur en mode plein écran sans onglets personnels ou extensions visibles.
- [ ] Chaîne BNB Testnet sélectionnée par défaut.
- [ ] Chronomètre visible à côté pour respecter impérativement la durée maximale de 2 minutes (120 secondes).
