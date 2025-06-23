import type { WalletProvider, WalletInfo } from './types'
import { 
  isInstalled, 
  getAddress, 
  getPublicKey, 
  getNetwork, 
  signMessage, 
  sendPayment 
} from '@gemwallet/api'

export class GemWalletProvider implements WalletProvider {
  name = 'GemWallet'

  isInstalled(): boolean {
    try {
      // Χρησιμοποιούμε synchronous έλεγχο για το window object
      return typeof window !== 'undefined' && !!(window as any).gemWallet
    } catch (error) {
      console.log('GemWallet detection error:', error)
      return false
    }
  }

  async connect(customAddress?: string): Promise<WalletInfo> {
    if (!this.isInstalled()) {
      throw new Error('GemWallet is not installed')
    }

    try {
      const [addressResult, publicKeyResult, networkResult] = await Promise.all([
        getAddress(),
        getPublicKey(),
        getNetwork()
      ])

      return {
        name: this.name,
        address: (addressResult as any)?.address || (addressResult as any)?.result?.address || '',
        publicKey: (publicKeyResult as any)?.publicKey || (publicKeyResult as any)?.result?.publicKey || '',
        networkId: (networkResult as any)?.network || (networkResult as any)?.result?.network || 'mainnet'
      }
    } catch (error) {
      throw new Error(`Failed to connect to GemWallet: ${error}`)
    }
  }

  async disconnect(): Promise<void> {
    // GemWallet doesn't have a disconnect method
  }

  async signMessage(message: string): Promise<string> {
    if (!this.isInstalled()) {
      throw new Error('GemWallet is not installed')
    }

    const result = await signMessage(message)
    return (result as any)?.signedMessage || (result as any)?.result?.signedMessage || ''
  }

  async sendPayment(destination: string, amount: string, destinationTag?: number): Promise<string> {
    if (!this.isInstalled()) {
      throw new Error('GemWallet is not installed')
    }

    const result = await sendPayment({
      destination,
      amount,
      destinationTag
    })
    return (result as any)?.hash || (result as any)?.result?.hash || ''
  }
}