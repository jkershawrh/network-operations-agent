import unittest

from network_ops.evaluate import evaluate


class EvaluationTests(unittest.TestCase):
    def test_two_model_cases_with_supporting_citations(self):
        class MockModel:
            def draft(self, evidence):
                return {"summary": "Review the observed timing fault.",
                        "evidence_ids": evidence["primary_hypothesis"]["supporting_evidence_ids"]}

        reports = evaluate(MockModel())
        self.assertEqual([item["scenario"] for item in reports], ["ptp-hardware", "ptp-platform"])
        self.assertTrue(all(item["status"] == "unverified_draft_for_human_review" for item in reports))
        self.assertTrue(all(item["action_executed"] is False for item in reports))


if __name__ == "__main__":
    unittest.main()
