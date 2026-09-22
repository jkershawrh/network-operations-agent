"""Local teaching UI/API; fixture-only and not an MCP transport."""

from __future__ import annotations

import json
import os
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path

from .investigation import investigate

INDEX = Path(__file__).resolve().parents[2] / "web" / "index.html"
SCENARIOS = frozenset({"ptp-hardware", "ptp-platform"})


class LabHandler(BaseHTTPRequestHandler):
    def _send(self, status: int, body: bytes, content_type: str) -> None:
        self.send_response(status)
        self.send_header("Content-Type", content_type)
        self.send_header("Content-Length", str(len(body)))
        self.send_header("Cache-Control", "no-store")
        self.send_header("X-Content-Type-Options", "nosniff")
        self.end_headers()
        self.wfile.write(body)

    def _json(self, status: int, data: dict) -> None:
        self._send(status, json.dumps(data).encode(), "application/json; charset=utf-8")

    def do_GET(self) -> None:
        if self.path == "/":
            self._send(200, INDEX.read_bytes(), "text/html; charset=utf-8")
        elif self.path == "/health":
            self._json(200, {"status": "ok", "mode": "synthetic_local_proof"})
        else:
            self._json(404, {"error": "Not found"})

    def do_POST(self) -> None:
        if self.path != "/api/investigate":
            self._json(404, {"error": "Not found"})
            return
        try:
            length = int(self.headers.get("Content-Length", "0"))
            if not 1 <= length <= 1024:
                raise ValueError("Invalid request size")
            request = json.loads(self.rfile.read(length))
            if not isinstance(request, dict) or set(request) != {"scenario_id"}:
                raise ValueError("Expected scenario_id only")
            scenario_id = request["scenario_id"]
            if not isinstance(scenario_id, str) or scenario_id not in SCENARIOS:
                raise ValueError("Unknown synthetic scenario")
        except (ValueError, TypeError, UnicodeDecodeError):
            self._json(400, {"error": "Select an approved synthetic scenario"})
            return
        endpoint = os.environ.get("NETWORK_OPS_MCP_URL")
        if endpoint:
            from .mcp_client import MCPDiagnosticTool
            tools = [MCPDiagnosticTool(scope, endpoint) for scope in (
                "network", "openshift_platform", "hardware"
            )]
            self._json(200, investigate(scenario_id, tools=tools))
        else:
            self._json(200, investigate(scenario_id))


def serve(host: str = "127.0.0.1", port: int = 8080) -> None:
    if host not in {"127.0.0.1", "localhost"} and not (
        host == "0.0.0.0" and os.environ.get("NETWORK_OPS_CONTAINER_MODE") == "1"
    ):
        raise ValueError("Non-loopback binding requires explicit container mode")
    with ThreadingHTTPServer((host, port), LabHandler) as server:
        print(f"Local lab: http://{host}:{server.server_port}", flush=True)
        server.serve_forever()
