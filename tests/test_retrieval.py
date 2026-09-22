import unittest

from network_ops import investigate
from network_ops.providers import FixtureAlarmProvider, FixtureKnowledgeProvider


class RetrievalTests(unittest.TestCase):
    def test_hardware_signal_retrieves_matching_case_and_runbook(self):
        result = investigate("ptp-hardware")
        sources = [item["source_id"] for item in result["historical_context_with_source_revision"]]
        self.assertEqual(sources, ["ptp-case-hardware", "ptp-runbook"])
        self.assertEqual(result["historical_context_with_source_revision"][0]["matching_signals"],
                         ["nic_timestamp_fault", "timing_alarm"])

    def test_platform_signal_retrieves_matching_case(self):
        result = investigate("ptp-platform")
        sources = [item["source_id"] for item in result["historical_context_with_source_revision"]]
        self.assertEqual(sources, ["ptp-case-platform", "ptp-runbook"])

    def test_no_diagnostic_evidence_does_not_reveal_case(self):
        alarm = FixtureAlarmProvider().load("ptp-hardware")
        self.assertEqual(FixtureKnowledgeProvider().retrieve(alarm, []), [])
        result = investigate("ptp-hardware", tools=[])
        self.assertEqual(result["historical_context_with_source_revision"], [])
        self.assertEqual(result["primary_hypothesis"]["cause"], "inconclusive")


if __name__ == "__main__":
    unittest.main()
