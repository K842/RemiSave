# Soroban Project

## Project Structure

This repository uses the recommended structure for a Soroban project:

```text
.
├── contracts
│   └── hello_world
│       ├── src
│       │   ├── lib.rs
│       │   └── test.rs
│       └── Cargo.toml
├── Cargo.toml
└── README.md
```

- New Soroban contracts can be put in `contracts`, each in their own directory. There is already a `hello_world` contract in there to get you started.
- If you initialized this project with any other example contracts via `--with-example`, those contracts will be in the `contracts` directory as well.
- Contracts should have their own `Cargo.toml` files that rely on the top-level `Cargo.toml` workspace for their dependencies.
- Frontend libraries can be added to the top-level directory as well. If you initialized this project with a frontend template via `--frontend-template` you will have those files already included.

# RemiSave: Yield-Bearing Remittance Vaults on Stellar
Empowering global workers with high-yield savings and low-cost cross-border transfers.

## 📄 One-line Description
RemiSave is a decentralized finance (DeFi) protocol built on Stellar Soroban that transforms traditional remittances into yield-generating assets through automated liquidity vaults.

## ❓ Problem It Solves (Remittance Context)
High Costs: Traditional remittance corridors to India and emerging markets often charge 5-7% in fees, significantly eating into the savings of migrant workers.

Idle Capital: Once money is sent, it typically sits in non-interest-bearing accounts, losing value to inflation.

Complexity: Most DeFi solutions are too complex for non-technical users, requiring deep knowledge of liquidity pools and gas fees.

Financial Exclusion: Millions remain unbanked or underbanked, lacking access to professional-grade yield-generating financial instruments.

## ✅ Solution / How It Works
RemiSave bridges the gap between cross-border payments and DeFi yield.

On-Ramp: Users convert local fiat to stablecoins (like rUSDC).

Deposit: Stablecoins are deposited into the RemiSave Vault.

Yield Generation: The Vault interacts with lending protocols (like Blend) to earn interest on the deposited capital.

Flexible Withdrawal: Users can withdraw their principal plus accrued yield at any time, or send it directly to a recipient.

## ✨ Key Features
Smart Vaults: Automated yield optimization that moves capital to the most efficient lending pools.

Atomic Transactions: Uses Soroban’s advanced footprinting to ensure "Approve + Deposit" happens securely in a single user-signed flow.

Real-Time Analytics: A live dashboard providing TVL (Total Value Locked), APY (Annual Percentage Yield), and individual share prices.

Developer Faucet: Integrated testing tools to mint rUSDC for sandbox experimentation.

Non-Custodial: Users maintain full control of their funds via the Freighter Wallet; RemiSave never takes custody of private keys.

## 🛠 Tech Stack
Blockchain: Stellar Soroban (Rust Smart Contracts).

Frontend: Next.js 14, TypeScript, Tailwind CSS.

Wallet: Freighter Extension.

SDKs: @stellar/stellar-sdk, @stellar/freighter-api.

UI Components: Shadcn UI, Radix UI, Lucide Icons.

## 📐 Architecture Diagram
Code snippet
graph TD
    A[User / Freighter Wallet] -->|Approve + Deposit| B[RemiSave Frontend]
    B -->|Smart Contract Call| C[Soroban Vault Contract]
    C -->|Asset Transfer| D[rUSDC Token Contract]
    C -->|Mint Shares| A
    C -->|Liquidity Provision| E[Blend / Yield Source]
    E -->|Interest Accrual| C
  <img width="1200" height="800" alt="system Arc_diagram_1" src="https://github.com/user-attachments/assets/0251cbdc-e219-4167-85b7-40ce60cfa625" />

## 📜 Smart Contract Overview
1. Token Contract (rUSDC)
A standard-compliant Stellar asset implementation that handles:

allowance: Managing spending permissions for the vault.

mint / burn: Controlling supply for testing and redemption.

2. Vault Contract
The core logic engine of the protocol:

Yield Logic: Calculated as (Total Assets / Total Shares). As the vault earns interest, the value of each share increases relative to the underlying token.

deposit: Takes underlying tokens and issues "shares" to the user based on current price.

withdraw: Burns shares and returns the proportional amount of underlying assets plus interest.

get_tvl: Returns the current total value locked in the contract.

## 🚀 Deployment Details
Network: Stellar Testnet.

Vault Contract ID: CB75... (Check your .env for your specific deployment).

Token Contract ID: CAO... (Check your .env for your specific deployment).

Explorer: Stellar Expert (Testnet).

## 💻 How to Run Locally
Clone & Install:

Bash
git clone <your-repo-url>
cd remisave-frontend
npm install
Setup Contracts:
From the root directory, ensure Stellar CLI is installed and run:

Bash
make full-reset
This deploys contracts and populates your .env.local.

Start Frontend:

Bash
npm run dev
Connect: Open localhost:3000 and connect your Freighter wallet set to Testnet.

## 🗺 Future Roadmap
Blend Protocol Integration: Real-time integration with the Blend Mainnet for production yield.

Revenue Fee Logic: Implementing a small protocol fee on yield to ensure project sustainability.

UPI Integration: Exploring anchors that allow direct off-ramping to Indian UPI IDs.

RemiVault Mobile: A lightweight mobile-first version for easier access in low-bandwidth regions.

## ⚖ Competitive Differentiation
Unlike standard remittance apps (Wise, Western Union), RemiSave is programmable. It doesn't just send money; it puts that money to work. Compared to other DeFi apps, RemiSave abstracts the complexity of liquidity provision into a simple "Savings Account" interface tailored for the remittance corridor.

## 🛡 Security Considerations & Risks
Smart Contract Risk: The protocol relies on the security of Soroban. While the SDK is robust, contracts should undergo professional audits before Mainnet.

Liquidity Risk: Yield depends on the availability of liquidity in underlying lending protocols like Blend.

Testnet Status: Currently deployed on Testnet; funds are not real and have no value.

## 🤝 Acknowledgements
Special thanks to the Stellar Development Foundation (SDF) and the Soroban community for providing the infrastructure and tools (Blend, Freighter) to make decentralized financial inclusion possible.
