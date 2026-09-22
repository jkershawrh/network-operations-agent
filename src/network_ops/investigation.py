"""Fail-closed evidence assembly; no model or operational mutation occurs here."""

from __future__ import annotations

import hashlib
import json
from typing import Iterable

from .providers import (
    AlarmProvider,
    DiagnosticTool,
    FixtureAlarmProvider,
    FixtureDiagnosticTool,
    FixtureKnowledgeProvider,
    KnowledgeProvider,
)


def _stable_id(alarm: dict) -> str:
    source = f"{alarm['alarm_id']}:{alarm['fixture_revision']}"
    return hashlib.sha256(source.encode()).hexdigest()[:12]


def investigate(
    scenario_id: str,
    *,
    alarm_provider: AlarmProvider | None = None,
    tools: Iterable[DiagnosticTool] | None = None,
    knowledge_provider: KnowledgeProvider | None = None,
) -> dict:
    """Return a source-separated recommendation for synthetic input only.

    External providers are deliberately not trusted to select a root cause or
    authorize action. Missing tool evidence forces an inconclusive result.
    """

    alarm = (alarm_provider or FixtureAlarmProvider()).load(scenario_id)
    if alarm.get("data_classification") != "synthetic":
        raise ValueError("This proof accepts synthetic scenario data only")

    investigation_id = _stable_id(alarm)
    observations: list[dict] = []
    unknowns: list[str] = []
    scores = {"hardware": 0, "platform": 0}
    seen_scopes: set[str] = set()
    expected_signals = {
        "network": "timing_alarm",
        "openshift_platform": "platform_timing_fault",
        "hardware": "nic_timestamp_fault",
    }
    diagnostic_tools = tools if tools is not None else (
        FixtureDiagnosticTool(scope)
        for scope in ("network", "openshift_platform", "hardware")
    )

    for tool in diagnostic_tools:
        scope = tool.scope
        if scope not in {"network", "openshift_platform", "hardware"}:
            raise ValueError("Diagnostic provider has an unsupported scope")
        if scope in seen_scopes:
            raise ValueError("Duplicate diagnostic scope")
        seen_scopes.add(scope)
        try:
            result = tool.inspect(alarm)
            if not isinstance(result, dict):
                raise ValueError("Diagnostic result must be an object")
            if result.get("status") != "ok":
                raise ValueError("Diagnostic status is not ok")
            if (not isinstance(result.get("observed_at"), str) or
                    not result["observed_at"] or
                    not isinstance(result.get("provenance"), str) or
                    not result["provenance"]):
                raise ValueError("Diagnostic provenance is missing")
            findings = result.get("observations")
            if not isinstance(findings, list) or len(findings) != 1:
                raise ValueError("Expected one bounded diagnostic observation")
            for index, finding in enumerate(findings, 1):
                if (not isinstance(finding, dict) or
                        finding.get("signal") != expected_signals[scope] or
                        finding.get("state") not in {"present", "absent"}):
                    raise ValueError("Diagnostic observation is unsupported")
                evidence_id = f"{scope}-{index}"
                observations.append({
                    "evidence_id": evidence_id,
                    "scope": scope,
                    "signal": finding["signal"],
                    "state": finding["state"],
                    "observed_at": result["observed_at"],
                    "provenance": result["provenance"],
                })
                if finding["state"] == "present":
                    if finding["signal"] == "platform_timing_fault":
                        scores["platform"] += 1
                    elif finding["signal"] == "nic_timestamp_fault":
                        scores["hardware"] += 1
        except (KeyError, TypeError, ValueError, TimeoutError, ConnectionError) as exc:
            unknowns.append(f"{scope} diagnostics unavailable: {type(exc).__name__}")

    for scope in ("network", "openshift_platform", "hardware"):
        if scope not in seen_scopes:
            unknowns.append(f"{scope} diagnostics not supplied")

    try:
        retrieved = (knowledge_provider or FixtureKnowledgeProvider()).retrieve(alarm, observations)
        if not isinstance(retrieved, list):
            raise ValueError("Knowledge result must be a list")
        context = [
            {
                "evidence_id": f"knowledge-{index}",
                "source_id": doc["source_id"],
                "source_revision": doc["source_revision"],
                "excerpt": doc["excerpt"],
                "retrieval_score": doc.get("retrieval_score"),
                "matching_signals": doc.get("matching_signals", []),
            }
            for index, doc in enumerate(retrieved[:5], 1)
            if (isinstance(doc, dict) and
                isinstance(doc.get("source_id"), str) and doc["source_id"] and
                isinstance(doc.get("source_revision"), str) and doc["source_revision"] and
                isinstance(doc.get("excerpt"), str) and doc["excerpt"])
        ]
        if not context:
            unknowns.append("No approved historical context retrieved")
    except (KeyError, TypeError, ValueError, TimeoutError, ConnectionError):
        context = []
        unknowns.append("Historical context unavailable")

    complete = not any("diagnostics" in item for item in unknowns)
    if complete and scores["hardware"] > 0 and scores["platform"] == 0:
        cause = "hardware_timing"
        support = [o["evidence_id"] for o in observations if o["signal"] == "nic_timestamp_fault" and o["state"] == "present"]
    elif complete and scores["platform"] > 0 and scores["hardware"] == 0:
        cause = "platform_timing"
        support = [o["evidence_id"] for o in observations if o["signal"] == "platform_timing_fault" and o["state"] == "present"]
    else:
        cause = "inconclusive"
        support = []
        if complete:
            unknowns.append("Current observations do not distinguish a single cause")

    return {
        "schema_version": "network-operations-agent.result/v0.1",
        "investigation_id": investigation_id,
        "alarm_id": alarm["alarm_id"],
        "current_observations_with_tool_provenance": observations,
        "historical_context_with_source_revision": context,
        "primary_hypothesis": {"cause": cause, "supporting_evidence_ids": support},
        "alternate_hypotheses": ["platform_timing", "hardware_timing"] if cause == "inconclusive" else ["platform_timing" if cause == "hardware_timing" else "hardware_timing"],
        "unknowns_and_conflicts": unknowns,
        "next_discriminating_test": "Compare platform lock-state events with NIC timestamp diagnostics at the same time window",
        "proposed_action": "Have a qualified network operator review the evidence and run the next diagnostic test",
        "action_requires_human_approval": True,
        "action_executed": False,
        "mode": "deterministic_fixture_proof",
    }


def to_json(result: dict) -> str:
    return json.dumps(result, indent=2, sort_keys=True)
