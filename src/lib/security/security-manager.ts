// Security Manager - Ενοποίηση όλων των συστημάτων ασφάλειας
// Κεντρικό σύστημα διαχείρισης ασφάλειας και απορρήτου

import { encryption, E2EEncryption, EncryptedMessage, KeyPair } from './encryption'
import { selfDestructManager, SelfDestructManager, SelfDestructConfig } from './self-destruct'
import { blockchainSigner, BlockchainSigner, BlockchainSignature, IdentityVerification } from './blockchain-signing'
import { metadataStripper, MetadataStripper, MetadataConfig, CleanedMessage } from './metadata-stripper'

export interface SecureEmailConfig {
  encryption: {
    enabled: boolean
    algorithm: 'AES-256' | 'PGP' | 'HYBRID'
  }
  selfDestruct: SelfDestructConfig
  blockchainSigning: {
    enabled: boolean
    requireOnChainProof: boolean
  }
  metadataStripping: MetadataConfig
  zeroKnowledge: {
    enabled: boolean
    serverSideEncryption: boolean
  }
}

export interface SecureEmail {
  id: string
  encryptedMessage: EncryptedMessage
  blockchainSignature: BlockchainSignature
  cleanedMetadata: CleanedMessage
  securityLevel: 'maximum' | 'high' | 'medium' | 'basic'
  verificationStatus: IdentityVerification
  selfDestructInfo?: any
}

export interface SecurityReport {
  encryptionStatus: 'encrypted' | 'not_encrypted'
  signatureStatus: 'verified' | 'invalid' | 'not_signed'
  anonymityLevel: 'high' | 'medium' | 'low'
  selfDestructStatus: 'active' | 'expired' | 'disabled'
  overallSecurity: 'maximum' | 'high' | 'medium' | 'low'
  warnings: string[]
  recommendations: string[]
}

export class SecurityManager {
  private static instance: SecurityManager
  private encryptionService: E2EEncryption
  private selfDestructService: SelfDestructManager
  private signingService: BlockchainSigner
  private metadataService: MetadataStripper

  private constructor() {
    this.encryptionService = encryption
    this.selfDestructService = selfDestructManager
    this.signingService = blockchainSigner
    this.metadataService = metadataStripper
  }

  static getInstance(): SecurityManager {
    if (!SecurityManager.instance) {
      SecurityManager.instance = new SecurityManager()
    }
    return SecurityManager.instance
  }

  // Δημιουργία πλήρως ασφαλούς email
  async createSecureEmail(
    content: string,
    recipientAddress: string,
    senderAddress: string,
    senderPrivateKey: string,
    config: SecureEmailConfig
  ): Promise<SecureEmail> {
    const emailId = this.generateSecureId()

    // 1. Καθάρισμα metadata για ανωνυμία
    const rawMessage = {
      id: emailId,
      content,
      from: senderAddress,
      to: recipientAddress,
      timestamp: Date.now()
    }

    const cleanedMessage = await this.metadataService.stripAllMetadata(
      rawMessage,
      config.metadataStripping
    )

    // 2. Blockchain signing για πιστοποίηση ταυτότητας
    let blockchainSignature: BlockchainSignature
    if (config.blockchainSigning.enabled) {
      blockchainSignature = await this.signingService.signMessage(
        content,
        senderAddress,
        senderPrivateKey
      )
    } else {
      // Δημιουργία dummy signature
      blockchainSignature = {
        signature: '',
        publicKey: '',
        walletAddress: senderAddress,
        timestamp: Date.now(),
        messageHash: ''
      }
    }

    // 3. End-to-End Encryption
    let encryptedMessage: EncryptedMessage
    if (config.encryption.enabled) {
      const recipientPublicKey = await this.encryptionService.getPublicKeyFromAddress(recipientAddress)
      
      encryptedMessage = await this.encryptionService.encryptMessage(
        content,
        recipientPublicKey,
        senderPrivateKey,
        config.selfDestruct.enabled ? {
          expiresAt: Date.now() + (config.selfDestruct.expiresAfter || 0),
          deleteAfterRead: config.selfDestruct.deleteAfterRead || false
        } : undefined
      )
    } else {
      // Δημιουργία dummy encrypted message
      encryptedMessage = {
        encryptedContent: content,
        encryptedKey: '',
        signature: '',
        timestamp: Date.now(),
        metadata: {
          algorithm: 'none',
          keyFingerprint: ''
        }
      }
    }

    // 4. Self-Destruct setup
    let selfDestructInfo
    if (config.selfDestruct.enabled) {
      selfDestructInfo = this.selfDestructService.createSelfDestructMessage(
        emailId,
        config.selfDestruct
      )
    }

    // 5. Επαλήθευση υπογραφής
    const verificationStatus = config.blockchainSigning.enabled
      ? await this.signingService.verifySignature(content, blockchainSignature)
      : {
          isValid: false,
          senderAddress,
          verificationLevel: 'low' as const,
          trustScore: 0,
          warnings: ['Blockchain signing disabled']
        }

    // 6. Υπολογισμός επιπέδου ασφάλειας
    const securityLevel = this.calculateSecurityLevel(config, verificationStatus)

    const secureEmail: SecureEmail = {
      id: emailId,
      encryptedMessage,
      blockchainSignature,
      cleanedMetadata: cleanedMessage,
      securityLevel,
      verificationStatus,
      selfDestructInfo
    }

    // 7. Zero-Knowledge Storage
    if (config.zeroKnowledge.enabled) {
      await this.storeWithZeroKnowledge(secureEmail, senderAddress)
    }

    return secureEmail
  }

  // Ανάγνωση ασφαλούς email
  async readSecureEmail(
    secureEmail: SecureEmail,
    readerAddress: string,
    readerPrivateKey: string
  ): Promise<{ content: string; report: SecurityReport } | null> {
    try {
      // 1. Έλεγχος self-destruct
      if (secureEmail.selfDestructInfo) {
        const canRead = this.selfDestructService.canReadMessage(secureEmail.id)
        if (!canRead.canRead) {
          throw new Error(canRead.reason || 'Message cannot be read')
        }
        
        // Καταγραφή ανάγνωσης
        this.selfDestructService.recordMessageRead(secureEmail.id)
      }

      // 2. Αποκρυπτογράφηση
      const senderPublicKey = await this.encryptionService.getPublicKeyFromAddress(
        secureEmail.blockchainSignature.walletAddress
      )
      
      const decryptedContent = await this.encryptionService.decryptMessage(
        secureEmail.encryptedMessage,
        readerPrivateKey,
        senderPublicKey
      )

      if (!decryptedContent) {
        throw new Error('Failed to decrypt message')
      }

      // 3. Δημιουργία security report
      const report = this.generateSecurityReport(secureEmail)

      return {
        content: decryptedContent,
        report
      }

    } catch (error) {
      console.error('Failed to read secure email:', error)
      return null
    }
  }

  // Δημιουργία security report
  private generateSecurityReport(secureEmail: SecureEmail): SecurityReport {
    const warnings: string[] = []
    const recommendations: string[] = []

    // Έλεγχος κρυπτογράφησης
    const encryptionStatus = secureEmail.encryptedMessage.encryptedContent ? 'encrypted' : 'not_encrypted'
    if (encryptionStatus === 'not_encrypted') {
      warnings.push('Το μήνυμα δεν είναι κρυπτογραφημένο')
      recommendations.push('Ενεργοποιήστε την κρυπτογράφηση για μέγιστη ασφάλεια')
    }

    // Έλεγχος υπογραφής
    const signatureStatus = secureEmail.verificationStatus.isValid ? 'verified' : 
                           secureEmail.blockchainSignature.signature ? 'invalid' : 'not_signed'
    
    if (signatureStatus === 'invalid') {
      warnings.push('Η ψηφιακή υπογραφή δεν είναι έγκυρη')
    } else if (signatureStatus === 'not_signed') {
      warnings.push('Το μήνυμα δεν έχει ψηφιακή υπογραφή')
      recommendations.push('Χρησιμοποιήστε blockchain signing για πιστοποίηση')
    }

    // Έλεγχος ανωνυμίας
    const anonymityLevel = secureEmail.cleanedMetadata.anonymityLevel
    if (anonymityLevel === 'low') {
      warnings.push('Χαμηλό επίπεδο ανωνυμίας')
      recommendations.push('Ενεργοποιήστε περισσότερες επιλογές metadata stripping')
    }

    // Έλεγχος self-destruct
    const selfDestructStatus = secureEmail.selfDestructInfo ? 
      (secureEmail.selfDestructInfo.isExpired ? 'expired' : 'active') : 'disabled'

    // Υπολογισμός συνολικής ασφάλειας
    const overallSecurity = this.calculateOverallSecurity(
      encryptionStatus,
      signatureStatus,
      anonymityLevel,
      selfDestructStatus
    )

    return {
      encryptionStatus,
      signatureStatus,
      anonymityLevel,
      selfDestructStatus,
      overallSecurity,
      warnings,
      recommendations
    }
  }

  // Υπολογισμός επιπέδου ασφάλειας
  private calculateSecurityLevel(
    config: SecureEmailConfig,
    verification: IdentityVerification
  ): 'maximum' | 'high' | 'medium' | 'basic' {
    let score = 0

    if (config.encryption.enabled) score += 30
    if (config.blockchainSigning.enabled) score += 25
    if (config.selfDestruct.enabled) score += 20
    if (config.metadataStripping.stripTimestamps) score += 10
    if (config.metadataStripping.stripIPAddresses) score += 10
    if (config.zeroKnowledge.enabled) score += 5

    if (verification.verificationLevel === 'high') score += 10
    else if (verification.verificationLevel === 'medium') score += 5

    if (score >= 90) return 'maximum'
    if (score >= 70) return 'high'
    if (score >= 50) return 'medium'
    return 'basic'
  }

  // Υπολογισμός συνολικής ασφάλειας
  private calculateOverallSecurity(
    encryption: string,
    signature: string,
    anonymity: string,
    selfDestruct: string
  ): 'maximum' | 'high' | 'medium' | 'low' {
    let score = 0

    if (encryption === 'encrypted') score += 40
    if (signature === 'verified') score += 30
    if (anonymity === 'high') score += 20
    else if (anonymity === 'medium') score += 10
    if (selfDestruct === 'active') score += 10

    if (score >= 90) return 'maximum'
    if (score >= 70) return 'high'
    if (score >= 50) return 'medium'
    return 'low'
  }

  // Zero-Knowledge Storage
  private async storeWithZeroKnowledge(secureEmail: SecureEmail, userAddress: string): Promise<void> {
    // Κρυπτογράφηση με user-specific key
    const userKey = await this.deriveUserKey(userAddress)
    // Αποθήκευση στο localStorage με κρυπτογράφηση
    // Σε πραγματική υλοποίηση θα αποθηκεύαμε σε decentralized storage
  }

  // Παραγωγή user-specific key
  private async deriveUserKey(userAddress: string): Promise<string> {
    // Παραγωγή κλειδιού από wallet address
    return userAddress // Simplified για demo
  }

  // Δημιουργία ασφαλούς ID
  private generateSecureId(): string {
    return 'secure_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9)
  }

  // Προκαθορισμένες ρυθμίσεις ασφάλειας
  static getSecurityPresets() {
    return {
      maximum: {
        encryption: { enabled: true, algorithm: 'HYBRID' as const },
        selfDestruct: { enabled: true, expiresAfter: 24 * 60 * 60 * 1000, deleteAfterRead: true, maxReads: 1 },
        blockchainSigning: { enabled: true, requireOnChainProof: true },
        metadataStripping: {
          stripTimestamps: true,
          stripIPAddresses: true,
          stripUserAgent: true,
          stripDeviceInfo: true,
          stripLocationData: true,
          stripFileMetadata: true,
          anonymizeHeaders: true,
          useRandomDelay: true
        },
        zeroKnowledge: { enabled: true, serverSideEncryption: true }
      },
      high: {
        encryption: { enabled: true, algorithm: 'AES-256' as const },
        selfDestruct: { enabled: true, expiresAfter: 7 * 24 * 60 * 60 * 1000, deleteAfterRead: false, maxReads: 5 },
        blockchainSigning: { enabled: true, requireOnChainProof: false },
        metadataStripping: {
          stripTimestamps: true,
          stripIPAddresses: true,
          stripUserAgent: true,
          stripDeviceInfo: false,
          stripLocationData: true,
          stripFileMetadata: true,
          anonymizeHeaders: true,
          useRandomDelay: false
        },
        zeroKnowledge: { enabled: true, serverSideEncryption: false }
      },
      medium: {
        encryption: { enabled: true, algorithm: 'AES-256' as const },
        selfDestruct: { enabled: false },
        blockchainSigning: { enabled: true, requireOnChainProof: false },
        metadataStripping: {
          stripTimestamps: false,
          stripIPAddresses: true,
          stripUserAgent: false,
          stripDeviceInfo: false,
          stripLocationData: false,
          stripFileMetadata: false,
          anonymizeHeaders: false,
          useRandomDelay: false
        },
        zeroKnowledge: { enabled: false, serverSideEncryption: false }
      }
    }
  }
}

// Singleton instance
export const securityManager = SecurityManager.getInstance()
