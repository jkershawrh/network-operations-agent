# Architecture and event flow

## Roles

| Role | Baseline responsibility | Replaceable boundary |
| --- | --- | --- |
| Alarm source | Emit a versioned, synthetic network event and KPI snapshot | `AlarmProvider` |
| Orchestrator | Plan bounded diagnostic calls and compose an evidence record | `InvestigationRunner` |
| MCP tools | Return current network, platform, and hardware observations | `DiagnosticTool` |
| Retrieval | Return approved runbook and historical incident excerpts | `KnowledgeProvider` |
| Model client | Help interpret evidence and draft the explanation | `ModelClient` |
| Human reviewer | Accept, revise, or reject the proposed next action | `ReviewDecision` |

The orchestrator must not treat an MCP tool as an LLM, or a RAG excerpt as a
live observation. Tool names and schemas are versioned so a different platform
agent, hardware agent, or RAN vendor can be connected without rewriting the
learner journey. The model endpoint and key are runtime configuration, not
learner-facing source files or rendered Showroom values.

## Reference event flow

```text
Synthetic alarm + KPI snapshot
  -> normalize event and assign investigation ID
  -> ask bounded MCP tools for current network, platform, hardware evidence
  -> retrieve runbook and similar-incident excerpts by source/revision
  -> compare current observations with historical precedent
  -> produce evidence ledger, hypothesis, alternatives, and unknowns
  -> propose one next diagnostic or remediation step
  -> human reviews; baseline records decision but executes nothing
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
evidence that this lab is implemented. The live “Building Intelligent
Applications with Python and RAG” Showroom demonstrates retrieval and data
pipeline concepts but is a different lab. David Kypuros's implementation
remains an integration candidate until its source and terms are reviewed.
