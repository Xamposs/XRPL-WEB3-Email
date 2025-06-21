// Self-Destructing Emails System
// Σύστημα αυτοκαταστροφής μηνυμάτων

export interface SelfDestructConfig {
  enabled: boolean
  expiresAfter?: number // milliseconds
  deleteAfterRead?: boolean
  maxReads?: number
  burnAfterDate?: Date
}

export interface SelfDestructMessage {
  id: string
  expiresAt: number
  deleteAfterRead: boolean
  maxReads: number
  currentReads: number
  isExpired: boolean
  timeRemaining: number
}

export class SelfDestructManager {
  private static instance: SelfDestructManager
  private destructTimers: Map<string, NodeJS.Timeout> = new Map()
  private messageReads: Map<string, number> = new Map()

  static getInstance(): SelfDestructManager {
    if (!SelfDestructManager.instance) {
      SelfDestructManager.instance = new SelfDestructManager()
    }
    return SelfDestructManager.instance
  }

  // Δημιουργία self-destruct μηνύματος
  createSelfDestructMessage(
    messageId: string,
    config: SelfDestructConfig
  ): SelfDestructMessage {
    const now = Date.now()
    const expiresAt = config.expiresAfter ? now + config.expiresAfter : 0
    
    const selfDestructMessage: SelfDestructMessage = {
      id: messageId,
      expiresAt,
      deleteAfterRead: config.deleteAfterRead || false,
      maxReads: config.maxReads || 1,
      currentReads: 0,
      isExpired: false,
      timeRemaining: expiresAt - now
    }

    // Αποθήκευση στο localStorage
    this.storeSelfDestructInfo(messageId, selfDestructMessage)

    // Ρύθμιση timer για αυτόματη διαγραφή
    if (config.expiresAfter) {
      this.setDestructTimer(messageId, config.expiresAfter)
    }

    return selfDestructMessage
  }

  // Ρύθμιση timer για αυτόματη διαγραφή
  private setDestructTimer(messageId: string, expiresAfter: number): void {
    const timer = setTimeout(() => {
      this.destroyMessage(messageId, 'time_expired')
    }, expiresAfter)

    this.destructTimers.set(messageId, timer)
  }

  // Καταγραφή ανάγνωσης μηνύματος
  recordMessageRead(messageId: string): boolean {
    const destructInfo = this.getSelfDestructInfo(messageId)
    if (!destructInfo) return true

    // Έλεγχος αν έχει λήξει
    if (Date.now() > destructInfo.expiresAt && destructInfo.expiresAt > 0) {
      this.destroyMessage(messageId, 'time_expired')
      return false
    }

    // Αύξηση μετρητή αναγνώσεων
    destructInfo.currentReads++
    this.storeSelfDestructInfo(messageId, destructInfo)

    // Έλεγχος αν έφτασε το όριο αναγνώσεων
    if (destructInfo.currentReads >= destructInfo.maxReads) {
      if (destructInfo.deleteAfterRead) {
        setTimeout(() => {
          this.destroyMessage(messageId, 'read_limit_reached')
        }, 1000) // Μικρή καθυστέρηση για να διαβαστεί το μήνυμα
        return false
      }
    }

    return true
  }

  // Καταστροφή μηνύματος
  private destroyMessage(messageId: string, reason: string): void {
    console.log(`🔥 Self-destructing message ${messageId} - Reason: ${reason}`)
    
    // Διαγραφή από localStorage
    localStorage.removeItem(`message_${messageId}`)
    localStorage.removeItem(`destruct_${messageId}`)
    
    // Διαγραφή από demo emails
    const demoEmails = JSON.parse(localStorage.getItem('demo-emails') || '[]')
    const filteredEmails = demoEmails.filter((email: any) => email.id !== messageId)
    localStorage.setItem('demo-emails', JSON.stringify(filteredEmails))
    
    // Καθαρισμός timer
    const timer = this.destructTimers.get(messageId)
    if (timer) {
      clearTimeout(timer)
      this.destructTimers.delete(messageId)
    }

    // Καθαρισμός reads
    this.messageReads.delete(messageId)

    // Ειδοποίηση χρήστη
    this.notifyDestruction(messageId, reason)
  }

  // Ειδοποίηση για καταστροφή μηνύματος
  private notifyDestruction(messageId: string, reason: string): void {
    const reasonMessages = {
      time_expired: 'Το μήνυμα διαγράφηκε αυτόματα λόγω λήξης χρόνου',
      read_limit_reached: 'Το μήνυμα διαγράφηκε αυτόματα μετά την ανάγνωση',
      manual_destruct: 'Το μήνυμα καταστράφηκε χειροκίνητα'
    }

    // Εμφάνιση toast notification
    if (typeof window !== 'undefined') {
      const event = new CustomEvent('selfDestruct', {
        detail: {
          messageId,
          reason: reasonMessages[reason as keyof typeof reasonMessages] || reason
        }
      })
      window.dispatchEvent(event)
    }
  }

  // Αποθήκευση πληροφοριών self-destruct
  private storeSelfDestructInfo(messageId: string, info: SelfDestructMessage): void {
    localStorage.setItem(`destruct_${messageId}`, JSON.stringify(info))
  }

  // Ανάκτηση πληροφοριών self-destruct
  getSelfDestructInfo(messageId: string): SelfDestructMessage | null {
    try {
      const stored = localStorage.getItem(`destruct_${messageId}`)
      if (!stored) return null
      
      const info = JSON.parse(stored)
      
      // Ενημέρωση χρόνου που απομένει
      info.timeRemaining = Math.max(0, info.expiresAt - Date.now())
      info.isExpired = info.expiresAt > 0 && Date.now() > info.expiresAt
      
      return info
    } catch (error) {
      return null
    }
  }

  // Έλεγχος αν μήνυμα μπορεί να διαβαστεί
  canReadMessage(messageId: string): { canRead: boolean; reason?: string } {
    const destructInfo = this.getSelfDestructInfo(messageId)
    if (!destructInfo) return { canRead: true }

    // Έλεγχος λήξης χρόνου
    if (destructInfo.isExpired) {
      return { canRead: false, reason: 'Το μήνυμα έχει λήξει και καταστράφηκε' }
    }

    // Έλεγχος ορίου αναγνώσεων
    if (destructInfo.currentReads >= destructInfo.maxReads && destructInfo.deleteAfterRead) {
      return { canRead: false, reason: 'Το μήνυμα έχει φτάσει το όριο αναγνώσεων' }
    }

    return { canRead: true }
  }

  // Χειροκίνητη καταστροφή μηνύματος
  manualDestruct(messageId: string): void {
    this.destroyMessage(messageId, 'manual_destruct')
  }

  // Λήψη όλων των self-destruct μηνυμάτων
  getAllSelfDestructMessages(): SelfDestructMessage[] {
    const messages: SelfDestructMessage[] = []
    
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key?.startsWith('destruct_')) {
        const info = this.getSelfDestructInfo(key.replace('destruct_', ''))
        if (info) {
          messages.push(info)
        }
      }
    }
    
    return messages
  }

  // Καθαρισμός λήξαντων μηνυμάτων
  cleanupExpiredMessages(): void {
    const allMessages = this.getAllSelfDestructMessages()
    
    allMessages.forEach(message => {
      if (message.isExpired) {
        this.destroyMessage(message.id, 'time_expired')
      }
    })
  }

  // Προκαθορισμένες ρυθμίσεις self-destruct
  static getPresetConfigs() {
    return {
      '1hour': {
        enabled: true,
        expiresAfter: 60 * 60 * 1000, // 1 ώρα
        deleteAfterRead: false,
        maxReads: Infinity
      },
      '24hours': {
        enabled: true,
        expiresAfter: 24 * 60 * 60 * 1000, // 24 ώρες
        deleteAfterRead: false,
        maxReads: Infinity
      },
      '7days': {
        enabled: true,
        expiresAfter: 7 * 24 * 60 * 60 * 1000, // 7 μέρες
        deleteAfterRead: false,
        maxReads: Infinity
      },
      'readOnce': {
        enabled: true,
        expiresAfter: 0,
        deleteAfterRead: true,
        maxReads: 1
      },
      'read3Times': {
        enabled: true,
        expiresAfter: 0,
        deleteAfterRead: true,
        maxReads: 3
      }
    }
  }

  // Μορφοποίηση χρόνου που απομένει
  formatTimeRemaining(timeRemaining: number): string {
    if (timeRemaining <= 0) return 'Έληξε'
    
    const days = Math.floor(timeRemaining / (24 * 60 * 60 * 1000))
    const hours = Math.floor((timeRemaining % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000))
    const minutes = Math.floor((timeRemaining % (60 * 60 * 1000)) / (60 * 1000))
    const seconds = Math.floor((timeRemaining % (60 * 1000)) / 1000)
    
    if (days > 0) return `${days}μ ${hours}ώ`
    if (hours > 0) return `${hours}ώ ${minutes}λ`
    if (minutes > 0) return `${minutes}λ ${seconds}δ`
    return `${seconds}δ`
  }
}

// Singleton instance
export const selfDestructManager = SelfDestructManager.getInstance()
