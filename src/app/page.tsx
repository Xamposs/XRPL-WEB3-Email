'use client'

import { useWallet } from "@/lib/wallets/wallet-context"
import { WalletConnect } from "@/components/wallet-connect"
import { Mail, Shield, Zap, Globe, Star, Users, Lock, Rocket, ArrowRight, CheckCircle, Inbox } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"

export default function Home() {
  const { isConnected } = useWallet()

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Animated background */}
      <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 via-purple-600/20 to-cyan-600/20 animate-gradient"></div>

      {/* Header */}
      <header className="relative border-b border-white/10 bg-black/20 backdrop-blur-xl z-10">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative">
              <Mail className="w-8 h-8 text-blue-400 animate-pulse-glow" />
              <div className="absolute inset-0 w-8 h-8 bg-blue-400/20 rounded-full animate-ping"></div>
            </div>
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
                XRPL Email
              </h1>
              <Badge variant="info" className="text-xs">Web3</Badge>
            </div>
          </div>
          <div className="relative z-20">
            <WalletConnect id="header" />
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="relative">
        <div className="container mx-auto px-4 py-20">
          <div className="text-center max-w-6xl mx-auto">
            {/* Hero Badge */}
            <div className="inline-flex items-center gap-2 bg-blue-500/10 border border-blue-500/20 rounded-full px-4 py-2 mb-8">
              <Star className="w-4 h-4 text-yellow-400" />
              <span className="text-sm text-blue-300">Revolutionary Web3 Email Platform</span>
              <Badge variant="success" className="text-xs">Live</Badge>
            </div>

            {/* Main Heading */}
            <h2 className="text-6xl md:text-7xl font-bold mb-8 leading-tight">
              <span className="bg-gradient-to-r from-blue-400 via-purple-400 to-cyan-400 bg-clip-text text-transparent">
                Decentralized Email
              </span>
              <br />
              <span className="bg-gradient-to-r from-blue-400 via-purple-400 to-cyan-400 bg-clip-text text-transparent">
                for XRPL Ecosystem
              </span>
            </h2>

            <p className="text-xl md:text-2xl text-gray-300 mb-12 leading-relaxed max-w-4xl mx-auto">
              Send and receive <span className="text-blue-400 font-semibold">encrypted emails</span> using your XRPL wallet.
              <br />No servers, no surveillance, just pure <span className="text-purple-400 font-semibold">Web3 communication</span>.
            </p>

            {/* CTA Buttons */}
            {isConnected ? (
              <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
                <Link href="/inbox">
                  <Button size="lg" className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 py-4 text-lg animate-pulse-glow">
                    <Mail className="w-6 h-6 mr-3" />
                    Open Email Manager
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </Button>
                </Link>
                {/* Αφαιρούμε το Compose Email button */}
              </div>
            ) : (
              <div className="glass rounded-2xl p-8 max-w-lg mx-auto mb-16 animate-float">
                <div className="text-center">
                  <div className="relative mb-6">
                    <div className="w-20 h-20 bg-gradient-to-br from-blue-500 via-purple-500 to-cyan-500 rounded-full mx-auto flex items-center justify-center animate-pulse-glow">
                      <Mail className="w-10 h-10 text-white" />
                    </div>
                    <div className="absolute inset-0 w-20 h-20 bg-blue-400/20 rounded-full mx-auto animate-ping"></div>
                  </div>
                  <h3 className="text-3xl font-bold text-white mb-4 bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                    Ready to Experience Web3 Email?
                  </h3>
                  <p className="text-gray-300 mb-8 text-lg leading-relaxed">
                    Join the future of decentralized communication.<br/>
                    <span className="text-blue-400 font-semibold">Connect your wallet</span> from the header to get started!
                  </p>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="flex items-center gap-2 text-green-400">
                      <CheckCircle className="w-4 h-4" />
                      <span>End-to-End Encrypted</span>
                    </div>
                    <div className="flex items-center gap-2 text-green-400">
                      <CheckCircle className="w-4 h-4" />
                      <span>No Servers</span>
                    </div>
                    <div className="flex items-center gap-2 text-green-400">
                      <CheckCircle className="w-4 h-4" />
                      <span>XRPL Native</span>
                    </div>
                    <div className="flex items-center gap-2 text-green-400">
                      <CheckCircle className="w-4 h-4" />
                      <span>Open Source</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-20">
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-400 mb-2">100%</div>
                <div className="text-gray-400">Decentralized</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-purple-400 mb-2">0</div>
                <div className="text-gray-400">Servers</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-cyan-400 mb-2">∞</div>
                <div className="text-gray-400">Privacy</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-green-400 mb-2">3</div>
                <div className="text-gray-400">Wallets</div>
              </div>
            </div>
          </div>

          {/* Features Grid */}
          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            <Card className="bg-black/40 border-blue-500/20 backdrop-blur-xl hover:border-blue-400/40 transition-all duration-300 group">
              <CardHeader>
                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <Shield className="w-8 h-8 text-white" />
                </div>
                <CardTitle className="text-white text-xl">End-to-End Encrypted</CardTitle>
                <CardDescription className="text-gray-400">
                  Military-grade encryption using your XRPL wallet keys. Only you and the recipient can read them.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2 text-green-400 text-sm">
                  <CheckCircle className="w-4 h-4" />
                  <span>AES-256 Encryption</span>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-black/40 border-purple-500/20 backdrop-blur-xl hover:border-purple-400/40 transition-all duration-300 group">
              <CardHeader>
                <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <Globe className="w-8 h-8 text-white" />
                </div>
                <CardTitle className="text-white text-xl">Truly Decentralized</CardTitle>
                <CardDescription className="text-gray-400">
                  No central servers. Emails stored on XRPL blockchain for maximum decentralization and censorship resistance.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2 text-green-400 text-sm">
                  <CheckCircle className="w-4 h-4" />
                  <span>XRPL Blockchain</span>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-black/40 border-cyan-500/20 backdrop-blur-xl hover:border-cyan-400/40 transition-all duration-300 group">
              <CardHeader>
                <div className="w-16 h-16 bg-gradient-to-br from-cyan-500 to-blue-500 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <Zap className="w-8 h-8 text-white" />
                </div>
                <CardTitle className="text-white text-xl">XRPL Native</CardTitle>
                <CardDescription className="text-gray-400">
                  Built specifically for XRPL ecosystem. Works seamlessly with GemWallet, Crossmark, and XUMM.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2 text-green-400 text-sm">
                  <CheckCircle className="w-4 h-4" />
                  <span>Multi-Wallet Support</span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Additional Features */}
          <div className="mt-20 text-center">
          <h3 className="text-6xl font-bold text-white mb-12">
              Why Choose <span className="bg-gradient-to-r from-blue-400 via-purple-400 to-cyan-400 bg-clip-text text-transparent">XRPL Email</span>?
            </h3>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
              <div className="text-center p-6">
                <div className="w-12 h-12 bg-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Lock className="w-6 h-6 text-blue-400" />
                </div>
                <h4 className="text-white font-semibold mb-2">Zero Knowledge</h4>
                <p className="text-gray-400 text-sm">Your private keys never leave your device</p>
              </div>
              
              <div className="text-center p-6">
                <div className="w-12 h-12 bg-purple-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Users className="w-6 h-6 text-purple-400" />
                </div>
                <h4 className="text-white font-semibold mb-2">Community Driven</h4>
                <p className="text-gray-400 text-sm">Open source and community governed</p>
              </div>
              
              <div className="text-center p-6">
                <div className="w-12 h-12 bg-cyan-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Rocket className="w-6 h-6 text-cyan-400" />
                </div>
                <h4 className="text-white font-semibold mb-2">Lightning Fast</h4>
                <p className="text-gray-400 text-sm">Instant delivery via XRPL network</p>
              </div>
              
              <div className="text-center p-6">
                <div className="w-12 h-12 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Star className="w-6 h-6 text-green-400" />
                </div>
                <h4 className="text-white font-semibold mb-2">Future Ready</h4>
                <p className="text-gray-400 text-sm">Built for the next generation of web</p>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative border-t border-white/10 bg-black/20 backdrop-blur-xl mt-20">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center text-gray-400">
            <p className="mb-4">© 2024 XRPL Email - Decentralized Communication for Everyone</p>
            <div className="flex justify-center gap-6 text-sm">
              <a href="#" className="hover:text-blue-400 transition-colors">Privacy Policy</a>
              <a href="#" className="hover:text-blue-400 transition-colors">Terms of Service</a>
              <a href="#" className="hover:text-blue-400 transition-colors">Documentation</a>
              <a href="#" className="hover:text-blue-400 transition-colors">GitHub</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}