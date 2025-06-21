// Metadata Stripping System
// Αυτόματο καθάρισμα headers για απόλυτη ανωνυμία

export interface MetadataConfig {
  stripTimestamps: boolean
  stripIPAddresses: boolean
  stripUserAgent: boolean
  stripDeviceInfo: boolean
  stripLocationData: boolean
  stripFileMetadata: boolean
  anonymizeHeaders: boolean
  useRandomDelay: boolean
}

export interface CleanedMessage {
  content: string
  strippedMetadata: string[]
  anonymityLevel: 'high' | 'medium' | 'low'
  warnings: string[]
}

export class MetadataStripper {
  private static instance: MetadataStripper
  
  static getInstance(): MetadataStripper {
    if (!MetadataStripper.instance) {
      MetadataStripper.instance = new MetadataStripper()
    }
    return MetadataStripper.instance
  }

  // Καθάρισμα όλων των metadata από μήνυμα
  async stripAllMetadata(
    message: any,
    config: MetadataConfig = this.getDefaultConfig()
  ): Promise<CleanedMessage> {
    const strippedMetadata: string[] = []
    const warnings: string[] = []
    let cleanedMessage = { ...message }

    // Καθάρισμα timestamps
    if (config.stripTimestamps) {
      const timestampFields = this.findTimestampFields(cleanedMessage)
      timestampFields.forEach(field => {
        delete cleanedMessage[field]
        strippedMetadata.push(`Timestamp: ${field}`)
      })
      
      // Προσθήκη τυχαίας καθυστέρησης για timing attack protection
      if (config.useRandomDelay) {
        await this.addRandomDelay()
      }
    }

    // Καθάρισμα IP addresses
    if (config.stripIPAddresses) {
      cleanedMessage = this.removeIPAddresses(cleanedMessage)
      strippedMetadata.push('IP Addresses')
    }

    // Καθάρισμα User Agent
    if (config.stripUserAgent) {
      const userAgentFields = ['userAgent', 'browser', 'platform', 'os']
      userAgentFields.forEach(field => {
        if (cleanedMessage[field]) {
          delete cleanedMessage[field]
          strippedMetadata.push(`User Agent: ${field}`)
        }
      })
    }

    // Καθάρισμα device info
    if (config.stripDeviceInfo) {
      const deviceFields = ['deviceId', 'screenResolution', 'timezone', 'language', 'deviceType']
      deviceFields.forEach(field => {
        if (cleanedMessage[field]) {
          delete cleanedMessage[field]
          strippedMetadata.push(`Device Info: ${field}`)
        }
      })
    }

    // Καθάρισμα location data
    if (config.stripLocationData) {
      const locationFields = ['location', 'coordinates', 'country', 'city', 'region', 'geoip']
      locationFields.forEach(field => {
        if (cleanedMessage[field]) {
          delete cleanedMessage[field]
          strippedMetadata.push(`Location: ${field}`)
        }
      })
    }

    // Καθάρισμα file metadata
    if (config.stripFileMetadata && cleanedMessage.attachments) {
      cleanedMessage.attachments = await this.stripFileMetadata(cleanedMessage.attachments)
      strippedMetadata.push('File Metadata')
    }

    // Ανωνυμοποίηση headers
    if (config.anonymizeHeaders) {
      cleanedMessage = this.anonymizeHeaders(cleanedMessage)
      strippedMetadata.push('Headers Anonymized')
    }

    // Καθάρισμα debugging info
    cleanedMessage = this.removeDebuggingInfo(cleanedMessage)
    strippedMetadata.push('Debug Information')

    // Καθάρισμα tracking pixels και beacons
    if (cleanedMessage.content) {
      cleanedMessage.content = this.removeTrackingElements(cleanedMessage.content)
      strippedMetadata.push('Tracking Elements')
    }

    // Υπολογισμός επιπέδου ανωνυμίας
    const anonymityLevel = this.calculateAnonymityLevel(strippedMetadata.length, config)

    // Έλεγχος για πιθανά leaks
    const leakWarnings = this.detectPotentialLeaks(cleanedMessage)
    warnings.push(...leakWarnings)

    return {
      content: cleanedMessage,
      strippedMetadata,
      anonymityLevel,
      warnings
    }
  }

  // Εύρεση timestamp fields
  private findTimestampFields(obj: any): string[] {
    const timestampFields: string[] = []
    const timestampPatterns = [
      /timestamp/i,
      /created/i,
      /modified/i,
      /sent/i,
      /received/i,
      /date/i,
      /time/i
    ]

    const searchObject = (object: any, path: string = '') => {
      Object.keys(object).forEach(key => {
        const fullPath = path ? `${path}.${key}` : key
        
        if (timestampPatterns.some(pattern => pattern.test(key))) {
          timestampFields.push(fullPath)
        }
        
        if (typeof object[key] === 'object' && object[key] !== null) {
          searchObject(object[key], fullPath)
        }
      })
    }

    searchObject(obj)
    return timestampFields
  }

  // Αφαίρεση IP addresses
  private removeIPAddresses(obj: any): any {
    const ipPattern = /\b(?:[0-9]{1,3}\.){3}[0-9]{1,3}\b/g
    const ipv6Pattern = /\b(?:[0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}\b/g
    
    const cleanObject = (object: any): any => {
      if (typeof object === 'string') {
        return object
          .replace(ipPattern, '[IP_REMOVED]')
          .replace(ipv6Pattern, '[IPv6_REMOVED]')
      }
      
      if (Array.isArray(object)) {
        return object.map(cleanObject)
      }
      
      if (typeof object === 'object' && object !== null) {
        const cleaned: any = {}
        Object.keys(object).forEach(key => {
          if (!['ip', 'ipAddress', 'clientIp', 'remoteAddr'].includes(key)) {
            cleaned[key] = cleanObject(object[key])
          }
        })
        return cleaned
      }
      
      return object
    }

    return cleanObject(obj)
  }

  // Καθάρισμα file metadata
  private async stripFileMetadata(attachments: any[]): Promise<any[]> {
    return attachments.map(file => ({
      name: this.sanitizeFileName(file.name),
      size: file.size,
      type: file.type,
      // Αφαιρούμε: lastModified, webkitRelativePath, path, etc.
    }))
  }

  // Sanitization του filename
  private sanitizeFileName(filename: string): string {
    // Αφαίρεση metadata από filename
    return filename
      .replace(/\d{4}-\d{2}-\d{2}/g, 'YYYY-MM-DD') // Ημερομηνίες
      .replace(/\d{2}:\d{2}:\d{2}/g, 'HH:MM:SS') // Ώρες
      .replace(/IMG_\d+/g, 'IMG_XXXX') // Camera filenames
      .replace(/DSC\d+/g, 'DSC_XXXX') // Camera filenames
      .replace(/Screenshot_\d+/g, 'Screenshot_XXXX') // Screenshots
  }

  // Ανωνυμοποίηση headers
  private anonymizeHeaders(obj: any): any {
    const sensitiveHeaders = [
      'x-forwarded-for',
      'x-real-ip',
      'x-client-ip',
      'cf-connecting-ip',
      'x-forwarded-proto',
      'x-forwarded-host',
      'referer',
      'origin',
      'user-agent',
      'accept-language',
      'accept-encoding',
      'cookie',
      'authorization'
    ]

    if (obj.headers) {
      const cleanHeaders: any = {}
      Object.keys(obj.headers).forEach(key => {
        if (!sensitiveHeaders.includes(key.toLowerCase())) {
          cleanHeaders[key] = obj.headers[key]
        }
      })
      obj.headers = cleanHeaders
    }

    return obj
  }

  // Αφαίρεση debugging information
  private removeDebuggingInfo(obj: any): any {
    const debugFields = [
      'debug',
      'trace',
      'stack',
      'error',
      'console',
      'log',
      'sessionId',
      'requestId',
      'correlationId'
    ]

    const cleanObject = (object: any): any => {
      if (Array.isArray(object)) {
        return object.map(cleanObject)
      }
      
      if (typeof object === 'object' && object !== null) {
        const cleaned: any = {}
        Object.keys(object).forEach(key => {
          if (!debugFields.includes(key.toLowerCase())) {
            cleaned[key] = cleanObject(object[key])
          }
        })
        return cleaned
      }
      
      return object
    }

    return cleanObject(obj)
  }

  // Αφαίρεση tracking elements από HTML content
  private removeTrackingElements(content: string): string {
    return content
      // Tracking pixels
      .replace(/<img[^>]*width=["']?1["']?[^>]*height=["']?1["']?[^>]*>/gi, '')
      .replace(/<img[^>]*height=["']?1["']?[^>]*width=["']?1["']?[^>]*>/gi, '')
      // Web beacons
      .replace(/<img[^>]*src=["'][^"']*track[^"']*["'][^>]*>/gi, '')
      .replace(/<img[^>]*src=["'][^"']*beacon[^"']*["'][^>]*>/gi, '')
      // Analytics scripts - αντικατάσταση του /gis με /gi και [\s\S]*?
      .replace(/<script[^>]*google-analytics[^>]*>[\s\S]*?<\/script>/gi, '')
      .replace(/<script[^>]*gtag[^>]*>[\s\S]*?<\/script>/gi, '')
      // Social media tracking
      .replace(/<script[^>]*facebook[^>]*>[\s\S]*?<\/script>/gi, '')
      .replace(/<script[^>]*twitter[^>]*>[\s\S]*?<\/script>/gi, '')
  }

  // Προσθήκη τυχαίας καθυστέρησης
  private async addRandomDelay(): Promise<void> {
    const delay = Math.random() * 1000 + 500 // 500-1500ms
    return new Promise(resolve => setTimeout(resolve, delay))
  }

  // Υπολογισμός επιπέδου ανωνυμίας
  private calculateAnonymityLevel(strippedCount: number, config: MetadataConfig): 'high' | 'medium' | 'low' {
    const maxPossible = Object.values(config).filter(Boolean).length
    const percentage = (strippedCount / maxPossible) * 100

    if (percentage >= 80) return 'high'
    if (percentage >= 50) return 'medium'
    return 'low'
  }

  // Ανίχνευση πιθανών leaks
  private detectPotentialLeaks(obj: any): string[] {
    const warnings: string[] = []
    const objString = JSON.stringify(obj).toLowerCase()

    // Έλεγχος για email addresses
    if (/@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/.test(objString)) {
      warnings.push('Πιθανή διαρροή email address')
    }

    // Έλεγχος για phone numbers
    if (/\+?[0-9]{10,}/.test(objString)) {
      warnings.push('Πιθανή διαρροή τηλεφωνικού αριθμού')
    }

    // Έλεγχος για URLs με personal info
    if (/https?:\/\/[^\s]*user[^\s]*/.test(objString)) {
      warnings.push('Πιθανή διαρροή προσωπικών URLs')
    }

    return warnings
  }

  // Default configuration
  private getDefaultConfig(): MetadataConfig {
    return {
      stripTimestamps: true,
      stripIPAddresses: true,
      stripUserAgent: true,
      stripDeviceInfo: true,
      stripLocationData: true,
      stripFileMetadata: true,
      anonymizeHeaders: true,
      useRandomDelay: true
    }
  }

  // Λήψη anonymity report
  getAnonymityReport(cleanedMessage: CleanedMessage): string {
    const level = cleanedMessage.anonymityLevel
    const count = cleanedMessage.strippedMetadata.length
    
    const reports = {
      high: `🔒 Υψηλό επίπεδο ανωνυμίας - Αφαιρέθηκαν ${count} στοιχεία metadata`,
      medium: `🔶 Μέτριο επίπεδο ανωνυμίας - Αφαιρέθηκαν ${count} στοιχεία metadata`,
      low: `⚠️ Χαμηλό επίπεδο ανωνυμίας - Αφαιρέθηκαν μόνο ${count} στοιχεία metadata`
    }
    
    return reports[level]
  }
}

// Singleton instance
export const metadataStripper = MetadataStripper.getInstance()
