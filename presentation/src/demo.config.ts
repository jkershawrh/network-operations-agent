import type { DemoConfig } from './types'

const storyAsset = (path: string) => `${import.meta.env.BASE_URL}${path}`

export const demoConfig: DemoConfig = {
  id: 'network-operations-story',
  title: 'One Alarm. Two Causes. One Evidence Trail.',
  subtitle: 'Evidence-backed network operations with Red Hat and Intel',
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
        { id: 'intro', type: 'intro', beat: 'ordinary-world', title: 'One Alarm. Two Causes. One Evidence Trail.', subtitle: 'A timing alarm can cross network, platform, and hardware boundaries', speakerPrompt: 'Start with the operator, not the technology: the alarm is real, but it does not identify its own cause.' },
        { id: 'reframe', type: 'reframe', beat: 'stakes', eyebrow: 'The operational tension', title: 'The first explanation may be wrong', before: 'Ask AI for an answer', after: 'Build a traceable evidence case', detail: 'Current observations, approved history, optional model wording, and human authority must remain distinct. The safety invariant is zero remediation actions executed.', citation: { label: 'Quickstart contract: remediation_execution=false' }, speakerPrompt: 'The value is not autonomous repair. It is a faster, defensible next decision without surrendering operator authority.' },
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
      id: 'payoff', label: '03', title: 'The Handoff', scenes: [
        { id: 'punchline', type: 'punchline', beat: 'transformation', eyebrow: 'The transformation', line1: 'The agent does not close the incident.', line2: 'It makes the next decision defensible.', cta: 'Continue into proof, practice, or build →', speakerPrompt: 'Do not keep presenting. Choose the next journey based on the room and hand control to the live environment.' },
      ],
    },
  ],
  relatedStories: [
    { title: 'Live Demonstration', duration: '5–10 minutes', question: 'Can changing the evidence change the hypothesis?', technology: 'Two synthetic incidents · Structured evidence · Human review', instruction: 'Open the Network Operations Workspace and run both cases.', href: '/' },
    { title: 'Guided Demo', duration: '25–35 minutes', question: 'Can the audience trace every claim to its owner and boundary?', technology: 'Baseline · Architecture trace · OpenShift resources', instruction: 'Continue in the Showroom guide through Modules 1 and 2.' },
    { title: 'Hands-on Lab', duration: '75–90 minutes', question: 'Can participants extend, break, qualify, and explain the pattern?', technology: 'Build · Failure injection · Qualification · NOC decision brief', instruction: 'Complete all seven Showroom modules and export the evidence bundle.' },
  ],
}
