'use client'

import React, { useState } from 'react'
import { useVault } from '@/app/contexts/vault-context'
import { useWallet } from '@/app/contexts/wallet-context'
import { useWithdrawVault } from '@/hooks/use-vault-operations'
import { formatStellarAmount } from '@/lib/utils'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { AlertCircle } from 'lucide-react'

export function UserPosition() {
  const { isConnected } = useWallet()
  const { userPosition, isLoading, vaultState } = useVault()
  const { withdraw, isLoading: isWithdrawing, error: withdrawError } = useWithdrawVault()
  const [showWithdrawConfirm, setShowWithdrawConfirm] = useState(false)

  const handleWithdraw = async () => {
    if (!userPosition || userPosition.shares === BigInt(0)) return

    try {
      await withdraw(userPosition.shares)
      setShowWithdrawConfirm(false)
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

  if (!userPosition || (userPosition.shares === BigInt(0) && userPosition.amountDeposited === BigInt(0))) {
    return (
      <Card className="border-dashed bg-neutral-50 p-6 text-center">
        <p className="text-sm font-medium text-neutral-700">No deposits yet</p>
        <p className="text-xs text-neutral-500">Deposit rUSDC to start earning yield</p>
      </Card>
    )
  }

  const totalValue = vaultState?.totalDeposits ? 
    (userPosition.shares * vaultState.totalDeposits) / (vaultState.totalShares || BigInt(1)) 
    : userPosition.amountDeposited

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
        <div>
          <p className="text-xs uppercase text-neutral-600 tracking-wide">Shares Owned</p>
          <p className="text-2xl font-bold text-primary">
            {formatStellarAmount(userPosition.shares, 0)}
          </p>
        </div>

        <div className="border-t border-neutral-200 pt-4">
          <p className="text-xs uppercase text-neutral-600 tracking-wide mb-1">Amount Deposited</p>
          <p className="text-lg font-semibold text-neutral-900">
            {formatStellarAmount(userPosition.amountDeposited, 7)} rUSDC
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
            {userPosition.lastDepositTime
              ? new Date(userPosition.lastDepositTime * 1000).toLocaleDateString()
              : 'N/A'}
          </p>
        </div>
      </div>

      <div className="mt-6 space-y-2">
        {!showWithdrawConfirm ? (
          <Button
            onClick={() => setShowWithdrawConfirm(true)}
            variant="outline"
            disabled={isWithdrawing}
            className="w-full"
          >
            Withdraw
          </Button>
        ) : (
          <>
            <Button
              onClick={handleWithdraw}
              disabled={isWithdrawing}
              className="w-full bg-red-500 hover:bg-red-600"
            >
              {isWithdrawing ? 'Withdrawing...' : 'Confirm Withdraw'}
            </Button>
            <Button
              onClick={() => setShowWithdrawConfirm(false)}
              disabled={isWithdrawing}
              variant="outline"
              className="w-full"
            >
              Cancel
            </Button>
          </>
        )}
      </div>
    </Card>
  )
}
