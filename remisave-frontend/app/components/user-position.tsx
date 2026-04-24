'use client'

import React, { useState } from 'react'
import { useVault } from '@/app/contexts/vault-context'
import { useWallet } from '@/app/contexts/wallet-context'
import { useWithdrawVault } from '@/hooks/use-vault-operations'
import { formatStellarAmount, toStellarAmount, fromStellarAmount } from '@/lib/utils'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { AlertCircle } from 'lucide-react'

export function UserPosition() {
  const { isConnected } = useWallet()
  const { userPosition, isLoading, vaultState } = useVault()
  const { withdraw, isLoading: isWithdrawing, error: withdrawError } = useWithdrawVault()
  const [withdrawAmount, setWithdrawAmount] = useState<string>('')
  const [isMax, setIsMax] = useState(false)

  const handleWithdraw = async () => {
    if (!userPosition || userPosition.shares === BigInt(0)) return

    try {
      let sharesToWithdraw = BigInt(0)
      
      if (isMax) {
        sharesToWithdraw = userPosition.shares
      } else {
        const amount = toStellarAmount(withdrawAmount)
        if (amount <= BigInt(0)) return
        
        // shares = (amount * totalShares) / totalDeposits
        if (vaultState && vaultState.totalShares > BigInt(0) && vaultState.totalDeposits > BigInt(0)) {
          sharesToWithdraw = (amount * vaultState.totalShares) / vaultState.totalDeposits
        } else {
          // Fallback if state is not fully loaded but user has position
          sharesToWithdraw = amount
        }

        // Safety cap
        if (sharesToWithdraw > userPosition.shares) {
          sharesToWithdraw = userPosition.shares
        }
      }

      await withdraw(sharesToWithdraw)
      setWithdrawAmount('')
      setIsMax(false)
    } catch (error) {
      console.error('Withdrawal failed:', error)
    }
  }

  if (!isConnected) {
    return (
      <Card className="border-dashed bg-neutral-50 p-6 text-center">
        <p className="text-sm text-neutral-500">Connect wallet to view your position</p>
      </Card>
    )
  }

  if (isLoading) {
    return (
      <Card className="p-6">
        <Skeleton className="mb-4 h-5 w-32" />
        <div className="space-y-3">
          <div>
            <Skeleton className="mb-1 h-4 w-24" />
            <Skeleton className="h-6 w-28" />
          </div>
          <div>
            <Skeleton className="mb-1 h-4 w-24" />
            <Skeleton className="h-6 w-28" />
          </div>
        </div>
      </Card>
    )
  }

  const hasPosition = userPosition && (userPosition.shares > BigInt(0) || userPosition.amountDeposited > BigInt(0))

  const totalValue = (vaultState?.totalDeposits && userPosition?.shares) ? 
    (userPosition.shares * vaultState.totalDeposits) / (vaultState.totalShares || BigInt(1)) 
    : (userPosition?.amountDeposited || BigInt(0))

  return (
    <Card className="bg-gradient-to-br from-primary/5 to-accent/5 p-6">
      <h3 className="mb-4 text-sm font-semibold text-neutral-900">Your Position</h3>
      
      {withdrawError && (
        <div className="mb-4 flex gap-2 rounded-lg border border-red-200 bg-red-50 p-2 text-xs text-red-700">
          <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
          <p>{withdrawError}</p>
        </div>
      )}

      <div className="space-y-4">
        <div className="border-t border-neutral-200 pt-4">
          <p className="text-xs uppercase text-neutral-600 tracking-wide">Shares Owned</p>
          <p className="text-2xl font-bold text-primary">
            {formatStellarAmount(userPosition?.shares || BigInt(0), 0)}
          </p>
        </div>

        <div className="border-t border-neutral-200 pt-4">
          <p className="text-xs uppercase text-neutral-600 tracking-wide mb-1">Amount Deposited</p>
          <p className="text-lg font-semibold text-neutral-900">
            {formatStellarAmount(userPosition?.amountDeposited || BigInt(0), 7)} rUSDC
          </p>
        </div>

        <div className="border-t border-neutral-200 pt-4">
          <p className="text-xs uppercase text-neutral-600 tracking-wide mb-1">Position Value</p>
          <p className="text-lg font-semibold text-green-600">
            {formatStellarAmount(totalValue, 7)} rUSDC
          </p>
        </div>

        <div className="border-t border-neutral-200 pt-4">
          <p className="text-xs text-neutral-500">
            Last Deposit:{' '}
            {userPosition?.lastDepositTime
              ? new Date(userPosition.lastDepositTime * 1000).toLocaleDateString()
              : 'N/A'}
          </p>
        </div>
      </div>

      <div className="mt-6 space-y-4 pt-4 border-t border-neutral-200">
        <div className="space-y-2">
          <div className="flex justify-between text-xs text-neutral-500 px-1">
            <span>Withdraw Amount (rUSDC)</span>
            <button 
              onClick={() => {
                setWithdrawAmount(fromStellarAmount(totalValue))
                setIsMax(true)
              }}
              className="text-primary hover:underline font-medium"
              disabled={isWithdrawing || !hasPosition}
            >
              Use Max
            </button>
          </div>
          <Input
            type="number"
            value={withdrawAmount}
            onChange={(e) => {
              setWithdrawAmount(e.target.value)
              setIsMax(false)
            }}
            step="0.0000001"
            placeholder="0.0"
            className="h-10 bg-white shadow-sm"
            disabled={isWithdrawing || !hasPosition}
          />
        </div>
        
        <Button
          onClick={handleWithdraw}
          disabled={isWithdrawing || !hasPosition || !withdrawAmount || parseFloat(withdrawAmount) <= 0}
          className="w-full bg-red-600 hover:bg-red-700 text-white font-semibold transition-colors shadow-sm"
        >
          {isWithdrawing ? 'Withdrawing...' : 'Confirm Withdrawal'}
        </Button>
      </div>
    </Card>
  )
}
