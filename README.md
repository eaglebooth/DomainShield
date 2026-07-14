# DomainShield V3

DomainShield is a GenLayer-native brand-domain insurance protocol. It reads public
WHOIS and website evidence, uses comparative semantic consensus to classify malicious
domain squatting, and transfers native GEN from policy-backed reserves.

## Contract lifecycle

1. The constructor binds the deployer as reserve owner.
2. `fund_reserve` accepts owner-funded native GEN.
3. `create_policy` accepts a native GEN premium, records fixed STANDARD/FULL payout tiers, and locks maximum coverage.
4. `file_claim` accepts a suspected domain and public HTTPS evidence from the policy owner.
5. `evaluate_claim` uses `web.render`, `exec_prompt`, and `prompt_comparative` to select a payout tier.
6. `submit_appeal` accepts one new evidence URL during a 24-hour appeal window.
7. `evaluate_claim` compares original and appeal evidence for the final ruling.
8. `payout_claim` transfers native GEN to the policy owner exactly once.
9. `close_policy` releases unused coverage when no claim is open.
10. `withdraw_unallocated` lets only the deployer recover reserve not backing policies.

## Frontend

The existing visual system is preserved. Focused pages cover verification, reserve
funding/withdrawal, policy creation/closure, claim filing, AI review, appeal, appeal
review, payout, registries, and the complete product guide. Reads and writes use
`genlayer-js` on `studionet`; no mock records are displayed.

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

## Deployment status

DomainShield V3 changes custody, payout tiers, and settlement behavior, so it requires
a new GenLayer Studio deployment. Configure the new address after deployment:

```bash
NEXT_PUBLIC_CONTRACT_ADDRESS=0xD7a936EE5302FB651052D783e7E7f6c7dA51B047
NEXT_PUBLIC_CONTRACT_VERSION=3
NEXT_PUBLIC_NETWORK=studionet
```
