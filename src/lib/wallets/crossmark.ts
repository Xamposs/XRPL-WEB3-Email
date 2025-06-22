import { WalletProvider, WalletInfo } from './types'

// Type definitions για το Crossmark SDK
interface CrossmarkSDK {
  methods: {
    signInAndWait: () => Promise<{
      response: {
        address: string
        publicKey?: string
        network?: string
      }
    }>
    signAndWait: (payload: any) => Promise<{
      response: {
        signature?: string
        data?: {
          signature?: string
        }
      }
    }>
    signAndSubmitAndWait: (transaction: any) => Promise<{
      response: {
        data?: {
          resp?: {
            result?: {
              hash?: string
            }
            hash?: string
          }
        }
      }
    }>
  }
}

// Import του SDK με proper typing
let sdk: CrossmarkSDK
try {
  sdk = require('@crossmarkio/sdk')
} catch (error) {
  console.warn('Crossmark SDK not available:', error)
}

declare global {
  interface Window {
    crossmark?: any
  }
}

export class CrossmarkProvider implements WalletProvider {
  name = 'Crossmark'

  isInstalled(): boolean {
    try {
      return typeof window !== 'undefined' && 
             typeof window.crossmark !== 'undefined' &&
             window.crossmark !== null
    } catch (error) {
      console.log('Crossmark detection error:', error)
      return false
    }
  }

  async connect(customAddress?: string): Promise<WalletInfo> {
    if (customAddress) {
      return {
        name: this.name,
        address: customAddress,
        publicKey: 'demo-public-key',
        networkId: 'mainnet'
      }
    }

    try {
      if (!this.isInstalled()) {
        throw new Error('Crossmark extension not found. Please install Crossmark from crossmark.io and refresh the page.')
      }

      if (!sdk) {
        throw new Error('Crossmark SDK not available')
      }

      const signInResult = await sdk.methods.signInAndWait()
      
      if (!signInResult.response || !signInResult.response.address) {
        throw new Error('Failed to get wallet information from Crossmark')
      }

      return {
        name: this.name,
        address: signInResult.response.address,
        publicKey: signInResult.response.publicKey || 'crossmark-public-key',
        networkId: signInResult.response.network || 'mainnet'
      }
    } catch (error) {
      if (error instanceof Error && error.message.includes('not found')) {
        throw error
      }
      throw new Error(`Failed to connect to Crossmark: ${error}`)
    }
  }

  async disconnect(): Promise<void> {
    // Crossmark SDK doesn't have a disconnect method
  }

  async signMessage(message: string): Promise<string> {
    if (!this.isInstalled()) {
      throw new Error('Crossmark is not installed')
    }

    if (!sdk) {
      throw new Error('Crossmark SDK not available')
    }

    try {
      const result = await sdk.methods.signAndWait({
        message: message
      })
      
      return result.response.signature || result.response.data?.signature || ''
    } catch (error) {
      throw new Error(`Failed to sign message: ${error}`)
    }
  }

  async sendPayment(destination: string, amount: string): Promise<string> {
    if (!this.isInstalled()) {
      throw new Error('Crossmark is not installed')
    }

    if (!sdk) {
      throw new Error('Crossmark SDK not available')
    }

    try {
      const signInResult = await sdk.methods.signInAndWait()
      
      if (!signInResult.response?.address) {
        throw new Error('Could not get user address')
      }

      const result = await sdk.methods.signAndSubmitAndWait({
        TransactionType: 'Payment',
        Account: signInResult.response.address,
        Destination: destination,
        Amount: amount,
        Fee: '12'
      })
      
      return result.response.data?.resp?.result?.hash || result.response.data?.resp?.hash || ''
    } catch (error) {
      throw new Error(`Failed to send payment: ${error}`)
    }
  }
}
