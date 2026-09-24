import json
import threading
import unittest
from unittest.mock import patch
from http.server import ThreadingHTTPServer
from urllib.error import HTTPError
from urllib.request import Request, urlopen

from network_ops.web import LabHandler

ROOT = __import__("pathlib").Path(__file__).resolve().parents[1]


class WebTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.server = ThreadingHTTPServer(("127.0.0.1", 0), LabHandler)
        cls.thread = threading.Thread(target=cls.server.serve_forever, daemon=True)
        cls.thread.start()
        cls.base = f"http://127.0.0.1:{cls.server.server_port}"

    @classmethod
    def tearDownClass(cls):
        cls.server.shutdown()
        cls.server.server_close()
        cls.thread.join(timeout=2)

    def post(self, data, path="/api/investigate"):
        request = Request(self.base + path, data=json.dumps(data).encode(),
                          headers={"Content-Type": "application/json"}, method="POST")
        return urlopen(request)

    def test_page_and_health(self):
        with urlopen(self.base + "/") as response:
            self.assertIn(b"Network Operations Agent", response.read())
        with urlopen(self.base + "/health") as response:
            self.assertEqual(json.load(response)["mode"], "synthetic_local_proof")
        with urlopen(self.base + "/ready") as response:
            self.assertEqual(json.load(response)["status"], "ready")

    def test_investigation_round_trip(self):
        with self.post({"scenario_id": "ptp-platform"}) as response:
            result = json.load(response)
        self.assertEqual(result["primary_hypothesis"]["cause"], "platform_timing")
        self.assertFalse(result["action_executed"])

    def test_rejects_unknown_or_extra_input(self):
        for payload in ({"scenario_id": "customer-live"},
                        {"scenario_id": "ptp-hardware", "command": "execute"}):
            with self.assertRaises(HTTPError) as caught:
                self.post(payload)
            self.assertEqual(caught.exception.code, 400)

    def test_partial_model_configuration_does_not_expose_it(self):
        with patch.dict("os.environ", {"NETWORK_OPS_MODEL_API_KEY": "private-test-secret"}, clear=True):
            with self.post({"scenario_id": "ptp-platform"}) as response:
                raw = response.read().decode()
        result = json.loads(raw)
        self.assertEqual(result["model_draft"], {"status": "unavailable_or_rejected"})
        self.assertEqual(result["primary_hypothesis"]["cause"], "platform_timing")
        self.assertNotIn("private-test-secret", raw)

    def test_readiness_reports_unavailable_mcp(self):
        with patch.dict("os.environ", {"NETWORK_OPS_MCP_URL": "http://127.0.0.1:1/mcp"}, clear=True):
            with self.assertRaises(HTTPError) as caught:
                urlopen(self.base + "/ready")
        self.assertEqual(caught.exception.code, 503)

    def test_review_simulation_never_executes_or_persists(self):
        with self.post({"scenario_id": "ptp-hardware"}) as response:
            investigation_id = json.load(response)["investigation_id"]
        for decision in ("approve_recommendation", "request_more_evidence", "reject"):
            with self.post({"scenario_id": "ptp-hardware", "investigation_id": investigation_id,
                            "decision": decision}, path="/api/review") as response:
                result = json.load(response)
            self.assertEqual(result["decision"], decision)
            self.assertFalse(result["action_executed"])
            self.assertEqual(result["mode"], "review_simulation_no_persistence")

    def test_review_rejects_wrong_id_or_unsafe_fields(self):
        for payload in (
            {"scenario_id": "ptp-hardware", "investigation_id": "wrong", "decision": "reject"},
            {"scenario_id": "ptp-hardware", "investigation_id": "875f7641bbc5",
             "decision": "execute_remediation"},
            {"scenario_id": "ptp-hardware", "investigation_id": "875f7641bbc5",
             "decision": []},
            {"scenario_id": "ptp-hardware", "investigation_id": "875f7641bbc5",
             "decision": [], "command": "execute"},
        ):
            with self.assertRaises(HTTPError) as caught:
                self.post(payload, path="/api/review")
            self.assertEqual(caught.exception.code, 400)

    def test_lab_endpoints_are_off_by_default(self):
        scenario = json.loads((ROOT / "learner-templates" / "upstream-clock-scenario.json").read_text())
        with self.assertRaises(HTTPError) as caught:
            self.post({"scenario": scenario}, path="/api/lab/investigate")
        self.assertEqual(caught.exception.code, 404)

    def test_lab_mode_investigates_and_qualifies(self):
        scenario = json.loads((ROOT / "learner-templates" / "upstream-clock-scenario.json").read_text())
        with patch.dict("os.environ", {"NETWORK_OPS_LAB_MODE": "1"}, clear=True):
            with self.post({"scenario": scenario}, path="/api/lab/investigate") as response:
                result = json.load(response)
            with self.post({"scenario": scenario}, path="/api/lab/qualify") as response:
                report = json.load(response)
        self.assertEqual(result["primary_hypothesis"]["cause"], "upstream_timing")
        self.assertEqual(report["overall_result"], "pass")
        self.assertFalse(report["action_executed"])


if __name__ == "__main__":
    unittest.main()
