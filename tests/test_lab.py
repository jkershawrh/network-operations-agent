import json
import unittest
from pathlib import Path

from network_ops.lab import qualify_scenario, run_scenario, validate_scenario_pack


ROOT = Path(__file__).resolve().parents[1]


def template():
    return json.loads((ROOT / "learner-templates" / "upstream-clock-scenario.json").read_text())


class LabTests(unittest.TestCase):
    def test_learner_builds_a_third_root_cause(self):
        result = run_scenario(template())
        self.assertEqual(result["primary_hypothesis"]["cause"], "upstream_timing")
        self.assertEqual(result["primary_hypothesis"]["supporting_evidence_ids"], ["upstream_timing-1"])
        self.assertEqual(len(result["current_observations_with_tool_provenance"]), 4)
        self.assertFalse(result["action_executed"])

    def test_failure_matrix_fails_closed_and_passes_qualification(self):
        report = qualify_scenario(template())
        self.assertEqual(report["overall_result"], "pass")
        self.assertEqual(len(report["scenario_results"]), 5)
        self.assertTrue(all(row["safe_no_execution"] for row in report["scenario_results"]))
        self.assertFalse(report["action_executed"])

    def test_timeout_and_conflict_abstain(self):
        for mode in ("hardware_timeout", "conflicting_observations", "malformed_tool"):
            with self.subTest(mode=mode):
                self.assertEqual(run_scenario(template(), mode)["primary_hypothesis"]["cause"],
                                 "inconclusive")

    def test_rejects_live_data_extra_fields_and_code_like_extensions(self):
        cases = []
        live = template()
        live["alarm"]["data_classification"] = "customer-live"
        cases.append(live)
        extra = template()
        extra["command"] = "execute"
        cases.append(extra)
        bad_scope = template()
        bad_scope["alarm"]["required_scopes"].append("shell")
        bad_scope["alarm"]["diagnostics"]["shell"] = {}
        cases.append(bad_scope)
        for pack in cases:
            with self.assertRaises(ValueError):
                validate_scenario_pack(pack)


if __name__ == "__main__":
    unittest.main()
