'use client'

import React from 'react'
import { useVault } from '@/app/contexts/vault-context'
import { formatStellarAmount } from '@/lib/utils'
import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

export function VaultStats() {
  const { vaultState, userPosition, isLoading, error } = useVault()

  if (isLoading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="p-6">
            <Skeleton className="mb-2 h-4 w-24" />
            <Skeleton className="h-8 w-32" />
          </Card>
        ))}
      </div>
    )
  }

  if (error || !vaultState) {
    return (
      <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4 text-sm text-yellow-700">
        Loading vault data... The contract may still be initializing. Please refresh.
      </div>
    )
  }

  const totalValue = (vaultState?.totalDeposits && userPosition?.shares) ? 
    (userPosition.shares * vaultState.totalDeposits) / (vaultState.totalShares || BigInt(1)) 
    : (userPosition?.amountDeposited || BigInt(0))

  const stats = [
    {
      label: 'Your Deposit Value',
      value: formatStellarAmount(totalValue, 7),
      suffix: 'rUSDC',
      color: 'blue',
    },
    {
      label: 'Current Yield',
      value: (Number(vaultState.rate) / 100).toFixed(2),
      suffix: '%',
      color: 'green',
    },
    {
      label: 'Your Shares',
      value: formatStellarAmount(userPosition?.shares || BigInt(0), 0),
      suffix: 'shares',
      color: 'purple',
    },
    {
      label: 'Vault Status',
      value: vaultState.paused ? 'Paused' : 'Active',
      suffix: '',
      color: vaultState.paused ? 'red' : 'green',
    },
  ]

  const colorClasses: { [key: string]: string } = {
    blue: 'bg-blue-50 border-blue-200',
    green: 'bg-green-50 border-green-200',
    purple: 'bg-purple-50 border-purple-200',
    red: 'bg-red-50 border-red-200',
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat) => (
        <Card 
          key={stat.label} 
          className={`border p-6 ${colorClasses[stat.color]}`}
        >
          <p className="mb-2 text-xs font-medium text-neutral-600 uppercase tracking-wide">
            {stat.label}
          </p>
          <p className="text-2xl font-bold text-neutral-900">
            {stat.value}
            <span className="ml-1 text-sm text-neutral-500">{stat.suffix}</span>
          </p>
        </Card>
      ))}
    </div>
  )
}
