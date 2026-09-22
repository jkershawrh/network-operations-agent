"""Small provider contracts; external MCP and model adapters can implement these."""

from __future__ import annotations

import json
from pathlib import Path
from typing import Callable, Protocol


DATA = Path(__file__).resolve().parents[2] / "data"


class AlarmProvider(Protocol):
    def load(self, scenario_id: str) -> dict: ...


class DiagnosticTool(Protocol):
    scope: str

    def inspect(self, alarm: dict) -> dict: ...


class KnowledgeProvider(Protocol):
    def retrieve(self, alarm: dict) -> list[dict]: ...


class FixtureAlarmProvider:
    def load(self, scenario_id: str) -> dict:
        if scenario_id not in {"ptp-hardware", "ptp-platform"}:
            raise ValueError("Unknown synthetic scenario")
        return json.loads((DATA / "scenarios" / f"{scenario_id}.json").read_text())


class FixtureDiagnosticTool:
    def __init__(self, scope: str):
        if scope not in {"network", "openshift_platform", "hardware"}:
            raise ValueError("Unsupported diagnostic scope")
        self.scope = scope

    def inspect(self, alarm: dict) -> dict:
        return alarm["diagnostics"][self.scope]


class ApprovedDiagnosticAdapter:
    """Call one explicitly mapped read-only tool via an injected transport.

    The caller supplies an MCP-capable transport after authenticating it;
    this class does not discover arbitrary tools, access a network, or store
    credentials. The transport returns a normalized diagnostic dictionary.
    """

    def __init__(self, scope: str, tool_name: str, call: Callable[[str, dict], dict]):
        approved = {
            "network": "network_timing_status",
            "openshift_platform": "platform_timing_status",
            "hardware": "hardware_timestamp_status",
        }
        if approved.get(scope) != tool_name:
            raise ValueError("Diagnostic tool is not approved for this scope")
        self.scope = scope
        self._tool_name = tool_name
        self._call = call

    def inspect(self, alarm: dict) -> dict:
        if alarm.get("data_classification") != "synthetic":
            raise ValueError("Only synthetic alarm data is permitted")
        return self._call(self._tool_name, {
            "alarm_id": alarm["alarm_id"],
            "occurred_at": alarm["occurred_at"],
            "scope": self.scope,
        })


class FixtureKnowledgeProvider:
    def retrieve(self, alarm: dict) -> list[dict]:
        docs = json.loads((DATA / "knowledge.json").read_text())
        allowed = set(alarm["knowledge_source_ids"])
        return [doc for doc in docs if doc["source_id"] in allowed]
