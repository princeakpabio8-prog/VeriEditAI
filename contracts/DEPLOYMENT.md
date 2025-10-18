# TruthBadge Smart Contract Deployment Guide

## Prerequisites

1. **MetaMask wallet** with Shardeum Liberty Testnet configured
2. **Testnet SHM tokens** from https://faucet-liberty10.shardeum.org/
3. **Remix IDE** or Hardhat setup

---

## Option 1: Deploy with Remix IDE (Easiest)

### Step 1: Add Shardeum Liberty to MetaMask

1. Open MetaMask
2. Click Network dropdown → Add Network → Add Network Manually
3. Fill in:
   - **Network Name:** Shardeum Liberty Testnet
   - **RPC URL:** https://liberty10.shardeum.org/
   - **Chain ID:** 8081
   - **Currency Symbol:** SHM
   - **Block Explorer:** https://explorer-liberty10.shardeum.org

### Step 2: Get Testnet SHM

1. Visit https://faucet-liberty10.shardeum.org/
2. Enter your wallet address
3. Request testnet SHM (you'll need ~0.5 SHM for deployment)

### Step 3: Deploy Contract via Remix

1. Go to https://remix.ethereum.org/
2. Create new file `TruthBadge.sol`
3. Copy the contract code from `contracts/TruthBadge.sol`
4. Install OpenZeppelin:
   - Click "Plugin Manager" (plug icon)
   - Activate "OpenZeppelin Contracts"
   - Or manually add dependencies in Remix

5. **Compile:**
   - Select Solidity Compiler (left sidebar)
   - Choose compiler version: `0.8.20` or higher
   - Click "Compile TruthBadge.sol"

6. **Deploy:**
   - Select "Deploy & Run Transactions" (left sidebar)
   - Environment: `Injected Provider - MetaMask`
   - Ensure MetaMask is on Shardeum Liberty Testnet
   - Contract: `TruthBadge`
   - Click **Deploy**
   - Confirm transaction in MetaMask

7. **Copy Contract Address:**
   - After deployment, copy the contract address from Deployed Contracts
   - Example: `0x1234567890abcdef1234567890abcdef12345678`

---

## Option 2: Deploy with Hardhat

### Setup

```bash
npm install --save-dev hardhat @nomicfoundation/hardhat-toolbox
npx hardhat init
```

### Install OpenZeppelin

```bash
npm install @openzeppelin/contracts
```

### Configure Hardhat

Edit `hardhat.config.js`:

```javascript
require("@nomicfoundation/hardhat-toolbox");

module.exports = {
  solidity: "0.8.20",
  networks: {
    shardeumLiberty: {
      url: "https://liberty10.shardeum.org/",
      accounts: ["YOUR_PRIVATE_KEY"], // ⚠️ Never commit this!
      chainId: 8081
    }
  }
};
```

### Deploy Script

Create `scripts/deploy.js`:

```javascript
async function main() {
  const TruthBadge = await ethers.getContractFactory("TruthBadge");
  const truthBadge = await TruthBadge.deploy();
  await truthBadge.deployed();
  
  console.log("TruthBadge deployed to:", truthBadge.address);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
```

### Run Deployment

```bash
npx hardhat run scripts/deploy.js --network shardeumLiberty
```

---

## Post-Deployment

### 1. Verify Contract Address

Visit https://explorer-liberty10.shardeum.org/ and search for your contract address

### 2. Add Secrets to Supabase

You'll need to add 3 secrets:

1. **Contract Address:**
   ```
   TRUTH_BADGE_CONTRACT_ADDRESS=0xYourContractAddress
   ```

2. **Minting Wallet Private Key:**
   - Create a NEW wallet for backend minting
   - Fund it with testnet SHM (~1 SHM)
   - Export private key from MetaMask
   ```
   MINTING_WALLET_PRIVATE_KEY=0xYourPrivateKey
   ```

3. **NFT.Storage API Key:**
   - Sign up at https://nft.storage/
   - Create new API key
   ```
   NFT_STORAGE_API_KEY=your_api_key
   ```

### 3. Add Secrets via Lovable

The AI will help you add these secrets to Supabase using the secrets tool.

---

## Testing the Contract

### Using Remix

1. In Deployed Contracts, expand your TruthBadge
2. Test functions:
   - `totalSupply()` - should return 0 initially
   - `mintBadge()` - mint a test badge
   - `verificationMinted()` - check if verification is minted

### Using Hardhat Console

```bash
npx hardhat console --network shardeumLiberty
```

```javascript
const TruthBadge = await ethers.getContractFactory("TruthBadge");
const contract = TruthBadge.attach("YOUR_CONTRACT_ADDRESS");

// Check total supply
await contract.totalSupply();

// Mint a badge (as owner)
await contract.mintBadge(
  "0xRecipientAddress",
  "verification-uuid",
  85,
  "ipfs://QmYourMetadata"
);
```

---

## Security Notes

⚠️ **IMPORTANT:**
- NEVER commit private keys to git
- Use environment variables for sensitive data
- The minting wallet should be separate from your main wallet
- Keep ~1-2 SHM in the minting wallet for gas fees
- Monitor wallet balance and refill when low

---

## Troubleshooting

### "Insufficient funds for gas"
- Get more testnet SHM from faucet
- Check you're on correct network (Chain ID 8081)

### "Nonce too high"
- Reset MetaMask account: Settings → Advanced → Reset Account

### "Contract deployment failed"
- Verify compiler version matches (0.8.20+)
- Check OpenZeppelin dependencies are installed
- Ensure you have enough testnet SHM

---

## Next Steps

After deployment:
1. ✅ Add secrets to Supabase (contract address, private key, NFT.Storage key)
2. ✅ The edge function will be updated to use real minting
3. ✅ Test end-to-end flow: Verify → Mint → View in gallery
4. ✅ Check transaction on explorer

---

## Mainnet Migration (Future)

When Shardeum mainnet launches:
1. Deploy same contract to mainnet
2. Update `chain_id` in edge function from 8081 to mainnet chain ID
3. Fund mainnet wallet with real SHM
4. Consider implementing migration script for testnet badge holders
