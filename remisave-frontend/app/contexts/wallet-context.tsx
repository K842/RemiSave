'use client'

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { Keypair } from '@stellar/stellar-sdk'
import {
  isConnected as checkFreighterConnected,
  isAllowed,
  requestAccess,
  signTransaction as freighterSignTx,
  signMessage as freighterSignMessage,
} from '@stellar/freighter-api'

interface WalletContextType {
  publicKey: string | null
  isConnected: boolean
  isLoading: boolean
  error: string | null
  connect: () => Promise<void>
  disconnect: () => void
  signTransaction: (txEnvelope: string) => Promise<string>
  signMessage: (message: string) => Promise<any>
}

const WalletContext = createContext<WalletContextType | undefined>(undefined)

export function WalletProvider({ children }: { children: React.ReactNode }) {
  const [publicKey, setPublicKey] = useState<string | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // We disabled auto-connect on mount based on user feedback. 
  // The user must explicitly press "Connect Wallet" to connect Freighter.
  useEffect(() => {
    // Empty
  }, [])

  const connect = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      const connected = await checkFreighterConnected()
      if (!connected) {
        throw new Error('Freighter wallet not detected. Please install Freighter extension.')
      }

      const result = await requestAccess()
      if (!result.address) {
        throw new Error(result.error || 'Failed to get public key from Freighter')
      }

      setPublicKey(result.address)
      setIsConnected(true)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to connect wallet'
      setError(errorMessage)
      console.error('[v0] Wallet connection error:', errorMessage)
    } finally {
      setIsLoading(false)
    }
  }, [])

  const disconnect = useCallback(() => {
    setPublicKey(null)
    setIsConnected(false)
    setError(null)
  }, [])

  const signTransaction = useCallback(
    async (txEnvelope: string): Promise<string> => {
      try {
        const connected = await checkFreighterConnected()
        if (!connected) {
          throw new Error('Freighter wallet not available')
        }

        // The new signTransaction expects { networkPassphrase }
        const { signedTxXdr, error } = await freighterSignTx(txEnvelope, {
          networkPassphrase: 'Test SDF Network ; September 2015',
        }) as any
        
        if (error) throw new Error(error)
        return signedTxXdr
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to sign transaction'
        setError(errorMessage)
        throw err
      }
    },
    []
  )

  const signMessage = useCallback(
    async (message: string): Promise<any> => {
      try {
        const connected = await checkFreighterConnected()
        if (!connected) {
          throw new Error('Freighter wallet not available')
        }

        const signed = await freighterSignMessage(message)
        return signed
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to sign message'
        setError(errorMessage)
        throw err
      }
    },
    []
  )

  return (
    <WalletContext.Provider
      value={{
        publicKey,
        isConnected,
        isLoading,
        error,
        connect,
        disconnect,
        signTransaction,
        signMessage,
      }}
    >
      {children}
    </WalletContext.Provider>
  )
}

export function useWallet() {
  const context = useContext(WalletContext)
  if (!context) {
    throw new Error('useWallet must be used within WalletProvider')
  }
  return context
}
