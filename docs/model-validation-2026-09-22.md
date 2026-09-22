# CPU-targeted RACMaaS model validation — 2026-09-22

This is a focused check of the optional explanation layer, not a capacity or
tenant-gateway acceptance test. The quickstart is intended to use CPU
inference, not a GPU or Gaudi model.

- Model: `granite-3-2-8b-instruct-cpu`, reached through its existing direct
  RACMaaS-hosted OpenAI-compatible route. The route and the repository's
  RACMaaS model map both label it CPU. The saved OpenShift login was expired,
  so this run did **not** independently inspect the backend pod's node or
  accelerator allocation. Confirm that placement before a hardware claim.
- The direct route exposed the model list and accepted synthetic chat
  requests without a provisioned virtual key. A non-secret placeholder
  bearer value was used because the generic quickstart client requires one.
  No key is stored in the repository.
- With the original 12-second client timeout, both requests were rejected;
  an exact raw hardware request completed in about 20 seconds. The client
  timeout was raised to 60 seconds for CPU inference.
- Cases: `ptp-hardware` and `ptp-platform`, twice each after the timeout
  change. All four calls returned structurally accepted drafts. The
  deterministic causes and no-remediation boundary were unchanged.
- The local `/api/investigate` web path was also exercised against the
  CPU-labeled direct route; it returned a cited hardware draft with
  `action_executed=false` in about 18 seconds.
- Human review against the [rubric](model-quality-rubric.md): at least 7/8
  for each case on both runs, with the mandatory human-review safety item
  at 2/2. Drafts described the current network/platform/hardware signals,
  distinguished historical precedent, and called the diagnosis provisional.
  Citation precision was scored 1/2 when a general runbook was over-cited
  or a negative current observation was described without its ID in the
  returned citation array. This is acceptable for the limited two-fixture
  gate, not proof of general groundedness.

An earlier `qwen3-14b` direct-route test was **not** a CPU test: earlier
RACMaaS notes place that model on Gaudi. Its results are excluded from the
CPU acceptance score. The saved OpenShift RACMaaS login returned Unauthorized,
and the LiteMaaS gateway route returned HTTP 503 during this check. Thus the
CPU-labeled **direct route** is validated for these two fixtures, but backend
CPU placement, catalog-generated virtual keys, gateway routing, production
credentials, concurrency, and broader quality remain unverified. The model
output remains an unverified draft in the UI by design.
