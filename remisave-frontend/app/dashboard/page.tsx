'use client'

import React from 'react'
import { DashboardHeader } from '@/app/components/dashboard-header'
import { VaultStats } from '@/app/components/vault-stats'
import { DepositForm } from '@/app/components/deposit-form'
import { UserPosition } from '@/app/components/user-position'

export default function DashboardPage() {
  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader />

      <main className="mx-auto max-w-7xl space-y-8 px-4 py-8 sm:px-6 lg:px-8">
        {/* Vault Stats */}
        <section>
          <h2 className="mb-4 text-lg font-semibold text-neutral-900">Vault Overview</h2>
          <VaultStats />
        </section>

        {/* Main Content Grid */}
        <div className="grid gap-8 lg:grid-cols-3">
          {/* Deposit Form */}
          <div className="lg:col-span-2">
            <DepositForm />
          </div>

          {/* User Position Sidebar */}
          <div>
            <UserPosition />
          </div>
        </div>
      </main>
    </div>
  )
}
