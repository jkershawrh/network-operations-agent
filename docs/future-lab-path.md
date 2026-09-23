# Launchpad quickstart-to-lab handoff

This repository remains the canonical standalone quickstart. It now also owns
the Antora learner journey, Helm deployment contract, and portable learner
artifact needed for Launchpad onboarding. Launchpad owns environment binding,
seat certification, catalog lifecycle, and ordering; those are not quickstart
release gates.

This file is a proposed gate sequence, not a certification report. The local
fixture tests for two distinct causes, timeout, retrieval miss, unknown
scenario, empty diagnostics, cross-scope signals, conflicting evidence, and
the approved-tool adapter pass. A local UBI image build and CLI smoke test
also pass. The base image resolves to amd64 on this arm64 host, so native
arm64 support is unverified. The synthetic MCP tools pass in-process and
over local Streamable HTTP. The application has been deployed and exercised
on the Oberon OpenShift cluster, and its optional model wording was validated
against CPU-labelled Granite 8B inference. That evidence does not establish
the placement of an external inference backend. Antora source is present, but
the ordered Launchpad journey and multi-seat gates remain RED / not run.

## Next integration boundary

- Map each diagnostic scope to one explicitly approved, read-only MCP tool.
  Reject unknown tool names, non-success status, missing timestamps or source
  provenance, empty observations, and signals returned by the wrong scope.
- Supply MCP endpoint and any authentication only through runtime Secret
  references. Never render credentials or raw model endpoints in Showroom.
- Keep the current deterministic evidence assembly as the fallback if MCP or
  the model times out. A model may draft wording, but may not add evidence IDs,
  select an unobserved root cause, or authorize an action.
- Test the actual MCP server schema and model response quality against both
  fixtures before choosing a target image, model, or Launchpad deployment.

## CDD — contracts

- Validate the alarm, diagnostic result, knowledge excerpt, evidence record,
  and review-decision schemas against positive and malformed fixtures.
- Assert diagnostic MCP tools cannot mutate state or reach outside their
  allowed namespace/data scope.
- Assert every final claim refers to an evidence ID or is labeled inference.

## TDD — implementation

- Test one synthetic timing incident with a hardware hypothesis and one with
  a platform hypothesis; require evidence to distinguish them.
- Test tool timeout, retrieval miss, conflicting evidence, model failure, and
  denied review. No failure path may report resolved or execute an action.
- Test that swapping diagnostic and model providers preserves the output
  contract and learner steps.

## EDD — environment

- Build immutable images from a pinned source, verify SBOM, provenance,
  signature, architecture, and pullability on the intended cluster.
- Verify MaaS credentials are seat-scoped runtime Secrets, not Git, Helm
  values, Argo CD Applications, or Showroom-rendered tokens.
- Verify each seat's routes, model call, MCP calls, RAG sources, isolation,
  readiness, restart behavior, and zero-residue reclaim.

## BDD — learner behavior

- A new learner completes the five steps from Showroom without hidden
  operator intervention.
- The learner can explain which facts came from current tools versus retrieved
  history, identify at least one uncertainty, and submit a reviewed action.
- The IMC profile and core profile exercise the same runtime and assessment.

## CBT — capability and claim checks

- A telco SME reviews synthetic signal realism and the two distinct causes.
- Red Hat and Intel owners review product/hardware descriptions and any
  published claims. No Ericsson or third-party branding is inherited.
- Only measured comparisons may support MTTR, truck-roll, latency, Xeon AMX,
  or cost claims; otherwise describe the capability without a number.

## Launchpad intake sequence

1. Publish the standalone quickstart source with a clean immutable SHA,
   deployable workload, Showroom/Antora content, synthetic data, and tests.
2. Run Launchpad's Git-first discovery/scaffold against that SHA; keep the
   generated intake and catalog record draft, internal-only, non-orderable.
3. Review model/tool data boundaries, namespace permissions, resource
   envelope, images, Showroom tabs, and cleanup contract.
4. Validate pinned source and Antora build; render the exact workload and
   review Secret/image/Route behavior without exposing raw credentials.
5. Certify the actual participant journey at one seat, then five, then the
   measured intended workshop size. Record failure and cleanup evidence.
6. Promote only after human review. IMC audience wording does not justify a
   second runtime or duplicate catalog item.

## Remaining decisions before catalog promotion

- Confirm maintainers and the immutable source revision used by intake.
- Bind a Launchpad-provided model Secret using `endpoint`, `name`, and
  `api-key`; never put those values in source or rendered Showroom content.
- Record target-model quality against both synthetic scenarios in the actual
  participant environment.
- Decide whether Ansible is an optional later module. If so, it needs a
  separate approval, authorization, rollback, and live certification track.
