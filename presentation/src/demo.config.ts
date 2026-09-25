import type { DemoConfig } from './types'

const storyAsset = (path: string) => `${import.meta.env.BASE_URL}${path}`

export const demoConfig: DemoConfig = {
  id: 'network-operations-story',
  title: 'One Alarm. Two Causes. One Evidence Trail.',
  subtitle: 'A timing alarm can cross network, platform, and hardware boundaries',
  event: 'Network Operations quickstart',
  audience: 'Network operators, platform teams, and technical decision makers',
  cta: 'Choose the depth that fits the room.',
  brand: {
    primary: { name: 'Red Hat', logo: storyAsset('logos/redhat.svg'), alt: 'Red Hat' },
    partner: { name: 'Intel', logo: storyAsset('logos/intel.png'), alt: 'Intel' },
    attribution: 'Red Hat × Intel',
  },
  acts: [
    {
      id: 'alarm', label: '00', title: 'The Alarm', scenes: [
        { id: 'reframe', type: 'reframe', beat: 'stakes', eyebrow: 'The operational tension', title: 'The first explanation may be wrong', before: 'Ask AI for an answer', after: 'Build a traceable evidence case', detail: 'Current observations, approved history, optional model wording, and human authority must remain distinct. The safety invariant is zero remediation actions executed.', citation: { label: 'Quickstart contract: remediation_execution=false' }, speakerPrompt: 'Start with the operator, not the technology: the alarm is real, but it does not identify its own cause. The value is a faster, defensible next decision without surrendering operator authority.' },
      ],
    },
    {
      id: 'architecture', label: '01', title: 'Guided Architecture', scenes: [
        {
          id: 'guided-architecture', type: 'guided-architecture', beat: 'system-reveal', eyebrow: 'Guided architecture · reveal each boundary', title: 'Who is allowed to claim what?', body: 'Use the operator question to reveal one responsibility at a time.',
          layers: [
            { id: 'alarm', component: 'Scenario contract', tone: 'primary', question: 'What exactly happened?', answer: 'A validated synthetic event starts the investigation.', detail: 'The alarm ID, occurrence time, and bounded scenario are input—not a diagnosis.' },
            { id: 'diagnostics', component: 'Read-only MCP', tone: 'partner', question: 'What do the systems show right now?', answer: 'Named diagnostics produce current observations with provenance.', detail: 'Network, platform, hardware, and upstream scopes are allowlisted. No arbitrary tool and no mutation capability enters the path.' },
            { id: 'history', component: 'Approved history', question: 'Has this pattern happened before?', answer: 'Versioned runbooks and synthetic cases add context—not proof.', detail: 'Historical sources retain IDs and revisions, and remain separate from current observations.' },
            { id: 'policy', component: 'Evidence policy', tone: 'success', question: 'Which cause does the evidence actually support?', answer: 'Deterministic policy compares competing causes and may abstain.', detail: 'Exactly one causal signal is required. Missing, malformed, or conflicting required evidence produces an inconclusive result.' },
            { id: 'operator', component: 'NOC operator', tone: 'primary', question: 'Who owns the next action?', answer: 'A human reviews the evidence and chooses the next diagnostic step.', detail: 'Optional model wording cannot add evidence, select a different cause, or authorize remediation.' },
          ],
          speakerPrompt: 'Pause after every question. Let the audience answer before revealing the component and boundary.',
        },
      ],
    },
    {
      id: 'proof', label: '02', title: 'Live Walkthrough', scenes: [
        { id: 'live-journey', type: 'live-journey', beat: 'live-proof', eyebrow: 'Live infrastructure · guided walkthrough', title: 'Watch the evidence move through the architecture', body: 'The journey verifies readiness, runs both investigations against the deployed MCP diagnostics, and pauses after each live act.', speakerPrompt: 'Narrate the active node and returned evidence. Pause after each act; the diagram, cause, and evidence IDs must agree before continuing.' },
      ],
    },
    {
      id: 'mechanisms', label: '03', title: 'Why It Worked', scenes: [
        { id: 'mechanisms', type: 'mechanisms', beat: 'trials', eyebrow: 'The operating mechanisms', title: 'The result is repeatable because the boundaries are explicit', body: 'Explain the machinery inline before moving into guided practice.', mechanisms: [
          { id: 'provenance', label: 'Provenance first', claim: 'Every current observation keeps its source.', detail: 'The hypothesis can cite only validated evidence IDs returned by approved diagnostics.', tone: 'partner' },
          { id: 'abstention', label: 'Fail closed', claim: 'Ambiguity becomes inconclusive—not confidence theater.', detail: 'Missing, malformed, or conflicting required evidence prevents a supported cause.', tone: 'primary' },
          { id: 'authority', label: 'Human authority', claim: 'Recommendation and action remain separate.', detail: 'The workflow proposes the next discriminating test and executes no remediation.', tone: 'success' },
        ], speakerPrompt: 'Tie each mechanism to the evidence the room just saw. Do not introduce a new side journey.' },
      ],
    },
    {
      id: 'payoff', label: '04', title: 'Evidence & Handoff', scenes: [
        { id: 'evidence-payoff', type: 'evidence-payoff', beat: 'transformation', eyebrow: 'What this session proved', title: 'Close on Flightpath evidence—not a memorized number', emptyState: 'Run both live investigations before making the payoff claim.', line1: 'The agent does not close the incident.', line2: 'It makes the next decision defensible.', cta: 'Continue into guided practice or the lab →', speakerPrompt: 'Read back only the causes, observation counts, request timing, and action boundary returned in this session. If the proof was not run, return to Act 02.' },
      ],
    },
  ],
  relatedStories: [
    { title: 'Live Demonstration', duration: '5–10 minutes', question: 'Can changing the evidence change the hypothesis?', technology: 'Two synthetic incidents · Structured evidence · Human review', instruction: 'Open the Network Operations Workspace and run both cases.', href: '/' },
    { title: 'Guided Demo', duration: '25–35 minutes', question: 'Can the audience trace every claim to its owner and boundary?', technology: 'Baseline · Architecture trace · OpenShift resources', instruction: 'Continue in the Showroom guide through Modules 1 and 2.' },
    { title: 'Hands-on Lab', duration: '75–90 minutes', question: 'Can participants extend, break, qualify, and explain the pattern?', technology: 'Build · Failure injection · Qualification · NOC decision brief', instruction: 'Complete all seven Showroom modules and export the evidence bundle.' },
  ],
}
