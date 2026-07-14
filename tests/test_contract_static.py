import ast
import pathlib
import re
import unittest


ROOT = pathlib.Path(__file__).resolve().parents[1]
SOURCE = (ROOT / "contracts" / "DomainShield.py").read_text(encoding="utf-8")
TREE = ast.parse(SOURCE)


class DomainShieldContractStaticTests(unittest.TestCase):
    def test_required_header(self):
        lines = SOURCE.splitlines()
        self.assertEqual(lines[0], "# v0.2.16")
        self.assertEqual(lines[1], '# { "Depends": "py-genlayer:1jb45aa8ynh2a9c9xn3b7qqh8sm5q93hwfp7jqmwsfhh8jpz09h6" }')
        self.assertEqual(lines[2], "from genlayer import *")

    def test_semantic_consensus_and_web_render(self):
        self.assertIn("gl.eq_principle.prompt_comparative(run_evaluation, principle)", SOURCE)
        self.assertNotIn("gl.eq_principle.strict_eq", SOURCE)
        self.assertGreaterEqual(SOURCE.count("gl.nondet.web.render"), 2)
        self.assertIn("gl.nondet.exec_prompt", SOURCE)

    def test_real_custody_and_transfers(self):
        self.assertIn("@gl.public.write.payable\n    def fund_reserve", SOURCE)
        self.assertIn("@gl.public.write.payable\n    def create_policy", SOURCE)
        self.assertGreaterEqual(SOURCE.count("gl.message.value"), 2)
        self.assertIn("emit_transfer(value=payout_amount)", SOURCE)
        self.assertIn("emit_transfer(value=amount)", SOURCE)

    def test_deployer_owned_and_normalized_addresses(self):
        self.assertIn("self.contract_owners[u256(0)] = gl.message.sender_address.as_hex", SOURCE)
        self.assertNotIn("def initialize_contract", SOURCE)
        self.assertIn("self.policy_owners[policy_id] = gl.message.sender_address.as_hex", SOURCE)

    def test_fixed_tiers_and_reserve_accounting(self):
        self.assertIn("policy_standard_coverages", SOURCE)
        self.assertIn("policy_remaining_coverages", SOURCE)
        self.assertNotIn('data.get("payout_amount"', SOURCE)
        self.assertIn("APPROVED_FULL", SOURCE)
        self.assertIn("APPROVED_STANDARD", SOURCE)

    def test_appeal_window_and_settlement_guards(self):
        self.assertIn("gl.get_block_timestamp() + u256(86400)", SOURCE)
        self.assertIn('return "APPEAL_WINDOW_OPEN"', SOURCE)
        self.assertIn('return "APPEAL_WINDOW_CLOSED"', SOURCE)
        self.assertIn('self.claim_statuses[claim_id] = "PAID"', SOURCE)

    def test_public_signatures(self):
        allowed = {"str", "u256", "typing.Any"}
        for node in ast.walk(TREE):
            if not isinstance(node, ast.FunctionDef):
                continue
            decorators = {ast.unparse(item) for item in node.decorator_list}
            if not any(item.startswith("gl.public.") for item in decorators):
                continue
            args = [arg for arg in node.args.args if arg.arg != "self"]
            self.assertLessEqual(len(args), 6, node.name)
            for arg in args:
                self.assertIn(ast.unparse(arg.annotation), allowed, node.name)

    def test_no_nested_scroll_container(self):
        css = (ROOT / "frontend" / "src" / "app" / "globals.css").read_text(encoding="utf-8")
        self.assertNotRegex(css, re.compile(r"overflow-y\s*:\s*auto"))
        self.assertNotRegex(css, re.compile(r"overflow\s*:\s*auto"))


if __name__ == "__main__":
    unittest.main()
