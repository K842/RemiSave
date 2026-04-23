# RemiSave Frontend - Quick Reference & Verification

## ✅ Verification Checklist

### 1. Environment Setup
- [ ] `.env.local` file exists in `remisave-frontend/`
- [ ] `NEXT_PUBLIC_VAULT_CONTRACT_ID` is set
- [ ] `NEXT_PUBLIC_TOKEN_CONTRACT_ID` is set
- [ ] Vault and Token contract IDs match deployed contracts

### 2. Dependencies
- [ ] `npm install` completed in `remisave-frontend/`
- [ ] All dependencies resolve without errors
- [ ] Node modules exist and are complete

### 3. Development Server
- [ ] `npm run dev` starts successfully
- [ ] Server runs on `http://localhost:3000`
- [ ] No build errors in console
- [ ] Hot reload working (edit and save a file)

### 4. Freighter Integration
- [ ] Freighter extension installed and enabled
- [ ] Set to Stellar testnet network
- [ ] Test account funded with testnet XLM

### 5. Frontend Components
- [ ] Dashboard header displays "RemiSave"
- [ ] "Connect Freighter" button visible
- [ ] Vault stats section renders without errors
- [ ] Deposit form displays correctly
- [ ] User position card shows placeholder text

### 6. Wallet Connection
- [ ] Click "Connect Freighter" → Freighter prompts
- [ ] Approve connection in Freighter popup
- [ ] Wallet address displays in header (truncated)
- [ ] Button changes to "Disconnect"

### 7. Data Loading
- [ ] Vault stats show loading skeletons initially
- [ ] After ~2 seconds, stats display values
- [ ] "Total Value Locked" shows a number
- [ ] "Yield Rate" shows percentage
- [ ] "Total Shares" shows number
- [ ] "Status" shows "Active" or "Paused"

### 8. User Position
- [ ] After wallet connects, position card updates
- [ ] If user has tokens: shows shares and deposit amount
- [ ] If user has no tokens: shows "No deposits yet"
- [ ] Position value calculated correctly

### 9. Deposit Flow
- [ ] Enter amount in deposit form (e.g., 10.5)
- [ ] Amount validates and is accepted
- [ ] Click "Deposit Now"
- [ ] Freighter prompts for approval signature
- [ ] Approve in Freighter → TX submitted
- [ ] Freighter prompts for deposit signature
- [ ] Approve in Freighter → TX submitted
- [ ] Wait for confirmation (2-5 seconds on testnet)
- [ ] "Deposit completed successfully!" message appears
- [ ] Shares amount in position card increases

### 10. Withdraw Flow
- [ ] User position shows shares
- [ ] Click "Withdraw" button
- [ ] Button changes to "Confirm Withdraw"
- [ ] Freighter prompts for withdrawal signature
- [ ] Approve in Freighter → TX submitted
- [ ] Wait for confirmation
- [ ] Shares amount decreases
- [ ] Wallet receives tokens back

## 🔍 Debugging Commands

### Check Environment Variables
```bash
cd remisave-frontend
cat .env.local
```

### Check Contract Deployment
```bash
# From project root
cat .env
```

### View Contract on Explorer
```
https://stellar.expert/explorer/testnet/contract/CB75PSYWLHAI5FQXR4WBFEGVL7HOGCQP37O2C5357LVQGL5ZUR2EOK77
```

### Check Recent Transactions
```
https://stellar.expert/explorer/testnet/transactions
```

### Browser Console
- Press F12 to open DevTools
- Go to Console tab
- Look for any error messages
- Search for "[RemiSave]" logged messages

### Network Tab
- Press F12 → Network tab
- Look for calls to `soroban-testnet.stellar.org`
- Check responses for errors

## 🐛 Common Issues & Fixes

### Issue: "Freighter wallet not detected"
**Fix:**
1. Install Freighter: https://freighter.app
2. Reload page
3. Check extension is enabled in browser

### Issue: Contract ID not configured
**Fix:**
1. Run: `make full-reset` from project root
2. Check `.env` file for contract IDs
3. Copy IDs to `.env.local`
4. Restart dev server

### Issue: Vault stats show zeros
**Fix:**
1. Wait 5-10 seconds (first load is slow)
2. Check contract IDs are correct
3. Check Soroban RPC is responsive:
   ```bash
   curl https://soroban-testnet.stellar.org
   ```
4. Hard refresh browser (Ctrl+Shift+R)

### Issue: Can't connect wallet
**Fix:**
1. Unlock Freighter wallet
2. Check network is set to testnet
3. Check public key is available
4. Try disconnect → reconnect

### Issue: Deposit transaction fails
**Fix:**
1. Check wallet has enough rUSDC balance
2. Run `make mint-test` to get more tokens
3. Wait a moment and retry
4. Check contract is deployed

### Issue: Transaction hangs/times out
**Fix:**
1. Close Freighter popup if still open
2. Check testnet status (can be slow)
3. Try again in a few moments
4. Refresh browser if needed

### Issue: UI not updating after transaction
**Fix:**
1. Wait 10 seconds (auto-refresh interval)
2. Manually refresh page
3. Check browser console for errors
4. Verify transaction was actually submitted

## 📋 File Locations Reference

| Component | File |
|-----------|------|
| Dashboard Page | `app/dashboard/page.tsx` |
| Dashboard Header | `app/components/dashboard-header.tsx` |
| Vault Stats | `app/components/vault-stats.tsx` |
| Deposit Form | `app/components/deposit-form.tsx` |
| User Position | `app/components/user-position.tsx` |
| Wallet Context | `app/contexts/wallet-context.tsx` |
| Vault Context | `app/contexts/vault-context.tsx` |
| Vault Operations Hook | `hooks/use-vault-operations.ts` |
| Contract Wrapper | `lib/contract-wrapper.ts` |
| Stellar Config | `lib/stellar-rpc.ts` |
| App Config | `lib/config.ts` |
| Utilities | `lib/utils.ts` |
| Root Layout | `app/layout.tsx` |
| Environment | `.env.local` |

## 🔗 Important URLs

- **Local Frontend**: http://localhost:3000
- **Horizon API**: https://horizon-testnet.stellar.org
- **Soroban RPC**: https://soroban-testnet.stellar.org
- **Stellar Expert**: https://stellar.expert/explorer/testnet
- **Stellar Faucet**: https://developers.stellar.org/docs/testnet

## 📞 Support Resources

| Resource | URL |
|----------|-----|
| Stellar Docs | https://developers.stellar.org |
| Soroban Docs | https://soroban.stellar.org |
| JS SDK Docs | https://js.stellar.org |
| Freighter Docs | https://freighter.app/docs |
| Stellar Expert | https://stellar.expert |

## 🧠 Key Concepts

### Context Providers
- **WalletContext**: Manages wallet connection, stores publicKey
- **VaultContext**: Manages vault state, user position, auto-refresh

### Hooks
- **useWallet()**: Access wallet functions and state
- **useVault()**: Access vault data and refresh functions
- **useDepositVault()**: Handle deposit transactions
- **useWithdrawVault()**: Handle withdrawal transactions

### Contract Methods
- **getVaultState()**: Read vault TVL, rate, shares
- **getUserPosition()**: Read user shares and deposits
- **buildApprovalTransaction()**: Create token approval
- **buildDepositTransaction()**: Create deposit TX
- **buildWithdrawalTransaction()**: Create withdrawal TX
- **submitTransaction()**: Send TX to network

### Data Flow
1. User connects wallet (Freighter)
2. WalletContext stores publicKey
3. VaultContext fetches vault state
4. Components render with data
5. User submits transaction
6. Freighter signs transaction
7. Contract wrapper submits to network
8. VaultContext auto-refreshes data
9. Components update with new data

## ⚡ Performance Tips

1. **Reduce API Calls**: Use Context for state sharing
2. **Cache Data**: VaultContext refreshes every 10 seconds
3. **Lazy Load**: Components only fetch what they need
4. **Optimize Images**: Use proper formats and sizes
5. **Code Split**: Webpack handles automatically

## 🔐 Security Reminders

1. Never commit `.env.local` to git
2. All transactions signed by user's wallet
3. No private keys stored in frontend
4. Validate all user inputs
5. Use HTTPS in production
6. Keep Freighter updated

## 📈 Monitoring

### Check Contract Calls
- Open browser DevTools (F12)
- Go to Network tab
- Filter by "soroban"
- Check POST requests
- View response body

### Monitor Transactions
- Visit: https://stellar.expert/explorer/testnet
- Search by transaction hash
- Check status and details
- View contract events

### View User Position
- Connect wallet in UI
- Check User Position card
- Should show shares and deposits
- Value updates in real-time

## 🚀 Quick Start Commands

```bash
# Terminal 1: Deploy contracts
cd /path/to/remisave
make full-reset

# Terminal 2: Start frontend
cd remisave-frontend
npm install
npm run dev

# Browser: Test application
# Visit http://localhost:3000
# Click "Connect Freighter"
# Try deposit/withdraw flows
```

## ✨ You're All Set!

The frontend is fully integrated with the smart contracts. All wiring is complete and ready for testing. 

Next steps:
1. Run `make full-reset` to deploy contracts
2. Run `npm run dev` to start frontend
3. Connect Freighter wallet
4. Test deposit/withdraw flows
5. Monitor transactions on Stellar Expert

For detailed information, see:
- `INTEGRATION.md` - Full integration guide
- `FRONTEND_SETUP.md` - Complete setup guide
- `WIRING_SUMMARY.md` - Technical wiring details

Happy testing! 🎉
