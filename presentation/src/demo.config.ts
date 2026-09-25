import type { DemoConfig } from './types'

const storyAsset = (path: string) => `${import.meta.env.BASE_URL}${path}`

export const demoConfig: DemoConfig = {
  id: 'network-operations-story',
  title: 'One Alarm. Two Causes. One Evidence Trail.',
  subtitle: 'A timing alarm can cross network, platform, and hardware boundaries',
  event: 'Network Operations quickstart',
  audience: 'Network operators, platform teams, and technical decision makers',
  cta: 'Evidence before inference. Human before action.',
  brand: {
    primary: { name: 'Red Hat', logo: storyAsset('logos/redhat.svg'), alt: 'Red Hat' },
    partner: { name: 'Intel', logo: storyAsset('logos/intel.png'), alt: 'Intel' },
    attribution: 'Red Hat × Intel',
  },
  acts: [
    {
      id: 'alarm', label: '00', title: 'The Alarm', scenes: [
        { id: 'incident-open', type: 'incident-open', beat: 'stakes', eyebrow: '02:17 · timing alarm · production network', title: 'One alarm is not one cause', alarm: 'PTP synchronization degraded', symptom: 'The same alarm can begin in the NIC or the platform timing service.', possibilities: [{ label: 'Hardware timing', signal: 'NIC timestamp fault', tone: 'partner' }, { label: 'Platform timing', signal: 'Timing service fault', tone: 'primary' }], decision: 'The operator needs evidence—not a more confident guess.', citation: { label: 'Synthetic scenarios · no remediation authority' }, speakerPrompt: 'Open on the incident: one symptom, two plausible causes. Let the ambiguity land.' },
      ],
    },
    {
      id: 'architecture', label: '01', title: 'Guided Architecture', scenes: [
        {
          id: 'guided-architecture', type: 'guided-architecture', beat: 'system-reveal', eyebrow: 'Guided system boundaries', title: 'Separate observation, context, inference, and authority',
          layers: [
            { id: 'alarm', component: 'Scenario contract', tone: 'primary', question: 'What exactly happened?', answer: 'A validated event starts the investigation.', detail: 'The alarm is input—not a diagnosis.' },
            { id: 'diagnostics', component: 'Read-only MCP', tone: 'partner', question: 'What do the systems show right now?', answer: 'Named diagnostics return current observations.', detail: 'Allowlisted scopes preserve source and time. They cannot mutate the network.' },
            { id: 'history', component: 'Approved history', question: 'Has this happened before?', answer: 'Versioned cases add context—not proof.', detail: 'Current observations and historical context stay separate.' },
            { id: 'policy', component: 'Evidence policy', tone: 'success', question: 'Which cause is supported?', answer: 'Deterministic policy selects one cause or abstains.', detail: 'Missing or conflicting evidence produces an inconclusive result.' },
            { id: 'cpu', component: 'Optional Intel CPU', tone: 'partner', question: 'Where can CPU inference help?', answer: 'An optional Granite model can draft operator wording after the evidence decision.', detail: 'The model explains; it cannot add evidence, change the cause, or authorize action.' },
            { id: 'operator', component: 'NOC operator', tone: 'primary', question: 'Who owns the next action?', answer: 'The operator reviews the evidence and decides.', detail: 'Recommendation and action remain separate.' },
          ],
          speakerPrompt: 'Pause after every question. Let the audience answer before revealing the component and boundary.',
        },
      ],
    },
    {
      id: 'proof', label: '02', title: 'Live Walkthrough', scenes: [
        { id: 'live-journey', type: 'live-journey', beat: 'live-proof', eyebrow: 'Live infrastructure · guided walkthrough', title: 'Watch evidence become a decision', body: 'Run two conditions through one deployed evidence path.', speakerPrompt: 'Narrate only the active boundary and returned evidence.' },
      ],
    },
    {
      id: 'mechanisms', label: '03', title: 'Why It Worked', scenes: [
        { id: 'mechanisms', type: 'mechanisms', beat: 'trials', eyebrow: 'The operating mechanisms', title: 'The result is repeatable because the boundaries are explicit', body: 'Explain the machinery inline before moving into guided practice.', mechanisms: [
          { id: 'provenance', label: 'Provenance first', claim: 'Every observation keeps its source.', detail: 'Only validated evidence IDs support a cause.', tone: 'partner' },
          { id: 'abstention', label: 'Fail closed', claim: 'Ambiguity becomes inconclusive.', detail: 'Missing or conflicting evidence blocks a supported cause.', tone: 'primary' },
          { id: 'authority', label: 'Human authority', claim: 'Recommendation is not action.', detail: 'The agent proposes; the operator decides.', tone: 'success' },
        ], speakerPrompt: 'Tie each mechanism to the evidence the room just saw. Do not introduce a new side journey.' },
      ],
    },
    {
      id: 'payoff', label: '04', title: 'Evidence & Handoff', scenes: [
        { id: 'evidence-payoff', type: 'evidence-payoff', beat: 'transformation', eyebrow: 'What this session proved', title: 'What the live system proved', emptyState: 'Run both live investigations first.', line1: 'Same alarm. Different evidence.', line2: 'The evidence changed the decision.', speakerPrompt: 'Close on three verified boundaries: evidence chose the cause, Granite explained it on Intel CPU, and the operator retained authority.' },
      ],
    },
  ],
  relatedStories: [{ title: 'Intel AI 301: Build an Evidence-Backed Network Operations Agent', duration: '4 hours', question: 'Can you build and qualify the workflow yourself?', technology: 'Separate Launchpad lab environment · Network Operations', instruction: 'The presentation ends here. Order the separate hands-on Network Operations lab in Partner AI Launchpad to build the scenario, inspect provenance, test failure boundaries, and produce the operator decision brief.', href: 'https://launchpad-candidate.apps.flightpath.fm2aihpcsed.com/request' }],
}
