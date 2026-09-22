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

    def test_business_story_and_required_sections(self):
        text = (ROOT / "README.md").read_text()
        title = text.splitlines()[0]
        self.assertTrue(title.startswith("# Investigate "))
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
