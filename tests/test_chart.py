import shutil
import subprocess
import unittest
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]


@unittest.skipUnless(shutil.which("helm"), "Helm is required for chart tests")
class ChartTests(unittest.TestCase):
    def test_secure_render_without_public_route(self):
        rendered = subprocess.check_output([
            "helm", "template", "network-ops", str(ROOT / "chart"),
            "--set", "image.repository=quay.io/example/network-operations-agent",
            "--set", "image.tag=sha-test",
            "--set", "model.existingSecret=assigned-model-key",
        ], text=True)
        self.assertEqual(rendered.count("kind: Deployment"), 2)
        self.assertEqual(rendered.count("kind: Service"), 2)
        self.assertIn("kind: NetworkPolicy", rendered)
        self.assertNotIn("kind: Route", rendered)
        self.assertIn('name: "assigned-model-key"', rendered)
        self.assertNotIn("NETWORK_OPS_MODEL_API_KEY\n", rendered)
        self.assertEqual(rendered.count("readOnlyRootFilesystem: true"), 2)
        self.assertEqual(rendered.count("automountServiceAccountToken: false"), 2)

    def test_digest_reference(self):
        rendered = subprocess.check_output([
            "helm", "template", "network-ops", str(ROOT / "chart"),
            "--set", "image.repository=quay.io/example/network-operations-agent",
            "--set", "image.digest=sha256:abc123",
        ], text=True)
        self.assertEqual(rendered.count("quay.io/example/network-operations-agent@sha256:abc123"), 2)

    def test_lint(self):
        subprocess.run(["helm", "lint", str(ROOT / "chart")], check=True,
                       capture_output=True, text=True)


if __name__ == "__main__":
    unittest.main()
