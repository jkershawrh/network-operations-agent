import json
import threading
import unittest
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer

from network_ops import investigate
from network_ops.model import OpenAICompatibleModel, add_model_draft


class ModelTests(unittest.TestCase):
    def test_valid_draft_does_not_change_decision(self):
        class Draft:
            def draft(self, evidence):
                return {"summary": "The current NIC timestamp fault merits review.",
                        "evidence_ids": ["hardware-1", "knowledge-1"]}

        original = investigate("ptp-hardware")
        enriched = add_model_draft(original, Draft())
        self.assertEqual(enriched["model_draft"]["status"], "unverified_draft_for_human_review")
        self.assertEqual(enriched["primary_hypothesis"], original["primary_hypothesis"])
        self.assertFalse(enriched["action_executed"])
        self.assertNotIn("model_draft", original)

    def test_fabricated_citation_is_rejected(self):
        class BadDraft:
            def draft(self, evidence):
                return {"summary": "Unsupported conclusion", "evidence_ids": ["secret-999"]}

        result = add_model_draft(investigate("ptp-platform"), BadDraft())
        self.assertEqual(result["model_draft"], {"status": "unavailable_or_rejected"})

    def test_citation_must_support_the_hypothesis(self):
        class IrrelevantDraft:
            def draft(self, evidence):
                return {"summary": "The platform fault is present", "evidence_ids": ["network-1"]}

        result = add_model_draft(investigate("ptp-platform"), IrrelevantDraft())
        self.assertEqual(result["model_draft"], {"status": "unavailable_or_rejected"})

    def test_failure_details_are_hidden(self):
        class BrokenDraft:
            def draft(self, evidence):
                raise ConnectionError("key and endpoint must not leak")

        result = add_model_draft(investigate("ptp-platform"), BrokenDraft())
        self.assertNotIn("key and endpoint must not leak", str(result))

    def test_inconclusive_skips_model(self):
        calls = []

        class ForbiddenDraft:
            def draft(self, evidence):
                calls.append(True)
                return {}

        original = investigate("ptp-platform", tools=[])
        self.assertEqual(add_model_draft(original, ForbiddenDraft())["model_draft"],
                         {"status": "skipped_inconclusive"})
        self.assertEqual(calls, [])

    def test_http_client_posts_to_compatible_endpoint(self):
        observed = {}

        class MockEndpoint(BaseHTTPRequestHandler):
            def do_POST(self):
                observed["path"] = self.path
                observed["authorization"] = self.headers.get("Authorization")
                observed["request"] = json.loads(self.rfile.read(int(self.headers["Content-Length"])))
                response = json.dumps({"choices": [{"message": {"content": json.dumps({
                    "summary": "Current fault requires review", "evidence_ids": ["hardware-1"]
                })}}]}).encode()
                self.send_response(200)
                self.send_header("Content-Length", str(len(response)))
                self.end_headers()
                self.wfile.write(response)

            def log_message(self, *args):
                pass

        server = ThreadingHTTPServer(("127.0.0.1", 0), MockEndpoint)
        thread = threading.Thread(target=server.serve_forever, daemon=True)
        thread.start()
        try:
            model = OpenAICompatibleModel(f"http://127.0.0.1:{server.server_port}/v1", "fixture-model", "test-key")
            result = add_model_draft(investigate("ptp-hardware"), model)
            self.assertEqual(result["model_draft"]["status"], "unverified_draft_for_human_review")
            self.assertEqual(observed["path"], "/v1/chat/completions")
            self.assertEqual(observed["authorization"], "Bearer test-key")
            self.assertEqual(observed["request"]["model"], "fixture-model")
            self.assertNotIn("chat_template_kwargs", observed["request"])
            self.assertNotIn("test-key", str(result))
            non_thinking = OpenAICompatibleModel(
                f"http://127.0.0.1:{server.server_port}/v1", "qwen3-14b", "test-key",
                non_thinking=True,
            )
            add_model_draft(investigate("ptp-hardware"), non_thinking)
            self.assertEqual(observed["request"]["chat_template_kwargs"],
                             {"enable_thinking": False})
        finally:
            server.shutdown()
            server.server_close()
            thread.join(timeout=2)

    def test_rejects_nonlocal_plain_http(self):
        with self.assertRaises(ValueError):
            OpenAICompatibleModel("http://model.example/v1", "model", "key")


if __name__ == "__main__":
    unittest.main()
