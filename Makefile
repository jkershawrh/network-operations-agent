.PHONY: test-unit test-mcp test-all run-local run-mcp audit-claims build-container

PYTHON ?= python3

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

audit-claims:
	@echo "No measured performance or hardware claims in fixture mode. Review tests/claim_registry.yaml before publication."
