.PHONY: test-unit test-all run-local audit-claims

test-unit:
	PYTHONPATH=src python3 -m unittest discover -s tests -v

test-all: test-unit

run-local:
	PYTHONPATH=src python3 -m network_ops serve

audit-claims:
	@echo "No measured performance or hardware claims in fixture mode. Review tests/claim_registry.yaml before publication."
