"""Exercise the published quickstart HTTP contract without credentials."""

from __future__ import annotations

import json
import sys
from urllib.request import Request, urlopen


EXPECTED = {
    "ptp-hardware": ("hardware_timing", "ptp-case-hardware"),
    "ptp-platform": ("platform_timing", "ptp-case-platform"),
}


def verify(result: dict, expected_cause: str, expected_source: str) -> None:
    if result["primary_hypothesis"]["cause"] != expected_cause:
        raise AssertionError("Unexpected hypothesis")
    observations = result["current_observations_with_tool_provenance"]
    if len(observations) != 3 or any(not item.get("provenance") for item in observations):
        raise AssertionError("Missing current diagnostic provenance")
    context = result["historical_context_with_source_revision"]
    if expected_source not in {item["source_id"] for item in context}:
        raise AssertionError("Expected historical source was not retrieved")
    if result["action_executed"] or not result["action_requires_human_approval"]:
        raise AssertionError("Action safety boundary failed")
    if result["unknowns_and_conflicts"]:
        raise AssertionError("Quickstart diagnostic gap detected")


def main() -> int:
    base = (sys.argv[1] if len(sys.argv) > 1 else "http://127.0.0.1:8080").rstrip("/")
    for scenario, (cause, source) in EXPECTED.items():
        request = Request(base + "/api/investigate", method="POST",
                          data=json.dumps({"scenario_id": scenario}).encode(),
                          headers={"Content-Type": "application/json"})
        with urlopen(request, timeout=30) as response:
            result = json.load(response)
        verify(result, cause, source)
        print(f"PASS {scenario}: {cause}, cited {source}, no action executed")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
