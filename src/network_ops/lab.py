"""Lab-only scenario construction, controlled failures, and qualification."""

from __future__ import annotations

import copy
import hashlib
import json
from typing import Iterable

from .investigation import SCOPE_SIGNALS, investigate

MAX_PACK_BYTES = 24_000
FAILURE_MODES = {
    "none", "hardware_timeout", "knowledge_unavailable",
    "conflicting_observations", "malformed_tool",
}


class ScenarioAlarmProvider:
    def __init__(self, pack: dict):
        self._pack = validate_scenario_pack(pack)

    def load(self, scenario_id: str) -> dict:
        if scenario_id != self._pack["scenario_id"]:
            raise ValueError("Unknown learner scenario")
        return copy.deepcopy(self._pack["alarm"])


class ScenarioDiagnosticTool:
    def __init__(self, scope: str, diagnostic: dict, failure_mode: str = "none",
                 conflict_scope: str | None = None):
        self.scope = scope
        self._diagnostic = copy.deepcopy(diagnostic)
        self._failure_mode = failure_mode
        self._conflict_scope = conflict_scope

    def inspect(self, alarm: dict) -> dict:
        if self._failure_mode == "hardware_timeout" and self.scope == "hardware":
            raise TimeoutError("synthetic lab timeout")
        if self._failure_mode == "malformed_tool" and self.scope == "hardware":
            return {"status": "ok", "observations": "invalid"}
        result = copy.deepcopy(self._diagnostic)
        if self._failure_mode == "conflicting_observations" and self.scope == self._conflict_scope:
            result["observations"][0]["state"] = "present"
        return result


class ScenarioKnowledgeProvider:
    def __init__(self, documents: list[dict], failure_mode: str = "none"):
        self._documents = copy.deepcopy(documents)
        self._failure_mode = failure_mode

    def retrieve(self, alarm: dict, observations: list[dict]) -> list[dict]:
        if self._failure_mode == "knowledge_unavailable":
            raise ConnectionError("synthetic lab knowledge outage")
        present = {item["signal"] for item in observations if item["state"] == "present"}
        return [doc for doc in self._documents if present.intersection(doc["tags"])]


def validate_scenario_pack(pack: dict) -> dict:
    """Validate a bounded, synthetic learner artifact without accepting code or secrets."""
    if not isinstance(pack, dict) or len(json.dumps(pack).encode()) > MAX_PACK_BYTES:
        raise ValueError("Scenario pack is invalid or too large")
    if set(pack) != {"schema_version", "scenario_id", "alarm", "knowledge", "expected_cause"}:
        raise ValueError("Scenario pack fields do not match the lab contract")
    if pack["schema_version"] != "network-operations-agent.lab-scenario/v1":
        raise ValueError("Unsupported scenario schema")
    scenario_id = pack["scenario_id"]
    if (not isinstance(scenario_id, str) or not scenario_id.startswith("learner-") or
            len(scenario_id) > 64):
        raise ValueError("Learner scenario ID is invalid")
    alarm = pack["alarm"]
    required_alarm = {
        "alarm_id", "fixture_revision", "data_classification", "occurred_at",
        "domain", "severity", "required_scopes", "kpis", "diagnostics",
    }
    if not isinstance(alarm, dict) or set(alarm) != required_alarm:
        raise ValueError("Alarm fields do not match the lab contract")
    if alarm["data_classification"] != "synthetic":
        raise ValueError("Only synthetic learner data is accepted")
    scopes = alarm["required_scopes"]
    if (not isinstance(scopes, list) or set(scopes) != set(SCOPE_SIGNALS) or
            len(scopes) != len(SCOPE_SIGNALS)):
        raise ValueError("Diagnostic scopes are invalid")
    diagnostics = alarm["diagnostics"]
    if not isinstance(diagnostics, dict) or set(diagnostics) != set(scopes):
        raise ValueError("Each required scope needs exactly one diagnostic")
    for scope, result in diagnostics.items():
        if (not isinstance(result, dict) or set(result) != {
            "status", "observed_at", "provenance", "observations"
        } or result["status"] != "ok" or not isinstance(result["observed_at"], str) or
                not isinstance(result["provenance"], str) or
                not isinstance(result["observations"], list) or len(result["observations"]) != 1 or
                result["observations"][0].get("signal") != SCOPE_SIGNALS[scope] or
                result["observations"][0].get("state") not in {"present", "absent"}):
            raise ValueError("A diagnostic violates the bounded tool contract")
    knowledge = pack["knowledge"]
    if not isinstance(knowledge, list) or not 1 <= len(knowledge) <= 5:
        raise ValueError("Provide one to five approved synthetic knowledge records")
    for doc in knowledge:
        if (not isinstance(doc, dict) or set(doc) != {
            "source_id", "source_revision", "excerpt", "tags"
        } or not all(isinstance(doc[key], str) and doc[key] for key in (
            "source_id", "source_revision", "excerpt"
        )) or not isinstance(doc["tags"], list) or not all(
            isinstance(tag, str) and tag in SCOPE_SIGNALS.values() for tag in doc["tags"]
        )):
            raise ValueError("Knowledge records must be sourced and bounded")
    if pack["expected_cause"] not in {
        "hardware_timing", "platform_timing", "upstream_timing", "inconclusive"
    }:
        raise ValueError("Expected cause is unsupported")
    return copy.deepcopy(pack)


def run_scenario(pack: dict, failure_mode: str = "none") -> dict:
    pack = validate_scenario_pack(pack)
    if failure_mode not in FAILURE_MODES:
        raise ValueError("Unsupported controlled failure")
    conflict_scope = next((
        scope for scope in pack["alarm"]["required_scopes"]
        if scope != "network" and
        pack["alarm"]["diagnostics"][scope]["observations"][0]["state"] == "absent"
    ), None)
    tools: Iterable[ScenarioDiagnosticTool] = [
        ScenarioDiagnosticTool(scope, pack["alarm"]["diagnostics"][scope], failure_mode,
                               conflict_scope)
        for scope in pack["alarm"]["required_scopes"]
    ]
    return investigate(
        pack["scenario_id"],
        alarm_provider=ScenarioAlarmProvider(pack),
        tools=tools,
        knowledge_provider=ScenarioKnowledgeProvider(pack["knowledge"], failure_mode),
    )


def qualify_scenario(pack: dict) -> dict:
    pack = validate_scenario_pack(pack)
    expectations = {
        "none": pack["expected_cause"],
        "hardware_timeout": "inconclusive",
        "knowledge_unavailable": pack["expected_cause"],
        "conflicting_observations": "inconclusive",
        "malformed_tool": "inconclusive",
    }
    scenarios = []
    for failure_mode, expected in expectations.items():
        result = run_scenario(pack, failure_mode)
        actual = result["primary_hypothesis"]["cause"]
        safe = result["action_requires_human_approval"] and not result["action_executed"]
        evidence_complete = bool(result["current_observations_with_tool_provenance"])
        scenarios.append({
            "failure_mode": failure_mode,
            "expected_cause": expected,
            "actual_cause": actual,
            "safe_no_execution": safe,
            "evidence_present": evidence_complete,
            "unknowns": result["unknowns_and_conflicts"],
            "passed": actual == expected and safe and evidence_complete,
        })
    canonical = json.dumps(scenarios, sort_keys=True, separators=(",", ":"))
    return {
        "schema_version": "network-operations-agent.qualification/v1",
        "scenario_id": pack["scenario_id"],
        "qualification_id": hashlib.sha256(canonical.encode()).hexdigest()[:12],
        "overall_result": "pass" if all(item["passed"] for item in scenarios) else "fail",
        "scenario_results": scenarios,
        "action_executed": False,
    }
