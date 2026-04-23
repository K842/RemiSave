'use client'

import React, { useState } from 'react'
import { useForm } from 'react-hook-form'
import { useWallet } from '@/app/contexts/wallet-context'
import { useVault } from '@/app/contexts/vault-context'
import { useDepositVault } from '@/hooks/use-vault-operations'
import { toStellarAmount } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { FieldGroup, FieldLabel } from '@/components/ui/field'
import { AlertCircle, CheckCircle } from 'lucide-react'

interface DepositFormData {
  amount: string
}

export function DepositForm() {
  const { publicKey, isConnected } = useWallet()
  const { contractId, tokenContractId, txStatus } = useVault()
  const { deposit, isLoading, error: depositError } = useDepositVault()
  const { register, handleSubmit, formState: { errors, isSubmitting }, reset } = useForm<DepositFormData>()
  const [depositStep, setDepositStep] = useState<'approve' | 'deposit' | 'complete'>('approve')
  const [completedTxHash, setCompletedTxHash] = useState<string | null>(null)

  const onSubmit = async (data: DepositFormData) => {
    if (!isConnected || !publicKey) {
      alert('Please connect your wallet first')
      return
    }

    if (!contractId || !tokenContractId) {
      alert('Contract IDs not configured')
      return
    }

    try {
      const amount = toStellarAmount(data.amount)

      // Step 1: Approve token transfer
      setDepositStep('approve')
      console.log('[RemiSave] Starting approval step with amount:', amount.toString())

      // Step 2: Deposit to vault
      setDepositStep('deposit')
      console.log('[RemiSave] Starting deposit step')

      const txHash = await deposit(amount)
      
      setCompletedTxHash(txHash)
      setDepositStep('complete')
      reset()

      // Reset form after 5 seconds
      setTimeout(() => {
        setDepositStep('approve')
        setCompletedTxHash(null)
      }, 5000)
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Deposit failed'
      console.error('[RemiSave] Deposit error:', errorMessage)
    }
  }

  return (
    <Card className="bg-white p-6">
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-neutral-900">Deposit rUSDC</h2>
        <p className="text-sm text-neutral-500">Lock your tokens in the yield-bearing vault</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {!isConnected && (
          <div className="flex gap-2 rounded-lg border border-orange-200 bg-orange-50 p-3 text-sm text-orange-700">
            <AlertCircle className="h-5 w-5 flex-shrink-0" />
            <p>Please connect your wallet to deposit</p>
          </div>
        )}

        {depositError && (
          <div className="flex gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            <AlertCircle className="h-5 w-5 flex-shrink-0" />
            <p>{depositError}</p>
          </div>
        )}

        <FieldGroup>
          <FieldLabel htmlFor="amount">Amount (rUSDC)</FieldLabel>
          <Input
            id="amount"
            type="number"
            step="0.0000001"
            placeholder="100.5"
            disabled={isLoading || !isConnected || depositStep === 'complete'}
            {...register('amount', {
              required: 'Amount is required',
              validate: (value) => {
                const num = parseFloat(value)
                if (isNaN(num) || num <= 0) return 'Amount must be greater than 0'
                return true
              },
            })}
          />
          {errors.amount && (
            <p className="text-sm text-red-600">{errors.amount.message}</p>
          )}
        </FieldGroup>

        {depositStep === 'complete' && completedTxHash && (
          <div className="rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-700">
            <div className="flex gap-2">
              <CheckCircle className="h-5 w-5 flex-shrink-0" />
              <div>
                <p className="font-semibold">Deposit completed successfully!</p>
                <p className="text-xs">Tx: {completedTxHash.slice(0, 16)}...</p>
              </div>
            </div>
          </div>
        )}

        <div className="space-y-2">
          <Button
            type="submit"
            disabled={isLoading || !isConnected || depositStep === 'complete'}
            className="w-full bg-primary hover:bg-primary/90"
          >
            {isLoading ? (
              depositStep === 'approve' ? 'Approving...' : 'Depositing...'
            ) : (
              'Deposit Now'
            )}
          </Button>

          {txStatus.status !== 'idle' && (
            <div className="text-center text-xs text-neutral-500">
              Status: {txStatus.status}
            </div>
          )}
        </div>
      </form>
    </Card>
  )
}
