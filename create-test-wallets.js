const { Wallet } = require('xrpl')

console.log('🔑 Creating Test Wallets for Demo...\n')

// Create two test wallets
const wallet1 = Wallet.generate()
const wallet2 = Wallet.generate()

console.log('📧 SENDER WALLET (Wallet 1):')
console.log('Address:', wallet1.address)
console.log('Private Key:', wallet1.privateKey)
console.log('Public Key:', wallet1.publicKey)
console.log('')

console.log('📨 RECIPIENT WALLET (Wallet 2):')
console.log('Address:', wallet2.address)
console.log('Private Key:', wallet2.privateKey)
console.log('Public Key:', wallet2.publicKey)
console.log('')

console.log('💡 DEMO INSTRUCTIONS:')
console.log('1. Copy the SENDER address and use it to connect to the app')
console.log('2. Use the RECIPIENT address as the "To" field in compose')
console.log('3. These are testnet wallets - no real XRP needed!')
console.log('')

console.log('🔗 You can also use these existing demo addresses:')
console.log('Demo Sender:   rN7n7otQDd6FczFgLdSqtcsAUxDkw6fzRH')
console.log('Demo Recipient: rHb9CJAWyB4rj91VRWn96DkukG4bwdtyTh')
