import { WalletProvider, WalletInfo } from './types'

declare global {
  interface Window {
    crossmark?: {
      isInstalled: () => boolean
      connect: () => Promise<{
        address: string
        publicKey: string
        network: string
      }>
      signMessage: (message: string) => Promise<{ signature: string }>
      sendPayment: (payment: {
        TransactionType: string
        Destination: string
        Amount: string
        Fee?: string
      }) => Promise<{ hash: string }>
    }
  }
}

export class CrossmarkProvider implements WalletProvider {
  name = 'Crossmark'

  isInstalled(): boolean {
    // Always return true and let the connect method handle the actual detection
    return true
  }

  async connect(customAddress?: string): Promise<WalletInfo> {
    // If custom address is provided, use it (for demo/testing)
    if (customAddress) {
      return {
        name: this.name,
        address: customAddress,
        publicKey: 'demo-public-key',
        networkId: 'mainnet'
      }
    }

    try {
      // Check if Crossmark is actually available
      if (typeof window === 'undefined' || !window.crossmark) {
        throw new Error('Crossmark extension not found. Please install Crossmark from crossmark.io and refresh the page.')
      }

      const result = await window.crossmark.connect()

      return {
        name: this.name,
        address: result.address,
        publicKey: result.publicKey,
        networkId: result.network
      }
    } catch (error) {
      if (error instanceof Error && error.message.includes('not found')) {
        throw error
      }
      throw new Error(`Failed to connect to Crossmark: ${error}`)
    }
  }

  async disconnect(): Promise<void> {
    // Crossmark doesn't have a disconnect method
    // The connection state is managed by the extension
  }

  async signMessage(message: string): Promise<string> {
    if (!this.isInstalled()) {
      throw new Error('Crossmark is not installed')
    }

    try {
      const result = await window.crossmark!.signMessage(message)
      return result.signature
    } catch (error) {
      throw new Error(`Failed to sign message: ${error}`)
    }
  }

  async sendPayment(destination: string, amount: string): Promise<string> {
    if (!this.isInstalled()) {
      throw new Error('Crossmark is not installed')
    }

    try {
      const result = await window.crossmark!.sendPayment({
        TransactionType: 'Payment',
        Destination: destination,
        Amount: amount,
        Fee: '12' // Standard fee in drops
      })
      return result.hash
    } catch (error) {
      throw new Error(`Failed to send payment: ${error}`)
    }
  }
}
