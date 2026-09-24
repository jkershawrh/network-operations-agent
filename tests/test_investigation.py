import unittest

from network_ops import investigate


class InvestigationTests(unittest.TestCase):
    def test_distinguishes_hardware_scenario(self):
        result = investigate("ptp-hardware")
        self.assertEqual(result["primary_hypothesis"]["cause"], "hardware_timing")
        self.assertEqual(result["primary_hypothesis"]["supporting_evidence_ids"], ["hardware-1"])
        self.assertTrue(result["action_requires_human_approval"])
        self.assertFalse(result["action_executed"])
        self.assertNotIn("upstream_timing", result["alternate_hypotheses"])

    def test_distinguishes_platform_scenario(self):
        result = investigate("ptp-platform")
        self.assertEqual(result["primary_hypothesis"]["cause"], "platform_timing")
        self.assertEqual(result["primary_hypothesis"]["supporting_evidence_ids"], ["openshift_platform-1"])

    def test_distinguishes_upstream_scenario(self):
        result = investigate("ptp-upstream")
        self.assertEqual(result["primary_hypothesis"]["cause"], "upstream_timing")
        self.assertEqual(result["primary_hypothesis"]["supporting_evidence_ids"], ["upstream_timing-1"])

    def test_timeout_abstains_and_preserves_gap(self):
        class BrokenHardware:
            scope = "hardware"

            def inspect(self, alarm):
                raise TimeoutError("do not expose internal details")

        from network_ops.providers import FixtureDiagnosticTool
        result = investigate("ptp-hardware", tools=[
            FixtureDiagnosticTool("network"),
            FixtureDiagnosticTool("openshift_platform"),
            BrokenHardware(),
        ])
        self.assertEqual(result["primary_hypothesis"]["cause"], "inconclusive")
        self.assertIn("hardware diagnostics unavailable: TimeoutError", result["unknowns_and_conflicts"])
        self.assertNotIn("do not expose internal details", str(result))

    def test_missing_retrieval_is_not_mistaken_for_current_evidence(self):
        class EmptyKnowledge:
            def retrieve(self, alarm, observations):
                return []

        result = investigate("ptp-platform", knowledge_provider=EmptyKnowledge())
        self.assertEqual(result["historical_context_with_source_revision"], [])
        self.assertIn("No approved historical context retrieved", result["unknowns_and_conflicts"])
        self.assertEqual(result["primary_hypothesis"]["cause"], "platform_timing")

    def test_rejects_unknown_scenario(self):
        with self.assertRaises(ValueError):
            investigate("customer-live")

    def test_conflicting_current_signals_abstain(self):
        from network_ops.providers import FixtureDiagnosticTool

        class ConflictingHardware:
            scope = "hardware"

            def inspect(self, alarm):
                return {
                    "status": "ok",
                    "observed_at": alarm["occurred_at"],
                    "provenance": "synthetic conflict fixture",
                    "observations": [{"signal": "nic_timestamp_fault", "state": "present"}],
                }

        result = investigate("ptp-platform", tools=[
            FixtureDiagnosticTool("network"),
            FixtureDiagnosticTool("openshift_platform"),
            ConflictingHardware(),
        ])
        self.assertEqual(result["primary_hypothesis"]["cause"], "inconclusive")
        self.assertEqual(result["primary_hypothesis"]["supporting_evidence_ids"], [])
        self.assertFalse(result["action_executed"])

    def test_empty_diagnostic_abstains(self):
        from network_ops.providers import FixtureDiagnosticTool

        class EmptyHardware:
            scope = "hardware"

            def inspect(self, alarm):
                return {"status": "ok", "observed_at": alarm["occurred_at"],
                        "provenance": "synthetic", "observations": []}

        result = investigate("ptp-hardware", tools=[
            FixtureDiagnosticTool("network"),
            FixtureDiagnosticTool("openshift_platform"),
            EmptyHardware(),
        ])
        self.assertEqual(result["primary_hypothesis"]["cause"], "inconclusive")
        self.assertIn("hardware diagnostics unavailable: ValueError", result["unknowns_and_conflicts"])

    def test_cross_scope_signal_abstains(self):
        from network_ops.providers import FixtureDiagnosticTool

        class MislabelledHardware:
            scope = "hardware"

            def inspect(self, alarm):
                return {"status": "ok", "observed_at": alarm["occurred_at"],
                        "provenance": "synthetic", "observations": [
                            {"signal": "platform_timing_fault", "state": "present"}]}

        result = investigate("ptp-hardware", tools=[
            FixtureDiagnosticTool("network"),
            FixtureDiagnosticTool("openshift_platform"),
            MislabelledHardware(),
        ])
        self.assertEqual(result["primary_hypothesis"]["cause"], "inconclusive")

    def test_malformed_tool_result_abstains_instead_of_crashing(self):
        from network_ops.providers import FixtureDiagnosticTool

        class MalformedHardware:
            scope = "hardware"

            def inspect(self, alarm):
                return ["not a diagnostic object"]

        result = investigate("ptp-hardware", tools=[
            FixtureDiagnosticTool("network"),
            FixtureDiagnosticTool("openshift_platform"),
            MalformedHardware(),
        ])
        self.assertEqual(result["primary_hypothesis"]["cause"], "inconclusive")
        self.assertIn("hardware diagnostics unavailable: ValueError", result["unknowns_and_conflicts"])

    def test_malformed_knowledge_is_a_gap_not_current_evidence(self):
        class MalformedKnowledge:
            def retrieve(self, alarm, observations):
                return ["untrusted text", {"source_id": "no-revision"}]

        result = investigate("ptp-platform", knowledge_provider=MalformedKnowledge())
        self.assertEqual(result["historical_context_with_source_revision"], [])
        self.assertEqual(result["primary_hypothesis"]["cause"], "platform_timing")
        self.assertIn("No approved historical context retrieved", result["unknowns_and_conflicts"])

    def test_approved_adapter_limits_arguments_and_tool_name(self):
        from network_ops.providers import ApprovedDiagnosticAdapter, FixtureAlarmProvider

        alarm = FixtureAlarmProvider().load("ptp-hardware")
        called = []

        def transport(name, args):
            called.append((name, args))
            return alarm["diagnostics"]["hardware"]

        adapter = ApprovedDiagnosticAdapter("hardware", "hardware_timestamp_status", transport)
        self.assertEqual(adapter.inspect(alarm)["status"], "ok")
        self.assertEqual(called, [("hardware_timestamp_status", {
            "alarm_id": alarm["alarm_id"],
            "occurred_at": alarm["occurred_at"],
            "scope": "hardware",
        })])
        with self.assertRaises(ValueError):
            ApprovedDiagnosticAdapter("hardware", "execute_remediation", transport)

    def test_adapter_transport_failure_abstains(self):
        from network_ops.providers import ApprovedDiagnosticAdapter, FixtureDiagnosticTool

        def broken_transport(name, args):
            raise ConnectionError("credential must not appear")

        result = investigate("ptp-hardware", tools=[
            FixtureDiagnosticTool("network"),
            FixtureDiagnosticTool("openshift_platform"),
            ApprovedDiagnosticAdapter("hardware", "hardware_timestamp_status", broken_transport),
        ])
        self.assertEqual(result["primary_hypothesis"]["cause"], "inconclusive")
        self.assertNotIn("credential must not appear", str(result))


if __name__ == "__main__":
    unittest.main()
