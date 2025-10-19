# FHE-AAVE: Privacy-Preserving Lending Protocol

A revolutionary decentralized lending platform built with Fully Homomorphic Encryption (FHE) technology, enabling confidential deposits, borrows, and repayments on-chain. Inspired by AAVE's proven lending model, FHE-AAVE ensures complete privacy of all transaction amounts while maintaining the trustless nature of DeFi protocols.

## 🌟 Project Overview

FHE-AAVE demonstrates the future of privacy-preserving decentralized finance by implementing a complete lending/borrowing protocol where **all amounts remain encrypted on-chain**. Users can deposit collateral, borrow against it, and manage their positions without revealing their financial data to anyone—including the smart contract itself.

### What Makes FHE-AAVE Unique?

- **Complete On-Chain Privacy**: All balances and transaction amounts are encrypted using Fully Homomorphic Encryption
- **User-Controlled Decryption**: Only you can decrypt your balance data through cryptographic signatures
- **Confidential Computations**: Smart contracts perform calculations on encrypted data without ever seeing plaintext values
- **AAVE-Inspired Design**: Familiar lending pool mechanics (deposit, borrow, withdraw, repay) with privacy built-in
- **Zero Knowledge of Amounts**: Even the protocol cannot see individual user balances or transaction amounts

## 🎯 Problems Solved

### 1. **Financial Privacy in DeFi**
Traditional DeFi protocols expose all transaction amounts and balances publicly. FHE-AAVE solves this by encrypting all financial data while still allowing the protocol to enforce lending rules.

### 2. **On-Chain Privacy Without Compromising Security**
Unlike mixing protocols or privacy coins that hide transaction graphs, FHE-AAVE maintains full auditability and transparency of the protocol logic while keeping amounts confidential.

### 3. **Regulatory Compliance Potential**
By separating protocol transparency from user privacy, FHE-AAVE provides a path toward compliant DeFi that protects sensitive financial information.

### 4. **Front-Running Protection**
Since transaction amounts are encrypted, MEV bots and front-runners cannot see deposit/borrow amounts, reducing exploitation vectors.

### 5. **Institutional-Grade Privacy**
Enables institutional participation in DeFi without exposing sensitive position sizes and trading strategies.

## ✨ Key Features

### Smart Contract Features

#### FHELendingPool Contract
- **🔐 Encrypted Deposits**: Deposit fheUSDT tokens with amounts encrypted end-to-end
- **💰 Confidential Borrowing**: Borrow against encrypted collateral with LTV enforcement on encrypted data
- **🔄 Private Withdrawals**: Withdraw funds without revealing amounts to observers
- **💳 Secure Repayments**: Repay loans with confidential transaction amounts
- **📊 Pool Metrics**: View aggregated pool statistics (total deposits, borrows, utilization)
- **🔍 Balance Queries**: Decrypt your personal balances on-demand with cryptographic signatures

#### fheUSDT Token (ERC7984)
- **Confidential ERC20**: Implementation of OpenZeppelin's ERC7984 standard for confidential tokens
- **🚰 Faucet Function**: Mint test tokens for development and testing
- **🎫 Operator System**: Time-limited transfer approvals for seamless pool interactions
- **🔐 Encrypted Balances**: All token balances stored as encrypted values on-chain

### Frontend Features

#### User Interface
- **🌐 Wallet Integration**: Seamless connection via RainbowKit (MetaMask, WalletConnect, Coinbase Wallet, etc.)
- **💎 Clean UI**: Modern, dark-themed interface with gradient accents
- **📱 Responsive Design**: Optimized for desktop and mobile devices
- **⚡ Real-Time Updates**: Live balance and pool metrics using React Query

#### Actions
1. **Faucet**: Mint test fheUSDT tokens for experimentation
2. **Deposit**: Add encrypted funds to the lending vault
3. **Withdraw**: Redeem your encrypted deposits
4. **Borrow**: Draw confidential liquidity against your collateral
5. **Repay**: Return borrowed funds to reduce debt
6. **View Balances**: Decrypt your personal deposit and debt amounts on-demand

#### Dashboard
- **Personal Metrics**: Your encrypted deposit balance, debt balance
- **Pool Analytics**: Total deposits, total borrows, utilization rate
- **Status Alerts**: Real-time feedback for all operations (success, error, warnings)

## 🛠 Technology Stack

### Blockchain & Smart Contracts
- **Solidity 0.8.27**: Smart contract language with latest security features
- **Hardhat**: Ethereum development environment
- **FHEVM by Zama**: Fully Homomorphic Encryption for Ethereum Virtual Machine
- **@fhevm/solidity**: Solidity library for FHE operations
- **@openzeppelin/confidential-contracts**: OpenZeppelin's confidential token standards (ERC7984)
- **TypeChain**: Type-safe contract interactions for TypeScript

### Frontend
- **React 19**: Modern UI library with latest features
- **TypeScript 5.8**: Type safety and developer experience
- **Vite 7**: Lightning-fast build tool and dev server
- **Wagmi 2**: React hooks for Ethereum
- **RainbowKit 2**: Beautiful wallet connection UI
- **Ethers.js 6**: Ethereum library for contract interactions
- **Viem 2**: TypeScript-first Ethereum library
- **TanStack Query**: Powerful data fetching and caching

### Privacy & Cryptography
- **@zama-fhe/relayer-sdk**: Client-side encryption/decryption SDK
- **FHE Operations**: euint64 (encrypted 64-bit integers), ebool (encrypted booleans)
- **EIP-712 Signatures**: Secure signed decryption requests
- **Encrypted Operators**: Time-limited confidential token approvals

### Development Tools
- **hardhat-deploy**: Deterministic contract deployments
- **Mocha & Chai**: Testing framework
- **ESLint & Prettier**: Code quality and formatting
- **Solhint**: Solidity linting
- **hardhat-gas-reporter**: Gas usage analysis

## 🏗 Architecture

### Smart Contract Layer

```
┌─────────────────────────────────────────────────────────┐
│                  FHELendingPool                         │
│  ┌─────────────────────────────────────────────────┐   │
│  │  State (All Encrypted - euint64):               │   │
│  │  • mapping(address => euint64) _deposits        │   │
│  │  • mapping(address => euint64) _debts           │   │
│  │  • euint64 _totalDeposits                       │   │
│  │  • euint64 _totalBorrows                        │   │
│  │  • euint64 _poolBalance                         │   │
│  └─────────────────────────────────────────────────┘   │
│                                                         │
│  Core Functions:                                       │
│  • deposit(externalEuint64, bytes) → encrypted add    │
│  • withdraw(externalEuint64, bytes) → FHE.select      │
│  • borrow(externalEuint64, bytes) → encrypted LTV     │
│  • repay(externalEuint64, bytes) → encrypted subtract │
│  • getEncryptedBalance() → encrypted view             │
│  • getEncryptedDebt() → encrypted view                │
└─────────────────────────────────────────────────────────┘
                          │
                          │ Uses
                          ▼
┌─────────────────────────────────────────────────────────┐
│                    fheUSDT Token                        │
│  • ERC7984 Confidential Token Standard                 │
│  • Encrypted balances for all holders                  │
│  • Operator pattern for pool approvals                 │
│  • Faucet for test token minting                       │
└─────────────────────────────────────────────────────────┘
```

### Frontend Layer

```
┌─────────────────────────────────────────────────────────┐
│                     User Interface                      │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐    │
│  │   Header    │  │ LendingApp  │  │   Wallet    │    │
│  │  Component  │  │  Component  │  │  Connection │    │
│  └─────────────┘  └─────────────┘  └─────────────┘    │
└─────────────────────────────────────────────────────────┘
                          │
                          │ Uses
                          ▼
┌─────────────────────────────────────────────────────────┐
│                   React Hooks Layer                     │
│  • useZamaInstance() → FHE SDK initialization          │
│  • useEthersSigner() → Wagmi to Ethers adapter         │
│  • useAccount() → Wallet connection state              │
│  • useContractRead/Write() → Contract interactions     │
└─────────────────────────────────────────────────────────┘
                          │
                          │ Interacts with
                          ▼
┌─────────────────────────────────────────────────────────┐
│              Zama FHE Relayer SDK                       │
│  • Client-side encryption of inputs                    │
│  • EIP-712 signed decryption requests                  │
│  • Handle generation and proof creation                │
└─────────────────────────────────────────────────────────┘
```

### FHE Encryption Flow

```
Deposit Flow:
User Input (plaintext)
    → Zama SDK Encrypts (client-side)
    → externalEuint64 + proof
    → Smart Contract validates & stores encrypted
    → Event emitted with encrypted amounts

Decryption Flow:
User requests balance
    → Generate EIP-712 signature
    → SDK sends signed request to relayer
    → Relayer decrypts with user's key
    → Returns plaintext to user only
```

## 🚀 Key Advantages

### 1. **Privacy-First Architecture**
- **No Plaintext Storage**: All amounts stored as encrypted values (euint64)
- **Client-Side Encryption**: User data encrypted before leaving the browser
- **Signature-Gated Decryption**: Only users can decrypt their own data with cryptographic signatures

### 2. **Trustless Privacy**
- **No Trusted Parties**: No centralized entity can decrypt user balances
- **Cryptographic Guarantees**: FHE provides mathematical privacy guarantees
- **Transparent Logic**: All protocol rules are visible and auditable on-chain

### 3. **DeFi-Native Design**
- **Familiar UX**: Similar user experience to traditional DeFi lending platforms
- **No Trade-Offs**: Full privacy without sacrificing decentralization or composability
- **Gas Efficient**: Optimized FHE operations keep transaction costs reasonable

### 4. **Developer-Friendly**
- **Standard Tools**: Works with Hardhat, Ethers.js, React, and familiar web3 stack
- **Type Safety**: Full TypeScript support with TypeChain-generated types
- **Comprehensive Tests**: Full test coverage for encrypted operations

### 5. **Future-Proof Technology**
- **Zama Ecosystem**: Built on production-ready FHE infrastructure
- **Standards-Compliant**: Uses ERC7984 standard for confidential tokens
- **Upgradeable Design**: Modular architecture allows for protocol improvements

## 📋 Prerequisites

- **Node.js**: Version 20 or higher
- **npm**: Version 7.0.0 or higher
- **Wallet**: MetaMask or any WalletConnect-compatible wallet
- **Test ETH**: Sepolia testnet ETH for gas fees ([Sepolia Faucet](https://sepoliafaucet.com/))

## 🔧 Installation & Setup

### 1. Clone the Repository

```bash
git clone https://github.com/yourusername/fhe-aave.git
cd fhe-aave
```

### 2. Install Backend Dependencies

```bash
npm install
```

### 3. Install Frontend Dependencies

```bash
cd src
npm install
cd ..
```

### 4. Configure Environment Variables

```bash
# Set your wallet mnemonic (for deployments)
npx hardhat vars set MNEMONIC

# Set your Infura API key for Sepolia network access
npx hardhat vars set INFURA_API_KEY

# Optional: Set Etherscan API key for contract verification
npx hardhat vars set ETHERSCAN_API_KEY
```

### 5. Compile Smart Contracts

```bash
npm run compile
```

### 6. Run Tests

```bash
# Run local tests with FHEVM plugin
npm run test

# Run tests on Sepolia testnet
npm run test:sepolia
```

## 🎮 Usage

### Local Development

#### 1. Start Local FHEVM Node

```bash
npm run chain
```

#### 2. Deploy Contracts to Localhost

```bash
npm run deploy:localhost
```

#### 3. Start Frontend Development Server

```bash
cd src
npm run dev
```

The application will be available at `http://localhost:5173`

### Sepolia Testnet Deployment

#### 1. Deploy Contracts to Sepolia

```bash
npm run deploy:sepolia
```

This will deploy both `fheUSDT` and `FHELendingPool` contracts and save deployment artifacts to `deployments/sepolia/`.

#### 2. Update Frontend Configuration

Update contract addresses in `src/src/config/contracts.ts` with the deployed addresses.

#### 3. Build and Deploy Frontend

```bash
cd src
npm run build
npm run preview
```

### Using the Application

#### Step 1: Connect Your Wallet
Click "Connect Wallet" in the header and select your preferred wallet provider.

#### Step 2: Get Test Tokens
1. Enter an amount (e.g., 1000)
2. Click "Get Tokens" in the Faucet section
3. Confirm the transaction in your wallet

#### Step 3: Deposit to Vault
1. Enter the amount you want to deposit
2. Click "Deposit"
3. The amount will be encrypted client-side and sent to the contract

#### Step 4: Borrow Against Collateral
1. Enter the amount you want to borrow (must be less than your deposit)
2. Click "Borrow"
3. The encrypted borrow will be processed by the smart contract

#### Step 5: View Your Balances
1. Click "Decrypt My Deposit" or "Decrypt My Debt"
2. Sign the EIP-712 decryption request in your wallet
3. Your encrypted balance will be decrypted and displayed

#### Step 6: Repay Loans
1. Enter the repayment amount
2. Click "Repay"
3. Your debt will be reduced (encrypted)

#### Step 7: Withdraw Deposits
1. Enter the withdrawal amount
2. Click "Withdraw"
3. Funds will be transferred back to your wallet

## 🧪 Testing

### Run All Tests

```bash
npm run test
```

### Run Specific Test File

```bash
npx hardhat test test/FHELendingPool.test.ts
```

### Generate Coverage Report

```bash
npm run coverage
```

### Test on Sepolia

```bash
npm run test:sepolia
```

## 📜 Available Hardhat Tasks

The project includes custom Hardhat tasks for interacting with the lending pool:

```bash
# Mint fheUSDT tokens
npx hardhat lending:faucet --amount 1000

# Deposit to lending pool
npx hardhat lending:deposit --amount 500

# Borrow from pool
npx hardhat lending:borrow --amount 100

# Repay borrowed amount
npx hardhat lending:repay --amount 50

# View encrypted balances
npx hardhat lending:balances
```

## 📂 Project Structure

```
fhe-aave/
├── contracts/                    # Smart contract source files
│   ├── FHELendingPool.sol       # Main lending pool with encrypted logic
│   └── fheUSDT.sol              # ERC7984 confidential token
│
├── deploy/                       # Hardhat deployment scripts
│   ├── 01_deploy_fheUSDT.ts
│   └── 02_deploy_lending_pool.ts
│
├── deployments/                  # Deployment artifacts and ABIs
│   └── sepolia/                 # Sepolia testnet deployments
│       ├── FHELendingPool.json
│       └── fheUSDT.json
│
├── tasks/                        # Hardhat custom tasks
│   └── lending.ts               # CLI tasks for lending operations
│
├── test/                         # Smart contract tests
│   ├── FHELendingPool.test.ts
│   └── fheUSDT.test.ts
│
├── src/                          # Frontend application
│   ├── src/
│   │   ├── components/          # React components
│   │   │   ├── LendingApp.tsx   # Main lending interface
│   │   │   └── Header.tsx       # Navigation header
│   │   ├── config/              # Configuration files
│   │   │   ├── contracts.ts     # Contract addresses & ABIs
│   │   │   └── wagmi.ts         # Wagmi & RainbowKit config
│   │   ├── hooks/               # Custom React hooks
│   │   │   ├── useZamaInstance.ts    # FHE SDK initialization
│   │   │   └── useEthersSigner.ts    # Ethers adapter
│   │   ├── styles/              # CSS styling
│   │   ├── App.tsx              # Root component
│   │   └── main.tsx             # React entry point
│   ├── vite.config.ts           # Vite configuration
│   └── package.json             # Frontend dependencies
│
├── types/                        # TypeChain generated types
├── artifacts/                    # Compiled contract artifacts
├── hardhat.config.ts            # Hardhat configuration
├── package.json                 # Backend dependencies
└── README.md                    # This file
```

## 🔐 Security Considerations

### Smart Contract Security
- ✅ **FHE-Based Access Control**: All sensitive operations use encrypted comparisons
- ✅ **Safe Arithmetic**: FHE operations prevent overflow/underflow attacks
- ✅ **Conditional Logic**: `FHE.select()` prevents unauthorized withdrawals/borrows
- ✅ **Permission Management**: Strict FHE handle permissions per address
- ⚠️ **Audit Status**: This is an experimental project - NOT audited for production use

### Frontend Security
- ✅ **Client-Side Encryption**: All amounts encrypted before leaving the browser
- ✅ **EIP-712 Signatures**: Secure signed requests for decryption
- ✅ **No Private Key Storage**: Uses wallet providers for key management
- ✅ **HTTPS Required**: All production deployments must use HTTPS

### Known Limitations
- **Gas Costs**: FHE operations are more expensive than plaintext operations
- **Operator Expiry**: Token operator approvals require periodic renewal
- **Numeric Limits**: euint64 limits maximum amounts to ~18 quintillion (sufficient for most use cases)
- **Testnet Only**: Currently deployed on Sepolia testnet for development

## 🗺 Future Roadmap

### Phase 1: Core Protocol Enhancement (Q2 2025)
- [ ] Implement variable interest rates based on utilization
- [ ] Add support for multiple collateral types
- [ ] Implement health factor for liquidation prevention
- [ ] Add flash loan functionality with encrypted amounts
- [ ] Create governance token for protocol decisions

### Phase 2: Advanced Features (Q3 2025)
- [ ] Multi-collateral lending pools
- [ ] Encrypted price oracles integration
- [ ] Liquidation mechanisms with privacy preservation
- [ ] Cross-chain bridge for confidential assets
- [ ] Yield farming with encrypted rewards

### Phase 3: User Experience (Q4 2025)
- [ ] Mobile-optimized PWA application
- [ ] Advanced portfolio analytics dashboard
- [ ] Transaction history with encrypted amounts
- [ ] Notification system for important events
- [ ] Multi-language support

### Phase 4: Ecosystem Integration (Q1 2026)
- [ ] Integration with other FHE-enabled DeFi protocols
- [ ] API for third-party applications
- [ ] Subgraph for efficient data querying
- [ ] SDK for developers building on FHE-AAVE
- [ ] Plugin system for custom lending strategies

### Phase 5: Production Readiness (Q2 2026)
- [ ] Professional security audit by leading firm
- [ ] Mainnet deployment on Ethereum L1
- [ ] Layer 2 deployments (Arbitrum, Optimism, etc.)
- [ ] Bug bounty program
- [ ] Comprehensive documentation and tutorials

### Research & Innovation
- [ ] Explore zkSNARK integration for additional privacy layers
- [ ] Research cross-chain encrypted messaging protocols
- [ ] Investigate encrypted NFT collateral support
- [ ] Develop privacy-preserving credit scoring system
- [ ] Explore regulatory compliance frameworks for encrypted DeFi

## 🤝 Contributing

We welcome contributions from the community! Here's how you can help:

### Reporting Bugs
1. Check if the issue already exists in [GitHub Issues](https://github.com/yourusername/fhe-aave/issues)
2. Create a detailed bug report with reproduction steps
3. Include your environment details (OS, Node version, etc.)

### Suggesting Features
1. Open a new issue with the "enhancement" label
2. Describe the feature and its benefits
3. Discuss implementation approaches

### Submitting Pull Requests
1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Make your changes and add tests
4. Run linting: `npm run lint`
5. Run tests: `npm run test`
6. Commit with clear messages: `git commit -m 'Add amazing feature'`
7. Push to your fork: `git push origin feature/amazing-feature`
8. Open a Pull Request with detailed description

### Development Guidelines
- Follow the existing code style (enforced by ESLint and Prettier)
- Write comprehensive tests for new features
- Document all public functions and complex logic
- Keep commits atomic and well-described
- Update documentation as needed

## 📚 Documentation & Resources

### Project Documentation
- [Hardhat Configuration Guide](./docs/hardhat-config.md)
- [Smart Contract Architecture](./docs/contracts.md)
- [Frontend Development Guide](./docs/frontend.md)
- [Testing Guide](./docs/testing.md)

### External Resources
- [FHEVM Documentation](https://docs.zama.ai/fhevm)
- [Zama Protocol Guides](https://docs.zama.ai/protocol)
- [ERC7984 Standard](https://github.com/OpenZeppelin/openzeppelin-contracts-upgradeable)
- [Hardhat Documentation](https://hardhat.org/docs)
- [Wagmi Documentation](https://wagmi.sh)
- [RainbowKit Documentation](https://rainbowkit.com)

### Community
- **Discord**: [Zama Discord](https://discord.gg/zama)
- **Twitter**: Follow [@zama_fhe](https://twitter.com/zama_fhe) for updates
- **GitHub Discussions**: [Project Discussions](https://github.com/yourusername/fhe-aave/discussions)

## 📄 License

This project is licensed under the **BSD-3-Clause-Clear License**. See the [LICENSE](LICENSE) file for complete details.

### What This Means
- ✅ Commercial use allowed
- ✅ Modification allowed
- ✅ Distribution allowed
- ✅ Private use allowed
- ❌ No patent grant
- ⚠️ Must include license and copyright notice

## 🙏 Acknowledgments

### Built With
- **[Zama](https://zama.ai)**: For pioneering Fully Homomorphic Encryption and the FHEVM protocol
- **[OpenZeppelin](https://openzeppelin.com)**: For confidential contract standards (ERC7984)
- **[Hardhat](https://hardhat.org)**: For the excellent Ethereum development framework
- **[AAVE](https://aave.com)**: For inspiration from their proven lending protocol design

### Special Thanks
- The Zama team for their support and groundbreaking FHE technology
- The Ethereum community for building the decentralized infrastructure
- All contributors who have helped improve this project

## 📞 Support & Contact

### Getting Help
- **GitHub Issues**: [Report bugs or request features](https://github.com/yourusername/fhe-aave/issues)
- **GitHub Discussions**: [Ask questions and share ideas](https://github.com/yourusername/fhe-aave/discussions)
- **Zama Discord**: [Join the community](https://discord.gg/zama)

### Project Maintainers
- **Primary Developer**: [Your Name](https://github.com/yourusername)
- **Email**: your.email@example.com (for security issues only)

### Security Vulnerability Reporting
If you discover a security vulnerability, please email security@example.com instead of opening a public issue. We appreciate responsible disclosure.

---

## 🌟 Star History

If you find this project useful, please consider giving it a star ⭐️ on GitHub!

---

**Built with ❤️ using Zama FHEVM technology**

*FHE-AAVE is an experimental project demonstrating privacy-preserving DeFi. Use at your own risk. Not audited for production use.*
