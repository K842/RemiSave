# RemiSave Frontend Integration Guide

## Overview

The RemiSave frontend is a Next.js application that connects to the Stellar Soroban smart contracts deployed on testnet. It provides a user interface for interacting with the token and vault contracts.

## Setup Instructions

### 1. Environment Configuration

The frontend requires environment variables configured in `.env.local`:

```bash
# Contract IDs (must match deployed contracts)
NEXT_PUBLIC_VAULT_CONTRACT_ID=CB75PSYWLHAI5FQXR4WBFEGVL7HOGCQP37O2C5357LVQGL5ZUR2EOK77
NEXT_PUBLIC_TOKEN_CONTRACT_ID=CAOJETDKV6B2CK7LF7P2ZGGAM323BMDE4XAQZK6HDKFQUVOJDSGAI77Y

# Stellar Network Configuration (testnet)
NEXT_PUBLIC_STELLAR_NETWORK=testnet
NEXT_PUBLIC_STELLAR_HORIZON_URL=https://horizon-testnet.stellar.org
NEXT_PUBLIC_STELLAR_RPC_URL=https://soroban-testnet.stellar.org

# User addresses for testing
NEXT_PUBLIC_ADMIN_ADDRESS=GATG5EYNN3CFQF4ROHTYQF5W3PD6ZFYL52D7PYVWD3CL6WYMNJ2X7YNH
NEXT_PUBLIC_USER_A_ADDRESS=GDACJIUR7UKPIWMC7KAKVQZ4VU4Y6J66ZA43V2DYPRYIE5AW36ERCZBJ
NEXT_PUBLIC_USER_B_ADDRESS=GBMHCGDHT33TYHQBQAD2MGPZJUH4LRCTZIAWNPTICIR5Z5ZRPWY7OUP3
NEXT_PUBLIC_USER_C_ADDRESS=GA7Z4C2IDHZXDGWV52PQQHPH7HFODV3VNERO6OCRBMTP66L7YWFHROZC
NEXT_PUBLIC_USER_D_ADDRESS=GCGZKNOEMDB3Q4DDVOJ2AFOILUEBDKENXDRZIG367UE4AUOHM3
```

### 2. Install Dependencies

```bash
cd remisave-frontend
npm install
# or
pnpm install
```

### 3. Run Development Server

```bash
npm run dev
# or
pnpm dev
```

The application will be available at `http://localhost:3000`

## Architecture

### Contexts

#### WalletContext (`app/contexts/wallet-context.tsx`)
- Manages wallet connection via Freighter extension
- Provides `publicKey`, `isConnected`, `signTransaction`, `signMessage`
- Automatically detects Freighter on mount

#### VaultContext (`app/contexts/vault-context.tsx`)
- Manages vault state and user position
- Auto-refreshes data every 10 seconds
- Provides vault contract ID and token contract ID
- Handles transaction status tracking

### Hooks

#### useWallet
```typescript
const { publicKey, isConnected, connect, disconnect, signTransaction } = useWallet()
```

#### useVault
```typescript
const { 
  vaultState, 
  userPosition, 
  isLoading, 
  error, 
  txStatus,
  contractId,
  tokenContractId,
  refreshVaultState,
  refreshUserPosition
} = useVault()
```

#### useDepositVault
```typescript
const { deposit, isLoading, error } = useDepositVault()

// Deposit tokens
const txHash = await deposit(amount)
```

#### useWithdrawVault
```typescript
const { withdraw, isLoading, error } = useWithdrawVault()

// Withdraw tokens
const txHash = await withdraw(sharesAmount)
```

### Contract Wrapper (`lib/contract-wrapper.ts`)

Provides low-level functions for contract interaction:

- **getVaultState(contractId)** - Read vault state (TVL, rate, shares, etc.)
- **getUserPosition(contractId, userPublicKey)** - Read user's shares and deposits
- **getPricePerShare(contractId)** - Get current price per share
- **buildApprovalTransaction()** - Create token approval transaction
- **buildDepositTransaction()** - Create deposit transaction
- **buildWithdrawalTransaction()** - Create withdrawal transaction
- **submitTransaction()** - Submit signed transaction to network

### Components

#### DashboardHeader
- Displays wallet connection status
- Connect/Disconnect buttons
- Shows connected wallet address

#### VaultStats
- Displays total value locked (TVL)
- Shows yield rate (APY)
- Total shares in vault
- Vault status (Active/Paused)

#### DepositForm
- Input field for deposit amount
- Approval + Deposit flow
- Transaction status tracking
- Error handling

#### UserPosition
- Shows user's shares
- Displays total deposited amount
- Shows position value
- Withdraw button with confirmation

## User Flow

### 1. Connect Wallet
1. Click "Connect Freighter" button
2. Approve connection in Freighter extension
3. Wallet address displays in header

### 2. Deposit Tokens
1. Enter amount to deposit
2. Click "Deposit Now"
3. Approve token transfer (Freighter signs)
4. Confirm deposit transaction (Freighter signs)
5. Receive shares in vault

### 3. View Position
1. User position shows in sidebar
2. Displays shares owned and amount deposited
3. Shows total value of position

### 4. Withdraw Tokens
1. Click "Withdraw" button in user position card
2. Confirm withdrawal
3. Sign transaction in Freighter
4. Receive tokens back to wallet

## Development

### Adding New Contract Methods

1. Add method to `contract-wrapper.ts`:
```typescript
export async function myContractMethod(
  contractId: string,
  params: string
): Promise<any> {
  return callContractMethod(contractId, 'my_method', [
    nativeToScVal(params)
  ])
}
```

2. Use in components or hooks
3. Handle loading/error states

### Testing

1. Have test tokens in wallet (minted via `make mint-test`)
2. Connect wallet in UI
3. Try deposit/withdraw flows
4. Check contract events in Stellar Expert

## Troubleshooting

### Freighter Not Detected
- Install Freighter extension: https://freighter.app
- Ensure extension is enabled
- Refresh browser

### Transaction Fails
- Check wallet has enough balance
- Verify contract IDs in `.env.local`
- Check network is set to testnet
- Look at Horizon/Soroban logs

### Can't Connect Wallet
- Ensure Freighter is installed and unlocked
- Check network in Freighter matches testnet
- Try disconnecting and reconnecting

### No Data Displayed
- Check that contracts are deployed
- Verify contract IDs are correct
- Check Soroban RPC endpoint is accessible
- Check browser console for errors

## Contract Methods Used

### Token Contract
- `approve(from, spender, amount, expiration_ledger)` - Approve spending
- `balance(id)` - Get token balance
- `transfer(from, to, amount)` - Transfer tokens
- `transfer_from(spender, from, to, amount)` - Transfer on behalf
- `burn(from, amount)` - Burn tokens
- `decimals()` - Get token decimals (7)
- `name()` - Get token name
- `symbol()` - Get token symbol

### Vault Contract
- `initialize(admin, token_id, rate_bps)` - Initialize vault
- `deposit(from, amount)` - Deposit tokens
- `withdraw(from, shares)` - Withdraw by shares
- `get_tvl()` - Get total value locked
- `get_rate()` - Get current yield rate
- `get_total_shares()` - Get total shares issued
- `get_user_shares(user)` - Get user's shares
- `get_user_value(user)` - Get user's position value
- `get_price_per_share()` - Get current share price
- `get_admin()` - Get vault admin
- `set_admin(new_admin)` - Change admin
- `set_rate(rate_bps)` - Change yield rate
- `set_paused(paused)` - Pause/unpause vault

## Resources

- [Stellar Documentation](https://developers.stellar.org)
- [Soroban Documentation](https://soroban.stellar.org)
- [Stellar SDK (JS/TS)](https://js.stellar.org)
- [Freighter Wallet](https://freighter.app)
- [Stellar Expert Explorer](https://stellar.expert)

## Support

For issues or questions:
1. Check the troubleshooting section above
2. Review contract logs on Stellar Expert
3. Check browser console for errors
4. Verify environment variables are set correctly
