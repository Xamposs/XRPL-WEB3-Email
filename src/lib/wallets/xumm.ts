import { WalletProvider, WalletInfo } from './types'
import { XamanSDKProvider } from './xaman-sdk'

declare global {
  interface Window {
    xaman?: {
      isInstalled: () => boolean
      connect: () => Promise<{
        account: string
        publicKey: string
        networkEndpoint: string
      }>
      signMessage: (message: string) => Promise<{ signature: string }>
      sendPayment: (payment: {
        TransactionType: string
        Destination: string
        Amount: string
      }) => Promise<{ hash: string }>
    }
    // Legacy support for XUMM
    xumm?: {
      isInstalled: () => boolean
      connect: () => Promise<{
        account: string
        publicKey: string
        networkEndpoint: string
      }>
      signMessage: (message: string) => Promise<{ signature: string }>
      sendPayment: (payment: {
        TransactionType: string
        Destination: string
        Amount: string
      }) => Promise<{ hash: string }>
    }
  }
}

export class XamanProvider implements WalletProvider {
  name = 'Xaman'

  isInstalled(): boolean {
    // Check if Xaman browser bridge is available
    return typeof window !== 'undefined' && !!(window.xaman || window.xumm)
  }

  async connect(customAddress?: string): Promise<WalletInfo> {
    try {
      // Try to connect via browser bridge first (if available)
      if (window.xaman?.connect) {
        console.log('🔗 Using Xaman browser bridge')
        const result = await window.xaman.connect()
        return {
          name: this.name,
          address: result.account,
          publicKey: result.publicKey,
          networkId: result.networkEndpoint
        }
      }

      // Try legacy XUMM support
      if (window.xumm?.connect) {
        console.log('🔗 Using legacy XUMM browser bridge')
        const result = await window.xumm.connect()
        return {
          name: this.name,
          address: result.account,
          publicKey: result.publicKey,
          networkId: result.networkEndpoint
        }
      }

      // If no browser bridge available, trigger QR modal
      console.log('🔗 No browser bridge found, triggering QR modal')
      throw new Error('SHOW_QR_MODAL')

    } catch (error) {
      console.error('❌ Xaman connection failed:', error)
      // Always trigger QR modal for mobile wallet connection
      throw new Error('SHOW_QR_MODAL')
    }
  }

  async disconnect(): Promise<void> {
    // Xaman doesn't have a disconnect method
    // The connection state is managed by the app
  }

  async signMessage(message: string): Promise<string> {
    if (!this.isInstalled()) {
      throw new Error('Xaman is not installed')
    }

    try {
      const wallet = window.xaman || window.xumm
      const result = await wallet!.signMessage(message)
      return result.signature
    } catch (error) {
      throw new Error(`Failed to sign message: ${error}`)
    }
  }

  async sendPayment(destination: string, amount: string): Promise<string> {
    if (!this.isInstalled()) {
      throw new Error('Xaman is not installed')
    }

    try {
      const wallet = window.xaman || window.xumm
      const result = await wallet!.sendPayment({
        TransactionType: 'Payment',
        Destination: destination,
        Amount: amount
      })
      return result.hash
    } catch (error) {
      throw new Error(`Failed to send payment: ${error}`)
    }
  }
}
