# Audience journey acceptance matrix

This matrix treats the presentation, live system, guided demo, and lab as one
product. A green release must preserve the transitions between them, not merely
render the React story.

| Journey contract | Red | Amber | Green | Automated evidence |
|---|---|---|---|---|
| Presenter story | More than 10 minutes or more than 10 scenes | 8–10 minutes or 8–10 scenes | 5–7 minutes and no more than 7 scenes | `validateDemoConfig` and presentation tests |
| Architecture | Static diagram or unexplained component list | Animated sequence without audience questions | Operator question → responsibility → boundary, revealed one at a time | guided-architecture component test |
| Live proof | Fixture appears live or proof is only narrated | Honest fallback but no clear next step | Source state is explicit and proof hands off to the Workspace | live-proof tests and offline verification |
| Demonstration | Repeats the entire presentation | Runs one case without comparison | Workspace compares both alarm cases and exposes evidence, unknowns, next test, and authority | smoke and publication tests |
| Mechanism explanation | Component inventory or side journey | Mechanisms named without connection to proof | Provenance, abstention, and authority are explained inline from the observed result | presentation scene test |
| Evidence payoff | Static claim or memorized metric | Qualitative recap disconnected from the run | Payoff reads causes, observation counts, request timing, and action boundary from current-session Flightpath responses | journey evidence component test |
| Guided demo | No instructor path | Commands exist but architecture is disconnected | Modules 1–2 connect UI, API evidence, architecture, and OpenShift resources | Showroom publication tests |
| Hands-on lab | Read-only tour only | Participant edits without qualification | Participant builds a third case, extends MCP, injects failures, qualifies behavior, and exports a decision brief | lab contract and behavior suite |
| Journey handoff | Presentation ends with another slide | CTA names a next step but does not identify where | Finale offers live demo, guided demo, and lab with duration and exact destination | config validation and finale rendering |
| Presenter guidance | No timing or prompts | Separate notes that drift from scenes | Scene-bound prompts available with `P`; guide states where to stop and transition | presenter-control test |
| Honest claims | Unqualified production or autonomous-operation claims | Caveats only in documentation | Synthetic scope, source state, uncertainty, and no-remediation boundary remain visible | claim registry, contracts, and tests |

## Release gate

A row is green only when its automated evidence passes and a rehearsal confirms
the human transition. Any red row blocks a demo release. Amber rows may be used
only for an internal rehearsal with the limitation called out before the run.

## Presenter sequence

1. **Story — 5–7 minutes:** establish the ambiguous alarm, reframe the value,
   reveal the architecture through five operator questions, run two live
   conditions, explain the operating mechanisms inline, and deliver a payoff
   derived from the current Flightpath responses.
2. **Live demonstration — 5–10 minutes:** open *Network Operations Workspace*,
   run both built-in cases, and compare provenance, unknowns, and the next test.
3. **Guided demo — 25–35 minutes:** follow Modules 1–2 with the Workspace,
   Terminal, and OpenShift Console visible.
4. **Hands-on lab — 75–90 minutes:** complete all seven modules, ending with a
   qualification report, checksums, and a NOC decision brief.
