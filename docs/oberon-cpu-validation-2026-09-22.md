# Oberon CPU-only inference check — 2026-09-22

This is a separate infrastructure check from the RACMaaS direct-route review.
No RACMaaS serving pod was inspected here.

- Oberon has one amd64 node with 256 CPU cores. Its reported capacity and
  allocatable resources contain no GPU or Gaudi device resource. The existing
  `fleet-llm-d/ovms-granite-2b` pod runs on that node, requests/limits only
  CPU and memory, and serves an OpenAI-compatible `granite-2b-cpu` endpoint.
- The quickstart's two drafts were rejected against Granite 2B. An exact
  synthetic hardware response mixed up evidence IDs and included source IDs
  in the `evidence_ids` array. Granite 2B is **not** an accepted model for
  this quickstart.
- The existing Oberon model cache also contains an OpenVINO Granite 8B model.
  A temporary `granite-8b-cpu` serving pod was run on Oberon from that cache,
  with only CPU and memory resources and no Route. At an 8-CPU limit, one
  case was rejected after a long wait. At a 16-CPU limit, both synthetic
  cases produced structurally accepted drafts on two consecutive runs.
- Human review of the 16-CPU outputs found correct current signals,
  separation of historical context, provisional language, and the
  no-remediation boundary. Historical claims were sometimes not represented
  in the returned citation array, so citation precision is at most 1/2 on
  the [rubric](model-quality-rubric.md); this is a limited 7/8 teaching proof,
  not a general quality or capacity claim.
- The local quickstart `/api/investigate` web path also returned a cited
  hardware draft with `action_executed=false` through the temporary Oberon
  model in about 18 seconds.

The temporary Granite 8B pod and local port-forwards were removed. No
existing Oberon deployment, Route, or model cache was modified. This proves
the quickstart can use CPU-only inference on Oberon at this test size. It
does **not** prove that the separate RACMaaS
`granite-3-2-8b-instruct-cpu` route is scheduled without accelerators;
that requires a RACMaaS cluster-side serving-pod check.
