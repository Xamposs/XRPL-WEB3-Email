import { isInstalled, getAddress, getPublicKey, getNetwork, signMessage, sendPayment } from '@gemwallet/api'
import type { WalletProvider, WalletInfo } from './types'

export class GemWalletProvider implements WalletProvider {
  name = 'GemWallet'

  isInstalled(): boolean {
    try {
      return isInstalled()
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
  }

  async signMessage(message: string): Promise<string> {
    if (!this.isInstalled()) {
      throw new Error('GemWallet is not installed')
    }

    const result = await signMessage(message)
    return result.signedMessage
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
    return result.hash
  }
}
