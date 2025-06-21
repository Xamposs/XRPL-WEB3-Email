import CryptoJS from 'crypto-js'

export class EmailEncryption {
  private static generateKey(senderAddress: string, recipientAddress: string): string {
    // Generate a deterministic key based on both addresses
    const combined = [senderAddress, recipientAddress].sort().join('')
    return CryptoJS.SHA256(combined).toString()
  }

  static encrypt(
    content: string,
    senderAddress: string,
    recipientAddress: string
  ): string {
    try {
      const key = this.generateKey(senderAddress, recipientAddress)
      const encrypted = CryptoJS.AES.encrypt(content, key).toString()
      return encrypted
    } catch (error) {
      throw new Error(`Failed to encrypt content: ${error}`)
    }
  }

  static decrypt(
    encryptedContent: string,
    senderAddress: string,
    recipientAddress: string
  ): string {
    try {
      const key = this.generateKey(senderAddress, recipientAddress)
      const decrypted = CryptoJS.AES.decrypt(encryptedContent, key)
      const plaintext = decrypted.toString(CryptoJS.enc.Utf8)
      
      if (!plaintext) {
        throw new Error('Failed to decrypt content - invalid key or corrupted data')
      }
      
      return plaintext
    } catch (error) {
      throw new Error(`Failed to decrypt content: ${error}`)
    }
  }

  static encryptEmailData(
    subject: string,
    content: string,
    senderAddress: string,
    recipientAddress: string
  ): { encryptedSubject: string; encryptedContent: string } {
    return {
      encryptedSubject: this.encrypt(subject, senderAddress, recipientAddress),
      encryptedContent: this.encrypt(content, senderAddress, recipientAddress)
    }
  }

  static decryptEmailData(
    encryptedSubject: string,
    encryptedContent: string,
    senderAddress: string,
    recipientAddress: string
  ): { subject: string; content: string } {
    return {
      subject: this.decrypt(encryptedSubject, senderAddress, recipientAddress),
      content: this.decrypt(encryptedContent, senderAddress, recipientAddress)
    }
  }
}
