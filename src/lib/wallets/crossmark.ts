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
    try {
      console.log('🔍 Checking Crossmark installation...')
      console.log('window:', typeof window)
      console.log('window.crossmark:', window.crossmark)
      console.log('typeof window.crossmark:', typeof window.crossmark)
      
      if (typeof window === 'undefined') {
        console.log('❌ Window is undefined')
        return false
      }
      
      if (typeof window.crossmark === 'undefined') {
        console.log('❌ window.crossmark is undefined')
        return false
      }
      
      if (window.crossmark === null) {
        console.log('❌ window.crossmark is null')
        return false
      }
      
      console.log('window.crossmark.isInstalled:', window.crossmark.isInstalled)
      console.log('typeof window.crossmark.isInstalled:', typeof window.crossmark.isInstalled)
      
      if (typeof window.crossmark.isInstalled !== 'function') {
        console.log('❌ window.crossmark.isInstalled is not a function')
        return false
      }
      
      const result = window.crossmark.isInstalled()
      console.log('✅ Crossmark.isInstalled() result:', result)
      return result
    } catch (error) {
      console.error('❌ Error checking Crossmark installation:', error)
      return false
    }
  }

  async connect(customAddress?: string): Promise<WalletInfo> {
    if (!this.isInstalled()) {
      throw new Error('Crossmark is not installed')
    }

    try {
      const result = await window.crossmark!.connect()

      return {
        name: this.name,
        address: result.address,
        publicKey: result.publicKey,
        networkId: result.network
      }
    } catch (error) {
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
