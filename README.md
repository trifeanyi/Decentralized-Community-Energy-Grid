# Decentralized Community Energy Grid

A Web3-based platform leveraging Decentralized Physical Infrastructure Networks (DePIN) to create a peer-to-peer energy marketplace, enabling households and communities to generate, trade, and consume renewable energy transparently using blockchain and smart contracts.

---

## Overview

The Decentralized Community Energy Grid consists of four main smart contracts built on the Clarity language for the Stacks blockchain, forming a decentralized, transparent, and efficient ecosystem for energy trading and community governance:

1. **EnergyMarketplace Contract** – Facilitates peer-to-peer energy trading between producers and consumers.
2. **EnergyToken Contract** – Manages the ENERGY token for transactions within the ecosystem.
3. **EnergyMetering Contract** – Tracks energy production and consumption via IoT integration.
4. **EnergyGridDAO Contract** – Enables community governance for grid management decisions.

---

## Features

- **Peer-to-Peer Energy Trading**: Producers (e.g., households with solar panels) list and sell excess energy to consumers.
- **ENERGY Token**: A standardized token for secure, transparent energy transactions.
- **Real-Time Energy Tracking**: IoT smart meters report production and consumption on-chain.
- **Community Governance**: A DAO allows members to propose and vote on grid improvements.
- **Transparency**: All transactions and energy flows are recorded on the blockchain.
- **Scalability**: Designed for integration with Layer-2 solutions to reduce transaction costs.

---

## Smart Contracts

### EnergyMarketplace Contract
- Create and manage energy offers (amount in kWh, price in ENERGY tokens).
- Execute energy purchases with automatic token transfers.
- Track active offers and emit events for transparency.

### EnergyToken Contract
- Mint and manage ENERGY tokens for ecosystem transactions.
- Support token transfers and approvals (based on ERC20-like functionality).
- Ensure secure and transparent payments for energy trades.

### EnergyMetering Contract
- Record energy production and consumption for each user.
- Integrate with IoT smart meters for real-time data reporting.
- Emit events for verifiable energy flow tracking.

### EnergyGridDAO Contract
- Enable community proposals for grid upgrades or rule changes.
- Support token-weighted voting for fair decision-making.
- Track proposals and votes on-chain for transparency.

---

## Installation

1. Install [Clarinet CLI](https://docs.hiro.so/clarinet/getting-started):
   ```bash
   npm install -g @hirosystems/clarinet
   ```
2. Clone this repository:
   ```bash
   git clone https://github.com/yourusername/decentralized-community-energy-grid.git
   ```
3. Run tests:
   ```bash
   clarinet test
   ```
4. Deploy contracts to the Stacks blockchain:
   ```bash
   clarinet deploy
   ```

---

## Usage

Each smart contract operates independently but integrates with others to form a complete energy trading and governance ecosystem. Refer to individual contract documentation for function calls, parameters, and usage examples.

- **EnergyMarketplace**: Producers call `create-offer` to list energy, and consumers call `buy-energy` to purchase.
- **EnergyToken**: Use `transfer` and `approve` for token transactions.
- **EnergyMetering**: IoT devices or oracles call `report-energy` to log production and consumption.
- **EnergyGridDAO**: Members call `create-proposal` and `vote` for community decisions.

---

## License

MIT License