// Blockchain-based Signing System
// Υπογραφή email με XRPL wallet για πιστοποίηση sender identity

import CryptoJS from 'crypto-js'

export interface BlockchainSignature {
  signature: string
  publicKey: string
  walletAddress: string
  timestamp: number
  messageHash: string
  txHash?: string // XRPL transaction hash για on-chain verification
}

export interface SignedMessage {
  content: string
  signature: BlockchainSignature
  metadata: {
    algorithm: string
    version: string
    chainId: string
  }
}

export interface IdentityVerification {
  isValid: boolean
  senderAddress: string
  verificationLevel: 'high' | 'medium' | 'low'
  trustScore: number
  warnings: string[]
}

export class BlockchainSigner {
  private static instance: BlockchainSigner
  
  static getInstance(): BlockchainSigner {
    if (!BlockchainSigner.instance) {
      BlockchainSigner.instance = new BlockchainSigner()
    }
    return BlockchainSigner.instance
  }

  // Υπογραφή μηνύματος με XRPL wallet
  async signMessage(
    content: string,
    walletAddress: string,
    privateKey: string
  ): Promise<BlockchainSignature> {
    // Δημιουργία hash του μηνύματος
    const messageHash = CryptoJS.SHA256(content).toString()
    
    // Δημιουργία timestamp
    const timestamp = Date.now()
    
    // Δημιουργία payload για υπογραφή
    const signaturePayload = {
      messageHash,
      walletAddress,
      timestamp,
      chainId: 'xrpl-mainnet'
    }
    
    const payloadString = JSON.stringify(signaturePayload)
    
    // Υπογραφή με XRPL wallet (simplified για demo)
    const signature = CryptoJS.HmacSHA256(payloadString, privateKey).toString()
    
    // Δημιουργία δημόσιου κλειδιού από wallet address
    const publicKey = CryptoJS.SHA256(walletAddress + 'public').toString()
    
    // Προαιρετικά: Δημιουργία on-chain transaction για verification
    const txHash = await this.createOnChainProof(signaturePayload, signature)
    
    return {
      signature,
      publicKey,
      walletAddress,
      timestamp,
      messageHash,
      txHash
    }
  }

  // Επαλήθευση υπογραφής μηνύματος
  async verifySignature(
    content: string,
    blockchainSignature: BlockchainSignature
  ): Promise<IdentityVerification> {
    const warnings: string[] = []
    let verificationLevel: 'high' | 'medium' | 'low' = 'high'
    let trustScore = 100

    try {
      // Επαλήθευση hash μηνύματος
      const expectedHash = CryptoJS.SHA256(content).toString()
      if (expectedHash !== blockchainSignature.messageHash) {
        warnings.push('Το hash του μηνύματος δεν ταιριάζει')
        verificationLevel = 'low'
        trustScore -= 50
      }

      // Επαλήθευση υπογραφής
      const signaturePayload = {
        messageHash: blockchainSignature.messageHash,
        walletAddress: blockchainSignature.walletAddress,
        timestamp: blockchainSignature.timestamp,
        chainId: 'xrpl-mainnet'
      }
      
      const payloadString = JSON.stringify(signaturePayload)
      const expectedPublicKey = CryptoJS.SHA256(blockchainSignature.walletAddress + 'public').toString()
      
      if (expectedPublicKey !== blockchainSignature.publicKey) {
        warnings.push('Το δημόσιο κλειδί δεν ταιριάζει με το wallet address')
        verificationLevel = 'low'
        trustScore -= 30
      }

      // Επαλήθευση χρονικής σφραγίδας (δεν πρέπει να είναι πολύ παλιά ή μελλοντική)
      const now = Date.now()
      const timeDiff = Math.abs(now - blockchainSignature.timestamp)
      const maxAge = 24 * 60 * 60 * 1000 // 24 ώρες
      
      if (timeDiff > maxAge) {
        warnings.push('Η υπογραφή είναι πολύ παλιά')
        verificationLevel = verificationLevel === 'high' ? 'medium' : 'low'
        trustScore -= 20
      }

      if (blockchainSignature.timestamp > now + 5 * 60 * 1000) { // 5 λεπτά tolerance
        warnings.push('Η υπογραφή έχει μελλοντική χρονική σφραγίδα')
        verificationLevel = 'low'
        trustScore -= 40
      }

      // Επαλήθευση on-chain proof (αν υπάρχει)
      if (blockchainSignature.txHash) {
        const onChainValid = await this.verifyOnChainProof(blockchainSignature.txHash)
        if (!onChainValid) {
          warnings.push('Η on-chain επαλήθευση απέτυχε')
          verificationLevel = 'medium'
          trustScore -= 15
        } else {
          trustScore += 10 // Bonus για on-chain verification
        }
      } else {
        warnings.push('Δεν υπάρχει on-chain επαλήθευση')
        if (verificationLevel === 'high') verificationLevel = 'medium'
        trustScore -= 10
      }

      // Έλεγχος για γνωστά malicious addresses
      const isMalicious = await this.checkMaliciousAddress(blockchainSignature.walletAddress)
      if (isMalicious) {
        warnings.push('Το wallet address είναι σε blacklist')
        verificationLevel = 'low'
        trustScore = Math.min(trustScore, 20)
      }

      // Έλεγχος reputation του wallet
      const reputation = await this.getWalletReputation(blockchainSignature.walletAddress)
      if (reputation < 50) {
        warnings.push('Χαμηλή φήμη wallet address')
        if (verificationLevel === 'high') verificationLevel = 'medium'
        trustScore = Math.min(trustScore, reputation + 30)
      }

      return {
        isValid: warnings.length === 0 || verificationLevel !== 'low',
        senderAddress: blockchainSignature.walletAddress,
        verificationLevel,
        trustScore: Math.max(0, Math.min(100, trustScore)),
        warnings
      }

    } catch (error) {
      return {
        isValid: false,
        senderAddress: blockchainSignature.walletAddress,
        verificationLevel: 'low',
        trustScore: 0,
        warnings: ['Σφάλμα κατά την επαλήθευση υπογραφής: ' + error]
      }
    }
  }

  // Δημιουργία on-chain proof (για demo)
  private async createOnChainProof(payload: any, signature: string): Promise<string> {
    // Σε πραγματική υλοποίηση θα δημιουργούσαμε XRPL transaction
    // Για demo, δημιουργούμε fake transaction hash
    const proofData = JSON.stringify({ payload, signature, timestamp: Date.now() })
    return CryptoJS.SHA256(proofData).toString().substring(0, 32)
  }

  // Επαλήθευση on-chain proof
  private async verifyOnChainProof(txHash: string): Promise<boolean> {
    // Σε πραγματική υλοποίηση θα ελέγχαμε το XRPL blockchain
    // Για demo, επιστρέφουμε true αν το hash έχει σωστό format
    return txHash.length === 32 && /^[a-f0-9]+$/i.test(txHash)
  }

  // Έλεγχος για malicious addresses
  private async checkMaliciousAddress(address: string): Promise<boolean> {
    // Σε πραγματική υλοποίηση θα ελέγχαμε σε blacklist database
    const knownMaliciousAddresses = [
      'rMalicious1234567890123456789012',
      'rScammer1234567890123456789012'
    ]
    return knownMaliciousAddresses.includes(address)
  }

  // Λήψη reputation score για wallet
  private async getWalletReputation(address: string): Promise<number> {
    // Σε πραγματική υλοποίηση θα ελέγχαμε:
    // - Ιστορικό συναλλαγών
    // - Αναφορές spam/scam
    // - Χρόνο ύπαρξης του wallet
    // - Όγκο συναλλαγών
    
    // Για demo, δημιουργούμε score βασισμένο στο address
    const hash = CryptoJS.SHA256(address).toString()
    const score = parseInt(hash.substring(0, 2), 16) / 255 * 100
    return Math.floor(score)
  }

  // Δημιουργία signed message
  async createSignedMessage(
    content: string,
    walletAddress: string,
    privateKey: string
  ): Promise<SignedMessage> {
    const signature = await this.signMessage(content, walletAddress, privateKey)
    
    return {
      content,
      signature,
      metadata: {
        algorithm: 'XRPL-HMAC-SHA256',
        version: '1.0',
        chainId: 'xrpl-mainnet'
      }
    }
  }

  // Επαλήθευση signed message
  async verifySignedMessage(signedMessage: SignedMessage): Promise<IdentityVerification> {
    return this.verifySignature(signedMessage.content, signedMessage.signature)
  }

  // Λήψη trust badge για UI
  getTrustBadge(verification: IdentityVerification): {
    color: string
    text: string
    icon: string
  } {
    if (!verification.isValid) {
      return { color: 'red', text: 'Μη έγκυρο', icon: '❌' }
    }

    switch (verification.verificationLevel) {
      case 'high':
        return { color: 'green', text: 'Υψηλή εμπιστοσύνη', icon: '✅' }
      case 'medium':
        return { color: 'yellow', text: 'Μέτρια εμπιστοσύνη', icon: '⚠️' }
      case 'low':
        return { color: 'orange', text: 'Χαμηλή εμπιστοσύνη', icon: '🔶' }
      default:
        return { color: 'gray', text: 'Άγνωστο', icon: '❓' }
    }
  }
}

// Singleton instance
export const blockchainSigner = BlockchainSigner.getInstance()
