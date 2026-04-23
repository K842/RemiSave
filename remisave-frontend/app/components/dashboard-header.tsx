'use client'

import React from 'react'
import { useWallet } from '@/app/contexts/wallet-context'
import { Button } from '@/components/ui/button'

export function DashboardHeader() {
  const { publicKey, isConnected, isLoading, connect, disconnect, error } = useWallet()

  const truncateKey = (key: string) => {
    return `${key.slice(0, 6)}...${key.slice(-6)}`
  }

  return (
    <header className="border-b border-neutral-200 bg-white">
      <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-full bg-primary" />
            <h1 className="text-xl font-bold text-primary">RemiSave</h1>
          </div>

          <div className="flex items-center gap-4">
            {error && <span className="text-sm text-red-500">{error}</span>}

            {isConnected ? (
              <div className="flex items-center gap-3">
                <div className="rounded-full bg-green-100 px-3 py-1 text-sm text-green-700">
                  Connected: {truncateKey(publicKey!)}
                </div>
                <Button
                  onClick={disconnect}
                  variant="outline"
                  size="sm"
                >
                  Disconnect
                </Button>
              </div>
            ) : (
              <Button
                onClick={connect}
                disabled={isLoading}
                className="bg-primary hover:bg-primary/90"
              >
                {isLoading ? 'Connecting...' : 'Connect Freighter'}
              </Button>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}
