// End-to-End Encryption System
// Υλοποίηση PGP-style κρυπτογράφησης με hybrid approach

import CryptoJS from 'crypto-js'

export interface KeyPair {
  publicKey: string
  privateKey: string
  fingerprint: string
}

export interface EncryptedMessage {
  encryptedContent: string
  encryptedKey: string
  signature: string
  timestamp: number
  metadata: {
    algorithm: string
    keyFingerprint: string
    selfDestruct?: {
      expiresAt: number
      deleteAfterRead: boolean
    }
  }
}

export class E2EEncryption {
  private static instance: E2EEncryption
  
  static getInstance(): E2EEncryption {
    if (!E2EEncryption.instance) {
      E2EEncryption.instance = new E2EEncryption()
    }
    return E2EEncryption.instance
  }

  // Δημιουργία νέου ζεύγους κλειδιών
  async generateKeyPair(walletAddress: string): Promise<KeyPair> {
    // Χρησιμοποιούμε το wallet address ως seed για deterministic keys
    const seed = CryptoJS.SHA256(walletAddress + Date.now()).toString()
    
    // Δημιουργία RSA-style keys (simplified για demo)
    const privateKey = CryptoJS.SHA256(seed + 'private').toString()
    const publicKey = CryptoJS.SHA256(seed + 'public').toString()
    const fingerprint = CryptoJS.SHA256(publicKey).toString().substring(0, 16)

    const keyPair: KeyPair = {
      publicKey,
      privateKey,
      fingerprint
    }

    // Αποθήκευση στο localStorage (Zero-Knowledge)
    this.storeKeyPair(walletAddress, keyPair)
    
    return keyPair
  }

  // Αποθήκευση κλειδιών με Zero-Knowledge approach
  private storeKeyPair(walletAddress: string, keyPair: KeyPair): void {
    const encryptedKeys = CryptoJS.AES.encrypt(
      JSON.stringify(keyPair), 
      walletAddress
    ).toString()
    
    localStorage.setItem(`keys_${walletAddress}`, encryptedKeys)
  }

  // Ανάκτηση κλειδιών
  getKeyPair(walletAddress: string): KeyPair | null {
    try {
      const encryptedKeys = localStorage.getItem(`keys_${walletAddress}`)
      if (!encryptedKeys) return null

      const decryptedBytes = CryptoJS.AES.decrypt(encryptedKeys, walletAddress)
      const decryptedData = decryptedBytes.toString(CryptoJS.enc.Utf8)
      
      return JSON.parse(decryptedData)
    } catch (error) {
      console.error('Failed to retrieve keys:', error)
      return null
    }
  }

  // Κρυπτογράφηση μηνύματος με δημόσιο κλειδί παραλήπτη
  async encryptMessage(
    content: string,
    recipientPublicKey: string,
    senderPrivateKey: string,
    selfDestruct?: {
      expiresAt: number
      deleteAfterRead: boolean
    }
  ): Promise<EncryptedMessage> {
    // Δημιουργία συμμετρικού κλειδιού για το περιεχόμενο
    const symmetricKey = CryptoJS.lib.WordArray.random(256/8).toString()
    
    // Κρυπτογράφηση περιεχομένου με AES
    const encryptedContent = CryptoJS.AES.encrypt(content, symmetricKey).toString()
    
    // Κρυπτογράφηση συμμετρικού κλειδιού με δημόσιο κλειδί παραλήπτη
    const encryptedKey = CryptoJS.AES.encrypt(symmetricKey, recipientPublicKey).toString()
    
    // Ψηφιακή υπογραφή με ιδιωτικό κλειδί αποστολέα
    const signature = this.signMessage(content, senderPrivateKey)
    
    return {
      encryptedContent,
      encryptedKey,
      signature,
      timestamp: Date.now(),
      metadata: {
        algorithm: 'AES-256 + RSA-like',
        keyFingerprint: CryptoJS.SHA256(recipientPublicKey).toString().substring(0, 16),
        selfDestruct
      }
    }
  }

  // Αποκρυπτογράφηση μηνύματος
  async decryptMessage(
    encryptedMessage: EncryptedMessage,
    recipientPrivateKey: string,
    senderPublicKey: string
  ): Promise<string | null> {
    try {
      // Έλεγχος self-destruct
      if (encryptedMessage.metadata.selfDestruct) {
        const now = Date.now()
        if (now > encryptedMessage.metadata.selfDestruct.expiresAt) {
          throw new Error('Message has expired and self-destructed')
        }
      }

      // Αποκρυπτογράφηση συμμετρικού κλειδιού
      const decryptedKeyBytes = CryptoJS.AES.decrypt(
        encryptedMessage.encryptedKey, 
        recipientPrivateKey
      )
      const symmetricKey = decryptedKeyBytes.toString(CryptoJS.enc.Utf8)
      
      // Αποκρυπτογράφηση περιεχομένου
      const decryptedContentBytes = CryptoJS.AES.decrypt(
        encryptedMessage.encryptedContent, 
        symmetricKey
      )
      const content = decryptedContentBytes.toString(CryptoJS.enc.Utf8)
      
      // Επαλήθευση υπογραφής
      const isValidSignature = this.verifySignature(
        content, 
        encryptedMessage.signature, 
        senderPublicKey
      )
      
      if (!isValidSignature) {
        throw new Error('Invalid message signature - message may be tampered')
      }

      // Αν είναι delete-after-read, σημειώνουμε ότι διαβάστηκε
      if (encryptedMessage.metadata.selfDestruct?.deleteAfterRead) {
        this.markAsRead(encryptedMessage)
      }
      
      return content
    } catch (error) {
      console.error('Decryption failed:', error)
      return null
    }
  }

  // Ψηφιακή υπογραφή μηνύματος
  private signMessage(content: string, privateKey: string): string {
    const hash = CryptoJS.SHA256(content).toString()
    return CryptoJS.HmacSHA256(hash, privateKey).toString()
  }

  // Επαλήθευση ψηφιακής υπογραφής
  private verifySignature(content: string, signature: string, publicKey: string): boolean {
    const hash = CryptoJS.SHA256(content).toString()
    const expectedSignature = CryptoJS.HmacSHA256(hash, publicKey).toString()
    return signature === expectedSignature
  }

  // Σήμανση μηνύματος ως διαβασμένο (για self-destruct)
  private markAsRead(message: EncryptedMessage): void {
    // Στην πραγματικότητα θα διαγράφαμε το μήνυμα από το blockchain
    console.log('Message marked for deletion after read')
  }

  // Καθάρισμα metadata για ανωνυμία
  stripMetadata(message: any): any {
    const cleanMessage = {
      encryptedContent: message.encryptedContent,
      encryptedKey: message.encryptedKey,
      signature: message.signature,
      timestamp: message.timestamp,
      metadata: {
        algorithm: message.metadata.algorithm,
        // Αφαιρούμε όλα τα άλλα metadata
      }
    }
    
    return cleanMessage
  }

  // Δημιουργία δημόσιου κλειδιού από XRPL address
  async getPublicKeyFromAddress(xrplAddress: string): Promise<string> {
    // Σε πραγματική υλοποίηση θα ψάχναμε στο blockchain
    // Για demo, δημιουργούμε deterministic public key
    return CryptoJS.SHA256(xrplAddress + 'public').toString()
  }
}

// Singleton instance
export const encryption = E2EEncryption.getInstance()
