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

## RemiSave: Yield-Bearing Cross-Border Remittance Vault"Bridging Borders, Building Wealth."**### One-line DescriptionA decentralized, Soroban-powered DeFi protocol that allows migrant workers to send remittances to India while earning real-time yield through automated liquidity vaults.### Problem It SolvesTraditional remittance to India faces three major hurdles:High Fees: Middlemen and legacy banking rails (SWIFT) charge between 3% to 7% in fees.Idle Capital: Funds lose value during the 2–5 day settlement period.Complexity: Existing Web3 solutions are too technical for non-crypto-native users.### Solution / How It WorksRemiSave simplifies the journey from foreign currency to Indian savings:Deposit: User deposits stablecoins (e.g., USDC) into the RemiSave Global Vault.Yield Generation: While the transfer is "in-flight," the capital is supplied to the Blend Protocol to earn interest.Remit: The user triggers a remittance. The principal is swapped via Stellar’s SDEX/Soroban liquidity pools.Claim: The recipient receives the funds in local assets, while the sender retains a portion of the generated yield.### Key FeaturesAuto-Yield Vaults: Integration with Blend for automated lending and yield optimization.Low-Gas Architecture: Leveraging Soroban’s efficient footprint for sub-cent transaction costs.Atomic Swaps: Instant conversion between global stablecoins and local Indian assets.Non-Custodial: Users maintain full control of their keys via Freighter or similar Stellar wallets.### Tech StackFrontend: Next.js 14+ (App Router), Tailwind CSS, TypeScript.Smart Contracts: Soroban (Rust SDK), Stellar-CLI.Blockchain: Stellar Network (Testnet/Mainnet).DeFi Integration: Blend Protocol (Lending/Borrowing logic).Database/Cache: Supabase (optional for transaction history) or IndexedDB.### Architecture DiagramCode snippetgraph TD
    A[Sender] -->|Deposit USDC| B(RemiSave Vault Contract)
    B -->|Lend| C(Blend Protocol)
    C -->|Accrue Yield| B
    B -->|Swap/Remit| D{Stellar SDEX}
    D -->|Local Asset| E[Recipient Wallet/Anchor]
    B -->|Withdraw Yield| A
### Smart Contract OverviewThe core logic resides in the remisave_vault contract:deposit(user: Address, amount: i128): Locks assets and initializes the yield-tracking state.calculate_yield(user: Address) -> i128: Queries the Blend position to determine accrued interest.remit(recipient: Address, amount: i128): Unwinds the lending position and transfers funds through the Stellar path-payment logic.### Deployment DetailsNetwork: Stellar TestnetVault Contract ID: CC... (Replace with your actual ID)Token Contract (USDC): CA...Explorer Link: View on Stellar.expert### How to Run Locally1. Clone and Install:Bashgit clone https://github.com/Sudipta-Paul/remisave-frontend.git
cd remisave-frontend
npm install
2. Setup Environment Variables:Create a .env.local:Code snippetNEXT_PUBLIC_SOROBAN_NETWORK_PASSPHRASE="Test SDF Network ; September 2015"
NEXT_PUBLIC_VAULT_CONTRACT_ID="YOUR_ID"
3. Run the Development Server:Note: If the server auto-exits in WSL, use the pipe fix.Bashtail -f /dev/null | npm run dev
### Future RoadmapReal Blend Integration: Moving from mock yield to live Blend Protocol pools.Revenue Model: Implementing a 0.05% protocol fee on yield (keeping the principal transfer free).UPI Off-ramp: Integrating with Indian anchors to allow direct withdrawal to Bank Accounts via UPI.RemiVault Mobile: A Flutter/React Native app for a seamless mobile-first experience.### Competitive DifferentiationFeatureRemiSaveTraditional (Western Union)Standard Crypto TransferFees< 0.1%5% +VariableSpeed5 Seconds3-5 Days~10 Minutes (Eth)YieldYes (Earnings)NoNo### Security Considerations & RisksSmart Contract Risk: The protocol relies on the security of the Blend Protocol and Soroban VM.Oracle Dependency: Price feeds for swaps require reliable Oracles (e.g., Band or Dia).Regulatory Compliance: Future versions will explore KYC/AML integrations for DPIIT/Government compliance.### Contribution & LicenseDistributed under the MIT License. Contributions are welcome! Please open an issue first to discuss major changes.### AcknowledgementsSpecial thanks to the Stellar Development Foundation (SDF), the Soroban community, and Blend Protocol for providing the infrastructure and documentation that made this project possible.
