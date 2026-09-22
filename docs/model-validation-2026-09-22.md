# Direct RACMaaS model validation — 2026-09-22

This is a focused quality check for the optional explanation layer, not a
capacity test or a tenant-gateway acceptance test.

- Model: `qwen3-14b`, reached through the existing direct RACMaaS-hosted
  OpenAI-compatible route. The direct route exposed the model list and accepted
  the two synthetic chat requests without a provisioned virtual key; a
  non-secret placeholder bearer value was used because this quickstart's
  generic client requires one. No key is stored in the repository.
- Mode: `NETWORK_OPS_MODEL_NON_THINKING=1`. This adds the Qwen3/vLLM
  `chat_template_kwargs.enable_thinking=false` extension. Without it, the
  hardware draft was repeatedly rejected because the short completion budget
  was consumed before usable JSON was returned.
- Cases: `ptp-hardware` and `ptp-platform`, twice each after the final prompt
  revision. All four calls returned a structurally accepted draft. The
  deterministic cause and no-remediation boundary were unchanged.
- The local `/api/investigate` web path was also exercised with the direct
  model configuration; it returned a cited hardware draft and
  `action_executed=false`.
- Human review against the [rubric](model-quality-rubric.md): 8/8 for each
  scenario on the final two runs. The hardware draft identified the network
  alarm and NIC timestamp fault, separated the earlier synthetic case, cited
  `network-1`, `hardware-1`, and `knowledge-1`, and called the diagnosis
  provisional. The platform draft identified the network alarm and platform
  timing fault, separated the earlier case, cited `network-1`,
  `openshift_platform-1`, and `knowledge-1`, and required human review.

The saved OpenShift RACMaaS login returned Unauthorized, and the LiteMaaS
gateway route returned HTTP 503 during this check. Therefore this validates
the **direct model route only**. It does not validate catalog-generated
virtual keys, gateway routing, production credentials, concurrency, or
generalization beyond these two small synthetic incidents. The model output
remains an unverified draft in the user interface by design.
