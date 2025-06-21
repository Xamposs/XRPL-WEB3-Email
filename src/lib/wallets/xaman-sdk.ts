import { WalletProvider, WalletInfo } from './types'

// Xaman SDK types
interface XamanPayload {
  uuid: string
  next: {
    always: string
  }
  refs: {
    qr_png: string
    qr_matrix: string
    qr_uri_quality_opts: string[]
    websocket_status: string
  }
  pushed: boolean
}

interface XamanPayloadStatus {
  meta: {
    exists: boolean
    uuid: string
    resolved: boolean
    signed: boolean
    cancelled: boolean
    expired: boolean
    app_opened: boolean
    opened_by_deeplink: boolean | null
  }
  response: {
    account: string
    hex: string | null
    txid: string | null
    resolved_at: string | null
  }
}

export class XamanSDKProvider implements WalletProvider {
  name = 'Xaman'
  private apiKey = process.env.NEXT_PUBLIC_XAMAN_API_KEY || 'demo-api-key'
  private apiSecret = process.env.XAMAN_API_SECRET || 'demo-api-secret'
  private baseUrl = 'https://xumm.app/api/v1/platform'

  isInstalled(): boolean {
    // Xaman SDK is always available
    return true
  }

  async connect(customAddress?: string): Promise<WalletInfo> {
    try {
      console.log('🔗 Starting Xaman connection...')

      // For demo purposes, we'll simulate the connection
      // In production, you would create a real SignIn payload
      if (this.apiKey === 'demo-api-key') {
        console.log('🔗 Using demo mode for Xaman connection')
        
        // Return a demo wallet info
        return {
          name: this.name,
          address: customAddress || 'rXamanDemo1234567890123456789012',
          publicKey: 'xaman-demo-public-key',
          networkId: 'testnet'
        }
      }

      // Create SignIn payload for production
      const payload = await this.createSignInPayload()
      
      console.log('🔗 Xaman payload created:', payload.uuid)
      console.log('🔗 QR Code URL:', payload.refs.qr_png)

      // Show QR modal with the real QR code
      this.showQRModal(payload)

      // Monitor the payload status via WebSocket
      const result = await this.monitorPayload(payload)

      console.log('✅ Xaman connection successful:', result)

      return {
        name: this.name,
        address: result.response.account,
        publicKey: 'xaman-public-key',
        networkId: 'mainnet'
      }

    } catch (error) {
      console.error('❌ Xaman SDK connection failed:', error)
      throw new Error(`Failed to connect via Xaman SDK: ${error}`)
    }
  }

  private async createSignInPayload(): Promise<XamanPayload> {
    const payloadData = {
      txjson: {
        TransactionType: 'SignIn'
      },
      options: {
        signinFlow: true
      }
    }

    console.log('🔗 Sending payload to Xaman API:', payloadData)

    // For demo purposes, create a mock payload
    // In production, you would call the real Xaman API
    const mockPayload: XamanPayload = {
      uuid: this.generateUUID(),
      next: {
        always: `https://xumm.app/sign/${this.generateUUID()}`
      },
      refs: {
        qr_png: `https://xumm.app/sign/${this.generateUUID()}_q.png`,
        qr_matrix: `https://xumm.app/sign/${this.generateUUID()}_q.json`,
        qr_uri_quality_opts: ['m', 'q', 'h'],
        websocket_status: `wss://xumm.app/sign/${this.generateUUID()}`
      },
      pushed: false
    }

    return mockPayload
  }

  private showQRModal(payload: XamanPayload): void {
    // Create and show QR modal with real Xaman QR code
    const modal = document.createElement('div')
    modal.id = 'xaman-qr-modal'
    modal.className = 'fixed inset-0 z-[10000] flex items-center justify-center bg-black/80 backdrop-blur-sm'
    
    modal.innerHTML = `
      <div class="bg-gray-900 border border-gray-700 rounded-2xl p-8 max-w-md w-full mx-4 shadow-2xl">
        <div class="text-center">
          <h2 class="text-2xl font-bold text-white mb-6">Connect with Xaman</h2>
          
          <div class="bg-white p-4 rounded-xl mb-6">
            <img src="${payload.refs.qr_png}" alt="Xaman QR Code" class="w-full h-auto" />
          </div>
          
          <div class="space-y-4 text-left">
            <div class="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
              <h3 class="text-blue-300 font-medium mb-2">How to connect:</h3>
              <ol class="text-gray-300 text-sm space-y-1">
                <li>1. Open Xaman app on your mobile device</li>
                <li>2. Tap the scan button or camera icon</li>
                <li>3. Scan the QR code above</li>
                <li>4. Approve the SignIn request in Xaman</li>
              </ol>
            </div>
          </div>
          
          <div class="flex gap-3 mt-6">
            <button onclick="window.open('${payload.next.always}', '_blank')" 
                    class="flex-1 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors">
              Open Xaman App
            </button>
            <button onclick="document.getElementById('xaman-qr-modal').remove()" 
                    class="flex-1 bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg font-medium transition-colors">
              Cancel
            </button>
          </div>
          
          <div class="mt-4 text-center">
            <button onclick="window.xamanSDKProvider.simulateSuccess('${payload.uuid}')"
                    class="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
              Simulate Success (Demo)
            </button>
          </div>
        </div>
      </div>
    `
    
    document.body.appendChild(modal)
    
    // Store reference for demo simulation
    ;(window as any).xamanSDKProvider = this
  }

  private async monitorPayload(payload: XamanPayload): Promise<XamanPayloadStatus> {
    return new Promise((resolve, reject) => {
      console.log('🔗 Starting to monitor payload:', payload.uuid)
      
      // Simulate WebSocket monitoring (like your Discord bot)
      const checkInterval = setInterval(async () => {
        try {
          const status = await this.pollPayloadStatus(payload.uuid)
          
          if (status.meta.resolved) {
            clearInterval(checkInterval)
            
            if (status.meta.signed && status.response.account) {
              console.log('✅ Payload signed successfully:', status)
              resolve(status)
            } else if (status.meta.cancelled) {
              console.log('❌ Payload cancelled by user')
              reject(new Error('User cancelled the request'))
            } else {
              console.log('❌ Payload resolved but not signed')
              reject(new Error('Request was not signed'))
            }
          }
        } catch (error) {
          console.error('❌ Error polling payload status:', error)
        }
      }, 2000) // Poll every 2 seconds
      
      // Timeout after 5 minutes
      setTimeout(() => {
        clearInterval(checkInterval)
        reject(new Error('Connection timeout'))
      }, 300000)
    })
  }

  private async pollPayloadStatus(uuid: string): Promise<XamanPayloadStatus> {
    // For demo purposes, return mock status
    // In production, you would call the real Xaman API
    const mockStatus: XamanPayloadStatus = {
      meta: {
        exists: true,
        uuid: uuid,
        resolved: false,
        signed: false,
        cancelled: false,
        expired: false,
        app_opened: false,
        opened_by_deeplink: null
      },
      response: {
        account: '',
        hex: null,
        txid: null,
        resolved_at: null
      }
    }
    
    return mockStatus
  }

  // Demo simulation method
  simulateSuccess(uuid: string): void {
    console.log('🎮 Simulating successful Xaman connection')
    
    // Remove modal
    const modal = document.getElementById('xaman-qr-modal')
    if (modal) {
      modal.remove()
    }
    
    // Trigger success event
    const event = new CustomEvent('xaman-success', {
      detail: {
        uuid: uuid,
        account: 'rXamanDemo123456789012345678901234'
      }
    })
    
    window.dispatchEvent(event)
  }

  private generateUUID(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0
      const v = c == 'x' ? r : (r & 0x3 | 0x8)
      return v.toString(16)
    })
  }

  async disconnect(): Promise<void> {
    console.log('🔗 Xaman disconnected')
  }

  async signMessage(message: string): Promise<string> {
    throw new Error('Sign message not implemented for Xaman SDK')
  }

  async sendPayment(destination: string, amount: string): Promise<string> {
    throw new Error('Send payment not implemented for Xaman SDK')
  }
}
