# XRPL Email Web3 🚀

A decentralized email platform built specifically for the XRPL (XRP Ledger) ecosystem. Send and receive encrypted emails using your XRPL wallet - no servers, no surveillance, just pure Web3 communication.

## ✨ Features

- **🔐 End-to-End Encryption**: Emails are encrypted using wallet-based keys
- **🌐 Fully Decentralized**: No central servers - emails stored on XRPL blockchain
- **💎 Multi-Wallet Support**: Works with GemWallet, Crossmark, and XUMM
- **⚡ XRPL Native**: Built specifically for the XRPL ecosystem
- **🔒 Privacy First**: Only sender and recipient can read email content
- **💰 Low Cost**: Minimal XRP fees (0.000001 XRP per email)

## 🛠️ Tech Stack

- **Frontend**: Next.js 15, React 19, TypeScript
- **Styling**: Tailwind CSS, Radix UI
- **Blockchain**: XRPL (XRP Ledger)
- **Encryption**: AES encryption with wallet-derived keys
- **Wallets**: GemWallet, Crossmark, XUMM integration

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ and npm
- An XRPL wallet (GemWallet, Crossmark, or XUMM)

### Installation

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Set up environment variables**
   ```bash
   cp .env.example .env.local
   ```

3. **Run the development server**
   ```bash
   npm run dev
   ```

4. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## 📱 Supported Wallets

### GemWallet
- Browser extension for XRPL
- Download: [GemWallet](https://gemwallet.app/)

### Crossmark
- Multi-platform XRPL wallet
- Download: [Crossmark](https://crossmark.io/)

### XUMM
- Mobile XRPL wallet
- Download: [XUMM](https://xumm.app/)

## 🔧 How It Works

1. **Connect Wallet**: Connect your XRPL wallet to authenticate
2. **Compose Email**: Write your email with recipient's XRPL address
3. **Encryption**: Email content is encrypted using sender/recipient addresses
4. **Blockchain Storage**: Encrypted email is stored as memo in XRPL transaction
5. **Decryption**: Only sender and recipient can decrypt and read the email

## 🔐 Security Features

- **Wallet-Based Authentication**: No passwords, only wallet signatures
- **End-to-End Encryption**: AES encryption with deterministic keys
- **Decentralized Storage**: No central point of failure
- **Transaction Verification**: All emails verified on XRPL blockchain

---

**Built with ❤️ for the XRPL ecosystem**
