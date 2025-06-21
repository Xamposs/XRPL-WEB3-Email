import { WalletProvider, WalletInfo } from './types'

export class DemoWalletProvider implements WalletProvider {
  name = 'Demo Mode'

  isInstalled(): boolean {
    return true // Demo is always "installed"
  }

  async connect(customAddress?: string): Promise<WalletInfo> {
    // Simulate connection delay
    await new Promise(resolve => setTimeout(resolve, 1000))

    const address = customAddress || 'rN7n7otQDd6FczFgLdSqtcsAUxDkw6fzRH'

    return {
      name: this.name,
      address,
      publicKey: 'demo-public-key-12345',
      networkId: 'testnet'
    }
  }

  async disconnect(): Promise<void> {
    // Demo disconnect - just resolve
    await new Promise(resolve => setTimeout(resolve, 500))
  }

  async signMessage(message: string): Promise<string> {
    // Simulate signing delay
    await new Promise(resolve => setTimeout(resolve, 1000))

    // Return a demo signature
    return `demo-signature-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  }

  async sendPayment(destination: string, amount: string): Promise<string> {
    // Simulate transaction delay
    await new Promise(resolve => setTimeout(resolve, 2000))

    // Return a demo transaction hash
    return `demo-tx-${Date.now()}-${Math.random().toString(36).substr(2, 16)}`
  }
}
