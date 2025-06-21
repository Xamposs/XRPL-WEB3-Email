'use client'

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react'
import { WalletContextType, WalletInfo, EmailMessage, SupportedWallet } from './types'
import { GemWalletProvider } from './gemwallet'
import { CrossmarkProvider } from './crossmark'
import { XamanProvider } from './xumm'
import { DemoWalletProvider } from './demo'
import { EmailService } from '../email/service'

const WalletContext = createContext<WalletContextType | null>(null)

const walletProviders = {
  demo: new DemoWalletProvider(),
  gemwallet: new GemWalletProvider(),
  crossmark: new CrossmarkProvider(),
  xaman: new XamanProvider(),
  xumm: new XamanProvider() // Legacy support
}

export function WalletProvider({ children }: { children: React.ReactNode }) {
  const [wallet, setWallet] = useState<WalletInfo | null>(null)
  const [isConnecting, setIsConnecting] = useState(false)
  const [emailService] = useState(() => new EmailService())

  const isConnected = !!wallet

  // Load wallet from localStorage on mount
  useEffect(() => {
    const savedWallet = localStorage.getItem('xrpl-wallet')
    if (savedWallet) {
      try {
        setWallet(JSON.parse(savedWallet))
      } catch (error) {
        console.error('Failed to load saved wallet:', error)
        localStorage.removeItem('xrpl-wallet')
      }
    }
  }, [])

  const connect = useCallback(async (walletName: string, customAddress?: string) => {
    setIsConnecting(true)
    try {
      const provider = walletProviders[walletName as keyof typeof walletProviders]
      if (!provider) {
        throw new Error(`Unsupported wallet: ${walletName}`)
      }

      // Skip isInstalled check for Xaman and XUMM (mobile wallets)
      if (walletName !== 'xaman' && walletName !== 'xumm' && !provider.isInstalled()) {
        throw new Error(`${provider.name} is not installed`)
      }

      const walletInfo = await provider.connect(customAddress)
      setWallet(walletInfo)
      localStorage.setItem('xrpl-wallet', JSON.stringify(walletInfo))
    } catch (error) {
      // Special handling for Xaman QR modal - don't log as error
      if (error instanceof Error && error.message === 'SHOW_QR_MODAL') {
        console.log('🔗 Triggering QR modal for Xaman connection')
        throw error
      }

      console.error('Failed to connect wallet:', error)
      throw error
    } finally {
      setIsConnecting(false)
    }
  }, [])

  const disconnect = useCallback(async () => {
    try {
      if (wallet) {
        const provider = walletProviders[wallet.name.toLowerCase() as keyof typeof walletProviders]
        if (provider) {
          await provider.disconnect()
        }
      }
      setWallet(null)
      localStorage.removeItem('xrpl-wallet')
    } catch (error) {
      console.error('Failed to disconnect wallet:', error)
      throw error
    }
  }, [wallet])

  const signMessage = useCallback(async (message: string): Promise<string> => {
    if (!wallet) {
      throw new Error('No wallet connected')
    }

    const provider = walletProviders[wallet.name.toLowerCase() as keyof typeof walletProviders]
    if (!provider) {
      throw new Error(`Unsupported wallet: ${wallet.name}`)
    }

    return provider.signMessage(message)
  }, [wallet])

  const sendEmail = useCallback(async (
    to: string,
    subject: string,
    content: string
  ): Promise<string> => {
    if (!wallet) {
      throw new Error('No wallet connected')
    }

    // Handle demo mode and Xaman demo
    if (wallet.name === 'Demo Mode' || wallet.address.includes('XamanDemo')) {
      // Simulate email sending for demo
      await new Promise(resolve => setTimeout(resolve, 2000))

      // Store demo email in localStorage
      const demoEmails = JSON.parse(localStorage.getItem('demo-emails') || '[]')
      const newEmail = {
        id: `demo-email-${Date.now()}`,
        from: wallet.address,
        to,
        subject,
        content,
        timestamp: Date.now(),
        txHash: `demo-tx-${Date.now()}`,
        encrypted: true
      }
      demoEmails.push(newEmail)
      localStorage.setItem('demo-emails', JSON.stringify(demoEmails))

      return newEmail.txHash
    }

    const provider = walletProviders[wallet.name.toLowerCase() as keyof typeof walletProviders]
    if (!provider) {
      throw new Error(`Unsupported wallet: ${wallet.name}`)
    }

    // Create a sign transaction function for the email service
    const signTransaction = async (tx: any) => {
      // This is a simplified version - in a real implementation,
      // you'd need to properly format the transaction for each wallet
      const signature = await provider.signMessage(JSON.stringify(tx))
      return { tx_blob: signature }
    }

    return emailService.sendEmail(
      wallet.address,
      to,
      subject,
      content,
      signTransaction
    )
  }, [wallet, emailService])

  const getEmails = useCallback(async (): Promise<EmailMessage[]> => {
    if (!wallet) {
      throw new Error('No wallet connected')
    }

    // Handle demo mode and Xaman demo
    if (wallet.name === 'Demo Mode' || wallet.address.includes('XamanDemo')) {
      // Simulate loading delay
      await new Promise(resolve => setTimeout(resolve, 1000))

      // Get demo emails from localStorage and add some sample emails
      const demoEmails = JSON.parse(localStorage.getItem('demo-emails') || '[]')

      // Add some sample emails if none exist
      if (demoEmails.length === 0) {
        const sampleEmails = [
          {
            id: 'sample-1',
            from: 'rSampleSender1234567890123456789012',
            to: wallet.address,
            subject: wallet.address.includes('XamanDemo') ? 'Welcome to XRPL Email via Xaman!' : 'Welcome to XRPL Email!',
            content: wallet.address.includes('XamanDemo') ? 'Welcome to the decentralized email platform via Xaman wallet! This is a sample email to show how the system works with Xaman integration. You can send encrypted emails to any XRPL address using your Xaman wallet.' : 'Welcome to the decentralized email platform! This is a sample email to show how the system works. You can send encrypted emails to any XRPL address.',
            timestamp: Date.now() - 86400000, // 1 day ago
            txHash: 'sample-tx-1234567890',
            encrypted: true
          },
          {
            id: 'sample-2',
            from: 'rAnotherSender1234567890123456789012',
            to: wallet.address,
            subject: 'XRPL Email Features',
            content: 'Here are some key features:\n\n• End-to-end encryption\n• Decentralized storage on XRPL\n• No central servers\n• Low transaction fees\n• Multi-wallet support\n• Xaman wallet integration',
            timestamp: Date.now() - 172800000, // 2 days ago
            txHash: 'sample-tx-0987654321',
            encrypted: true
          }
        ]

        const allEmails = [...sampleEmails, ...demoEmails]
        localStorage.setItem('demo-emails', JSON.stringify(allEmails))
        return allEmails
      }

      return demoEmails
    }

    return emailService.getEmails(wallet.address)
  }, [wallet, emailService])

  const value: WalletContextType = {
    wallet,
    isConnected,
    isConnecting,
    connect,
    disconnect,
    signMessage,
    sendEmail,
    getEmails
  }

  return (
    <WalletContext.Provider value={value}>
      {children}
    </WalletContext.Provider>
  )
}

export function useWallet() {
  const context = useContext(WalletContext)
  if (!context) {
    throw new Error('useWallet must be used within a WalletProvider')
  }
  return context
}
