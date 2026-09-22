"""MCP-backed diagnostic provider; tool responses still pass investigation checks."""

from __future__ import annotations

import asyncio
import json

from mcp import Client
from mcp.types import TextContent

from .providers import ApprovedDiagnosticAdapter


APPROVED_TOOLS = {
    "network": "network_timing_status",
    "openshift_platform": "platform_timing_status",
    "hardware": "hardware_timestamp_status",
}


def approved_tools_available(endpoint: str | object) -> bool:
    async def check() -> bool:
        async with Client(endpoint) as client:
            listed = await client.list_tools()
            return set(APPROVED_TOOLS.values()).issubset({tool.name for tool in listed.tools})

    try:
        return asyncio.run(check())
    except Exception:
        return False


class MCPDiagnosticTool:
    def __init__(self, scope: str, endpoint: str | object):
        if scope not in APPROVED_TOOLS:
            raise ValueError("Unsupported diagnostic scope")
        self.scope = scope
        self._endpoint = endpoint

    def inspect(self, alarm: dict) -> dict:
        async def call(name: str, args: dict) -> dict:
            async with Client(self._endpoint) as client:
                listed = await client.list_tools()
                if name not in {tool.name for tool in listed.tools}:
                    raise ValueError("Approved diagnostic tool unavailable")
                result = await client.call_tool(name, args)
                if result.is_error:
                    raise ValueError("Diagnostic tool returned an error")
                if isinstance(result.structured_content, dict):
                    return result.structured_content
                if len(result.content) == 1 and isinstance(result.content[0], TextContent):
                    parsed = json.loads(result.content[0].text)
                    if isinstance(parsed, dict):
                        return parsed
                raise ValueError("Diagnostic tool returned no structured data")

        def sync_call(name: str, args: dict) -> dict:
            try:
                return asyncio.run(call(name, args))
            except Exception as exc:
                raise ConnectionError("MCP diagnostic unavailable") from exc

        return ApprovedDiagnosticAdapter(
            self.scope, APPROVED_TOOLS[self.scope], sync_call
        ).inspect(alarm)
