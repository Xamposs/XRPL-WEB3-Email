import { Client, Payment } from 'xrpl'
import { EmailMessage } from '../wallets/types'
import { EmailEncryption } from './encryption'
import { generateEmailId } from '../utils'

// Interface για ενιαία διαχείριση email services
export interface IEmailService {
  sendEmail(fromAddress: string, toAddress: string, subject: string, content: string, signTransaction?: (tx: any) => Promise<any>): Promise<string>
  getEmails(address: string): Promise<EmailMessage[]>
  getSentEmails?(address: string): Promise<EmailMessage[]>
  getReceivedEmails?(address: string): Promise<EmailMessage[]>
  deleteEmail?(emailId: string): Promise<void>
}

export class EmailService implements IEmailService {
  private client: Client

  constructor(serverUrl: string = 'wss://s.altnet.rippletest.net:51233') {
    this.client = new Client(serverUrl)
  }

  async connect(): Promise<void> {
    try {
      if (!this.client.isConnected()) {
        await this.client.connect()
      }
    } catch (error) {
      throw new Error(`Failed to connect to XRPL: ${error}`)
    }
  }

  async disconnect(): Promise<void> {
    try {
      if (this.client.isConnected()) {
        await this.client.disconnect()
      }
    } catch (error) {
      console.error('Error disconnecting from XRPL:', error)
    }
  }

  async sendEmail(
    fromAddress: string,
    toAddress: string,
    subject: string,
    content: string,
    signTransaction: (tx: any) => Promise<any>
  ): Promise<string> {
    if (!signTransaction) {
      throw new Error('signTransaction function is required for XRPL email service')
    }

    await this.connect()

    try {
      // Encrypt the email content
      const { encryptedSubject, encryptedContent } = EmailEncryption.encryptEmailData(
        subject,
        content,
        fromAddress,
        toAddress
      )

      // Create email metadata
      const emailData = {
        id: generateEmailId(),
        from: fromAddress,
        to: toAddress,
        subject: encryptedSubject,
        content: encryptedContent,
        timestamp: Date.now(),
        encrypted: true
      }

      // Create memo with email data
      const memoData = JSON.stringify(emailData)
      const memo = {
        Memo: {
          MemoType: Buffer.from('email', 'utf8').toString('hex').toUpperCase(),
          MemoData: Buffer.from(memoData, 'utf8').toString('hex').toUpperCase()
        }
      }

      // Create payment transaction (minimal amount to include memo)
      const payment: Payment = {
        TransactionType: 'Payment',
        Account: fromAddress,
        Destination: toAddress,
        Amount: '1', // 1 drop (0.000001 XRP)
        Memos: [memo]
      }

      // Prepare and sign transaction
      const prepared = await this.client.autofill(payment)
      const signed = await signTransaction(prepared)

      // Submit transaction
      const result = await this.client.submitAndWait(signed.tx_blob)

      if (result.result.meta && typeof result.result.meta === 'object' && 'TransactionResult' in result.result.meta) {
        if (result.result.meta.TransactionResult === 'tesSUCCESS') {
          return result.result.hash
        } else {
          throw new Error(`Transaction failed: ${result.result.meta.TransactionResult}`)
        }
      }

      throw new Error('Transaction result unclear')
    } catch (error) {
      throw new Error(`Failed to send email: ${error}`)
    }
  }

  async getEmails(address: string): Promise<EmailMessage[]> {
    await this.connect()

    try {
      // Get account transactions
      const response = await this.client.request({
        command: 'account_tx',
        account: address,
        limit: 100
      })

      const emails: EmailMessage[] = []

      for (const tx of response.result.transactions) {
        if (tx.tx && (tx.tx as any).TransactionType === 'Payment' && (tx.tx as any).Memos) {
          for (const memo of (tx.tx as any).Memos) {
            if (memo.Memo && memo.Memo.MemoType) {
              const memoType = Buffer.from(memo.Memo.MemoType, 'hex').toString('utf8')

              if (memoType === 'email' && memo.Memo.MemoData) {
                try {
                  const memoData = Buffer.from(memo.Memo.MemoData, 'hex').toString('utf8')
                  const emailData = JSON.parse(memoData)

                  // Decrypt email if current user is sender or recipient
                  if (emailData.encrypted && (emailData.from === address || emailData.to === address)) {
                    try {
                      const { subject, content } = EmailEncryption.decryptEmailData(
                        emailData.subject,
                        emailData.content,
                        emailData.from,
                        emailData.to
                      )

                      emails.push({
                        ...emailData,
                        subject,
                        content,
                        txHash: (tx.tx as any).hash
                      })
                    } catch (decryptError) {
                      // If decryption fails, add email with encrypted content
                      emails.push({
                        ...emailData,
                        txHash: (tx.tx as any).hash
                      })
                    }
                  } else {
                    emails.push({
                      ...emailData,
                      txHash: (tx.tx as any).hash
                    })
                  }
                } catch (parseError) {
                  // Skip invalid email data
                  continue
                }
              }
            }
          }
        }
      }

      // Sort by timestamp (newest first)
      return emails.sort((a, b) => b.timestamp - a.timestamp)
    } catch (error) {
      throw new Error(`Failed to get emails: ${error}`)
    }
  }

  async getSentEmails(address: string): Promise<EmailMessage[]> {
    const allEmails = await this.getEmails(address)
    return allEmails.filter(email => email.from === address)
  }

  async getReceivedEmails(address: string): Promise<EmailMessage[]> {
    const allEmails = await this.getEmails(address)
    return allEmails.filter(email => email.to === address)
  }
}

// Demo Service για τοπική ανάπτυξη
export class DemoEmailService implements IEmailService {
  private readonly EMAILS_KEY = 'xrpl_emails' // Αλλάζουμε σε απλό key
  // Αφαιρούμε τα άχρηστα keys
  // private readonly SENT_EMAILS_KEY = 'xrpl_demo_sent_emails'
  // private readonly RECEIVED_EMAILS_KEY = 'xrpl_demo_received_emails'
  // private readonly TRASHED_EMAILS_KEY = 'xrpl_demo_trashed_emails'

  private getStoredEmails(): EmailMessage[] {
    try {
      const stored = localStorage.getItem(this.EMAILS_KEY)
      console.log('📥 Loading emails from localStorage:', stored) // Προσθέτουμε logging
      return stored ? JSON.parse(stored) : []
    } catch (error) {
      console.error('Error reading emails from localStorage:', error)
      return []
    }
  }

  private saveEmails(emails: EmailMessage[]): void {
    try {
      console.log('💾 Saving emails to localStorage:', emails) // Προσθέτουμε logging
      localStorage.setItem(this.EMAILS_KEY, JSON.stringify(emails))
    } catch (error) {
      console.error('Error saving emails to localStorage:', error)
      throw new Error('Failed to save emails')
    }
  }

  async sendEmail(
    fromAddress: string,
    toAddress: string,
    subject: string,
    content: string
  ): Promise<string> {
    try {
      const emails = this.getStoredEmails()
      const newEmail: EmailMessage = {
        id: generateEmailId(),
        from: fromAddress,
        to: toAddress,
        subject,
        content,
        timestamp: Date.now(),
        encrypted: false
      }

      emails.push(newEmail)
      this.saveEmails(emails)

      // Simulate transaction delay
      await new Promise(resolve => setTimeout(resolve, 1000))

      return `demo_tx_${newEmail.id}`
    } catch (error) {
      throw new Error(`Failed to send demo email: ${error}`)
    }
  }

  async getEmails(address: string): Promise<EmailMessage[]> {
    try {
      const emails = this.getStoredEmails()
      return emails
        .filter(email => email.from === address || email.to === address)
        .sort((a, b) => b.timestamp - a.timestamp)
    } catch (error) {
      console.error('Error getting emails:', error)
      return []
    }
  }

  async getSentEmails(address: string): Promise<EmailMessage[]> {
    try {
      const emails = this.getStoredEmails()
      return emails
        .filter(email => email.from === address)
        .sort((a, b) => b.timestamp - a.timestamp)
    } catch (error) {
      console.error('Error getting sent emails:', error)
      return []
    }
  }

  async getReceivedEmails(address: string): Promise<EmailMessage[]> {
    try {
      const emails = this.getStoredEmails()
      return emails
        .filter(email => email.to === address)
        .sort((a, b) => b.timestamp - a.timestamp)
    } catch (error) {
      console.error('Error getting received emails:', error)
      return []
    }
  }

  async deleteEmail(emailId: string): Promise<void> {
    try {
      const emails = this.getStoredEmails()
      const updatedEmails = emails.filter(email => email.id !== emailId)
      this.saveEmails(updatedEmails)
    } catch (error) {
      throw new Error(`Failed to delete email: ${error}`)
    }
  }
}

// Factory για επιλογή του κατάλληλου service
export class EmailServiceFactory {
  static createService(useDemo: boolean = true): IEmailService {
    return useDemo ? new DemoEmailService() : new EmailService()
  }
}