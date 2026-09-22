import unittest

from network_ops import investigate
from network_ops.smoke import verify


class SmokeContractTests(unittest.TestCase):
    def test_both_synthetic_paths(self):
        verify(investigate("ptp-hardware"), "hardware_timing", "ptp-case-hardware")
        verify(investigate("ptp-platform"), "platform_timing", "ptp-case-platform")

    def test_wrong_cause_fails(self):
        with self.assertRaises(AssertionError):
            verify(investigate("ptp-platform"), "hardware_timing", "ptp-case-hardware")


if __name__ == "__main__":
    unittest.main()
