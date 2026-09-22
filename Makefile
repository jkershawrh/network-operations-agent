.PHONY: test-unit test-mcp test-all test-model run-local run-mcp compose-up compose-down smoke audit-claims build-container

PYTHON ?= python3
COMPOSE ?= docker compose

test-unit:
	PYTHONPATH=src $(PYTHON) -m unittest discover -s tests -v

test-mcp:
	$(PYTHON) -c 'import mcp'
	PYTHONPATH=src $(PYTHON) -m unittest discover -s tests -p 'test_mcp*.py' -v

test-all: test-mcp test-unit

run-local:
	PYTHONPATH=src $(PYTHON) -m network_ops serve

run-mcp:
	PYTHONPATH=src $(PYTHON) -m network_ops.mcp_server

build-container:
	podman build -f Containerfile -t network-operations-agent:local .

compose-up:
	$(COMPOSE) -f compose.yaml up --build -d

compose-down:
	$(COMPOSE) -f compose.yaml down

smoke:
	PYTHONPATH=src $(PYTHON) -m network_ops.smoke

test-model:
	PYTHONPATH=src $(PYTHON) -m network_ops.evaluate

audit-claims:
	@echo "No measured performance or hardware claims in fixture mode. Review tests/claim_registry.yaml before publication."
