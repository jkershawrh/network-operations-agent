import unittest
from pathlib import Path

import yaml
from openapi_spec_validator import validate

from network_ops import investigate


ROOT = Path(__file__).resolve().parents[1]


class ContractTests(unittest.TestCase):
    def test_openapi_spec_is_valid_and_covers_public_endpoints(self):
        spec = yaml.safe_load((ROOT / "contracts" / "openapi" / "openapi.yaml").read_text())
        validate(spec)
        self.assertEqual(
            set(spec["paths"]),
            {"/health", "/ready", "/api/investigate", "/api/review",
             "/api/lab/investigate", "/api/lab/qualify"},
        )

    def test_full_lab_contract_is_separate_and_substantial(self):
        contract = yaml.safe_load((ROOT / "contracts" / "lab-contract.yaml").read_text())
        self.assertEqual(contract["api_version"], "network-operations-agent.lab/v1")
        self.assertEqual(contract["identity"]["catalog_item"], "unified-network-operations")
        self.assertEqual(
            set(contract["user_journey"]["experience_paths"]),
            {"presentation", "demonstration", "guided_demo", "hands_on_lab"},
        )
        self.assertEqual(contract["deployment"]["story_path"], "/story/")
        self.assertTrue(contract["deployment"]["shared_runtime_and_evidence_contract"])
        self.assertGreaterEqual(contract["user_journey"]["expected_duration_minutes"], 75)
        self.assertGreaterEqual(len(contract["user_journey"]["modules"]), 7)
        self.assertFalse(contract["safety_invariants"]["remediation_execution"])

    def test_contract_parses_and_is_quickstart_scoped(self):
        contract = yaml.safe_load((ROOT / "contracts" / "quickstart-contract.yaml").read_text())
        self.assertEqual(contract["api_version"], "network-operations-agent.quickstart/v0.1")
        self.assertTrue(contract["deployment_constraints"]["remediation_execution"] is False)
        self.assertEqual(contract["deployment_constraints"]["launchpad"]["presentation_path"], "/story/")

    def test_result_fields_and_evidence_references(self):
        contract = yaml.safe_load((ROOT / "contracts" / "quickstart-contract.yaml").read_text())
        required = set(contract["user_journey"]["output_required"])
        for scenario in ("ptp-hardware", "ptp-platform"):
            with self.subTest(scenario=scenario):
                result = investigate(scenario)
                self.assertTrue(required.issubset(result))
                self.assertTrue(result["action_requires_human_approval"])
                self.assertFalse(result["action_executed"])
                current = result["current_observations_with_tool_provenance"]
                ids = {item["evidence_id"] for item in current}
                self.assertEqual(len(ids), len(current))
                self.assertTrue(set(result["primary_hypothesis"]["supporting_evidence_ids"]).issubset(ids))
                self.assertTrue(all(item["observed_at"] and item["provenance"] for item in current))
                self.assertTrue(all(item["source_id"] and item["source_revision"] for item in
                                    result["historical_context_with_source_revision"]))


if __name__ == "__main__":
    unittest.main()
