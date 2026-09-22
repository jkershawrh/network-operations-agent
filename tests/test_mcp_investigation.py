import unittest

try:
    from network_ops.mcp_client import MCPDiagnosticTool
    from network_ops.mcp_server import server
except ImportError:
    MCPDiagnosticTool = None
    server = None

from network_ops import investigate


@unittest.skipUnless(MCPDiagnosticTool is not None, "Install requirements-mcp.txt")
class MCPInvestigationTests(unittest.TestCase):
    def test_in_process_mcp_investigation(self):
        tools = [MCPDiagnosticTool(scope, server) for scope in (
            "network", "openshift_platform", "hardware"
        )]
        result = investigate("ptp-hardware", tools=tools)
        self.assertEqual(result["primary_hypothesis"]["cause"], "hardware_timing")
        self.assertFalse(result["action_executed"])
        self.assertEqual(len(result["current_observations_with_tool_provenance"]), 3)

    def test_unavailable_mcp_fails_closed(self):
        tools = [MCPDiagnosticTool(scope, "http://127.0.0.1:1/mcp") for scope in (
            "network", "openshift_platform", "hardware"
        )]
        result = investigate("ptp-platform", tools=tools)
        self.assertEqual(result["primary_hypothesis"]["cause"], "inconclusive")
        self.assertEqual(result["current_observations_with_tool_provenance"], [])
        self.assertFalse(result["action_executed"])


if __name__ == "__main__":
    unittest.main()
