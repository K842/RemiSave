/**
 * Stellar Contract Configuration
 * All contract IDs and network configuration
 */

export const CONTRACTS = {
  VAULT: process.env.NEXT_PUBLIC_VAULT_CONTRACT_ID || '',
  TOKEN: process.env.NEXT_PUBLIC_TOKEN_CONTRACT_ID || '',
} as const

export const ADDRESSES = {
  ADMIN: process.env.NEXT_PUBLIC_ADMIN_ADDRESS || '',
  USER_A: process.env.NEXT_PUBLIC_USER_A_ADDRESS || '',
  USER_B: process.env.NEXT_PUBLIC_USER_B_ADDRESS || '',
  USER_C: process.env.NEXT_PUBLIC_USER_C_ADDRESS || '',
  USER_D: process.env.NEXT_PUBLIC_USER_D_ADDRESS || '',
} as const

export const NETWORK = {
  NAME: process.env.NEXT_PUBLIC_STELLAR_NETWORK || 'testnet',
  HORIZON_URL: process.env.NEXT_PUBLIC_STELLAR_HORIZON_URL || 'https://horizon-testnet.stellar.org',
  RPC_URL: process.env.NEXT_PUBLIC_STELLAR_RPC_URL || 'https://soroban-testnet.stellar.org',
} as const

export const validateConfiguration = () => {
  const errors: string[] = []

  if (!CONTRACTS.VAULT) errors.push('NEXT_PUBLIC_VAULT_CONTRACT_ID not set')
  if (!CONTRACTS.TOKEN) errors.push('NEXT_PUBLIC_TOKEN_CONTRACT_ID not set')
  if (!ADDRESSES.ADMIN) errors.push('NEXT_PUBLIC_ADMIN_ADDRESS not set')

  if (errors.length > 0) {
    console.warn('Configuration warnings:', errors)
  }

  return errors.length === 0
}
