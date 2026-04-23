# RemiSave - Complete Setup & Running Guide

## Prerequisites

1. **Rust & Cargo** - For smart contracts
2. **Node.js & npm/pnpm** - For frontend
3. **Freighter Wallet** - Browser extension for signing transactions
4. **Stellar CLI** - For contract deployment
5. **Git** - For version control

## Quick Start

### 1. Deploy Smart Contracts

```bash
# From project root
make full-reset
```

This will:
- Build token and vault contracts
- Deploy to Stellar testnet
- Initialize vault
- Mint test tokens to users
- Output contract IDs to `.env`

### 2. Start Frontend

```bash
# From project root
cd remisave-frontend

# Install dependencies
npm install
# or
pnpm install

# Copy environment variables (already done via make full-reset)
# Edit .env.local if needed

# Start dev server
npm run dev
```

Frontend will be at: `http://localhost:3000`

### 3. Connect & Test

1. **Open Dashboard**
   - Go to http://localhost:3000
   - Click "Connect Freighter"

2. **Approve Connection**
   - Freighter will request permission
   - Approve connection to dashboard

3. **Deposit Tokens**
   - Enter amount (e.g., 100 rUSDC)
   - Click "Deposit Now"
   - Sign transactions in Freighter
   - Watch your shares increase

4. **Withdraw Tokens**
   - Click "Withdraw" in your position card
   - Confirm and sign
   - Receive tokens back

## Project Structure

```
remisave/
├── contracts/
│   ├── token/          # Token contract (rUSDC)
│   │   └── src/
│   │       ├── contract.rs
│   │       ├── lib.rs
│   │       └── test.rs
│   └── vault/          # Yield vault contract
│       └── src/
│           └── lib.rs
├── remisave-frontend/  # Next.js dashboard
│   ├── app/
│   │   ├── components/     # React components
│   │   ├── contexts/       # WalletContext, VaultContext
│   │   ├── dashboard/      # Dashboard page
│   │   └── layout.tsx
│   ├── hooks/              # useDepositVault, useWithdrawVault
│   ├── lib/
│   │   ├── contract-wrapper.ts  # Contract interaction
│   │   ├── stellar-rpc.ts       # Stellar RPC config
│   │   ├── config.ts            # App configuration
│   │   └── utils.ts             # Helper functions
│   └── .env.local          # Environment variables
├── Makefile            # Build & deployment scripts
└── .env                # Stellar addresses
```

## Environment Variables

Located in `/remisave-frontend/.env.local`:

```bash
NEXT_PUBLIC_VAULT_CONTRACT_ID=CB75...
NEXT_PUBLIC_TOKEN_CONTRACT_ID=CAO...
NEXT_PUBLIC_ADMIN_ADDRESS=GAT...
NEXT_PUBLIC_USER_A_ADDRESS=GDA...
NEXT_PUBLIC_USER_B_ADDRESS=GBM...
NEXT_PUBLIC_USER_C_ADDRESS=GA7...
NEXT_PUBLIC_USER_D_ADDRESS=GCG...
```

## Key Components & Flows

### Wallet Connection Flow
```
Browser → Freighter Extension → Stellar Testnet
   ↓
WalletContext stores publicKey
   ↓
VaultContext fetches vault data
   ↓
Dashboard displays data
```

### Deposit Flow
```
User enters amount
   ↓
Form validates input
   ↓
buildApprovalTransaction() creates TX
   ↓
signTransaction() (Freighter signs)
   ↓
submitTransaction() sends to network
   ↓
buildDepositTransaction() creates TX
   ↓
signTransaction() (Freighter signs)
   ↓
submitTransaction() sends to network
   ↓
refreshVaultState() + refreshUserPosition()
   ↓
UI updates with new shares
```

### Withdraw Flow
```
User clicks Withdraw
   ↓
buildWithdrawalTransaction() creates TX
   ↓
signTransaction() (Freighter signs)
   ↓
submitTransaction() sends to network
   ↓
refreshVaultState() + refreshUserPosition()
   ↓
UI updates with new balance
```

## Useful Commands

```bash
# Run tests
cargo test -p remisave-token
cargo test -p remisave-vault

# Build contracts
stellar contract build

# Deploy to testnet
make full-reset

# Mint more test tokens
make mint-test

# Check deployed contracts
stellar contract invoke --id <CONTRACT_ID> -- get_tvl

# View contract on Stellar Expert
# https://stellar.expert/explorer/testnet/contract/CB75...

# View transactions
# https://stellar.expert/explorer/testnet/tx/<TX_HASH>
```

## Troubleshooting

### 1. "Freighter wallet not detected"
- Install Freighter from https://freighter.app
- Refresh the page
- Make sure extension is enabled

### 2. "Connect failed / permission denied"
- Unlock Freighter wallet
- Try connecting again
- Check that Freighter network is set to testnet

### 3. "Contract ID not configured"
- Run `make full-reset` to deploy contracts
- Check `.env` file has the deployed IDs
- Restart frontend dev server

### 4. "Insufficient balance"
- Run `make mint-test` to get more tokens
- Make sure you have rUSDC (token contract) balance

### 5. "Transaction failed / timeout"
- Check Stellar testnet status
- Verify contract is deployed: https://stellar.expert
- Check Soroban RPC endpoint
- Try again (testnet can be slow)

### 6. "No data loading"
- Wait a moment (first load takes time)
- Check browser console for errors
- Verify `.env.local` has correct contract IDs
- Try hard refresh (Ctrl+Shift+R)

## Development Tips

### Testing Contract Interactions
1. Use Freighter with testnet
2. Connect different wallet addresses
3. Deposit/withdraw to test flows
4. Check Stellar Expert for transaction details

### Debugging
1. Open browser DevTools (F12)
2. Check Console tab for errors
3. Check Network tab for API calls
4. Look for contract event logs

### Adding Features
1. Edit components in `/app/components/`
2. Use hooks: `useWallet()`, `useVault()`, `useDepositVault()`
3. Add new contract methods to `lib/contract-wrapper.ts`
4. Test in browser with Freighter

## Network Information

- **Network**: Stellar Testnet
- **Chain ID**: SDF Testnet Generic
- **Horizon URL**: https://horizon-testnet.stellar.org
- **Soroban RPC**: https://soroban-testnet.stellar.org
- **Explorer**: https://stellar.expert/explorer/testnet
- **Faucet**: https://developers.stellar.org/docs/testnet

## Important Notes

1. **Testnet Only** - This is for testing only, never use real funds
2. **Test Keys** - All keys are test keys, don't use in production
3. **Network Delays** - Testnet can be slow, transactions may take a few seconds
4. **Fund Wallet** - Use the Stellar faucet to fund test accounts
5. **Smart Contract Risk** - These are test contracts, may have bugs

## Next Steps

1. ✅ Deploy contracts (`make full-reset`)
2. ✅ Start frontend (`npm run dev`)
3. ✅ Connect wallet (Freighter)
4. ✅ Test deposit/withdraw flows
5. ? Add more features (harvest, strategies, etc.)
6. ? Deploy to production testnet
7. ? Audit smart contracts
8. ? Deploy to mainnet

## Support & Resources

- **Stellar Docs**: https://developers.stellar.org
- **Soroban Guide**: https://soroban.stellar.org
- **JS SDK**: https://js.stellar.org
- **GitHub Issues**: Check project issues
- **Community**: Stellar Dev Discord

---

**Happy testing! 🚀**
