# GUIDE DE DÉPLOIEMENT : BATCHSELL

## 1. PARAMÈTRES DU CONSTRUCTEUR

Le contrat `BatchSellExecutor` requiert 4 arguments lors de son initialisation :
```solidity
constructor(
    address _initialOwner,
    address _fourMemeRouter,
    address _pancakeRouter,
    bool _enableFourMeme
)
```

1. `_initialOwner` : Adresse de l'administrateur (gestion de la pause d'urgence et whitelist des routeurs).
2. `_fourMemeRouter` : Adresse du contrat officiel de bonding curve FourMeme.
3. `_pancakeRouter` : Adresse du routeur PancakeSwap V2 (`PancakeRouter02`).
4. `_enableFourMeme` : Booléen (`false` recommandé sur Mainnet tant que l'interface officielle fourMeme n'a pas été formellement validée on-chain).

---

## 2. ADRESSES CONFIGURÉES

### BNB Smart Chain (BSC Mainnet - Chain ID: 56)
- **PancakeSwap V2 Router** : `0x10ED43C718714eb63d5aA57B78B54704E256024E` (Vérifié sur BSCScan)
- **WBNB** : `0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c` (Vérifié sur BSCScan)
- **FourMeme Router** : `0x5c952063c7fc8610FFDB798152D69F0B9550762b` (`UNVERIFIED` - soumis à l'interrupteur `allowFourMemeExecution`)
- **BatchSellExecutor** : À déployer via la commande ci-dessous.

### BNB Smart Chain Testnet (BSC Testnet - Chain ID: 97)
- **PancakeSwap V2 Router** : `0xD99D1c33F9fC3444f8101754aBC46c52416550D1`
- **WBNB** : `0xae13d989daC2f0dEbFf460aC112a837C89BAa7cd`
- **BatchSellExecutor** : `0x70997970C51812dc3A010C7d01b50e0d17dc79C8`

---

## 3. COMMANDES DE DÉPLOIEMENT FOUNDRY

### Déploiement sur BSC Testnet
```bash
forge create contracts/src/BatchSellExecutor.sol:BatchSellExecutor \
  --rpc-url https://data-seed-prebsc-1-s1.binance.org:8545 \
  --private-key $DEPLOYER_PRIVATE_KEY \
  --constructor-args \
    $ADMIN_ADDRESS \
    0x2514897e0F1b05F999D59E71F4259b3B15a81617 \
    0xD99D1c33F9fC3444f8101754aBC46c52416550D1 \
    true \
  --verify \
  --etherscan-api-key $BSCSCAN_API_KEY
```

### Déploiement sur BSC Mainnet
```bash
forge create contracts/src/BatchSellExecutor.sol:BatchSellExecutor \
  --rpc-url https://binance.llamarpc.com \
  --private-key $DEPLOYER_PRIVATE_KEY \
  --constructor-args \
    $ADMIN_ADDRESS \
    0x5c952063c7fc8610FFDB798152D69F0B9550762b \
    0x10ED43C718714eb63d5aA57B78B54704E256024E \
    false \
  --verify \
  --etherscan-api-key $BSCSCAN_API_KEY
```

---

## 4. CHECKLIST AVANT MISE EN PRODUCTION (FONDS RÉELS)

1. **Aucun secret dans le code** : Vérifier que `.env` n'est pas commité.
2. **Audit indépendant** : Ne pas présenter le contrat comme audité par un tiers externe sans rapport officiel d'un cabinet de sécurité Web3.
3. **Validation de l'adresse fourMeme** : Confirmer l'adresse et l'ABI de fourMeme sur le réseau de production avant d'activer `setFourMemeExecution(true)`.
4. **Test préalable sur Testnet** : Réaliser au moins 3 batchs réels sur Testnet avec des tokens testnet.
