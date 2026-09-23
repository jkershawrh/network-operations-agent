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


if __name__ == "__main__":
    unittest.main()
