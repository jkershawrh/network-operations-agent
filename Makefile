.PHONY: test-unit test-all run-local audit-claims build-container

test-unit:
	PYTHONPATH=src python3 -m unittest discover -s tests -v

test-all: test-unit

run-local:
	PYTHONPATH=src python3 -m network_ops serve

build-container:
	podman build -f Containerfile -t network-operations-agent:local .

audit-claims:
	@echo "No measured performance or hardware claims in fixture mode. Review tests/claim_registry.yaml before publication."
