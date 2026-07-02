# DomainShield

On-chain brand domain squatting insurance that automates dispute coverage payouts using GenLayer decentralized AI Jury consensus.

## Overview

When startups rename their brands or launch new products, domain speculators (squatters) often register corresponding `.com`, `.net`, or `.io` domains in advance, demanding exorbitant buy-back fees. Pursuing legal action through ICANN (UDRP) is prohibitively slow and expensive. 

**DomainShield** offers an automated, decentralized insurance alternative. Businesses purchase coverage for their brand names. If a squatter registers a confusingly similar domain and extorts them, the brand owner files a dispute claim. GenLayer's decentralized AI Jury nodes fetch the domain's WHOIS data, analyze historical extortion patterns, reach a consensus on whether malicious squatting is taking place, and automatically disburse insurance coverage payouts to fund retrieval efforts.

---

## Architecture & Features

### 1. Intelligent Smart Contract (`DomainShield.py`)
* **Strict Storage Declarations**: Implements safe on-chain storage with `TreeMap` and `u256` scalar counters.
* **Non-deterministic AI Consensus**: Leverages `gl.eq_principle.prompt_comparative` to reach consensus on subjective AI evaluations (Scam Risk, Squatting Intent, and Confidence scores) based on live WHOIS data and web content.
* **Treasury and Budget Protection**: Enforces robust state validation, ensuring disbursements never exceed max coverage or total treasury budget.

### 2. Frontend Interface (`Next.js + TypeScript`)
* **Premium Theme**: Beautiful glassmorphic purple-black dark UI tailored for a futuristic Web3 experience.
* **Real Web3 Integration**: Fully integrated with **`genlayer-js`** to read contract states and sign public transactions (Premium payment, claim filing, jury consensus execution, and payout withdrawals).
* **Testing Scenarios**: Comes with pre-configured testing setups (Malicious Squatting vs. Pre-existing Legit Site) to easily demo the AI Jury's decision-making logic.

---

## Deployed Addresses

* **GenLayer Studio Intelligent Contract**: `0x58D77993CE38C7b692C21dc5BE5f61fee494C823`
* **Vercel Production App**: [https://domainshield-insurance.vercel.app](https://domainshield-insurance.vercel.app)

---

## Project Structure

```bash
DomainShield/
├── contracts/
│   └── DomainShield.py          # GenLayer Intelligent Contract
├── frontend/
│   ├── src/
│   │   ├── app/
│   │   │   ├── globals.css      # Custom styling & purple-black variables
│   │   │   └── page.tsx         # Next.js interactive UI & wallet integration
│   │   └── lib/
│   │       └── genlayer.ts      # GenLayer JS client setup
│   └── .env.local               # Environment variables
├── tests/
│   └── test_contract_static.py  # Static validation test suite
└── README.md                    # Project documentation
```

---

## Local Setup

### 1. Smart Contract Verification
Verify contract syntax against GenLayer rules:
```bash
python tests/test_contract_static.py
```

### 2. Run Frontend
Navigate to the frontend directory:
```bash
cd frontend
npm install
npm run dev
```
Open [http://localhost:3042](http://localhost:3042) to interact with the application locally.
