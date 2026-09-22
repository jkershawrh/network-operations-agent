"""Read-only MCP tools over approved synthetic telco fixtures."""

from __future__ import annotations

from mcp.server import MCPServer
from mcp.server.mcpserver.exceptions import ToolError

from .providers import FixtureAlarmProvider


server = MCPServer("network-operations-agent-fixtures")
SCENARIOS = ("ptp-hardware", "ptp-platform")


def _inspect(scope: str, alarm_id: str, occurred_at: str) -> dict:
    for scenario_id in SCENARIOS:
        alarm = FixtureAlarmProvider().load(scenario_id)
        if alarm["alarm_id"] == alarm_id and alarm["occurred_at"] == occurred_at:
            return alarm["diagnostics"][scope]
    raise ToolError("Unknown synthetic alarm")


@server.tool()
def network_timing_status(alarm_id: str, occurred_at: str, scope: str) -> dict:
    """Read a synthetic network timing observation; never change state."""
    if scope != "network":
        raise ToolError("Scope mismatch")
    return _inspect(scope, alarm_id, occurred_at)


@server.tool()
def platform_timing_status(alarm_id: str, occurred_at: str, scope: str) -> dict:
    """Read a synthetic OpenShift platform timing observation."""
    if scope != "openshift_platform":
        raise ToolError("Scope mismatch")
    return _inspect(scope, alarm_id, occurred_at)


@server.tool()
def hardware_timestamp_status(alarm_id: str, occurred_at: str, scope: str) -> dict:
    """Read a synthetic hardware timestamp observation."""
    if scope != "hardware":
        raise ToolError("Scope mismatch")
    return _inspect(scope, alarm_id, occurred_at)


def main() -> None:
    import os

    host = "0.0.0.0" if os.environ.get("NETWORK_OPS_CONTAINER_MODE") == "1" else "127.0.0.1"
    server.run("streamable-http", host=host, port=8095, json_response=True)


if __name__ == "__main__":
    main()
