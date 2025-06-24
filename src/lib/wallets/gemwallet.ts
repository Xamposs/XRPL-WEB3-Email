import { 
  isInstalled, 
  getAddress, 
  getPublicKey, 
  getNetwork, 
  signMessage, 
  sendPayment 
} from '@gemwallet/api'
import { WalletProvider, WalletInfo } from './types'

export class GemWalletProvider implements WalletProvider {
  name = 'GemWallet'

  isInstalled(): boolean {
    try {
      // Δοκιμάζουμε διαφορετικούς τρόπους ελέγχου
      if (typeof window === 'undefined') return false;
      
      // Έλεγχος για το window.gemWallet
      if (typeof (window as any).gemWallet !== 'undefined') {
        console.log('GemWallet detected via window.gemWallet');
        return true;
      }
      
      // Έλεγχος για το window.GemWallet (με κεφαλαίο G)
      if (typeof (window as any).GemWallet !== 'undefined') {
        console.log('GemWallet detected via window.GemWallet');
        return true;
      }
      
      // Έλεγχος για το chrome extension
      if ((window as any).chrome?.runtime?.id) {
        // Προσθέτουμε περισσότερα logs για debugging
        console.log('Chrome extension detected, checking if it might be GemWallet');
      }
      
      console.log('GemWallet not detected via synchronous checks');
      return false;
    } catch (error) {
      console.error('GemWallet detection error:', error);
      return false;
    }
  }

  async connect(customAddress?: string): Promise<WalletInfo> {
    try {
      // Προσθέτουμε περισσότερα logs για debugging
      console.log('Attempting to connect to GemWallet...');
      
      // Χρησιμοποιούμε το async isInstalled για πιο ακριβή έλεγχο
      const installed = await isInstalled();
      console.log('GemWallet isInstalled() result:', installed);
      
      if (!installed) {
        console.error('GemWallet is not installed according to API check');
        throw new Error('GemWallet is not installed');
      }

      console.log('Getting GemWallet account info...');
      const [addressResult, publicKeyResult, networkResult] = await Promise.all([
        getAddress(),
        getPublicKey(),
        getNetwork()
      ]);
      
      console.log('GemWallet address result:', addressResult);
      console.log('GemWallet network result:', networkResult);

      return {
        name: this.name,
        address: (addressResult as any)?.address || (addressResult as any)?.result?.address || '',
        publicKey: (publicKeyResult as any)?.publicKey || (publicKeyResult as any)?.result?.publicKey || '',
        networkId: (networkResult as any)?.network || (networkResult as any)?.result?.network || 'mainnet'
      };
    } catch (error) {
      console.error('Failed to connect to GemWallet:', error);
      throw new Error(`Failed to connect to GemWallet: ${error}`);
    }
  }

  async disconnect(): Promise<void> {
    // GemWallet doesn't have a disconnect method
  }

  async signMessage(message: string): Promise<string> {
    try {
      const installed = await isInstalled()
      if (!installed) {
        throw new Error('GemWallet is not installed')
      }
      // Διόρθωση: η signMessage δέχεται απλά το string, όχι object
      const result = await signMessage(message)
      return (result as any)?.signature || (result as any)?.result?.signature || ''
    } catch (error) {
      throw new Error(`Failed to sign message: ${error}`)
    }
  }

  async sendPayment(destination: string, amount: string, destinationTag?: number): Promise<string> {
    try {
      const installed = await isInstalled()
      if (!installed) {
        throw new Error('GemWallet is not installed')
      }
      const payment = {
        destination,
        amount: amount, // Για XRP, το amount είναι απλώς string (drops)
        ...(destinationTag && { destinationTag })
      }
      const result = await sendPayment(payment)
      
      // Handle different possible response formats
      if (typeof result === 'string') {
        return result
      }
      
      if (result && typeof result === 'object') {
        return (result as any)?.hash || 
               (result as any)?.result?.hash || 
               (result as any)?.txHash || 
               (result as any)?.transactionHash || 
               ''
      }
      
      return ''
    } catch (error) {
      throw new Error(`Failed to send payment: ${error}`)
    }
  }
}