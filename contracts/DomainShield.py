# v0.2.16
# { "Depends": "py-genlayer:1jb45aa8ynh2a9c9xn3b7qqh8sm5q93hwfp7jqmwsfhh8jpz09h6" }
from genlayer import *
import typing
import json


@gl.evm.contract_interface
class _Recipient:
    class View:
        pass

    class Write:
        pass


class DomainShield(gl.Contract):
    initialized: u256
    contract_owners: TreeMap[u256, str]
    contract_balance: u256
    contract_reserved: u256
    contract_paid: u256

    policy_count: u256
    policy_owners: TreeMap[u256, str]
    policy_brand_names: TreeMap[u256, str]
    policy_insured_domains: TreeMap[u256, str]
    policy_premiums: TreeMap[u256, u256]
    policy_standard_coverages: TreeMap[u256, u256]
    policy_max_coverages: TreeMap[u256, u256]
    policy_remaining_coverages: TreeMap[u256, u256]
    policy_start_times: TreeMap[u256, u256]
    policy_statuses: TreeMap[u256, str]

    claim_count: u256
    claim_policy_ids: TreeMap[u256, u256]
    claim_squatted_domains: TreeMap[u256, str]
    claim_evidence_urls: TreeMap[u256, str]
    claim_statuses: TreeMap[u256, str]
    claim_decisions: TreeMap[u256, str]
    claim_approved_payouts: TreeMap[u256, u256]
    claim_squatting_scores: TreeMap[u256, u256]
    claim_scam_risks: TreeMap[u256, u256]
    claim_confidence_scores: TreeMap[u256, u256]
    claim_ai_reports: TreeMap[u256, str]
    claim_appeal_urls: TreeMap[u256, str]
    claim_appealed: TreeMap[u256, u256]
    claim_appeal_deadlines: TreeMap[u256, u256]

    def __init__(self):
        self.initialized = u256(1)
        self.contract_owners[u256(0)] = gl.message.sender_address.as_hex
        self.contract_balance = u256(0)
        self.contract_reserved = u256(0)
        self.contract_paid = u256(0)
        self.policy_count = u256(0)
        self.claim_count = u256(0)

    @gl.public.write.payable
    def fund_reserve(self) -> str:
        if self.contract_owners[u256(0)] != gl.message.sender_address.as_hex:
            return "OWNER_ONLY"
        amount = gl.message.value
        if amount == u256(0):
            return "ZERO_AMOUNT"
        self.contract_balance = self.contract_balance + amount
        return "RESERVE_FUNDED"

    @gl.public.write
    def withdraw_unallocated(self, amount: u256) -> str:
        if self.contract_owners[u256(0)] != gl.message.sender_address.as_hex:
            return "OWNER_ONLY"
        if amount == u256(0):
            return "ZERO_AMOUNT"
        available = self.contract_balance - self.contract_reserved
        if amount > available:
            return "INSUFFICIENT_UNALLOCATED_RESERVE"
        self.contract_balance = self.contract_balance - amount
        _Recipient(gl.message.sender_address).emit_transfer(value=amount)
        return "RESERVE_WITHDRAWN"

    @gl.public.write.payable
    def create_policy(
        self,
        brand_name: str,
        insured_domain: str,
        standard_coverage: u256,
        max_coverage: u256,
    ) -> typing.Any:
        if len(brand_name) == 0 or len(brand_name) > 120:
            return "EMPTY_BRAND"
        if len(insured_domain) == 0 or len(insured_domain) > 253:
            return "EMPTY_DOMAIN"
        premium = gl.message.value
        if premium == u256(0):
            return "ZERO_PREMIUM"
        if standard_coverage == u256(0) or max_coverage == u256(0):
            return "ZERO_COVERAGE"
        if max_coverage < standard_coverage:
            return "INVALID_COVERAGE_TIERS"

        domain = insured_domain.lower()

        i = u256(0)
        while i < self.policy_count:
            if self.policy_insured_domains[i] == domain:
                return "DOMAIN_ALREADY_INSURED"
            i = i + u256(1)

        new_balance = self.contract_balance + premium
        available = new_balance - self.contract_reserved
        if max_coverage > available:
            return "INSUFFICIENT_POLICY_RESERVE"

        policy_id = self.policy_count
        self.policy_owners[policy_id] = gl.message.sender_address.as_hex
        self.policy_brand_names[policy_id] = brand_name
        self.policy_insured_domains[policy_id] = domain
        self.policy_premiums[policy_id] = premium
        self.policy_standard_coverages[policy_id] = standard_coverage
        self.policy_max_coverages[policy_id] = max_coverage
        self.policy_remaining_coverages[policy_id] = max_coverage
        self.policy_start_times[policy_id] = gl.get_block_timestamp()
        self.policy_statuses[policy_id] = "ACTIVE"

        self.contract_balance = new_balance
        self.contract_reserved = self.contract_reserved + max_coverage
        self.policy_count = policy_id + u256(1)
        return policy_id

    @gl.public.write
    def file_claim(
        self,
        policy_id: u256,
        squatted_domain: str,
        evidence_url: str,
    ) -> typing.Any:
        if policy_id >= self.policy_count:
            return "POLICY_NOT_FOUND"
        if self.policy_statuses[policy_id] != "ACTIVE":
            return "POLICY_NOT_ACTIVE"
        if self.policy_owners[policy_id] != gl.message.sender_address.as_hex:
            return "POLICY_OWNER_ONLY"
        if len(squatted_domain) == 0:
            return "EMPTY_SQUATTED_DOMAIN"
        if self._is_url(evidence_url) == u256(0):
            return "BAD_EVIDENCE_URL"
        if self.policy_remaining_coverages[policy_id] == u256(0):
            return "POLICY_EXHAUSTED"

        claim_id = self.claim_count
        self.claim_policy_ids[claim_id] = policy_id
        self.claim_squatted_domains[claim_id] = squatted_domain
        self.claim_evidence_urls[claim_id] = evidence_url
        self.claim_statuses[claim_id] = "FILED"
        self.claim_decisions[claim_id] = "PENDING"
        self.claim_approved_payouts[claim_id] = u256(0)
        self.claim_squatting_scores[claim_id] = u256(0)
        self.claim_scam_risks[claim_id] = u256(0)
        self.claim_confidence_scores[claim_id] = u256(0)
        self.claim_ai_reports[claim_id] = ""
        self.claim_appeal_urls[claim_id] = ""
        self.claim_appealed[claim_id] = u256(0)
        self.claim_appeal_deadlines[claim_id] = u256(0)

        self.claim_count = claim_id + u256(1)
        return claim_id

    @gl.public.write
    def evaluate_claim(self, claim_id: u256) -> typing.Any:
        if claim_id >= self.claim_count:
            return "CLAIM_NOT_FOUND"
        
        status = self.claim_statuses[claim_id]
        if status != "FILED" and status != "APPEAL_PENDING":
            return "CLAIM_NOT_EVALUATABLE"

        policy_id = self.claim_policy_ids[claim_id]
        brand_name = self.policy_brand_names[policy_id]
        insured_domain = self.policy_insured_domains[policy_id]
        standard_coverage = self.policy_standard_coverages[policy_id]
        max_coverage = self.policy_max_coverages[policy_id]
        squatted_domain = self.claim_squatted_domains[claim_id]
        evidence_url = self.claim_evidence_urls[claim_id]
        appeal_url = self.claim_appeal_urls[claim_id]

        def run_evaluation() -> str:
            try:
                evidence_content = str(gl.nondet.web.render(evidence_url, mode="html"))[:3500]
                appeal_content = ""
                if status == "APPEAL_PENDING":
                    appeal_content = str(gl.nondet.web.render(appeal_url, mode="html"))[:3000]
            except Exception:
                return json.dumps({"decision":"NEEDS_REVIEW","squatting_score":0,"scam_risk":0,"confidence_score":0,"reason":"Required domain evidence could not be read."}, sort_keys=True, separators=(",", ":"))
            prompt = f"""You are DomainShield, an on-chain brand domain squatting insurance jury.

Brand Under Protection:
- Brand Name: {brand_name}
- Primary Insured Domain: {insured_domain}
- Standard Payout Tier (wei): {standard_coverage}
- Full Payout Tier (wei): {max_coverage}

Claim Dispute Details:
- Claim ID: {claim_id}
- Alleged Squatted Domain: {squatted_domain}
- Scraped WHOIS or Domain Evidence Link: {evidence_url}

Scraped Evidence Content:
{evidence_content}

Appeal Evidence Content (empty when this is the first review):
{appeal_content}

Evaluate if the Alleged Squatted Domain represents a malicious domain squatting attempt targeting the protected brand.
Check the following:
1. Is the squatted domain registered after the brand's policy? Or is it clearly using the brand's name without permission?
2. Does the scraped content show parked page ads, empty websites with 'domain for sale', extortion/exorbitant buy-back offers, or active phishing?
3. What is the estimated cost or damage value requested?

Scoring criteria:
- squatting_score 0-100: How clearly does it target the brand name maliciously? (high score = malicious target).
- scam_risk 0-100: Phishing or extortion risk associated with the squatting site.
- confidence_score 0-100: Certainty of the analysis based on the parsed WHOIS/web evidence.

Decision Rules:
- APPROVED_FULL: clear phishing, extortion, or malicious impersonation with squatting_score >= 85, scam_risk >= 70, confidence_score >= 80.
- APPROVED_STANDARD: malicious brand squatting proven with squatting_score >= 70 and confidence_score >= 75.
- NEEDS_REVIEW: if evidence is incomplete, unclear, or conflicting.
- REJECTED: if it is a legitimate site unrelated to the brand, registered before the brand, or has no squatting traits.

Respond with ONLY this JSON block:
{{
  "decision": "APPROVED_FULL|APPROVED_STANDARD|REJECTED|NEEDS_REVIEW",
  "squatting_score": 0,
  "scam_risk": 0,
  "confidence_score": 0,
  "reason": "a concise single sentence explanation detailing the evidence"
}}"""
            return gl.nondet.exec_prompt(prompt)

        principle = """Two DomainShield AI reviews are equivalent when they agree on the substantive outcome:
the same payout tier among APPROVED_FULL, APPROVED_STANDARD, REJECTED, NEEDS_REVIEW; the same verdict on whether the target domain is malicious;
and similar squatting, scam risk, and confidence score bands that support that tier.
Ignore wording differences in the reason field, JSON key order, punctuation, capitalization, or harmless phrasing.
Reject equivalence if the selected payout tier differs."""

        consensus = gl.eq_principle.prompt_comparative(run_evaluation, principle)
        parsed = self._parse_evaluation(consensus)

        decision = parsed["decision"]
        squatting_score = u256(int(parsed["squatting_score"]))
        scam_risk = u256(int(parsed["scam_risk"]))
        confidence = u256(int(parsed["confidence_score"]))
        reason = str(parsed["reason"])[:900]

        if decision == "APPROVED_FULL" and (squatting_score < u256(85) or scam_risk < u256(70) or confidence < u256(80)):
            decision = "NEEDS_REVIEW"
        if decision == "APPROVED_STANDARD" and (squatting_score < u256(70) or confidence < u256(75)):
            decision = "NEEDS_REVIEW"

        payout_amount = u256(0)
        remaining = self.policy_remaining_coverages[policy_id]
        if decision == "APPROVED_FULL":
            payout_amount = max_coverage if max_coverage <= remaining else remaining
        elif decision == "APPROVED_STANDARD":
            payout_amount = standard_coverage if standard_coverage <= remaining else remaining
        if payout_amount == u256(0) and (decision == "APPROVED_FULL" or decision == "APPROVED_STANDARD"):
            decision = "NEEDS_REVIEW"

        self.claim_decisions[claim_id] = decision
        self.claim_approved_payouts[claim_id] = payout_amount
        self.claim_squatting_scores[claim_id] = squatting_score
        self.claim_scam_risks[claim_id] = scam_risk
        self.claim_confidence_scores[claim_id] = confidence
        self.claim_ai_reports[claim_id] = reason

        if decision == "APPROVED_FULL" or decision == "APPROVED_STANDARD":
            self.claim_statuses[claim_id] = "APPROVED_AFTER_APPEAL" if status == "APPEAL_PENDING" else "APPROVED"
        else:
            self.claim_statuses[claim_id] = "FINAL_REJECTED" if status == "APPEAL_PENDING" and decision == "REJECTED" else decision
        if status != "APPEAL_PENDING":
            self.claim_appeal_deadlines[claim_id] = gl.get_block_timestamp() + u256(86400)

        return self.get_decision(claim_id)

    @gl.public.write
    def submit_appeal(self, claim_id: u256, appeal_url: str) -> str:
        if claim_id >= self.claim_count:
            return "CLAIM_NOT_FOUND"
        status = self.claim_statuses[claim_id]
        if status != "APPROVED" and status != "REJECTED" and status != "NEEDS_REVIEW":
            return "CLAIM_NOT_APPEALABLE"
        if self.claim_appealed[claim_id] != u256(0):
            return "APPEAL_ALREADY_USED"
        policy_id = self.claim_policy_ids[claim_id]
        if self.policy_owners[policy_id] != gl.message.sender_address.as_hex:
            return "POLICY_OWNER_ONLY"
        if gl.get_block_timestamp() > self.claim_appeal_deadlines[claim_id]:
            return "APPEAL_WINDOW_CLOSED"
        if self._is_url(appeal_url) == u256(0):
            return "BAD_APPEAL_URL"

        self.claim_approved_payouts[claim_id] = u256(0)
        self.claim_appeal_urls[claim_id] = appeal_url
        self.claim_appealed[claim_id] = u256(1)
        self.claim_statuses[claim_id] = "APPEAL_PENDING"
        self.claim_decisions[claim_id] = "PENDING"
        return "APPEAL_OPENED"

    @gl.public.write
    def payout_claim(self, claim_id: u256) -> str:
        if claim_id >= self.claim_count:
            return "CLAIM_NOT_FOUND"
        status = self.claim_statuses[claim_id]
        if status != "APPROVED" and status != "APPROVED_AFTER_APPEAL":
            return "NOT_APPROVED"
        if status == "APPROVED" and gl.get_block_timestamp() <= self.claim_appeal_deadlines[claim_id]:
            return "APPEAL_WINDOW_OPEN"

        payout_amount = self.claim_approved_payouts[claim_id]
        if payout_amount == u256(0):
            return "ZERO_PAYOUT"
        if payout_amount > self.contract_reserved:
            return "RESERVE_MISMATCH"
        if payout_amount > self.contract_balance:
            return "INSUFFICIENT_BALANCE"
        policy_id = self.claim_policy_ids[claim_id]
        if payout_amount > self.policy_remaining_coverages[policy_id]:
            return "POLICY_RESERVE_MISMATCH"

        self.contract_balance = self.contract_balance - payout_amount
        self.contract_reserved = self.contract_reserved - payout_amount
        self.policy_remaining_coverages[policy_id] = self.policy_remaining_coverages[policy_id] - payout_amount
        self.contract_paid = self.contract_paid + payout_amount
        self.claim_statuses[claim_id] = "PAID"
        _Recipient(Address(self.policy_owners[policy_id])).emit_transfer(value=payout_amount)
        return "PAID"

    @gl.public.write
    def close_policy(self, policy_id: u256) -> str:
        if policy_id >= self.policy_count:
            return "POLICY_NOT_FOUND"
        if self.policy_owners[policy_id] != gl.message.sender_address.as_hex:
            return "POLICY_OWNER_ONLY"
        if self.policy_statuses[policy_id] != "ACTIVE":
            return "POLICY_NOT_ACTIVE"
        i = u256(0)
        while i < self.claim_count:
            if self.claim_policy_ids[i] == policy_id:
                status = self.claim_statuses[i]
                if status == "FILED" or status == "APPROVED" or status == "APPEAL_PENDING" or status == "APPROVED_AFTER_APPEAL":
                    return "OPEN_CLAIMS_EXIST"
            i = i + u256(1)
        remaining = self.policy_remaining_coverages[policy_id]
        self.policy_remaining_coverages[policy_id] = u256(0)
        self.contract_reserved = self.contract_reserved - remaining
        self.policy_statuses[policy_id] = "CLOSED"
        return "POLICY_CLOSED"

    @gl.public.view
    def get_policy_count(self) -> u256:
        return self.policy_count

    @gl.public.view
    def get_claim_count(self) -> u256:
        return self.claim_count

    @gl.public.view
    def get_contract_state(self) -> str:
        owner = ""
        if self.initialized != u256(0):
            owner = self.contract_owners[u256(0)]
        return json.dumps(
            {
                "balance": int(self.contract_balance),
                "reserved": int(self.contract_reserved),
                "paid": int(self.contract_paid),
                "owner": owner,
                "policy_count": int(self.policy_count),
                "claim_count": int(self.claim_count),
                "initialized": int(self.initialized),
            },
            sort_keys=True,
            separators=(",", ":"),
        )

    @gl.public.view
    def get_policy(self, policy_id: u256) -> str:
        if policy_id >= self.policy_count:
            return "POLICY_NOT_FOUND"
        return json.dumps(
            {
                "owner": self.policy_owners[policy_id],
                "brand_name": self.policy_brand_names[policy_id],
                "insured_domain": self.policy_insured_domains[policy_id],
                "premium": int(self.policy_premiums[policy_id]),
                "standard_coverage": int(self.policy_standard_coverages[policy_id]),
                "max_coverage": int(self.policy_max_coverages[policy_id]),
                "remaining_coverage": int(self.policy_remaining_coverages[policy_id]),
                "start_time": int(self.policy_start_times[policy_id]),
                "status": self.policy_statuses[policy_id],
            },
            sort_keys=True,
            separators=(",", ":"),
        )

    @gl.public.view
    def get_claim(self, claim_id: u256) -> str:
        if claim_id >= self.claim_count:
            return "CLAIM_NOT_FOUND"
        return json.dumps(
            {
                "policy_id": int(self.claim_policy_ids[claim_id]),
                "squatted_domain": self.claim_squatted_domains[claim_id],
                "evidence_url": self.claim_evidence_urls[claim_id],
                "status": self.claim_statuses[claim_id],
                "decision": self.claim_decisions[claim_id],
                "approved_payout": int(self.claim_approved_payouts[claim_id]),
                "squatting_score": int(self.claim_squatting_scores[claim_id]),
                "scam_risk": int(self.claim_scam_risks[claim_id]),
                "confidence_score": int(self.claim_confidence_scores[claim_id]),
                "reason": self.claim_ai_reports[claim_id],
                "appeal_url": self.claim_appeal_urls[claim_id],
                "appealed": int(self.claim_appealed[claim_id]),
                "appeal_deadline": int(self.claim_appeal_deadlines[claim_id]),
            },
            sort_keys=True,
            separators=(",", ":"),
        )

    @gl.public.view
    def get_decision(self, claim_id: u256) -> str:
        if claim_id >= self.claim_count:
            return "CLAIM_NOT_FOUND"
        return json.dumps(
            {
                "decision": self.claim_decisions[claim_id],
                "approved_payout": int(self.claim_approved_payouts[claim_id]),
                "squatting_score": int(self.claim_squatting_scores[claim_id]),
                "scam_risk": int(self.claim_scam_risks[claim_id]),
                "confidence_score": int(self.claim_confidence_scores[claim_id]),
                "reason": self.claim_ai_reports[claim_id],
                "status": self.claim_statuses[claim_id],
            },
            sort_keys=True,
            separators=(",", ":"),
        )

    def _is_url(self, value: str) -> u256:
        if len(value) < 12 or len(value) > 500:
            return u256(0)
        if value[:8] == "https://":
            return u256(1)
        return u256(0)

    def _clamp_score(self, value: typing.Any) -> int:
        try:
            number = int(value)
            if number < 0:
                return 0
            if number > 100:
                return 100
            return number
        except Exception:
            return 0

    def _parse_evaluation(self, raw: str) -> typing.Any:
        try:
            data = json.loads(raw)
        except Exception:
            return {
                "decision": "NEEDS_REVIEW",
                "squatting_score": 0,
                "scam_risk": 0,
                "confidence_score": 0,
                "reason": "AI returned invalid JSON formatting. Human review required.",
            }

        decision = str(data.get("decision", "NEEDS_REVIEW"))
        if decision != "APPROVED_FULL" and decision != "APPROVED_STANDARD" and decision != "REJECTED":
            decision = "NEEDS_REVIEW"

        return {
            "decision": decision,
            "squatting_score": self._clamp_score(data.get("squatting_score", 0)),
            "scam_risk": self._clamp_score(data.get("scam_risk", 0)),
            "confidence_score": self._clamp_score(data.get("confidence_score", 0)),
            "reason": str(data.get("reason", "No reason provided.")),
        }
