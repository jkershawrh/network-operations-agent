Network operations teams rarely struggle because they lack alerts.

They struggle because one alert can represent several very different failures.

Today, we have a production timing alarm.

PTP synchronization has degraded.

.

The same symptom could begin in the network interface hardware, or it could come from the platform timing service.

Those causes require different responses.

The operator does not need a more confident guess.

The operator needs evidence that crosses the network, platform, and hardware boundaries.

.

This investigation begins by defining exactly what happened.

A validated scenario contract describes the alarm and its operating scope.

The alert is treated as input, not as a diagnosis.

.

Next, the system asks what the environment shows right now.

Allowlisted diagnostic tools collect current network, platform, and hardware observations.

These tools are read-only.

They preserve where every observation came from, and they cannot modify the environment.

.

The investigation also asks whether this has happened before.

Versioned cases and runbooks provide approved historical context.

That context can help interpret current observations, but history is never allowed to masquerade as current evidence.

.

The next question is which cause the evidence actually supports.

A deterministic policy compares the current observations with the approved context.

It selects a supported cause, or it abstains when the evidence is incomplete or contradictory.

The decision is not made by the language model.

.

Generative AI enters only after the evidence decision.

Granite runs on Intel Xeon CPU infrastructure and drafts a concise explanation for the operator.

The model cannot introduce new evidence.

It cannot change the selected cause.

It cannot authorize remediation.

.

The final boundary is human authority.

The system can recommend the next discriminating test and propose an operational response.

The operator still owns the next action.

Every claim has a source.

Every decision has a boundary.

Every action has an accountable owner.

.

Now we will run two conditions through the same deployed architecture on Red Hat OpenShift.

Before making any claim, the application verifies that the services and diagnostics boundary are ready.

The results that follow come from the running environment when the interface displays live status.

If the interface displays rehearsal or offline status, those results are fallback examples and are not presented as live evidence.

.

In the first condition, the system investigates a possible hardware timing problem.

The agent normalizes the alarm, collects observations from three diagnostic scopes, retrieves approved context, and applies the evidence policy.

The current evidence includes network, OpenShift platform, and hardware observations.

Every observation retains an evidence identifier and its provenance.

In this condition, the hardware timestamp fault is present while the competing platform signal is absent.

.

The system retrieves versioned operational knowledge to help interpret those observations.

The historical context can support the explanation, but it cannot override what the systems reported.

The deterministic policy follows the current evidence and identifies hardware timing as the supported cause.

Granite then drafts the operator explanation on the Intel CPU inference workload shown by the live response.

The separation is visible.

The policy decides.

The model explains.

The human acts.

.

The agent proposes the next discriminating test and a possible operational response.

No remediation has occurred.

Human approval is explicitly required.

.

For the second condition, the alarm, architecture, tools, and policy remain the same.

Only the underlying evidence changes.

This time, the problem originates in the platform timing service.

The workflow again gathers current observations, retrieves approved context, applies the same deterministic policy, and uses the model only to explain the supported result.

.

The second investigation reaches a different conclusion.

The evidence now supports platform timing.

We have the same alert and the same workflow, but two distinct evidence-backed diagnoses.

The system is not repeating a memorized answer.

It is not trusting the alarm label.

Its conclusion follows the current evidence.

.

Three operating mechanisms make this result repeatable.

First, provenance comes before confidence.

Every supporting observation retains its source.

Second, the workflow fails closed.

Missing or conflicting evidence produces an inconclusive result instead of a confident fabrication.

Third, recommendation is not action.

The agent can investigate and explain, but operational authority remains with the person responsible for the network.

.

This session completed two infrastructure investigations.

One alarm produced two different supported causes because the evidence changed.

Granite participated on Intel CPU as an explanation layer.

The system performed no automated remediation.

Evidence chose the cause.

AI explained the result.

Human authority was preserved.

.

Evidence before inference.

Human before action.

.

The presentation and guided proof end here.

The hands-on Network Operations lab is a separate environment available through Partner AI Launchpad.

In that lab, participants build and qualify the workflow themselves.

They inspect provenance, extend the scenario, test failure boundaries, and produce an operator decision brief.

Red Hat provides the governed application platform and operational boundaries.

Intel provides the CPU infrastructure for practical enterprise inference.

Together, they make agentic network operations explainable, deployable, and accountable.

.
