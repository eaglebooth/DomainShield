# DomainShield V2

DomainShield is a GenLayer-native brand domain protection and payout-ledger protocol.
It reads public WHOIS/web evidence, uses comparative semantic AI consensus to judge
malicious domain squatting, allows one appeal, and finalizes an approved reserve entry.

## Why GenLayer

Whether a lookalike domain is legitimate, parked, extortionate, or actively phishing
is a contextual judgment that cannot be reduced to a deterministic string match.
DomainShield combines on-chain web rendering, LLM reasoning, and validator consensus.

## V2 lifecycle

1. `initialize_contract` derives the reserve owner from the caller.
2. `add_funds` is owner-only.
3. `create_policy` derives policy ownership from the connected wallet.
4. `file_claim` is restricted to the policy owner.
5. `evaluate_claim` uses `prompt_comparative` over live evidence.
6. `submit_appeal` adds one new evidence URL and releases any old reservation.
7. `evaluate_claim` reviews the appeal when status is `APPEAL_PENDING`.
8. `payout_claim` finalizes an approved payout ledger once.

## Frontend

The Next.js frontend provides separate Setup, Reserve, Policy, Claim, Review, Appeal,
Appeal Review, Payout, How It Works, list, detail, and contract verification pages.
Production contains no mock policies, claims, verdicts, balances, or hardcoded address.

## Local verification

```bash
python -m unittest discover -s tests -v
cd frontend
npm install
npm run lint
npm run build
npm run dev
```

Open `http://localhost:3042`.

## Deployment

DomainShield V2 is deployed on GenLayer Studio at:

```text
0xd1413E7Ea0E3420421247C4910bb34a2cB242e38
```

The frontend uses `genlayer-js` on `studionet` for live contract reads and writes.
