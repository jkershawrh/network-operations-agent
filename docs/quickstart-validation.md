# Quickstart validation

The quickstart demonstrates a synthetic telco investigation. These checks
separate working local behavior from unverified environment claims.

## Automated local gates

- `make test-all PYTHON=.venv/bin/python` covers contract fields, diagnostic
  abstention, evidence provenance, retrieval selection, MCP requests, model
  response filtering, simulated human review, HTTP behavior, publication
  basics, and Helm rendering.
- `helm lint chart` validates the optional OpenShift chart.
- `make compose-up COMPOSE='uvx podman-compose'` (or Docker Compose) starts
  two isolated services. `make smoke` checks both scenarios through the web
  API, including source IDs and the no-action boundary.
- `make compose-down COMPOSE='uvx podman-compose'` stops the stack.

## Manual model-quality gate

The model client is optional. A mock proves the request and response contract;
it does not establish quality of an actual target model. When an assigned
runtime endpoint and key are available, run `make test-model` and apply the
[model review rubric](model-quality-rubric.md) to both outputs. Reject
confident diagnoses on incomplete or conflicting data. Record the model ID,
endpoint owner, evaluation date, and reviewer; do not record keys or raw
bearer headers.

## Publication and environment gates

- Confirm repository owner, contributor organization, and license before
  public release. Do not infer a license from dependencies or related repos.
- Build and pin an immutable image digest. The local UBI image has built and
  run on an arm64 development host by emulating amd64; native arm64 is not
  verified, and no registry image is published.
- On OpenShift, verify image pull, readiness, internal MCP NetworkPolicy,
  the existing Secret reference, port-forward access, and uninstall cleanup.
  The chart deliberately creates no public Route or model Secret.
- Avoid MTTR, truck-roll, hardware-acceleration, latency, or capacity claims
  until measured in the target environment. The two synthetic incidents are
  instructional examples, not evidence of operational performance.

The [future lab path](future-lab-path.md) is separate from these quickstart
gates.
