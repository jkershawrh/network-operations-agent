import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { demoConfig } from '../demo.config'
import '../live/demoAdapter'
import type { SceneConfig } from '../types'
import { SceneRenderer } from './SceneRenderer'
import { clearJourneyEvidence, recordJourneyEvidence } from '../live/journeyEvidence'

describe('SceneRenderer', () => {
  afterEach(() => vi.restoreAllMocks())
  const scenes = demoConfig.acts.flatMap((act) => act.scenes)

  for (const scene of scenes) {
    it(`renders ${scene.type}: ${scene.id}`, () => {
      const { container } = render(<SceneRenderer scene={scene} brand={demoConfig.brand} />)
      expect(container.querySelector('.scene')).toBeInTheDocument()
    })
  }

  it('labels rehearsal data instead of presenting it as live', async () => {
    const scene: SceneConfig = { id: 'fallback-proof', type: 'live-proof', beat: 'live-proof', title: 'Fallback proof', adapterId: 'hardware-investigation', cta: 'Run proof', resultFields: [{ key: 'cause', label: 'Cause' }] }
    render(<SceneRenderer scene={scene} brand={demoConfig.brand} />)
    fireEvent.click(screen.getByRole('button', { name: scene.type === 'live-proof' ? scene.cta : '' }))
    expect(await screen.findByText('rehearsal')).toBeInTheDocument()
  })

  it('opens and closes the phase-aware technical topology', () => {
    const scene = scenes.find((item) => item.type === 'live-journey')!
    render(<SceneRenderer scene={scene} brand={demoConfig.brand} />)
    expect(screen.getByTestId('live-operator-workspace')).toBeInTheDocument()
    expect(screen.getByText('What happened?')).toBeInTheDocument()
    expect(screen.getByText('PTP synchronization degraded')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Run live investigation/ })).toBeInTheDocument()
    expect(screen.queryByLabelText('Live technical deployment topology')).not.toBeInTheDocument()
    expect(screen.getByLabelText('Live journey progress').querySelectorAll('button')).toHaveLength(4)
    fireEvent.click(screen.getByRole('button', { name: 'Inspect technical topology' }))
    expect(screen.getByLabelText('Live technical deployment topology')).toBeInTheDocument()
    expect(screen.getByRole('dialog', { name: 'Technical topology detail' })).toBeInTheDocument()
    expect(screen.getByText(/LIVE ARCHITECTURE · Alarm/)).toBeInTheDocument()
    expect(document.querySelector('[data-node="app"]')).toHaveClass('active', 'focus')
    expect(document.querySelector('[data-node="mcp"]')).not.toHaveClass('active')
    fireEvent.keyDown(window, { key: 'Escape' })
    expect(screen.queryByRole('dialog', { name: 'Technical topology detail' })).not.toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Inspect technical topology' }))
    fireEvent.click(screen.getByRole('button', { name: 'Close topology ×' }))
    expect(screen.queryByRole('dialog', { name: 'Technical topology detail' })).not.toBeInTheDocument()
  })

  it('paces the opening as three sparse internal beats', async () => {
    const scene = scenes.find((item) => item.type === 'incident-open')!
    render(<SceneRenderer scene={scene} brand={demoConfig.brand} />)
    expect(screen.getByText('02:17 · PRODUCTION NETWORK')).toBeInTheDocument()
    expect(screen.getByText('One alarm is not one cause.')).toBeInTheDocument()
    expect(screen.queryByText('Hardware timing')).not.toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Advance incident story' }))
    expect(await screen.findByText('Hardware timing')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Advance incident story' }))
    expect(await screen.findByText(/The operator needs evidence/)).toBeInTheDocument()
  })

  it('runs one live investigation and presents one coherent evidence view', async () => {
    const response = {
      investigation_id: 'run-1', alarm_id: 'synthetic-ptp-001', mode: 'deterministic_fixture_proof',
      current_observations_with_tool_provenance: [{ evidence_id: 'hardware-1', scope: 'hardware', signal: 'nic_timestamp_fault', state: 'present', observed_at: '2026-09-22T08:01:00Z', provenance: 'fixture-v1' }],
      historical_context_with_source_revision: [{ evidence_id: 'knowledge-1', source_id: 'ptp-runbook', source_revision: 'v1', excerpt: 'Compare current signals.' }],
      decision_policy: { name: 'single-present-cause', version: 'v1', source: 'checked-in application rule', rule: 'Exactly one mapped fault is required.' },
      primary_hypothesis: { cause: 'hardware_timing', supporting_evidence_ids: ['hardware-1'] }, alternate_hypotheses: ['platform_timing'], unknowns_and_conflicts: [],
      next_discriminating_test: 'Compare lock state', proposed_action: 'Have an operator review', action_requires_human_approval: true, action_executed: false,
    }
    vi.spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce(new Response(JSON.stringify({ status: 'ready' }), { status: 200 }))
      .mockResolvedValueOnce(new Response(JSON.stringify(response), { status: 200 }))
    const scene = scenes.find((item) => item.type === 'live-journey')!
    render(<SceneRenderer scene={scene} brand={demoConfig.brand} />)
    fireEvent.click(screen.getByRole('button', { name: /Run live investigation/ }))
    await screen.findByText('What did the agent find?')
    expect(screen.getByText('NIC hardware timestamping')).toBeInTheDocument()
    expect(screen.getByText(/adapter reports unreliable packet timestamping/)).toBeInTheDocument()
    expect(screen.getByText(/1 versioned sources retrieved/)).toBeInTheDocument()
    await waitFor(() => expect(globalThis.fetch).toHaveBeenCalledTimes(2))
  })

  it('renders the statistic-grid scene', () => {
    const scene: SceneConfig = {
      id: 'coverage-stat-grid',
      type: 'stat-grid',
      beat: 'stakes',
      title: 'The stakes',
      stats: [{ value: '3×', label: 'Faster', tone: 'success' }],
    }
    render(<SceneRenderer scene={scene} brand={demoConfig.brand} />)
    expect(screen.getByText('3×')).toBeInTheDocument()
    expect(screen.getByText('Faster')).toBeInTheDocument()
  })

  it('guides architecture as operator questions and revealed answers', async () => {
    const scene = scenes.find((item) => item.type === 'guided-architecture')!
    const { container } = render(<SceneRenderer scene={scene} brand={demoConfig.brand} />)
    expect(screen.queryByLabelText('Architecture progress')).not.toBeInTheDocument()
    expect(screen.getByText('What exactly happened?')).toBeInTheDocument()
    expect(screen.queryByText('A validated event starts the investigation.')).not.toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Reveal technical boundary' }))
    expect(await screen.findByText('A validated event starts the investigation.')).toBeInTheDocument()
    expect(container.querySelector('[data-node="app"]')).toHaveClass('active', 'focus')
    expect(container.querySelector('[data-node="mcp"]')).not.toHaveClass('active')
    fireEvent.click(screen.getByRole('button', { name: 'Ask next question →' }))
    expect(await screen.findByText('What do the systems show right now?')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Reveal technical boundary' }))
    expect(container.querySelector('[data-node="app"]')).toHaveClass('active')
    expect(container.querySelector('[data-node="app"]')).not.toHaveClass('focus')
    expect(container.querySelector('[data-node="mcp"]')).toHaveClass('active', 'focus')
  })

  it('keeps the presenter pitch at seven scenes or fewer', () => {
    expect(scenes.length).toBeLessThanOrEqual(7)
  })

  it('preserves the progressive proof sequence before the lab', () => {
    expect(scenes.map((scene) => scene.type)).toEqual(['incident-open', 'guided-architecture', 'live-journey', 'mechanisms', 'evidence-payoff'])
  })

  it('builds the payoff from live journey evidence', () => {
    clearJourneyEvidence()
    recordJourneyEvidence({ scenarioId: 'ptp-hardware', cause: 'hardware_timestamping', observationCount: 3, historicalSourceCount: 1, supportingEvidenceIds: ['hardware-1'], actionExecuted: false, model: 'granite-3.2-8b-tools', modelRuntime: 'Intel Xeon 6767P', modelStatus: 'unverified_draft_for_human_review', latencyMs: 47, collectedAt: '2026-09-24T12:00:00Z' })
    recordJourneyEvidence({ scenarioId: 'ptp-platform', cause: 'platform_timing', observationCount: 3, historicalSourceCount: 2, supportingEvidenceIds: ['openshift-platform-1'], actionExecuted: false, latencyMs: 53, collectedAt: '2026-09-24T12:00:01Z' })
    const scene = scenes.find((item) => item.type === 'evidence-payoff')!
    render(<SceneRenderer scene={scene} brand={demoConfig.brand} />)
    expect(screen.getByText('LIVE')).toBeInTheDocument()
    expect(screen.getByText('hardware timestamping')).toBeInTheDocument()
    expect(screen.getByText(/3 current observations · 1 approved sources/)).toBeInTheDocument()
    expect(screen.getByText('granite-3.2-8b-tools')).toBeInTheDocument()
    expect(screen.getByText(/Intel Xeon 6767P/)).toBeInTheDocument()
    expect(screen.getByText('THE RESULT')).toBeInTheDocument()
    expect(screen.getByText('HUMAN AUTHORITY')).toBeInTheDocument()
    expect(screen.getByText('Zero automated actions')).toBeInTheDocument()
    expect(screen.getByLabelText('Live proof metrics')).toHaveTextContent('2')
    expect(screen.getByLabelText('Live proof metrics')).toHaveTextContent('6')
    expect(screen.getByLabelText('Live proof metrics')).toHaveTextContent('50ms')
    expect(screen.getByLabelText('Live proof metrics')).toHaveTextContent('0')
    clearJourneyEvidence()
  })

  it('makes the agent, policy, LLM, and human boundaries explicit at decision time', async () => {
    const response = {
      investigation_id: 'run-1', alarm_id: 'synthetic-ptp-001', mode: 'deterministic_fixture_proof',
      current_observations_with_tool_provenance: [{ evidence_id: 'hardware-1', scope: 'hardware', signal: 'nic_timestamp_fault', state: 'present', observed_at: '2026-09-22T08:01:00Z', provenance: 'fixture-v1' }],
      historical_context_with_source_revision: [{ evidence_id: 'knowledge-1', source_id: 'ptp-runbook', source_revision: 'v1', excerpt: 'Compare current signals.' }],
      decision_policy: { name: 'single-present-cause', version: 'v1', source: 'checked-in application rule', rule: 'Exactly one mapped fault is required.' },
      primary_hypothesis: { cause: 'hardware_timing', supporting_evidence_ids: ['hardware-1'] }, alternate_hypotheses: ['platform_timing'], unknowns_and_conflicts: [],
      next_discriminating_test: 'Compare lock state', proposed_action: 'Have an operator review', action_requires_human_approval: true, action_executed: false,
    }
    vi.spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce(new Response(JSON.stringify({ status: 'ready' }), { status: 200 }))
      .mockResolvedValueOnce(new Response(JSON.stringify(response), { status: 200 }))
    const scene = scenes.find((item) => item.type === 'live-journey')!
    render(<SceneRenderer scene={scene} brand={demoConfig.brand} />)
    fireEvent.click(screen.getByRole('button', { name: /Run live investigation/ }))
    await screen.findByText('What did the agent find?')
    fireEvent.click(screen.getByRole('button', { name: /Follow the evidence/ }))
    expect(await screen.findByText('AGENT')).toBeInTheDocument()
    expect(screen.getByText('DETERMINISTIC POLICY')).toBeInTheDocument()
    expect(screen.getByText(/reviewed code, not learned by the LLM/)).toBeInTheDocument()
    expect(screen.getByText('LLM NOT CALLED')).toBeInTheDocument()
    expect(screen.getByText('INTEL CPU TARGET')).toBeInTheDocument()
    expect(screen.getByText('Not configured in this environment')).toBeInTheDocument()
    expect(screen.getByText('HUMAN AUTHORITY')).toBeInTheDocument()
  })

  it('includes the optional CPU explanation boundary in guided architecture', async () => {
    const scene = scenes.find((item) => item.type === 'guided-architecture')!
    render(<SceneRenderer scene={scene} brand={demoConfig.brand} />)
    const nextQuestions = ['What do the systems show right now?', 'Has this happened before?', 'Which cause is supported?', 'Where can CPU inference help?']
    for (const question of nextQuestions) {
      fireEvent.click(screen.getByRole('button', { name: 'Reveal technical boundary' }))
      fireEvent.click(screen.getByRole('button', { name: 'Ask next question →' }))
      expect(await screen.findByText(question)).toBeInTheDocument()
    }
    fireEvent.click(screen.getByRole('button', { name: 'Reveal technical boundary' }))
    expect(await screen.findByText('An optional Granite model can draft operator wording after the evidence decision.')).toBeInTheDocument()
  })

  it('renders the custom React scene escape hatch', () => {
    const scene: SceneConfig = {
      id: 'coverage-custom',
      type: 'custom',
      beat: 'live-proof',
      component: () => <div>Custom proof scene</div>,
    }
    render(<SceneRenderer scene={scene} brand={demoConfig.brand} />)
    expect(screen.getByText('Custom proof scene')).toBeInTheDocument()
  })

  const architectureScenes: SceneConfig[] = [
    {
      id: 'coverage-flow', type: 'architecture-flow', beat: 'system-reveal', title: 'Request flow',
      steps: [{ id: 'entry', label: 'Entry', transition: 'route' }, { id: 'model', label: 'Model' }],
    },
    {
      id: 'coverage-layers', type: 'architecture-layers', beat: 'system-reveal', title: 'Layers',
      layers: [{ id: 'platform', label: 'Platform', responsibility: 'Schedules the workload' }],
    },
    {
      id: 'coverage-compare', type: 'architecture-compare', beat: 'reframe', title: 'Structural change',
      before: { label: 'Before', nodes: ['Fixed path'] }, after: { label: 'After', nodes: ['Measured route'] }, insight: 'Measure before routing.',
    },
    {
      id: 'coverage-boundary', type: 'trust-boundary', beat: 'system-reveal', title: 'Trust boundaries',
      zones: [{ id: 'trusted', label: 'Trusted zone', boundary: 'Policy boundary', items: ['Private data'] }],
    },
    {
      id: 'coverage-topology', type: 'deployment-topology', beat: 'system-reveal', title: 'Placement',
      locations: [{ id: 'edge', label: 'Edge', workloads: ['Router'] }],
    },
  ]

  for (const scene of architectureScenes) {
    it(`renders architecture view: ${scene.type}`, () => {
      const { container } = render(<SceneRenderer scene={scene} brand={demoConfig.brand} />)
      expect(container.querySelector('.scene')).toBeInTheDocument()
    })
  }
})
