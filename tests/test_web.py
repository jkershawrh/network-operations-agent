import json
import threading
import unittest
from http.server import ThreadingHTTPServer
from urllib.error import HTTPError
from urllib.request import Request, urlopen

from network_ops.web import LabHandler


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

    def post(self, data):
        request = Request(self.base + "/api/investigate", data=json.dumps(data).encode(),
                          headers={"Content-Type": "application/json"}, method="POST")
        return urlopen(request)

    def test_page_and_health(self):
        with urlopen(self.base + "/") as response:
            self.assertIn(b"Network Operations Agent", response.read())
        with urlopen(self.base + "/health") as response:
            self.assertEqual(json.load(response)["mode"], "synthetic_local_proof")

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


if __name__ == "__main__":
    unittest.main()
