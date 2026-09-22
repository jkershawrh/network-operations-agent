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
            {"/health", "/ready", "/api/investigate", "/api/review"},
        )

    def test_contract_parses_and_is_quickstart_scoped(self):
        contract = yaml.safe_load((ROOT / "contracts" / "quickstart-contract.yaml").read_text())
        self.assertEqual(contract["api_version"], "network-operations-agent.quickstart/v0.1")
        self.assertTrue(contract["deployment_constraints"]["remediation_execution"] is False)

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
