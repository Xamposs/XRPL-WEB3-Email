'use client'

import { useState, useEffect } from 'react'
import { Wallet, LogOut, Copy, Check } from 'lucide-react'
import { XamanQRModal } from './xaman-qr-modal'
import { Button } from './ui/button'
import { Badge } from './ui/badge'
import { useWallet } from '@/lib/wallets/wallet-context'
import { formatAddress } from '@/lib/utils'

const walletOptions = [
  {
    id: 'demo',
    name: 'Demo Mode',
    description: 'Try the platform with a demo wallet',
    icon: '🎮',
    demoAddress: 'rN7n7otQDd6FczFgLdSqtcsAUxDkw6fzRH',
    available: true
  },
  {
    id: 'demo-custom',
    name: 'Custom Demo Address',
    description: 'Enter any XRPL address for testing',
    icon: '⚙️',
    available: true
  },
  {
    id: 'gemwallet',
    name: 'GemWallet',
    description: 'Connect with GemWallet browser extension',
    icon: '💎',
    downloadUrl: 'https://gemwallet.app/',
    available: false
  },
  {
    id: 'crossmark',
    name: 'Crossmark',
    description: 'Connect with Crossmark wallet',
    icon: '✖️',
    downloadUrl: 'https://crossmark.io/',
    available: false
  },
  {
    id: 'xaman',
    name: 'Xaman',
    description: 'Connect with Xaman mobile app (formerly XUMM)',
    icon: '🔥',
    downloadUrl: 'https://xaman.app/',
    available: false
  }
]

interface WalletConnectProps {
  id?: string
}

export function WalletConnect({ id = 'default' }: WalletConnectProps = {}) {
  const { wallet, isConnected, isConnecting, connect, disconnect } = useWallet()
  const [showWallets, setShowWallets] = useState(false)
  const [copied, setCopied] = useState(false)
  const [showCustomInput, setShowCustomInput] = useState(false)
  const [customAddress, setCustomAddress] = useState('')
  const [showXamanQR, setShowXamanQR] = useState(false)
  const modalId = `wallet-modal-${id}`

  // Check if wallets are actually installed
  useEffect(() => {
    if (typeof window !== 'undefined') {
      walletOptions.forEach(wallet => {
        if (wallet.id === 'gemwallet') {
          wallet.available = !!(window as any).gemWallet
        } else if (wallet.id === 'crossmark') {
          wallet.available = !!(window as any).crossmark
        } else if (wallet.id === 'xaman') {
          wallet.available = !!((window as any).xaman || (window as any).xumm)
        }
      })
    }
  }, [])

  // Handle escape key to close modal
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && showWallets) {
        setShowWallets(false)
      }
    }

    if (showWallets) {
      document.addEventListener('keydown', handleEscape)
      // Prevent body scroll when modal is open
      document.body.style.overflow = 'hidden'
    }

    return () => {
      document.removeEventListener('keydown', handleEscape)
      document.body.style.overflow = 'unset'
    }
  }, [showWallets])

  const handleConnect = async (walletId: string, address?: string) => {
    try {
      if (walletId === 'demo-custom') {
        setShowCustomInput(true)
        return
      }

      if (walletId === 'xaman') {
        try {
          console.log('🔗 Connecting to Xaman...')
          await connect('xaman')
          setShowWallets(false)
          console.log('✅ Xaman connection successful')
        } catch (error) {
          console.log('🔗 Showing Xaman QR modal for mobile connection')
          // Check if this is the expected QR modal trigger
          if (error instanceof Error && error.message === 'SHOW_QR_MODAL') {
            setShowXamanQR(true)
            setShowWallets(false)
          } else {
            console.error('❌ Xaman connection failed:', error)
            // Show QR modal as fallback for any connection error
            setShowXamanQR(true)
            setShowWallets(false)
          }
        }
        return
      }

      await connect(walletId, address)
      setShowWallets(false)
      setShowCustomInput(false)
      setCustomAddress('')
    } catch (error) {
      // Show user-friendly error message
      const errorMessage = error instanceof Error ? error.message : String(error)

      console.error('Failed to connect:', error)

      if (errorMessage.includes('not installed')) {
        if (walletId === 'gemwallet') {
          alert(`GemWallet browser extension not found! Please install GemWallet from the Chrome Web Store, or try Demo Mode to test the platform.`)
        } else if (walletId === 'crossmark') {
          alert(`Crossmark browser extension not found! Please install Crossmark from crossmark.io, or try Demo Mode to test the platform.`)
        } else {
          alert(`Wallet not found! Please install the wallet extension first, or try Demo Mode to test the platform.`)
        }
      } else {
        // Show the actual error message from the wallet provider
        alert(`Failed to connect: ${errorMessage}`)
      }
    }
  }

  const handleQuickConnect = (address: string) => {
    handleConnect('demo', address)
  }

  const handleXamanQRConnect = async (address: string) => {
    try {
      await connect('demo', address) // Use demo connection for now
      setShowXamanQR(false)
    } catch (error) {
      console.error('Failed to connect via QR:', error)
      alert(`Failed to connect: ${error}`)
    }
  }

  const handleCustomConnect = async () => {
    if (!customAddress.trim()) {
      alert('Please enter a valid XRPL address')
      return
    }

    if (!customAddress.startsWith('r') || customAddress.length < 25) {
      alert('Please enter a valid XRPL address starting with "r"')
      return
    }

    await handleConnect('demo', customAddress.trim())
  }

  const handleDisconnect = async () => {
    try {
      await disconnect()
    } catch (error) {
      console.error('Failed to disconnect:', error)
    }
  }

  const copyAddress = async () => {
    if (wallet?.address) {
      await navigator.clipboard.writeText(wallet.address)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  if (isConnected && wallet) {
    return (
      <div className="relative z-50">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 px-3 py-2 bg-green-500/10 border border-green-500/20 rounded-lg backdrop-blur-sm">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
            <span className="text-sm font-medium text-green-300">
              {wallet.name}
            </span>
            <button
              onClick={copyAddress}
              className="flex items-center gap-1 text-sm text-green-400 hover:text-green-300 transition-colors"
            >
              {formatAddress(wallet.address)}
              {copied ? (
                <Check className="w-3 h-3" />
              ) : (
                <Copy className="w-3 h-3" />
              )}
            </button>
            {wallet.name === 'Demo Mode' && (
              <Badge variant="warning" className="text-xs ml-2">
                Demo
              </Badge>
            )}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowWallets(true)}
            className="border-blue-500/30 text-blue-400 hover:text-blue-300 hover:bg-blue-500/10"
          >
            <Wallet className="w-4 h-4" />
            Change
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleDisconnect}
            className="border-red-500/30 text-red-400 hover:text-red-300 hover:bg-red-500/10"
          >
            <LogOut className="w-4 h-4" />
            Disconnect
          </Button>
        </div>

        {showWallets && (
          <>
            {/* Modal backdrop */}
            <div 
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[9999]" 
              onClick={() => setShowWallets(false)}
            />
            {/* Modal - Changed to dropdown positioning */}
            <div className="absolute top-full right-0 mt-2 z-[10000]">
              <div 
                className="bg-gray-900 border border-white/20 rounded-2xl p-6 w-80 shadow-2xl"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-semibold text-white">Connect Wallet</h3>
                  <button
                    onClick={() => setShowWallets(false)}
                    className="text-gray-400 hover:text-white transition-colors p-1 hover:bg-gray-800 rounded"
                  >
                    ✕
                  </button>
                </div>

                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {walletOptions.map((walletOption) => (
                    <div key={walletOption.id} className="relative">
                      <div
                        className={`w-full p-4 border rounded-xl transition-all duration-200 ${
                          walletOption.available
                            ? 'border-white/20 hover:border-blue-400/50 hover:bg-white/5'
                            : 'border-gray-600/30 bg-gray-800/30 opacity-60'
                        }`}
                      >
                        <div
                          className="flex items-center gap-3 cursor-pointer w-full"
                          onClick={() => handleConnect(walletOption.id)}
                        >
                          <span className="text-2xl">{walletOption.icon}</span>
                          <div className="flex-1">
                            <div className="font-medium text-white flex items-center gap-2 flex-wrap">
                              {walletOption.name}
                              {walletOption.id === 'demo' && (
                                <Badge variant="success" className="text-xs">
                                  Recommended
                                </Badge>
                              )}
                              {!walletOption.available && walletOption.id !== 'demo' && (
                                <Badge variant="outline" className="text-xs border-yellow-500 text-yellow-400">
                                  Try Connect
                                </Badge>
                              )}
                            </div>
                            <div className="text-sm text-gray-400 mt-1">
                              {walletOption.description}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    )
  }

  return (
    <div className="relative z-50">
      <Button
        onClick={(e) => {
          e.preventDefault()
          e.stopPropagation()
          setShowWallets(!showWallets)
        }}
        disabled={isConnecting}
        id={`wallet-button-${id}`}
        className={`bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 relative z-50 ${
          id === 'header' ? 'ring-2 ring-yellow-400/50' : ''
        }`}
        title={`Connect Wallet (${id})`}
      >
        <Wallet className="w-4 h-4" />
        {isConnecting ? 'Connecting...' : `Connect Wallet ${id === 'header' ? '(Header)' : ''}`}
      </Button>

      {showWallets && (
        <>
          {/* Modal backdrop */}
          <div 
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[9999]" 
            onClick={() => setShowWallets(false)}
          />
          {/* Modal - Changed from center modal to dropdown */}
          <div className="absolute top-full left-0 mt-2 z-[10000]">
            <div 
              className="bg-gray-900 border border-white/20 rounded-2xl p-6 w-80 shadow-2xl"
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
              }}
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold text-white">Connect Wallet</h3>
                <button
                  onClick={() => setShowWallets(false)}
                  className="text-gray-400 hover:text-white transition-colors p-1 hover:bg-gray-800 rounded"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-3 max-h-96 overflow-y-auto">
                {walletOptions.map((walletOption) => (
                  <div key={walletOption.id} className="relative">
                    <div
                      className={`w-full p-4 border rounded-xl transition-all duration-200 ${
                        walletOption.available
                          ? 'border-white/20 hover:border-blue-400/50 hover:bg-white/5'
                          : 'border-gray-600/30 bg-gray-800/30 opacity-60'
                      }`}
                    >
                      <div
                        className="flex items-center gap-3 cursor-pointer w-full"
                        onClick={() => handleConnect(walletOption.id)}
                      >
                        <span className="text-2xl">{walletOption.icon}</span>
                        <div className="flex-1">
                          <div className="font-medium text-white flex items-center gap-2 flex-wrap">
                            {walletOption.name}
                            {walletOption.id === 'demo' && (
                              <Badge variant="success" className="text-xs">
                                Recommended
                              </Badge>
                            )}
                            {!walletOption.available && walletOption.id !== 'demo' && (
                              <Badge variant="outline" className="text-xs border-yellow-500 text-yellow-400">
                                Try Connect
                              </Badge>
                            )}
                          </div>
                          <div className="text-sm text-gray-400 mt-1">
                            {walletOption.description}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="space-y-2 mt-6">
                <div className="text-xs text-blue-300 font-medium">Quick Demo Addresses:</div>
                <div className="grid grid-cols-1 gap-2">
                  <button
                    onClick={() => handleQuickConnect('rN7n7otQDd6FczFgLdSqtcsAUxDkw6fzRH')}
                    className="text-left px-3 py-2 bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/20 rounded-md transition-colors"
                  >
                    <div className="text-xs text-blue-300">📧 Sender</div>
                    <div className="text-xs text-gray-300 font-mono">rN7n7otQDd6FczFgLdSqtcsAUxDkw6fzRH</div>
                  </button>
                  <button
                    onClick={() => handleQuickConnect('rHb9CJAWyB4rj91VRWn96DkukG4bwdtyTh')}
                    className="text-left px-3 py-2 bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/20 rounded-md transition-colors"
                  >
                    <div className="text-xs text-purple-300">📨 Recipient</div>
                    <div className="text-xs text-gray-300 font-mono">rHb9CJAWyB4rj91VRWn96DkukG4bwdtyTh</div>
                  </button>
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setShowWallets(false)}
                  className="flex-1 px-4 py-2 border border-white/20 text-gray-300 hover:bg-white/10 rounded-md transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Custom Address Input Modal */}
      {showCustomInput && (
        <>
          <div 
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[9999]" 
            onClick={() => setShowCustomInput(false)}
          />
          <div className="fixed inset-0 flex items-center justify-center z-[10000]">
            <div 
              className="bg-gray-900 border border-white/20 rounded-2xl p-6 w-96 shadow-2xl"
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
              }}
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold text-white">Custom Demo Address</h3>
                <button
                  onClick={() => setShowCustomInput(false)}
                  className="text-gray-400 hover:text-white transition-colors p-1 hover:bg-gray-800 rounded"
                >
                  ✕
                </button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    XRPL Address
                  </label>
                  <input
                    type="text"
                    value={customAddress}
                    onChange={(e) => setCustomAddress(e.target.value)}
                    placeholder="rN7n7otQDd6FczFgLdSqtcsAUxDkw6fzRH"
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <p className="text-xs text-gray-400 mt-1">
                    Enter any valid XRPL address starting with 'r'
                  </p>
                </div>
                
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowCustomInput(false)}
                    className="flex-1 px-4 py-2 border border-gray-600 text-gray-300 hover:bg-gray-800 rounded-md transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleCustomConnect}
                    className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors"
                  >
                    Connect
                  </button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Xaman QR Modal */}
      <XamanQRModal
        isOpen={showXamanQR}
        onClose={() => setShowXamanQR(false)}
        onConnect={handleXamanQRConnect}
      />
    </div>
  )
}