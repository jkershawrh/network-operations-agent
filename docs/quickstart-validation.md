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

On 2026-09-22, the two cases also passed a limited [direct RACMaaS
CPU-labeled Granite 8B review](model-validation-2026-09-22.md). Backend CPU
placement and the tenant-keyed LiteMaaS gateway were not independently
validated; no performance or broader quality claim follows from two fixtures.
An independent [Oberon CPU-only check](oberon-cpu-validation-2026-09-22.md)
validated the same quickstart path on a node with no GPU or Gaudi resources;
it does not establish the backend placement of the separate RACMaaS route.

## Publication and environment gates

- The repository owner chose MIT; see `LICENSE`. Confirm contributor
  organization and complete intake before public release.
- Build and pin an immutable image digest. The UBI image has built and run on
  an arm64 development host by emulating amd64; native arm64 is not verified.
  Obtain the digest from a fresh pull of the registry tag, since the local
  build's manifest digest can differ from the digest served by Quay.
- On 2026-09-22, the amd64 image was pushed to private Quay and deployed by
  digest in an isolated OpenShift namespace. Both Deployments became ready;
  port-forwarded smoke checks passed for both incidents, and no Route was
  created. A namespace-local pull Secret was needed for the private image.
  An unrelated probe pod could not connect to the protected diagnostics
  service, while the app could. The Helm release, probe pod, and namespace-
  local pull Secret were removed after testing. The target-cluster image
  pull, readiness, HTTP journey, ingress isolation, and uninstall path are
  therefore verified. The chart creates no public Route or model Secret.
- Avoid MTTR, truck-roll, hardware-acceleration, latency, or capacity claims
  until measured in the target environment. The two synthetic incidents are
  instructional examples, not evidence of operational performance.

The [future lab path](future-lab-path.md) is separate from these quickstart
gates.
