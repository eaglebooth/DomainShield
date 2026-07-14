# DomainShield V3 contract review

Resolved issues:

- Removed first-caller ownership; deployer is owner in the constructor.
- Replaced typed ledger funding and premiums with payable native GEN custody.
- Normalized all stored and compared wallet addresses.
- Replaced AI-generated payout amounts with fixed STANDARD/FULL policy tiers.
- Kept subjective consensus on `prompt_comparative` and moved every web render into the local nondeterministic function.
- Added a 24-hour appeal window and complete original-plus-appeal evidence review.
- Added real native GEN payout transfer, policy reserve accounting, unallocated withdrawal, and policy closure.

The previous V2 address is incompatible with this storage and method schema.
