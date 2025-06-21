import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatAddress(address: string): string {
  if (!address) return ""
  return `${address.slice(0, 6)}...${address.slice(-4)}`
}

export function formatXRP(amount: string | number): string {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount
  return `${num.toFixed(6)} XRP`
}

export function generateEmailId(): string {
  return `email_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

export function isValidXRPAddress(address: string): boolean {
  // Basic XRPL address validation
  return /^r[1-9A-HJ-NP-Za-km-z]{25,34}$/.test(address)
}
