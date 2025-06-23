export interface WalletInfo {
  name: string
  address: string
  publicKey?: string
  networkId?: string
}

export interface WalletProvider {
  name: string
  isInstalled: () => boolean
  connect: (customAddress?: string) => Promise<WalletInfo>
  disconnect: () => Promise<void>
  signMessage: (message: string) => Promise<string>
  sendPayment: (destination: string, amount: string, destinationTag?: number) => Promise<string>
}

export interface EmailMessage {
  id: string
  from: string
  to: string
  subject: string
  content: string
  timestamp: number
  txHash?: string
  ipfsHash?: string
  encrypted: boolean
}

export interface WalletContextType {
  wallet: WalletInfo | null
  isConnected: boolean
  isConnecting: boolean
  connect: (walletName: string, customAddress?: string) => Promise<void>
  disconnect: () => Promise<void>
  signMessage: (message: string) => Promise<string>
  sendEmail: (to: string, subject: string, content: string) => Promise<string>
  getEmails: () => Promise<EmailMessage[]>
}

export type SupportedWallet = 'xumm' | 'gemwallet' | 'crossmark'
