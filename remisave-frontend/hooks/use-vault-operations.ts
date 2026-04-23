'use client'

import { useCallback, useState } from 'react'
import { useWallet } from '@/app/contexts/wallet-context'
import { useVault } from '@/app/contexts/vault-context'
import {
  buildApprovalTransaction,
  buildDepositTransaction,
  buildWithdrawalTransaction,
  submitTransaction,
} from '@/lib/contract-wrapper'
import { Horizon } from '@stellar/stellar-sdk'
import { STELLAR_HORIZON_URL, waitForTransactionConfirmation } from '@/lib/stellar-rpc'

export function useDepositVault() {
  const { publicKey, signTransaction } = useWallet()
  const { contractId, tokenContractId, setTransactionStatus, refreshVaultState, refreshUserPosition } = useVault()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const deposit = useCallback(
    async (amount: bigint) => {
      if (!publicKey) throw new Error('Wallet not connected')
      if (!contractId || !tokenContractId) throw new Error('Contract IDs not configured')

      setIsLoading(true)
      setError(null)

      try {
        const horizon = new Horizon.Server(STELLAR_HORIZON_URL)
        const account = await horizon.loadAccount(publicKey)

        // Step 1: Build approval transaction
        setTransactionStatus({ status: 'pending' })
        const approveTx = await buildApprovalTransaction(
          publicKey,
          tokenContractId,
          contractId,
          amount,
          account.sequence
        )

        // Step 2: Sign approval transaction
        const signedApproveTx = await signTransaction(approveTx)

        // Step 3: Submit approval transaction
        const approveTxHash = await submitTransaction(signedApproveTx)
        setTransactionStatus({ status: 'confirming', hash: approveTxHash })

        // Step 4: Wait for approval to be fully confirmed by the ledger before proceeding
        await waitForTransactionConfirmation(approveTxHash)

        // Step 5: Build deposit transaction
        const depositTx = await buildDepositTransaction(
          publicKey,
          contractId,
          amount,
          (BigInt(account.sequence) + BigInt(1)).toString()
        )

        // Step 6: Sign deposit transaction
        const signedDepositTx = await signTransaction(depositTx)

        // Step 7: Submit deposit transaction
        const depositTxHash = await submitTransaction(signedDepositTx)
        setTransactionStatus({ status: 'confirmed', hash: depositTxHash })

        // Refresh vault state
        await Promise.all([refreshVaultState(), refreshUserPosition()])

        return depositTxHash
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Deposit failed'
        setError(errorMessage)
        setTransactionStatus({ status: 'failed', error: errorMessage })
        throw err
      } finally {
        setIsLoading(false)
      }
    },
    [publicKey, contractId, tokenContractId, signTransaction, setTransactionStatus, refreshVaultState, refreshUserPosition]
  )

  return { deposit, isLoading, error }
}

export function useWithdrawVault() {
  const { publicKey, signTransaction } = useWallet()
  const { contractId, setTransactionStatus, refreshVaultState, refreshUserPosition } = useVault()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const withdraw = useCallback(
    async (sharesAmount: bigint) => {
      if (!publicKey) throw new Error('Wallet not connected')
      if (!contractId) throw new Error('Contract ID not configured')

      setIsLoading(true)
      setError(null)

      try {
        const horizon = new Horizon.Server(STELLAR_HORIZON_URL)
        const account = await horizon.loadAccount(publicKey)

        // Step 1: Build withdrawal transaction
        setTransactionStatus({ status: 'pending' })
        const withdrawTx = await buildWithdrawalTransaction(
          publicKey,
          contractId,
          sharesAmount,
          account.sequence
        )

        // Step 2: Sign withdrawal transaction
        const signedWithdrawTx = await signTransaction(withdrawTx)

        // Step 3: Submit withdrawal transaction
        const withdrawTxHash = await submitTransaction(signedWithdrawTx)
        setTransactionStatus({ status: 'confirmed', hash: withdrawTxHash })

        // Refresh vault state
        await Promise.all([refreshVaultState(), refreshUserPosition()])

        return withdrawTxHash
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Withdrawal failed'
        setError(errorMessage)
        setTransactionStatus({ status: 'failed', error: errorMessage })
        throw err
      } finally {
        setIsLoading(false)
      }
    },
    [publicKey, contractId, signTransaction, setTransactionStatus, refreshVaultState, refreshUserPosition]
  )

  return { withdraw, isLoading, error }
}
