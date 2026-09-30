import re
import unittest
from pathlib import Path


ROOT = Path(__file__).resolve().parents[2]


class ReadmePublicationTests(unittest.TestCase):
    def test_required_quickstart_sections(self):
        text = (ROOT / "README.md").read_text(encoding="utf-8")
        headings = {
            match.group(1).strip().lower()
            for match in re.finditer(r"(?m)^##\s+(.+?)\s*$", text)
        }
        required = {
            "architecture", "deploy", "overview", "references", "requirements",
            "repository structure", "table of contents", "tags",
        }
        self.assertFalse(required - headings)

    def test_architecture_image_has_descriptive_alt_text(self):
        text = (ROOT / "README.md").read_text(encoding="utf-8")
        match = re.search(r"!\[([^]]+)]\((docs/images/architecture\.svg)\)", text)
        self.assertIsNotNone(match)
        self.assertGreater(len(match.group(1).split()), 5)
        self.assertTrue((ROOT / match.group(2)).is_file())

    def test_showroom_execute_blocks_have_launchpad_controls(self):
        pages = list((ROOT / "showroom" / "modules" / "ROOT" / "pages").glob("*.adoc"))
        execute_blocks = sum(
            page.read_text(encoding="utf-8").count('role="execute"')
            for page in pages
        )
        self.assertGreater(execute_blocks, 0)

        script = ROOT / "showroom" / "supplemental-ui" / "js" / "vendor" / "clipboard.js"
        self.assertTrue(script.is_file())
        source = script.read_text(encoding="utf-8")
        self.assertIn("Run in terminal", source)
        self.assertIn("pasteToTerminal", source)

        for playbook_name in ("site.yml", "site-lab.yml"):
            playbook = (ROOT / playbook_name).read_text(encoding="utf-8")
            self.assertIn("supplemental_files: ./showroom/supplemental-ui", playbook)

    def test_lab_conclusion_explains_artifact_retention_and_platform_cleanup(self):
        conclusion = (
            ROOT
            / "showroom-lab"
            / "modules"
            / "ROOT"
            / "pages"
            / "conclusion.adoc"
        ).read_text(encoding="utf-8")
        normalized = " ".join(conclusion.split())

        self.assertIn("sanitized", normalized.lower())
        self.assertIn("outside the lab", normalized.lower())
        self.assertIn("reclaims the entire seat namespace", normalized)
        self.assertIn("revokes its model credential", normalized)
        self.assertIn("zero-residue platform cleanup", normalized)


if __name__ == "__main__":
    unittest.main()
