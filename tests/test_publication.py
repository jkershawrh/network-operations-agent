import json
import re
import unittest
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]


class PublicationTests(unittest.TestCase):
    def test_mit_license_is_present(self):
        license_text = (ROOT / "LICENSE").read_text()
        self.assertTrue(license_text.startswith("MIT License\n"))
        self.assertIn("Copyright (c) 2026 Jonathan Kershaw", license_text)

    def test_cpu_target_is_documented_without_hardware_overclaim(self):
        text = (ROOT / "README.md").read_text()
        self.assertIn("granite-3-2-8b-instruct-cpu", text)
        self.assertIn("backend placement still needs cluster-side confirmation", text)

    def test_launchpad_guided_journey_and_learner_artifact(self):
        showroom = ROOT / "showroom" / "modules" / "ROOT"
        antora = (ROOT / "showroom" / "antora.yml").read_text()
        nav = (showroom / "nav.adoc").read_text()
        pages = list((showroom / "pages").glob("*.adoc"))
        combined = "\n".join(path.read_text() for path in pages)
        self.assertIn("name: network-operations-agent", antora)
        for page in ("index.adoc", "01-investigate.adoc", "02-build-pattern.adoc",
                     "conclusion.adoc"):
            self.assertIn(page, nav)
        self.assertGreaterEqual(combined.count('role="execute"'), 6)
        self.assertIn("Leave with something", combined)
        template = json.loads((ROOT / "learner-templates" / "incident-pattern.json").read_text())
        self.assertEqual(template["schema_version"], "network-operations-agent.pattern/v1")
        self.assertTrue(template["action_requires_human_approval"])
        self.assertFalse(template["action_executed"])

    def test_full_lab_is_a_separate_seven_module_build_journey(self):
        root = ROOT / "showroom-lab" / "modules" / "ROOT"
        nav = (root / "nav.adoc").read_text()
        pages = list((root / "pages").glob("*.adoc"))
        combined = "\n".join(page.read_text() for page in pages)
        for number in range(1, 8):
            self.assertIn(f"{number}.", nav)
        self.assertGreaterEqual(combined.count('role="execute"'), 18)
        for outcome in ("scenario pack", "qualification report", "NOC decision brief"):
            self.assertIn(outcome, combined)
        self.assertIn("start_path: showroom-lab", (ROOT / "site-lab.yml").read_text())

    def test_business_story_and_required_sections(self):
        text = (ROOT / "README.md").read_text()
        title = text.splitlines()[0]
        self.assertTrue(title.startswith("# Analyze "))
        self.assertLessEqual(len(title[2:]), 64)
        for heading in ("Overview", "Detailed description", "Requirements", "Deploy",
                        "Repository structure", "References", "Tags"):
            self.assertIn(f"## {heading}", text)
        self.assertIn("Telecommunications", text)
        self.assertIn("synthetic data", text)

    def test_relative_links_exist(self):
        text = (ROOT / "README.md").read_text()
        for target in re.findall(r"\]\(([^)]+)\)", text):
            if target.startswith(("http://", "https://", "#")):
                continue
            self.assertTrue((ROOT / target).exists(), f"Missing README link: {target}")

    def test_no_credentials_in_source(self):
        for path in (ROOT / "src").rglob("*.py"):
            text = path.read_text()
            self.assertNotRegex(text, r"sk-[A-Za-z0-9]{20,}")


if __name__ == "__main__":
    unittest.main()
