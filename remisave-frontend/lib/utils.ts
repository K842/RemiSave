import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Stellar utilities for RemiSave
const DECIMALS = BigInt(7)
// @ts-ignore
const DECIMAL_MULTIPLIER = BigInt(10) ** DECIMALS

/**
 * Convert a human-readable amount (e.g., 100.5) to Stellar BigInt format (7 decimals)
 */
export function toStellarAmount(amount: number | string): bigint {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount
  if (isNaN(num)) throw new Error(`Invalid amount: ${amount}`)
  return BigInt(Math.round(num * Number(DECIMAL_MULTIPLIER)))
}

/**
 * Convert a Stellar BigInt amount back to human-readable format
 */
export function fromStellarAmount(amount: bigint): string {
  const divisor = DECIMAL_MULTIPLIER
  const whole = amount / divisor
  const remainder = amount % divisor
  const remainderStr = remainder.toString().padStart(7, '0')
  return `${whole}.${remainderStr}`.replace(/\.?0+$/, '')
}

/**
 * Format a Stellar BigInt amount for display (with commas and 2 decimal places)
 */
export function formatStellarAmount(amount: bigint, decimals?: number): string {
  if (decimals === 0) {
    // For shares or whole numbers
    return amount.toLocaleString('en-US')
  }

  // @ts-ignore
  const divisor = decimals ? BigInt(10) ** BigInt(decimals) : DECIMAL_MULTIPLIER
  const humanReadable = parseFloat((amount / divisor).toString()) + 
    Number(amount % divisor) / Number(divisor)
  
  return humanReadable.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: decimals || 7,
  })
}

/**
 * Safe BigInt multiplication with rounding
 */
export function mulBigInt(a: bigint, b: bigint, decimals: bigint = DECIMALS): bigint {
  // @ts-ignore
  return (a * b) / (BigInt(10) ** decimals)
}

/**
 * Safe BigInt division with rounding
 */
export function divBigInt(a: bigint, b: bigint, decimals: bigint = DECIMALS): bigint {
  if (b === BigInt(0)) throw new Error('Division by zero')
  // @ts-ignore
  return (a * (BigInt(10) ** decimals)) / b
}
