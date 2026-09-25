import type { DemoConfig } from './types'

const storyAsset = (path: string) => `${import.meta.env.BASE_URL}${path}`

export const demoConfig: DemoConfig = {
  id: 'network-operations-story',
  title: 'One Alarm. Two Causes. One Evidence Trail.',
  subtitle: 'Evidence-backed network operations with Red Hat and Intel',
  event: 'Network Operations quickstart',
  audience: 'Network operators, platform teams, and technical decision makers',
  cta: 'Choose one approved incident and map its evidence boundary.',
  brand: {
    primary: { name: 'Red Hat', logo: storyAsset('logos/redhat.svg'), alt: 'Red Hat' },
    partner: { name: 'Intel', logo: storyAsset('logos/intel.png'), alt: 'Intel' },
    attribution: 'Red Hat × Intel',
  },
  acts: [
    {
      id: 'alarm', label: '00', title: 'The Alarm', scenes: [
        { id: 'intro', type: 'intro', beat: 'ordinary-world', title: 'One Alarm. Two Causes. One Evidence Trail.', subtitle: 'A timing alarm can cross network, platform, and hardware boundaries' },
        { id: 'stakes', type: 'metric', beat: 'stakes', eyebrow: 'The safety invariant', value: '0', label: 'network or platform changes executed by this quickstart', tone: 'success', citation: { label: 'Quickstart contract: remediation_execution=false' } },
        { id: 'root-cause', type: 'quote', beat: 'root-cause', title: 'The alarm is real. The first explanation may not be.', quote: 'A timing alarm can originate in the network, the OpenShift platform, or the underlying hardware.', attribution: 'Network Operations quickstart' },
        { id: 'reframe', type: 'reframe', beat: 'reframe', title: 'Reframe the operator’s decision', before: 'Ask an AI for the answer', after: 'Build a traceable evidence case', detail: 'The system may explain evidence. It cannot replace provenance, uncertainty, or human review.' },
      ],
    },
    {
      id: 'evidence', label: '01', title: 'The Evidence Boundary', scenes: [
        { id: 'flow', type: 'architecture-flow', beat: 'system-reveal', eyebrow: 'System reveal', title: 'Every conclusion has a visible path', body: 'Present observations and historical context remain separate all the way to review.', steps: [
          { id: 'alarm', label: 'Synthetic alarm', detail: 'Versioned event + KPI snapshot', transition: 'normalize', tone: 'primary' },
          { id: 'mcp', label: 'Read-only MCP', detail: 'Network · Platform · Hardware', transition: 'observe', tone: 'partner' },
          { id: 'history', label: 'Approved retrieval', detail: 'Runbooks + prior synthetic cases', transition: 'compare' },
          { id: 'case', label: 'Evidence case', detail: 'Hypothesis · Unknowns · Next test', transition: 'review', tone: 'success' },
          { id: 'human', label: 'Human operator', detail: 'Approve, question, or reject' },
        ] },
        { id: 'boundaries', type: 'trust-boundary', beat: 'system-reveal', title: 'Three sources. Three meanings.', zones: [
          { id: 'present', label: 'Current observations', boundary: 'MCP provenance', items: ['Observed state', 'Timestamp', 'Tool identity'], tone: 'partner' },
          { id: 'history', label: 'Historical context', boundary: 'Approved sources', items: ['Source revision', 'Matching signals', 'Retrieval score'] },
          { id: 'wording', label: 'Optional model wording', boundary: 'Unverified draft', items: ['Cannot change the cause', 'Cannot execute action', 'Must cite evidence IDs'], tone: 'primary' },
        ] },
        { id: 'pipeline', type: 'pipeline', beat: 'system-reveal', title: 'The investigation earns its recommendation', steps: [
          { label: 'Observe', detail: 'Call bounded diagnostics' }, { label: 'Retrieve', detail: 'Rank approved context' }, { label: 'Compare', detail: 'Test competing causes' }, { label: 'Expose uncertainty', detail: 'Unknowns stay visible' }, { label: 'Propose', detail: 'One next diagnostic test' },
        ] },
      ],
    },
    {
      id: 'proof', label: '02', title: 'Two Investigations', scenes: [
        { id: 'hardware-proof', type: 'live-proof', beat: 'live-proof', eyebrow: 'Live proof · Case one', title: 'The hardware signal earns a hardware hypothesis', body: 'The same API gathers three current observations and keeps the recommendation read-only.', adapterId: 'hardware-investigation', cta: 'Investigate hardware signal', resultFields: [
          { key: 'alarm', label: 'Alarm' }, { key: 'cause', label: 'Supported cause' }, { key: 'observations', label: 'Current observations' }, { key: 'support', label: 'Supporting evidence' }, { key: 'approval', label: 'Human approval' }, { key: 'executed', label: 'Action executed' },
        ] },
        { id: 'platform-proof', type: 'live-proof', beat: 'live-proof', eyebrow: 'Live proof · Case two', title: 'Change the evidence. Change the hypothesis.', body: 'The platform fixture must not collapse into the hardware answer.', adapterId: 'platform-investigation', cta: 'Investigate platform signal', resultFields: [
          { key: 'alarm', label: 'Alarm' }, { key: 'cause', label: 'Supported cause' }, { key: 'observations', label: 'Current observations' }, { key: 'support', label: 'Supporting evidence' }, { key: 'approval', label: 'Human approval' }, { key: 'executed', label: 'Action executed' },
        ] },
        { id: 'comparison', type: 'comparison', beat: 'trials', title: 'One alarm family. Distinct evidence.', columns: [
          { label: 'Hardware signal', value: 'hardware_timing', detail: 'NIC timestamp fault present; platform timing fault absent', tone: 'partner' },
          { label: 'Platform signal', value: 'platform_timing', detail: 'Platform timing fault present; NIC timestamp fault absent', tone: 'success' },
        ] },
      ],
    },
    {
      id: 'limits', label: '03', title: 'Authority and Limits', scenes: [
        { id: 'tradeoff', type: 'tradeoff', beat: 'trials', title: 'Useful because it knows where to stop', options: [
          { title: 'Deterministic evidence', strength: 'Traceable cause selection', tradeoff: 'Limited to approved scenarios and diagnostic contracts.' },
          { title: 'Optional model wording', strength: 'Operator-friendly explanation', tradeoff: 'Unverified and never allowed to change the selected hypothesis.' },
          { title: 'Human review', strength: 'Preserves operational authority', tradeoff: 'The quickstart recommends; it does not remediate.' },
        ], decision: 'Missing or conflicting evidence produces an evidence gap—not a fabricated answer.' },
        { id: 'scope', type: 'stat-grid', beat: 'trials', eyebrow: 'Honest scope', title: 'What this proves—and what it does not', stats: [
          { value: '2', label: 'Approved synthetic quickstart scenarios', tone: 'partner' },
          { value: '3', label: 'Read-only diagnostic scopes', tone: 'neutral' },
          { value: '1', label: 'Next discriminating test proposed', tone: 'success' },
          { value: '0', label: 'Remediation actions executed', tone: 'success' },
        ], citation: { label: 'Quickstart contract and automated scenario tests' } },
      ],
    },
    {
      id: 'payoff', label: '04', title: 'The Operator Stays in Control', scenes: [
        { id: 'punchline', type: 'punchline', beat: 'transformation', eyebrow: 'The transformation', line1: 'The agent does not close the incident.', line2: 'It makes the next decision defensible.', cta: 'Map your next approved incident →' },
      ],
    },
  ],
  relatedStories: [
    { title: 'Build an Incident Pattern', question: 'Can this evidence contract travel to another alarm?', technology: 'Portable JSON · Approved tools · Human review' },
    { title: 'Reliability Lab', question: 'What happens when tools, retrieval, or model wording fail?', technology: 'Failure injection · Qualification · Evidence bundle' },
  ],
}
