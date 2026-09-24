import asyncio
import json
import unittest

try:
    from mcp import Client
    from network_ops.mcp_server import server
except ImportError:
    Client = None
    server = None


@unittest.skipUnless(Client is not None, "Install requirements-mcp.txt for MCP tests")
class MCPTests(unittest.TestCase):
    def test_approved_tool_set_and_structured_response(self):
        async def run():
            async with Client(server) as client:
                tools = await client.list_tools()
                self.assertEqual({tool.name for tool in tools.tools}, {
                    "network_timing_status", "platform_timing_status", "hardware_timestamp_status",
                    "upstream_clock_status",
                })
                response = await client.call_tool("hardware_timestamp_status", {
                    "alarm_id": "synthetic-ptp-001",
                    "occurred_at": "2026-09-22T08:00:00Z",
                    "scope": "hardware",
                })
                self.assertFalse(response.is_error)
                data = response.structured_content or json.loads(response.content[0].text)
                self.assertEqual(data["status"], "ok")
                self.assertEqual(data["observations"][0]["signal"], "nic_timestamp_fault")
        asyncio.run(run())

    def test_rejects_unknown_alarm(self):
        async def run():
            async with Client(server) as client:
                response = await client.call_tool("hardware_timestamp_status", {
                    "alarm_id": "customer-live", "occurred_at": "2026-09-22T08:01:00Z", "scope": "hardware",
                })
                self.assertTrue(response.is_error)
        asyncio.run(run())


if __name__ == "__main__":
    unittest.main()
