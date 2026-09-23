# Architecture and event flow

## Roles

| Role | Baseline responsibility | Replaceable boundary |
| --- | --- | --- |
| Alarm source | Emit a versioned, synthetic network event and KPI snapshot | `AlarmProvider` |
| Orchestrator | Call bounded diagnostics and compose an evidence record | `investigate` |
| MCP tools | Return current network, platform, and hardware observations | `DiagnosticTool` |
| Retrieval | Rank approved synthetic excerpts from present tool signals | `KnowledgeProvider` |
| Model client | Help interpret evidence and draft the explanation | `ModelClient` |
| Human reviewer | Simulate approval, request more evidence, or reject; no persistence or action | `/api/review` |

The orchestrator must not treat an MCP tool as an LLM, or a retrieved excerpt as a
live observation. Tool names and schemas are versioned so a different platform
agent, hardware agent, or RAN vendor can be connected without rewriting the
quickstart journey. The model endpoint and key are runtime configuration, not
source files or rendered UI values.

The current build includes a synthetic read-only MCP server and client using
Streamable HTTP. The local web process selects that path only when
`NETWORK_OPS_MCP_URL` is configured; otherwise it uses direct fixtures. The
MCP server is unauthenticated. Compose keeps it on an internal network; the
OpenShift chart restricts ingress to the application pod. It must not receive
any Route. The chart can expose only the learner-facing application through an
opt-in Launchpad participant Route. Retrieval is tag-based over approved synthetic excerpts and
uses only observations accepted from tools, not a preselected answer in the
alarm fixture.
An optional OpenAI-compatible model client can draft an explanation after the
deterministic hypothesis is selected. Missing/invalid model output cannot
change the hypothesis or execute an action. The text remains unverified for
human review even if its cited evidence IDs pass structural checks. No live
diagnostic connector, target-model quality proof, or vector retrieval is connected.

## Reference event flow

```text
Synthetic alarm + KPI snapshot
  -> normalize event and assign investigation ID
  -> ask bounded MCP tools for current network, platform, hardware evidence
  -> retrieve approved runbook and case excerpts matching present tool signals
  -> compare current observations with historical precedent
  -> produce evidence ledger, hypothesis, alternatives, and unknowns
  -> propose one next diagnostic test
  -> human simulates review; no decision is stored and nothing executes
```

For the first scenario, a radio-site timing alarm can lead to a cross-layer
investigation. The fixture may include offset spikes, lock-state changes,
platform events, and NIC timestamp observations. These are **synthetic
teaching data**, not a recreation of the joint vendor demo or proof that a
particular component is at fault. At least one alternate fixture should lead
to a platform-side cause so the learner cannot pass by always selecting
hardware.

## Failure behavior

- Tool timeout or authorization failure: preserve the error as an evidence
  gap and do not fabricate a result.
- Missing or low-quality retrieval: proceed only with live observations and
  say historical support is unavailable.
- Conflicting evidence: give competing hypotheses and the next discriminating
  test; do not emit a confident final root cause.
- Model unavailable: return a structured evidence ledger and safe failure
  message; do not claim an AI diagnosis.
- Approval unavailable: retain a recommendation only; never execute.

## Content profiles

`core-network-ops` owns the stable commands, contracts, and assessment.
`imc-telco` may change the scenario narrative, vocabulary, examples, and
opening/conclusion pages. It must not silently change permissions, model,
images, resource envelope, evidence policy, or action authority. A profile
that changes those properties requires separate certification.

## Separation from adjacent work

The existing `aiops-copilot` quickstart is a possible source of ideas, not
proof of this quickstart's behavior. David Kypuros's implementation remains
an integration candidate until its source and reuse terms are reviewed.
