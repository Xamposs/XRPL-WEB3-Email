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
    // Για το GemWallet, επιστρέφουμε πάντα true και κάνουμε τον πραγματικό έλεγχο στο connect()
    // Αυτό είναι επειδή το GemWallet δεν εκθέτει synchronous detection API
    console.log('🔍 GemWallet detection: assuming available, will check in connect()');
    return true;
  }

  async connect(customAddress?: string): Promise<WalletInfo> {
    try {
      console.log('🔗 Attempting to connect to GemWallet...');
      
      // Κάνουμε τον πραγματικό έλεγχο εδώ
      const installed = await isInstalled();
      console.log('🔍 GemWallet isInstalled() result:', installed);
      console.log('🔍 Type of result:', typeof installed);
      console.log('🔍 Result structure:', JSON.stringify(installed, null, 2));
      
      // Βελτιωμένη λογική εξαγωγής της τιμής isInstalled
      let isGemWalletInstalled = false;
      
      if (typeof installed === 'boolean') {
        isGemWalletInstalled = installed;
      } else if (installed && typeof installed === 'object') {
        // Ελέγχουμε όλες τις πιθανές δομές
        const result = (installed as any);
        
        // Πρώτα ελέγχουμε αν υπάρχει result.result.isInstalled
        if (result.result && typeof result.result === 'object') {
          isGemWalletInstalled = result.result.isInstalled === true;
        }
        // Μετά ελέγχουμε αν υπάρχει result.isInstalled
        else if (result.isInstalled !== undefined) {
          isGemWalletInstalled = result.isInstalled === true;
        }
        // Τέλος ελέγχουμε αν το ίδιο το result είναι boolean
        else if (result.result === true || result.result === false) {
          isGemWalletInstalled = result.result === true;
        }
      }
      
      console.log('🔍 Final installation check:', isGemWalletInstalled);
      
      if (!isGemWalletInstalled) {
        console.error('❌ GemWallet is not installed according to API check');
        throw new Error('GemWallet is not installed. Please install the GemWallet browser extension from https://gemwallet.app/');
      }

      console.log('📡 Getting GemWallet account info...');
      
      // Κάνουμε τις κλήσεις μία-μία για καλύτερο debugging
      const addressResult = await getAddress();
      console.log('📍 GemWallet address result:', addressResult);
      
      const publicKeyResult = await getPublicKey();
      console.log('🔑 GemWallet publicKey result:', publicKeyResult);
      
      const networkResult = await getNetwork();
      console.log('🌐 GemWallet network result:', networkResult);

      // Εξάγουμε τα δεδομένα με διαφορετικούς τρόπους
      const address = this.extractValue(addressResult, 'address');
      const publicKey = this.extractValue(publicKeyResult, 'publicKey');
      const networkId = this.extractValue(networkResult, 'network') || 'mainnet';

      if (!address) {
        throw new Error('Failed to get address from GemWallet');
      }

      console.log('✅ GemWallet connection successful:', { address, networkId });

      return {
        name: this.name,
        address,
        publicKey,
        networkId
      };
    } catch (error) {
      console.error('❌ Failed to connect to GemWallet:', error);
      
      // Δίνουμε πιο συγκεκριμένα μηνύματα σφάλματος
      if (error instanceof Error) {
        if (error.message.includes('not installed')) {
          throw new Error('GemWallet is not installed. Please install the GemWallet browser extension from https://gemwallet.app/');
        } else if (error.message.includes('User rejected')) {
          throw new Error('Connection was rejected by user');
        } else {
          throw new Error(`GemWallet connection failed: ${error.message}`);
        }
      }
      
      throw new Error(`Failed to connect to GemWallet: ${String(error)}`);
    }
  }

  // Helper method για εξαγωγή τιμών από διαφορετικές δομές response
  private extractValue(result: any, key: string): string {
    if (!result) return '';
    
    // Άμεση τιμή
    if (result[key]) return result[key];
    
    // Μέσα σε result object
    if (result.result && result.result[key]) return result.result[key];
    
    // Μέσα σε data object
    if (result.data && result.data[key]) return result.data[key];
    
    return '';
  }

  async disconnect(): Promise<void> {
    console.log('🔗 GemWallet disconnected');
  }

  async signMessage(message: string): Promise<string> {
    try {
      console.log('✍️ Signing message with GemWallet...');
      
      const installed = await isInstalled();
      if (!installed) {
        throw new Error('GemWallet is not installed');
      }
      
      const result = await signMessage(message);
      console.log('✅ Message signed:', result);
      
      return this.extractValue(result, 'signature');
    } catch (error) {
      console.error('❌ Failed to sign message:', error);
      throw new Error(`Failed to sign message: ${error}`);
    }
  }

  async sendPayment(destination: string, amount: string, destinationTag?: number): Promise<string> {
    try {
      console.log('💸 Sending payment with GemWallet...');
      
      const installed = await isInstalled();
      if (!installed) {
        throw new Error('GemWallet is not installed');
      }
      
      const payment = {
        destination,
        amount: amount,
        ...(destinationTag && { destinationTag })
      };
      
      console.log('💸 Payment details:', payment);
      
      const result = await sendPayment(payment);
      console.log('✅ Payment sent:', result);
      
      // Handle different possible response formats
      if (typeof result === 'string') {
        return result;
      }
      
      if (result && typeof result === 'object') {
        return this.extractValue(result, 'hash') || 
               this.extractValue(result, 'txHash') || 
               this.extractValue(result, 'transactionHash') || 
               '';
      }
      
      return '';
    } catch (error) {
      console.error('❌ Failed to send payment:', error);
      throw new Error(`Failed to send payment: ${error}`);
    }
  }
}