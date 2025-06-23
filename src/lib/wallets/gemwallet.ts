import { 
  isInstalled, 
  getAddress, 
  getPublicKey, 
  getNetwork, 
  signMessage, 
  sendPayment 
} from '@gemwallet/api'
import { WalletProvider, WalletInfo } from './types'

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
    try {
      // Χρησιμοποιούμε το async isInstalled για πιο ακριβή έλεγχο
      const installed = await isInstalled()
      if (!installed) {
        throw new Error('GemWallet is not installed')
      }

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
    try {
      const installed = await isInstalled()
      if (!installed) {
        throw new Error('GemWallet is not installed')
      }
      // Διόρθωση: η signMessage δέχεται απλά το string, όχι object
      const result = await signMessage(message)
      return (result as any)?.signature || (result as any)?.result?.signature || ''
    } catch (error) {
      throw new Error(`Failed to sign message: ${error}`)
    }
  }

  async sendPayment(destination: string, amount: string, destinationTag?: number): Promise<string> {
    try {
      const installed = await isInstalled()
      if (!installed) {
        throw new Error('GemWallet is not installed')
      }
      const payment = {
        destination,
        amount: {
          currency: 'XRP',
          value: amount
        },
        ...(destinationTag && { destinationTag })
      }
      const result = await sendPayment(payment)
      
      // Handle different possible response formats
      if (typeof result === 'string') {
        return result
      }
      
      if (result && typeof result === 'object') {
        return (result as any)?.hash || 
               (result as any)?.result?.hash || 
               (result as any)?.txHash || 
               (result as any)?.transactionHash || 
               ''
      }
      
      return ''
    } catch (error) {
      throw new Error(`Failed to send payment: ${error}`)
    }
  }
}