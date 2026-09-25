# Network Operations Demo — Video Talk Track

**Target duration:** 6–7 minutes  
**Core message:** Evidence chooses the cause. AI explains the result. The operator retains authority.

## Opening

Network operations teams rarely struggle because they lack alerts. They struggle because one alert can represent several very different failures.

Today, we have a production timing alarm: PTP synchronization has degraded.

**Click:** Reveal the ambiguity.

The same symptom could begin in the network interface hardware, or it could come from the platform timing service. Those causes require different responses.

**Click:** Reframe the decision.

So the operator does not need a more confident guess. They need evidence that crosses the network, platform, and hardware boundaries.

## Guided Architecture

We designed the investigation around six explicit boundaries. Let’s earn each part of the architecture by asking what the operator needs.

### 1. Scenario contract

What exactly happened?

**Click:** Reveal technical boundary.

A validated scenario contract defines the alarm and its operating scope. The alert is treated as input—not as a diagnosis.

**Click:** Ask next question.

### 2. Read-only diagnostics

What do the systems show right now?

**Click:** Reveal technical boundary.

Allowlisted MCP tools collect current network, platform, and hardware observations. These tools are read-only, retain provenance, and cannot modify the environment.

**Click:** Ask next question.

### 3. Approved history

Has this happened before?

**Click:** Reveal technical boundary.

Versioned cases and runbooks provide historical context. But history is not allowed to masquerade as current evidence.

**Click:** Ask next question.

### 4. Evidence policy

Which cause is actually supported?

**Click:** Reveal technical boundary.

A deterministic evidence policy compares the current observations with the approved context. It selects a supported cause—or abstains when evidence is missing or contradictory.

**Click:** Ask next question.

### 5. Intel CPU inference

Where can generative AI help?

**Click:** Reveal technical boundary.

Granite runs on Intel Xeon CPU infrastructure after the evidence decision. It drafts a concise explanation for the operator.

The model cannot introduce evidence, change the selected cause, or authorize remediation.

**Click:** Ask next question.

### 6. Human authority

Who owns the next action?

**Click:** Reveal technical boundary.

The operator does. The system recommends a discriminating test and proposed next step, but action remains behind a human approval boundary.

**Click:** Complete architecture.

Every claim now has a source, every decision has a boundary, and every action has an accountable owner.

## Live Walkthrough

Now we’ll run two conditions through the same deployed architecture on Flightpath.

### Checkpoint 1: Readiness

**Click:** Verify Flightpath readiness.

Before making any claim, the application verifies that the deployed services and diagnostics boundary are ready.

This is not a prerecorded sequence. The following results come from the running environment.

### Checkpoint 2: Hardware investigation

**Click:** Investigate hardware signal.

The agent is now normalizing the alarm, collecting three diagnostic scopes, retrieving approved context, and applying the evidence policy.

**Pause for the live response.**

The response takes approximately ten seconds because the workflow includes a live Granite inference on Intel CPU.

### Checkpoint 3: Current diagnostics

The current evidence includes network, OpenShift platform, and hardware observations.

Notice that every observation retains an evidence ID and provenance. The hardware timestamp fault is present, while the competing platform signal is absent.

**Click:** Inspect approved history.

### Checkpoint 4: Historical context

The system retrieves versioned operational knowledge. It can help interpret the observations, but it cannot override what the systems reported.

**Click:** Evaluate the evidence.

### Checkpoint 5: Decision and LLM boundary

The agent orchestrated the investigation. The deterministic policy selected hardware timing as the supported cause.

Granite 3.2 8B then drafted the operator explanation on an Intel Xeon 6767P CPU workload.

The important separation is visible here: the policy decides, the model explains, and the human acts.

**Click:** Review the authority boundary.

### Checkpoint 6: Human authority

The agent proposes the next discriminating test and a possible operational response.

But no remediation has occurred. Human approval is explicitly required.

**Click:** Change the incident condition.

### Checkpoint 7: Changed condition

Now we keep the alarm, architecture, tools, and policy exactly the same.

The only thing we change is the underlying evidence: this time, the problem originates in the platform timing service.

**Click:** Investigate platform signal.

**Pause for the live response.**

### Checkpoint 8: Comparison

The second investigation followed the new evidence to a different conclusion: platform timing.

So we have the same alert and the same workflow—but two distinct, evidence-backed diagnoses.

That is the proof. The system is not repeating a memorized answer or trusting the alarm label. Its conclusion follows the live evidence.

## Why It Worked

**Advance to:** Why It Worked.

Three operating mechanisms make this result repeatable.

First, provenance comes before confidence. Every supporting observation retains its source.

Second, the workflow fails closed. Missing or conflicting evidence produces an inconclusive result instead of a confident fabrication.

Third, recommendation is not action. The agent can investigate and explain, but operational authority remains with the person responsible for the network.

## Payoff

**Advance to:** Evidence & Handoff.

This session completed two live infrastructure investigations.

One alarm produced two different supported causes because the evidence changed.

Granite participated live on Intel CPU, but only as an explanation layer.

Across both investigations, the number of automated actions was zero.

Evidence chose the cause. AI explained the result. Human authority was preserved.

## Close

**Advance to the finale.**

Evidence before inference. Human before action.

The presentation has shown the operating model. The guided investigation is where the operator now takes control.

Using the same incident and evidence trail, they can inspect provenance, challenge the conclusion, and make the human review decision themselves.

Red Hat provides the governed application platform and operational boundaries. Intel provides the CPU infrastructure for practical enterprise inference. Together, they make agentic operations explainable, deployable, and accountable.

**Click:** Begin guided investigation.

## Recording Checklist

- Record at 1920×1080 in fullscreen.
- Confirm Flightpath readiness before starting.
- Verify both live investigations complete successfully.
- Confirm `granite-3.2-8b-tools` and Intel Xeon appear in the live proof.
- Confirm the payoff shows two causes and zero automated actions.
- Hide browser notifications and unrelated tabs.
- Keep the cursor still except when advancing the story.
- Pause after each architecture question before revealing its answer.
- Leave the final screen visible for three seconds before ending the recording.
