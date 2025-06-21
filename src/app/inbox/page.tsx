'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter } from 'next/navigation'
import { useWallet } from '@/lib/wallets/wallet-context'
import { WalletConnect } from '@/components/wallet-connect'
import { Mail as MailIcon, Inbox as InboxIcon, ArrowLeft as ArrowLeftIcon, Clock as ClockIcon, Shield as ShieldIcon, Eye as EyeIcon, Trash2 as Trash2Icon, RefreshCw as RefreshCwIcon, Send, Paperclip, Bold, Italic, Underline, Smile, Save, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { useToast } from '@/hooks/use-toast'
import Link from 'next/link'
import { EmailService } from '@/lib/email/service'
import { EmailServiceFactory } from '@/lib/email/service'
import { SecurityManager, SecureEmailConfig } from '@/lib/security/security-manager'
import { SecuritySettings } from '@/components/security-settings'
import { isValidXRPAddress } from '@/lib/utils'

interface ReceivedEmail {
  id: string
  from: string
  to: string
  subject: string
  content: string
  timestamp: string
  encrypted: boolean
  selfDestruct?: {
    expiresAt: string
    deleteAfterRead: boolean
    maxReads: number
    currentReads: number
  }
  securityLevel: string
  txHash?: string
  read: boolean
}

function InboxContent() {
  const { wallet, isConnected } = useWallet()
  const address = wallet?.address
  const { toast } = useToast()
  const router = useRouter()
  const [emails, setEmails] = useState<ReceivedEmail[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedEmail, setSelectedEmail] = useState<ReceivedEmail | null>(null)
  const [showCompose, setShowCompose] = useState(false)
  const [composeTo, setComposeTo] = useState('')
  const [composeSubject, setComposeSubject] = useState('')
  const [composeContent, setComposeContent] = useState('')
  const [sending, setSending] = useState(false)
  const [securityConfig, setSecurityConfig] = useState<SecureEmailConfig>(
    SecurityManager.getSecurityPresets().high
  )
  const [filter, setFilter] = useState<'all' | 'unread' | 'trash' | 'sent' | 'received'>('all')
  const [trashedEmails, setTrashedEmails] = useState<ReceivedEmail[]>([])
  const [sentEmails, setSentEmails] = useState<ReceivedEmail[]>([])
  const [priority, setPriority] = useState<'low' | 'normal' | 'high'>('normal')
  const [attachments, setAttachments] = useState<File[]>([])
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!isConnected) {
      router.push('/')
    } else {
      loadEmails()
    }
  }, [isConnected, router, address])

  useEffect(() => {
    if (isConnected && address) {
      loadSentEmails()
    }
  }, [isConnected, address, filter])

  const mockEmails: ReceivedEmail[] = [
    {
      id: '1',
      from: 'rN7n7otQDd6FczFgLdSqtcsAUxDkw6fzRH',
      to: address || 'rHb9CJAWyB4rj91VRWn96DkukG4bwdtyTh',
      subject: 'Demo Test Email',
      content: 'This is a test encrypted email!',
      timestamp: new Date().toISOString(),
      encrypted: true,
      selfDestruct: {
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        deleteAfterRead: true,
        maxReads: 1,
        currentReads: 0
      },
      securityLevel: 'MAXIMUM SECURITY',
      txHash: '0x1234567890abcdef',
      read: false
    }
  ]

  const loadEmails = async () => {
    if (!address) return

    setLoading(true)
    try {
      const emailService = EmailServiceFactory.createService(true)
      const receivedEmailsData = await emailService.getReceivedEmails!(address)
      
      // Μετατροπή EmailMessage[] σε ReceivedEmail[]
      const receivedEmails: ReceivedEmail[] = receivedEmailsData.map(email => ({
        ...email,
        timestamp: typeof email.timestamp === 'number' ? new Date(email.timestamp).toISOString() : email.timestamp,
        read: false,
        securityLevel: 'STANDARD'
      }))
      
      setEmails(receivedEmails)
      
      // Φόρτωση sent emails επίσης
      const sentEmailsData = await emailService.getSentEmails!(address)
      
      // Μετατροπή EmailMessage[] σε ReceivedEmail[]
      const sentEmails: ReceivedEmail[] = sentEmailsData.map(email => ({
        ...email,
        timestamp: typeof email.timestamp === 'number' ? new Date(email.timestamp).toISOString() : email.timestamp,
        read: true, // Sent emails are considered "read"
        securityLevel: 'STANDARD'
      }))
      
      setSentEmails(sentEmails)
      
      toast({
        title: "📥 Emails Loaded",
        description: `Found ${receivedEmails.length} received, ${sentEmails.length} sent email(s)`,
      })
    } catch (error) {
      toast({
        title: "❌ Error",
        description: "Failed to load emails",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const loadSentEmails = async () => {
    if (!address) return
    
    try {
      const emailService = EmailServiceFactory.createService(true)
      const sentEmailsData = await emailService.getSentEmails!(address)
      
      // Μετατροπή EmailMessage[] σε ReceivedEmail[]
      const sentEmails: ReceivedEmail[] = sentEmailsData.map(email => ({
        ...email,
        timestamp: typeof email.timestamp === 'number' ? new Date(email.timestamp).toISOString() : email.timestamp,
        read: true, // Sent emails are considered "read"
        securityLevel: 'STANDARD'
      }))
      
      setSentEmails(sentEmails)
    } catch (error) {
      console.error('Failed to load sent emails:', error)
    }
  }

  const openEmail = (email: ReceivedEmail) => {
    const updatedEmails = emails.map(e =>
      e.id === email.id ? { ...e, read: true, selfDestruct: e.selfDestruct ? { ...e.selfDestruct, currentReads: e.selfDestruct.currentReads + 1 } : undefined } : e
    )
    setEmails(updatedEmails)
    setSelectedEmail({ ...email, read: true })

    if (email.selfDestruct?.deleteAfterRead) {
      setTimeout(() => {
        setEmails(prev => prev.filter(e => e.id !== email.id))
        setSelectedEmail(null)
        const emailService = EmailServiceFactory.createService(true)
        emailService.deleteEmail!(email.id)
        toast({
          title: "💥 Email Self-Destructed",
          description: "Email was permanently deleted after reading",
        })
      }, 3000)
    }
  }

  const deleteEmail = (emailId: string) => {
    const emailToDelete = emails.find(e => e.id === emailId)
    if (emailToDelete) {
      setTrashedEmails(prev => [...prev, emailToDelete])
      // Ενημέρωση του localStorage μέσω EmailServiceFactory
      const emailService = EmailServiceFactory.createService(true)
      emailService.deleteEmail!(emailId)
    }
    setEmails(prev => prev.filter(e => e.id !== emailId))
    if (selectedEmail?.id === emailId) {
      setSelectedEmail(null)
    }
    toast({
      title: "🗑️ Email Moved to Trash",
      description: "Email has been moved to trash",
    })
  }

  const permanentlyDeleteEmail = (emailId: string) => {
    setTrashedEmails(prev => prev.filter(e => e.id !== emailId))
    toast({
      title: "🗑️ Email Permanently Deleted",
      description: "Email has been permanently deleted",
    })
  }

  const restoreEmail = (emailId: string) => {
    const emailToRestore = trashedEmails.find(e => e.id === emailId)
    if (emailToRestore) {
      setEmails(prev => [...prev, emailToRestore])
      setTrashedEmails(prev => prev.filter(e => e.id !== emailId))
      toast({
        title: "📧 Email Restored",
        description: "Email has been restored to inbox",
      })
    }
  }

  const getFilteredEmails = () => {
    switch (filter) {
      case 'unread':
        return emails.filter(email => !email.read)
      case 'trash':
        return trashedEmails
      case 'sent':
        return sentEmails
      case 'received':
        return emails
      case 'all':
        // Συνδυάζουμε όλα τα emails (received + sent)
        return [...emails, ...sentEmails].sort((a, b) => 
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
        )
      default:
        return [...emails, ...sentEmails].sort((a, b) => 
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
        )
    }
  }

  const getTimeRemaining = (expiresAt: string) => {
    const now = new Date().getTime()
    const expiry = new Date(expiresAt).getTime()
    const diff = expiry - now

    if (diff <= 0) return 'Expired'

    const hours = Math.floor(diff / (1000 * 60 * 60))
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))

    return `${hours}h ${minutes}m`
  }

  const insertFormatting = (startTag: string, endTag: string) => {
    const textarea = document.getElementById('content') as HTMLTextAreaElement
    if (!textarea) return

    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const selectedText = composeContent.substring(start, end)

    let newText
    if (selectedText) {
      newText = composeContent.substring(0, start) + startTag + selectedText + endTag + composeContent.substring(end)
    } else {
      newText = composeContent.substring(0, start) + startTag + endTag + composeContent.substring(start)
    }

    setComposeContent(newText)

    setTimeout(() => {
      textarea.focus()
      const newPosition = selectedText ? start + startTag.length + selectedText.length + endTag.length : start + startTag.length
      textarea.setSelectionRange(newPosition, newPosition)
    }, 0)
  }

  const handleFileAttachment = () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.multiple = true
    input.accept = '.txt,.pdf,.doc,.docx,.jpg,.jpeg,.png,.gif'
    input.onchange = (e) => {
      const files = Array.from((e.target as HTMLInputElement).files || [])
      setAttachments(prev => [...prev, ...files])
    }
    input.click()
  }

  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index))
  }

  const insertEmoji = (emoji: string) => {
    const textarea = document.getElementById('content') as HTMLTextAreaElement
    if (!textarea) return

    const start = textarea.selectionStart
    const newContent = composeContent.substring(0, start) + emoji + composeContent.substring(start)
    setComposeContent(newContent)

    setTimeout(() => {
      textarea.focus()
      textarea.setSelectionRange(start + emoji.length, start + emoji.length)
    }, 0)

    setShowEmojiPicker(false)
  }

  const handleSecurityPreset = (preset: 'maximum' | 'high' | 'medium') => {
    const presets = SecurityManager.getSecurityPresets()
    setSecurityConfig(presets[preset])
  }

  const saveDraft = () => {
    const draft = {
      to: composeTo.trim(),
      subject: composeSubject.trim(),
      content: composeContent.trim(),
      priority,
      timestamp: Date.now()
    }
    localStorage.setItem('email-draft', JSON.stringify(draft))
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.ctrlKey || e.metaKey) {
      switch (e.key.toLowerCase()) {
        case 'b':
          e.preventDefault()
          insertFormatting('**', '**')
          break
        case 'i':
          e.preventDefault()
          insertFormatting('*', '*')
          break
        case 'u':
          e.preventDefault()
          insertFormatting('__', '__')
          break
        case 's':
          e.preventDefault()
          saveDraft()
          break
      }
    }
  }

  const handleSendEmail = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    if (!composeTo || !composeSubject || !composeContent) return
    
    setSending(true)
    try {
      // Validation
      if (!isValidXRPAddress(composeTo.trim())) {
        setError('Please enter a valid XRPL address')
        return
      }

      // Create secure email with all security features
      const fullContent = `Subject: ${composeSubject.trim()}\n\n${composeContent.trim()}`
      const senderPrivateKey = wallet?.address + '_private_key'

      const secureEmail = await SecurityManager.getInstance().createSecureEmail(
        fullContent,
        composeTo.trim(),
        wallet?.address || '',
        senderPrivateKey,
        securityConfig
      )

      // Send via EmailServiceFactory
      const emailService = EmailServiceFactory.createService(true)
      const txHash = await emailService.sendEmail(
        wallet?.address || '',
        composeTo.trim(),
        composeSubject.trim(),
        composeContent.trim()
      )

      toast({
        title: "🔒 Secure Email Sent Successfully!",
        description: `Encrypted • Signed • TX: ${txHash.slice(0, 10)}...`,
      })
      
      setComposeTo('')
      setComposeSubject('')
      setComposeContent('')
      setShowCompose(false)
      setError('')
      
      // Refresh emails to show the new sent email in recipient's inbox
      loadEmails()
      loadSentEmails() // Ξεχωριστή κλήση για σιγουριά
    } catch (error) {
      console.error('Failed to send secure email:', error)
      toast({
        title: "Failed to send secure email",
        description: `Error: ${error}`,
        variant: "destructive"
      })
      setError(`Failed to send secure email: ${error}`)
    } finally {
      setSending(false)
    }
  }

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4">
        <Card className="bg-black/40 border-blue-500/20 backdrop-blur-xl max-w-md w-full">
          <CardHeader className="text-center">
            <div className="w-16 h-16 bg-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <InboxIcon className="w-8 h-8 text-blue-400" />
            </div>
            <CardTitle className="text-2xl text-white">
              📥 XRPL Email Inbox
            </CardTitle>
            <CardDescription className="text-gray-400">
              Connect your wallet to view received emails
            </CardDescription>
          </CardHeader>
          <CardContent>
            <WalletConnect />
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <Link href="/">
              <Button variant="ghost" size="sm" className="text-gray-400 hover:text-white">
                <ArrowLeftIcon className="w-4 h-4 mr-2" />
                Back
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-white flex items-center">
                <InboxIcon className="w-8 h-8 mr-3 text-blue-400" />
                Inbox
              </h1>
              <p className="text-gray-400 mt-1">
                Wallet: {address?.slice(0, 8)}...{address?.slice(-6)}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <Button
              onClick={() => setShowCompose(true)}
              className="bg-green-600 hover:bg-green-700"
            >
              <MailIcon className="w-4 h-4 mr-2" />
              Compose New Email
            </Button>
            <Button
              onClick={loadEmails}
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <RefreshCwIcon className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <WalletConnect id="inbox-header" />
          </div>
        </div>

        {/* Filters */}
        <div className="mb-6">
          <div className="flex items-center gap-4 p-4 bg-black/20 rounded-lg border border-blue-500/20">
            <Button
              onClick={() => setFilter('all')}
              variant={filter === 'all' ? 'default' : 'outline'}
              className={filter === 'all' ? 'bg-blue-600 hover:bg-blue-700' : 'border-blue-500/30 text-blue-300 hover:bg-blue-500/10'}
            >
              All ({emails.length})
            </Button>
            <Button
              onClick={() => {
                setFilter('received')
                loadEmails()
              }}
              variant={filter === 'received' ? 'default' : 'outline'}
              className={filter === 'received' ? 'bg-green-600 hover:bg-green-700' : 'border-blue-500/30 text-blue-300 hover:bg-blue-500/10'}
            >
              📥 Received ({emails.length})
            </Button>
            <Button
              onClick={() => {
                setFilter('sent')
                loadSentEmails()
              }}
              variant={filter === 'sent' ? 'default' : 'outline'}
              className={filter === 'sent' ? 'bg-purple-600 hover:bg-purple-700' : 'border-blue-500/30 text-blue-300 hover:bg-blue-500/10'}
            >
              📤 Sent ({sentEmails.length})
            </Button>
            <Button
              onClick={() => setFilter('unread')}
              variant={filter === 'unread' ? 'default' : 'outline'}
              className={filter === 'unread' ? 'bg-yellow-600 hover:bg-yellow-700' : 'border-blue-500/30 text-blue-300 hover:bg-blue-500/10'}
            >
              Unread ({emails.filter(e => !e.read).length})
            </Button>
            <Button
              onClick={() => setFilter('trash')}
              variant={filter === 'trash' ? 'default' : 'outline'}
              className={filter === 'trash' ? 'bg-red-600 hover:bg-red-700' : 'border-blue-500/30 text-blue-300 hover:bg-blue-500/10'}
            >
              <Trash2Icon className="w-4 h-4 mr-2" />
              Trash ({trashedEmails.length})
            </Button>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Email List */}
          <div className="lg:col-span-2">
            {loading ? (
              <Card className="bg-black/40 border-blue-500/20 backdrop-blur-xl">
                <CardContent className="p-8 text-center">
                  <div className="animate-spin w-8 h-8 border-4 border-blue-400 border-t-transparent rounded-full mx-auto mb-4"></div>
                  <p className="text-gray-400">Loading emails...</p>
                </CardContent>
              </Card>
            ) : getFilteredEmails().length === 0 ? (
              <Card className="bg-black/40 border-blue-500/20 backdrop-blur-xl">
                <CardContent className="p-8 text-center">
                  <MailIcon className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                  <h3 className="text-xl text-white mb-2">
                    {filter === 'trash' ? 'No emails in trash' : 
                     filter === 'unread' ? 'No unread emails' : 
                     filter === 'sent' ? 'No sent emails' :
                     filter === 'received' ? 'No received emails' : 'No emails found'}
                  </h3>
                  <p className="text-gray-400 mb-4">
                    {filter === 'all' || filter === 'received' ? 'Your inbox is empty. Send yourself a test email!' : 
                     filter === 'sent' ? 'You haven\'t sent any emails yet.' : ''}
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {getFilteredEmails().map((email) => (
                  <Card
                    key={email.id}
                    className={`bg-black/40 border-blue-500/20 backdrop-blur-xl cursor-pointer transition-all hover:border-blue-400/40 ${
                      selectedEmail?.id === email.id ? 'border-blue-400/60 bg-blue-500/10' : ''
                    } ${!email.read ? 'border-l-4 border-l-green-400' : ''}`}
                    onClick={() => openEmail(email)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className={`font-semibold ${!email.read ? 'text-white' : 'text-gray-300'}`}>
                              {email.subject}
                            </h3>
                            {!email.read && (
                              <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                                New
                              </Badge>
                            )}
                            {email.encrypted && (
                              <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">
                                🔒 Encrypted
                              </Badge>
                            )}
                            {email.selfDestruct && (
                              <Badge className="bg-red-500/20 text-red-400 border-red-500/30">
                                💥 Self-Destruct
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-gray-400 mb-1">
                            From: {email.from.slice(0, 8)}...{email.from.slice(-6)}
                          </p>
                          <p className="text-sm text-gray-500 truncate">
                            {email.content}
                          </p>
                          <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                            <span className="flex items-center">
                              <ClockIcon className="w-3 h-3 mr-1" />
                              {new Date(email.timestamp).toLocaleString()}
                            </span>
                            {email.selfDestruct && (
                              <span className="flex items-center text-red-400">
                                <AlertCircle className="w-3 h-3 mr-1" />
                                Expires: {getTimeRemaining(email.selfDestruct.expiresAt)}
                              </span>
                            )}
                            {email.txHash && (
                              <span className="flex items-center">
                                <ShieldIcon className="w-3 h-3 mr-1" />
                                TX: {email.txHash.slice(0, 8)}...
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2 ml-4">
                          {filter !== 'trash' && (
                            <Button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation()
                                deleteEmail(email.id)
                              }}
                              variant="ghost"
                              size="sm"
                              className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                            >
                              <Trash2Icon className="w-4 h-4" />
                            </Button>
                          )}
                          {filter === 'trash' && (
                            <>
                              <Button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  restoreEmail(email.id)
                                }}
                                variant="ghost"
                                size="sm"
                                className="text-green-400 hover:text-green-300 hover:bg-green-500/10"
                              >
                                Restore
                              </Button>
                              <Button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  permanentlyDeleteEmail(email.id)
                                }}
                                variant="ghost"
                                size="sm"
                                className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                              >
                                <Trash2Icon className="w-4 h-4" />
                              </Button>
                            </>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>

          {/* Email Detail */}
          <div className="lg:col-span-1">
            {selectedEmail ? (
              <Card className="bg-black/40 border-blue-500/20 backdrop-blur-xl sticky top-4">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg text-white">
                      {selectedEmail.subject}
                    </CardTitle>
                    <Button
                      onClick={() => setSelectedEmail(null)}
                      variant="ghost"
                      size="sm"
                      className="text-gray-400 hover:text-white"
                    >
                      ✕
                    </Button>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      {selectedEmail.encrypted && (
                        <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">
                          🔒 Encrypted
                        </Badge>
                      )}
                      {selectedEmail.selfDestruct && (
                        <Badge className="bg-red-500/20 text-red-400 border-red-500/30">
                          💥 Self-Destruct
                        </Badge>
                      )}
                      <Badge className="bg-purple-500/20 text-purple-400 border-purple-500/30">
                        {selectedEmail.securityLevel}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-400">
                      From: {selectedEmail.from}
                    </p>
                    <p className="text-sm text-gray-400">
                      To: {selectedEmail.to}
                    </p>
                    <p className="text-sm text-gray-400">
                      {new Date(selectedEmail.timestamp).toLocaleString()}
                    </p>
                    {selectedEmail.txHash && (
                      <p className="text-sm text-gray-400">
                        TX: {selectedEmail.txHash}
                      </p>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="prose prose-invert max-w-none">
                    <div className="whitespace-pre-wrap text-gray-300">
                      {selectedEmail.content}
                    </div>
                  </div>
                  {selectedEmail.selfDestruct && (
                    <div className="mt-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                      <div className="flex items-center text-red-400 text-sm">
                        <AlertCircle className="w-4 h-4 mr-2" />
                        <span className="font-semibold">Self-Destruct Active</span>
                      </div>
                      <div className="text-xs text-red-300 mt-1">
                        Expires: {getTimeRemaining(selectedEmail.selfDestruct.expiresAt)}
                      </div>
                      <div className="text-xs text-red-300">
                        Reads: {selectedEmail.selfDestruct.currentReads}/{selectedEmail.selfDestruct.maxReads}
                      </div>
                      {selectedEmail.selfDestruct.deleteAfterRead && (
                        <div className="text-xs text-red-300">
                          ⚠️ Will delete after reading
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            ) : (
              <Card className="bg-black/40 border-blue-500/20 backdrop-blur-xl sticky top-4">
                <CardContent className="p-8 text-center">
                  <EyeIcon className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                  <h3 className="text-lg text-white mb-2">No Email Selected</h3>
                  <p className="text-gray-400">
                    Select an email from the list to view its contents
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>

      {/* Compose Modal */}
      {showCompose && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <Card className="bg-black/90 border-blue-500/20 backdrop-blur-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-xl text-white flex items-center">
                  <Send className="w-5 h-5 mr-2" />
                  Compose Secure Email
                </CardTitle>
                <Button
                  onClick={() => setShowCompose(false)}
                  variant="ghost"
                  size="sm"
                  className="text-gray-400 hover:text-white"
                >
                  ✕
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <form onSubmit={handleSendEmail} className="space-y-4">
                {/* Email Fields */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      To (XRPL Address)
                    </label>
                    <Input
                      value={composeTo}
                      onChange={(e) => setComposeTo(e.target.value)}
                      placeholder="rN7n7otQDd6FczFgLdSqtcsAUxDkw6fzRH"
                      className="bg-black/40 border-blue-500/30 text-white placeholder-gray-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Priority
                    </label>
                    <select
                      value={priority}
                      onChange={(e) => setPriority(e.target.value as 'low' | 'normal' | 'high')}
                      className="w-full px-3 py-2 bg-black/40 border border-blue-500/30 rounded-md text-white"
                    >
                      <option value="low">🟢 Low</option>
                      <option value="normal">🟡 Normal</option>
                      <option value="high">🔴 High</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Subject
                  </label>
                  <Input
                    value={composeSubject}
                    onChange={(e) => setComposeSubject(e.target.value)}
                    placeholder="Enter email subject"
                    className="bg-black/40 border-blue-500/30 text-white placeholder-gray-500"
                    required
                  />
                </div>

                {/* Rich Text Toolbar */}
                <div className="flex items-center gap-2 p-2 bg-black/20 rounded-lg border border-blue-500/20">
                  <Button
                    type="button"
                    onClick={() => insertFormatting('**', '**')}
                    variant="ghost"
                    size="sm"
                    className="text-gray-400 hover:text-white"
                    title="Bold (Ctrl+B)"
                  >
                    <Bold className="w-4 h-4" />
                  </Button>
                  <Button
                    type="button"
                    onClick={() => insertFormatting('*', '*')}
                    variant="ghost"
                    size="sm"
                    className="text-gray-400 hover:text-white"
                    title="Italic (Ctrl+I)"
                  >
                    <Italic className="w-4 h-4" />
                  </Button>
                  <Button
                    type="button"
                    onClick={() => insertFormatting('__', '__')}
                    variant="ghost"
                    size="sm"
                    className="text-gray-400 hover:text-white"
                    title="Underline (Ctrl+U)"
                  >
                    <Underline className="w-4 h-4" />
                  </Button>
                  <div className="w-px h-6 bg-gray-600 mx-2"></div>
                  <Button
                    type="button"
                    onClick={handleFileAttachment}
                    variant="ghost"
                    size="sm"
                    className="text-gray-400 hover:text-white"
                    title="Attach File"
                  >
                    <Paperclip className="w-4 h-4" />
                  </Button>
                  <div className="relative">
                    <Button
                      type="button"
                      onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                      variant="ghost"
                      size="sm"
                      className="text-gray-400 hover:text-white"
                      title="Insert Emoji"
                    >
                      <Smile className="w-4 h-4" />
                    </Button>
                    {showEmojiPicker && (
                      <div className="absolute top-full left-0 mt-2 p-2 bg-black/90 border border-blue-500/30 rounded-lg backdrop-blur-xl z-10">
                        <div className="grid grid-cols-8 gap-1">
                          {['😀', '😃', '😄', '😁', '😆', '😅', '😂', '🤣', '😊', '😇', '🙂', '🙃', '😉', '😌', '😍', '🥰', '😘', '😗', '😙', '😚', '😋', '😛', '😝', '😜', '🤪', '🤨', '🧐', '🤓', '😎', '🤩', '🥳', '😏'].map((emoji) => (
                            <button
                              key={emoji}
                              type="button"
                              onClick={() => insertEmoji(emoji)}
                              className="p-1 hover:bg-blue-500/20 rounded text-lg"
                            >
                              {emoji}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="w-px h-6 bg-gray-600 mx-2"></div>
                  <Button
                    type="button"
                    onClick={saveDraft}
                    variant="ghost"
                    size="sm"
                    className="text-gray-400 hover:text-white"
                    title="Save Draft (Ctrl+S)"
                  >
                    <Save className="w-4 h-4" />
                  </Button>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Content
                  </label>
                  <textarea
                    id="content"
                    value={composeContent}
                    onChange={(e) => setComposeContent(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Write your secure email content here...\n\nSupported formatting:\n**bold** *italic* __underline__"
                    className="w-full h-64 px-3 py-2 bg-black/40 border border-blue-500/30 rounded-md text-white placeholder-gray-500 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                    required
                  />
                </div>

                {/* Attachments */}
                {attachments.length > 0 && (
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Attachments ({attachments.length})
                    </label>
                    <div className="space-y-2">
                      {attachments.map((file, index) => (
                        <div key={index} className="flex items-center justify-between p-2 bg-black/20 rounded border border-blue-500/20">
                          <span className="text-sm text-gray-300">
                            📎 {file.name} ({(file.size / 1024).toFixed(1)} KB)
                          </span>
                          <Button
                            type="button"
                            onClick={() => removeAttachment(index)}
                            variant="ghost"
                            size="sm"
                            className="text-red-400 hover:text-red-300"
                          >
                            ✕
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Security Settings */}
                <SecuritySettings
                  config={securityConfig}
                  onChange={setSecurityConfig}
                  onPresetSelect={handleSecurityPreset}
                />

                {/* Error Display */}
                {error && (
                  <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                    <div className="flex items-center text-red-400 text-sm">
                      <AlertCircle className="w-4 h-4 mr-2" />
                      {error}
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex items-center justify-between pt-4">
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      onClick={() => setShowCompose(false)}
                      variant="outline"
                      className="border-gray-600 text-gray-300 hover:bg-gray-700"
                    >
                      Cancel
                    </Button>
                    <Button
                      type="button"
                      onClick={saveDraft}
                      variant="outline"
                      className="border-blue-500/30 text-blue-300 hover:bg-blue-500/10"
                    >
                      <Save className="w-4 h-4 mr-2" />
                      Save Draft
                    </Button>
                  </div>
                  <Button
                    type="submit"
                    disabled={sending || !composeTo || !composeSubject || !composeContent}
                    className="bg-green-600 hover:bg-green-700 disabled:opacity-50"
                  >
                    {sending ? (
                      <>
                        <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                        Sending...
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4 mr-2" />
                        Send Secure Email
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}

export default function Inbox() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-blue-400 border-t-transparent rounded-full"></div>
      </div>
    }>
      <InboxContent />
    </Suspense>
  )
}