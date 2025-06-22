'use client'

import { useState, useEffect } from 'react'
import { X } from 'lucide-react'

interface XamanQRModalProps {
  isOpen: boolean
  onClose: () => void
  onConnect: (address: string) => void
}

export function XamanQRModal({ isOpen, onClose, onConnect }: XamanQRModalProps) {
  const [qrCode, setQrCode] = useState<string>('')
  const [connectionUri, setConnectionUri] = useState<string>('')
  const [isConnecting, setIsConnecting] = useState(false)

  useEffect(() => {
    if (isOpen) {
      console.log('✅ XamanQRModal opened')

      // Generate a simple demo URI for QR code display
      const demoUri = `xaman://connect?demo=true&timestamp=${Date.now()}`
      setConnectionUri(demoUri)

      // Generate QR code
      setQrCode(`https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(demoUri)}`)
      console.log('✅ Demo QR Code generated for display purposes')
    }
  }, [isOpen])

  const generateRandomString = (length: number) => {
    const chars = 'abcdef0123456789'
    let result = ''
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    return result
  }

  const handleDeepLink = () => {
    console.log('🔗 Attempting to open Xaman app')

    // Try to open Xaman app
    const xamanUrl = 'https://xaman.app'
    window.open(xamanUrl, '_blank')

    console.log('✅ Opened Xaman website - user can download the app from there')

    // Show instructions
    alert(
      'Xaman App Instructions:\n\n' +
      '1. Download Xaman app from xaman.app\n' +
      '2. Install it on your mobile device\n' +
      '3. Scan the QR code above with the Xaman app\n' +
      '4. Or use the "Simulate Connection" button for demo purposes'
    )
  }

  const handleSimulateConnection = () => {
    console.log('🎮 Simulating Xaman connection for demo')
    setIsConnecting(true)
    
    // Simulate connection delay
    setTimeout(() => {
      const demoAddress = 'rN7n7otQDd6FczFgLdSqtcsAUxDkw6fzRH'
      onConnect(demoAddress)
      setIsConnecting(false)
      onClose()
    }, 2000)
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-black/95 border border-white/20 rounded-2xl p-8 max-w-md w-full mx-4 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🔥</span>
            <h2 className="text-xl font-bold text-white">Connect with Xaman</h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors p-1"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {isConnecting ? (
          <div className="text-center py-8">
            <div className="animate-spin w-8 h-8 border-2 border-blue-400 border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-white font-medium">Connecting to Xaman...</p>
            <p className="text-gray-400 text-sm mt-2">Please approve the connection in your Xaman app</p>
          </div>
        ) : (
          <>
            {/* QR Code */}
            <div className="text-center mb-6">
              <div className="bg-white p-4 rounded-xl inline-block mb-4">
                {qrCode ? (
                  <img
                    src={qrCode}
                    alt="Xaman QR Code"
                    className="w-64 h-64"
                  />
                ) : (
                  <div className="w-64 h-64 bg-gray-200 flex items-center justify-center">
                    <span className="text-gray-500">Loading QR Code...</span>
                  </div>
                )}
              </div>
              <p className="text-white font-medium mb-2">Scan with Xaman App</p>
              <p className="text-gray-400 text-sm">
                Open Xaman on your mobile device and scan this QR code to connect
              </p>
            </div>

            {/* Mobile Button */}
            <div className="text-center mb-6">
              <div className="flex gap-3 justify-center">
                <button
                  onClick={handleDeepLink}
                  className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
                >
                  Open Xaman App
                </button>
                <button
                  onClick={() => {
                    console.log('📋 Copying URI to clipboard:', connectionUri)
                    navigator.clipboard.writeText(connectionUri).then(() => {
                      console.log('✅ URI copied successfully')
                      alert('WalletConnect URI copied to clipboard!')
                    }).catch((err) => {
                      console.error('❌ Failed to copy URI:', err)
                      alert('Failed to copy URI. Please try again.')
                    })
                  }}
                  className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-3 rounded-lg font-medium transition-colors"
                >
                  Copy URI
                </button>
              </div>
              <p className="text-gray-400 text-xs mt-2">
                On mobile? Tap "Open Xaman App" or copy the URI to paste in Xaman manually
              </p>
            </div>

            {/* Instructions */}
            <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4 mb-4">
              <h3 className="text-blue-300 font-medium mb-2">How to connect:</h3>
              <ol className="text-gray-300 text-sm space-y-1">
                <li>1. Open Xaman app on your mobile device</li>
                <li>2. Tap the scan button or camera icon</li>
                <li>3. Scan the QR code above</li>
                <li>4. Approve the connection in Xaman</li>
              </ol>
            </div>

            {/* Demo Connection Button */}
            <div className="mt-6 pt-4 border-t border-white/20">
              <button
                onClick={() => {
                  console.log('🔗 Simulating Xaman connection for demo')
                  setIsConnecting(true)
                  
                  // Simulate connection delay
                  setTimeout(() => {
                    const demoAddress = 'rXamanDemo1234567890123456789012'
                    console.log('✅ Demo connection successful:', demoAddress)
                    onConnect(demoAddress)
                    setIsConnecting(false)
                    onClose()
                  }, 2000)
                }}
                disabled={isConnecting}
                className="w-full bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium py-3 px-4 rounded-xl transition-all duration-200 flex items-center justify-center gap-2"
              >
                <span className="text-lg">🎮</span>
                {isConnecting ? 'Connecting...' : 'Simulate Connection (Demo)'}
              </button>
              <p className="text-xs text-gray-400 text-center mt-2">
                For testing purposes - simulates a real Xaman connection
              </p>
            </div>


          </>
        )}
      </div>
    </div>
  )
}
