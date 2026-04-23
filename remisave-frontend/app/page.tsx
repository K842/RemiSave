'use client'

import React from 'react'
import Link from 'next/link'
import { useWallet } from '@/app/contexts/wallet-context'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Zap, Lock, TrendingUp, Send } from 'lucide-react'

export default function HomePage() {
  const { isConnected, connect } = useWallet()

  const features = [
    {
      icon: Send,
      title: 'Seamless Remittances',
      description: 'Send tokens across borders with minimal fees using Stellar blockchain',
    },
    {
      icon: Lock,
      title: 'Yield-Bearing Vault',
      description: 'Your deposits earn yield automatically while locked in the smart contract',
    },
    {
      icon: TrendingUp,
      title: 'Real-Time Growth',
      description: 'Monitor your earnings in real-time with transparent on-chain calculations',
    },
    {
      icon: Zap,
      title: 'Fast & Secure',
      description: 'Powered by Stellar Soroban smart contracts for instant, secure transactions',
    },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-neutral-50">
      {/* Header */}
      <header className="border-b border-neutral-200 bg-white/80 backdrop-blur">
        <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-full bg-primary" />
              <h1 className="text-xl font-bold text-primary">RemiSave</h1>
            </div>
            {isConnected ? (
              <Link href="/dashboard">
                <Button className="bg-primary hover:bg-primary/90">
                  Go to Dashboard
                </Button>
              </Link>
            ) : (
              <Button onClick={() => connect()} className="bg-primary hover:bg-primary/90">
                Connect Wallet
              </Button>
            )}
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        {/* Hero Section */}
        <section className="mb-20 text-center">
          <h2 className="mb-4 text-4xl font-bold tracking-tight text-neutral-900 sm:text-5xl">
            Remittance Savings
            <span className="block text-primary">with Stellar Yield</span>
          </h2>
          <p className="mx-auto mb-8 max-w-2xl text-lg text-neutral-600">
            Send money home and earn yield simultaneously. RemiSave combines the speed of Stellar blockchain
            with the security of Soroban smart contracts to create a new way to save and send.
          </p>
          <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Link href="/dashboard">
              <Button size="lg" className="bg-primary hover:bg-primary/90">
                Start Saving
              </Button>
            </Link>
            <Button variant="outline" size="lg">
              Learn More
            </Button>
          </div>
        </section>

        {/* Features Grid */}
        <section className="mb-20">
          <h3 className="mb-12 text-center text-2xl font-bold text-neutral-900">
            Why Choose RemiSave?
          </h3>
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {features.map((feature) => {
              const Icon = feature.icon
              return (
                <Card key={feature.title} className="border-neutral-200 p-6">
                  <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-blue-50">
                    <Icon className="h-6 w-6 text-primary" />
                  </div>
                  <h4 className="mb-2 font-semibold text-neutral-900">{feature.title}</h4>
                  <p className="text-sm text-neutral-600">{feature.description}</p>
                </Card>
              )
            })}
          </div>
        </section>

        {/* CTA Section */}
        <section className="rounded-2xl bg-primary px-8 py-16 text-center text-white sm:px-12">
          <h3 className="mb-4 text-3xl font-bold">Ready to Start Saving?</h3>
          <p className="mb-8 text-lg text-blue-100">
            Connect your Freighter wallet and begin earning yield on your remittances today.
          </p>
          <Link href="/dashboard">
            <Button size="lg" variant="secondary" className="font-semibold">
              Launch Dashboard
            </Button>
          </Link>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-neutral-200 bg-white py-8">
        <div className="mx-auto max-w-7xl px-4 text-center sm:px-6 lg:px-8">
          <p className="text-sm text-neutral-600">
            RemiSave &copy; 2024. Built on Stellar Soroban. Not financial advice.
          </p>
        </div>
      </footer>
    </div>
  )
}
