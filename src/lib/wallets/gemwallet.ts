import { WalletProvider, WalletInfo } from './types'

declare global {
  interface Window {
    gemWallet?: {
      isInstalled: () => boolean
      getAddress: () => Promise<{ address: string }>
      getPublicKey: () => Promise<{ publicKey: string }>
      signMessage: (message: string) => Promise<{ signedMessage: string }>
      sendPayment: (payment: {
        destination: string
        amount: string
        destinationTag?: number
      }) => Promise<{ hash: string }>
      getNetwork: () => Promise<{ network: string }>
    }
  }
}

export class GemWalletProvider implements WalletProvider {
  name = 'GemWallet'

  isInstalled(): boolean {
    try {
      // Πιο απλός έλεγχος - μόνο αν υπάρχει το object
      return typeof window !== 'undefined' && 
             !!(window as any).gemWallet
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
      const gemWallet = (window as any).gemWallet
      
      const [addressResult, publicKeyResult, networkResult] = await Promise.all([
        gemWallet.getAddress(),
        gemWallet.getPublicKey(),
        gemWallet.getNetwork()
      ])

      return {
        name: this.name,
        address: addressResult.address,
        publicKey: publicKeyResult.publicKey,
        networkId: networkResult.network
      }
    } catch (error) {
      throw new Error(`Failed to connect to GemWallet: ${error}`)
    }
  }

  async disconnect(): Promise<void> {
    // GemWallet doesn't have a disconnect method
    // The connection state is managed by the extension
  }

  async signMessage(message: string): Promise<string> {
    if (!this.isInstalled()) {
      throw new Error('GemWallet is not installed')
    }

    try {
      const result = await window.gemWallet!.signMessage(message)
      return result.signedMessage
    } catch (error) {
      throw new Error(`Failed to sign message: ${error}`)
    }
  }

  async sendPayment(destination: string, amount: string): Promise<string> {
    if (!this.isInstalled()) {
      throw new Error('GemWallet is not installed')
    }

    try {
      const result = await window.gemWallet!.sendPayment({
        destination,
        amount
      })
      return result.hash
    } catch (error) {
      throw new Error(`Failed to send payment: ${error}`)
    }
  }
}
