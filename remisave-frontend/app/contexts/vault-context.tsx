'use client'

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react'
import { useWallet } from './wallet-context'
import {
  getVaultState,
  getUserPosition,
  VaultState,
  UserPosition,
} from '@/lib/contract-wrapper'

interface TransactionStatus {
  status: 'idle' | 'pending' | 'confirming' | 'confirmed' | 'failed'
  hash?: string
  error?: string
  timestamp?: number
}

interface VaultContextType {
  vaultState: VaultState | null
  userPosition: UserPosition | null
  isLoading: boolean
  error: string | null
  txStatus: TransactionStatus
  contractId: string
  tokenContractId: string
  refreshVaultState: () => Promise<void>
  refreshUserPosition: () => Promise<void>
  setTransactionStatus: (status: TransactionStatus) => void
  clearError: () => void
}

const VaultContext = createContext<VaultContextType | undefined>(undefined)

// Contract IDs (would be fetched from env or contract registry in production)
const VAULT_CONTRACT_ID = process.env.NEXT_PUBLIC_VAULT_CONTRACT_ID || ''
const TOKEN_CONTRACT_ID = process.env.NEXT_PUBLIC_TOKEN_CONTRACT_ID || ''

export function VaultProvider({ children }: { children: React.ReactNode }) {
  const { publicKey } = useWallet()
  const [vaultState, setVaultState] = useState<VaultState | null>(null)
  const [userPosition, setUserPosition] = useState<UserPosition | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [txStatus, setTxStatus] = useState<TransactionStatus>({ status: 'idle' })

  const refreshVaultState = useCallback(async () => {
    if (!VAULT_CONTRACT_ID) {
      setError('Vault contract ID not configured')
      return
    }

    try {
      setIsLoading(true)
      const state = await getVaultState(VAULT_CONTRACT_ID)
      setVaultState(state)
      setError(null) // Clear error on success
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch vault state'
      setError(errorMessage)
      console.error('[v0] Error fetching vault state:', errorMessage)
      // Don't re-throw, let the component handle the error gracefully
    } finally {
      setIsLoading(false)
    }
  }, [])

  const refreshUserPosition = useCallback(async () => {
    if (!VAULT_CONTRACT_ID || !publicKey) {
      return
    }

    try {
      const position = await getUserPosition(VAULT_CONTRACT_ID, publicKey)
      setUserPosition(position)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch user position'
      console.error('[v0] Error fetching user position:', errorMessage)
    }
  }, [publicKey])

  // Refresh vault state on mount and when contract ID changes (client-side only)
  useEffect(() => {
    if (typeof window === 'undefined') return // Skip on server-side render
    
    // Only fetch vault state if contract ID is available, add small delay
    const timer = setTimeout(() => {
      if (VAULT_CONTRACT_ID) {
        refreshVaultState().catch(err => {
          console.error('[v0] Initial vault state fetch failed:', err)
        })
      }
    }, 500)

    return () => clearTimeout(timer)
  }, [refreshVaultState])

  // Refresh user position when wallet connects
  useEffect(() => {
    if (publicKey) {
      refreshUserPosition().catch(err => {
        console.error('[v0] Initial user position fetch failed:', err)
      })
    }
  }, [publicKey, refreshUserPosition])

  // Auto-refresh vault state every 10 seconds (client-side only)
  useEffect(() => {
    if (typeof window === 'undefined') return // Skip on server-side render
    if (!VAULT_CONTRACT_ID) return // Don't set up interval if no contract
    
    const interval = setInterval(() => {
      refreshVaultState().catch(err => {
        console.error('[v0] Auto-refresh vault state failed:', err)
      })
    }, 10000)

    return () => clearInterval(interval)
  }, [refreshVaultState])

  const clearError = useCallback(() => {
    setError(null)
  }, [])

  return (
    <VaultContext.Provider
      value={{
        vaultState,
        userPosition,
        isLoading,
        error,
        txStatus,
        contractId: VAULT_CONTRACT_ID,
        tokenContractId: TOKEN_CONTRACT_ID,
        refreshVaultState,
        refreshUserPosition,
        setTransactionStatus: setTxStatus,
        clearError,
      }}
    >
      {children}
    </VaultContext.Provider>
  )
}

export function useVault() {
  const context = useContext(VaultContext)
  if (!context) {
    throw new Error('useVault must be used within VaultProvider')
  }
  return context
}
