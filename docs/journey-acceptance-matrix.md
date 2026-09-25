# Audience journey acceptance matrix

This matrix treats the presentation and live guided proof as one presenter
experience. The hands-on lab is a separate Launchpad product; a green release
must end with an explicit order handoff rather than embedding the lab runtime.

| Journey contract | Red | Amber | Green | Automated evidence |
|---|---|---|---|---|
| Presenter story | More than 10 minutes or more than 10 scenes | 8–10 minutes or 8–10 scenes | 5–7 minutes and no more than 7 scenes | `validateDemoConfig` and presentation tests |
| Architecture | Static diagram or unexplained component list | Animated sequence without audience questions | Operator question → responsibility → boundary, revealed one at a time | guided-architecture component test |
| Live proof | Fixture appears live or proof is only narrated | Honest fallback but no clear next step | Source state is explicit and proof hands off to the Workspace | live-proof tests and offline verification |
| Demonstration | Repeats the entire presentation | Runs one case without comparison | Workspace compares both alarm cases and exposes evidence, unknowns, next test, and authority | smoke and publication tests |
| Mechanism explanation | Component inventory or side journey | Mechanisms named without connection to proof | Provenance, abstention, and authority are explained inline from the observed result | presentation scene test |
| Evidence payoff | Static claim or memorized metric | Qualitative recap disconnected from the run | Payoff reads causes, observation counts, request timing, and action boundary from current-session Flightpath responses | journey evidence component test |
| Guided proof | Static narration only | Live workspace is disconnected from the story | Presentation, architecture, and live proof share one evidence journey and stop before lab authoring | presentation and live-journey tests |
| Hands-on lab boundary | Lab controls or lab network appear in the presenter runtime | Lab is described but the separation is unclear | No lab runtime is embedded; Launchpad provisions the separate environment | deployment values and publication tests |
| Journey handoff | Presentation ends with another slide or an internal lab link | CTA names Launchpad but not the orderable item | Finale names the Network Operations catalog item, duration, and exact Launchpad order destination | config validation and finale rendering |
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
2. **Live guided proof — 5–10 minutes:** run both built-in cases in the
   presenter environment and compare provenance, unknowns, and the next test.
3. **Close and hand off:** end the presentation. Do not open a lab module or a
   lab network inside the presenter runtime.
4. **Separate Launchpad lab — 4 hours:** order *Intel AI 301: Build an
   Evidence-Backed Network Operations Agent* and continue in its provisioned
   network, ending with qualification evidence and a NOC decision brief.
