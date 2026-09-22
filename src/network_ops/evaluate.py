"""Run structural checks against an assigned model; human review remains required."""

from __future__ import annotations

import os

from .investigation import investigate
from .model import OpenAICompatibleModel, add_model_draft


SCENARIOS = ("ptp-hardware", "ptp-platform")


def evaluate(model) -> list[dict]:
    reports = []
    for scenario in SCENARIOS:
        result = add_model_draft(investigate(scenario), model)
        draft = result["model_draft"]
        reports.append({
            "scenario": scenario,
            "cause": result["primary_hypothesis"]["cause"],
            "status": draft["status"],
            "summary": draft.get("summary"),
            "evidence_ids": draft.get("evidence_ids", []),
            "action_executed": result["action_executed"],
        })
    return reports


def main() -> int:
    names = ("NETWORK_OPS_MODEL_BASE_URL", "NETWORK_OPS_MODEL_NAME", "NETWORK_OPS_MODEL_API_KEY")
    if any(not os.environ.get(name) for name in names):
        print("Model evaluation needs an assigned endpoint, model name, and runtime key.")
        return 2
    try:
        model = OpenAICompatibleModel(
            *(os.environ[name] for name in names),
            non_thinking=os.environ.get("NETWORK_OPS_MODEL_NON_THINKING") == "1",
        )
    except ValueError:
        print("Model runtime configuration is invalid.")
        return 2
    reports = evaluate(model)
    for item in reports:
        print(f"{item['scenario']}: {item['status']} (hypothesis: {item['cause']})")
        if item["summary"]:
            print(f"  Draft for human review: {item['summary']}")
            print(f"  Cited evidence IDs: {', '.join(item['evidence_ids'])}")
    if not all(item["status"] == "unverified_draft_for_human_review" for item in reports):
        return 1
    print("Structural checks passed; human factual review is still required.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
