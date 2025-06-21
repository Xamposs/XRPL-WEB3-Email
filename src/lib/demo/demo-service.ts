// Demo service for testing email functionality
export class DemoService {
  private static STORAGE_KEY = 'xrpl-legacy-emails'
  
  private static getStoredEmails(): any[] {
    try {
      return JSON.parse(localStorage.getItem(this.STORAGE_KEY) || '[]')
    } catch (error) {
      console.error('Error parsing stored emails:', error)
      localStorage.removeItem(this.STORAGE_KEY) // Clear corrupted data
      return []
    }
  }

  private static saveEmails(emails: any[]): void {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(emails))
    } catch (error) {
      console.error('Error saving emails:', error)
      throw new Error('Failed to save emails to storage')
    }
  }

  static async sendDemoEmail(emailData: {
    from: string
    to: string
    subject: string
    content: string
    securityLevel: string
    encrypted: boolean
    selfDestruct?: any
  }) {
    try {
      // Simulate email sending process
      console.log('🚀 Demo: Sending email...')
      console.log('📧 From:', emailData.from)
      console.log('📨 To:', emailData.to)
      console.log('📝 Subject:', emailData.subject)
      console.log('🔒 Security Level:', emailData.securityLevel)
      
      // Get existing emails from localStorage
      const existingEmails = this.getStoredEmails()
      
      // Add new email
      const email = {
        id: Date.now().toString() + '_' + Math.random().toString(36).substr(2, 9),
        ...emailData,
        timestamp: new Date().toISOString(),
        txHash: '0x' + Math.random().toString(16).substr(2, 16),
        read: false
      }
      
      existingEmails.push(email)
      this.saveEmails(existingEmails)
      
      // Simulate blockchain transaction
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      console.log('✅ Demo: Email sent successfully!')
      console.log('⛓️ TX Hash:', email.txHash)
      
      return email
    } catch (error) {
      console.error('Failed to send demo email:', error)
      throw error
    }
  }

  static getReceivedEmails(address: string) {
    try {
      const emails = this.getStoredEmails()
      return emails.filter(email => email.to === address)
    } catch (error) {
      console.error('Failed to get received emails:', error)
      return []
    }
  }

  static getSentEmails(address: string) {
    try {
      const emails = this.getStoredEmails()
      return emails.filter(email => email.from === address)
    } catch (error) {
      console.error('Failed to get sent emails:', error)
      return []
    }
  }

  static deleteEmail(emailId: string): void {
    try {
      const emails = this.getStoredEmails()
      const updatedEmails = emails.filter(email => email.id !== emailId)
      this.saveEmails(updatedEmails)
    } catch (error) {
      console.error('Failed to delete email:', error)
      throw error
    }
  }

  static updateEmailStatus(emailId: string, updates: Partial<any>): void {
    try {
      const emails = this.getStoredEmails()
      const emailIndex = emails.findIndex(email => email.id === emailId)
      if (emailIndex !== -1) {
        emails[emailIndex] = { ...emails[emailIndex], ...updates }
        this.saveEmails(emails)
      }
    } catch (error) {
      console.error('Failed to update email status:', error)
      throw error
    }
  }

  static clearAllEmails(): void {
    try {
      localStorage.removeItem(this.STORAGE_KEY)
    } catch (error) {
      console.error('Failed to clear emails:', error)
    }
  }
}
