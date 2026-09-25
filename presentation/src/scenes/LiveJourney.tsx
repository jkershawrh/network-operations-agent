import { useEffect, useRef, useState } from 'react'
import { motion } from 'motion/react'
import type { LiveJourneyScene } from '../types'
import { SceneFrame } from './SceneFrame'
import { TechnicalTopology, type TopologyNodeId } from './TechnicalTopology'
import { clearJourneyEvidence, readJourneyEvidence, recordJourneyEvidence, type InvestigationEvidence } from '../live/journeyEvidence'

type Observation = {
  evidence_id: string
  scope: string
  signal: string
  state: string
  observed_at: string
  provenance: string
}

type HistoricalSource = {
  evidence_id: string
  source_id: string
  source_revision: string
  excerpt: string
}

type Result = {
  investigation_id: string
  alarm_id: string
  mode?: string
  current_observations_with_tool_provenance: Observation[]
  historical_context_with_source_revision: HistoricalSource[]
  decision_policy: { name: string; version: string; source: string; rule: string }
  primary_hypothesis: { cause: string; supporting_evidence_ids: string[] }
  alternate_hypotheses: string[]
  unknowns_and_conflicts: string[]
  next_discriminating_test: string
  proposed_action: string
  action_requires_human_approval: boolean
  action_executed: boolean
  model_draft?: {
    status?: string
    model?: string
    runtime?: string
    summary?: string
    evidence_ids?: string[]
    latency_ms?: number
    prompt?: {
      instruction: string
      evidence: {
        hypothesis: { cause: string; supporting_evidence_ids: string[] }
        current_observations: Observation[]
        historical_context: HistoricalSource[]
        unknowns: string[]
      }
    }
  }
}

type ScenarioId = 'ptp-hardware' | 'ptp-platform'
type Phase = 'alarm' | 'investigate' | 'decide' | 'compare'
type Status = 'idle' | 'running' | 'paused' | 'complete' | 'error'

const phases: Array<{
  id: Phase
  label: string
  kicker: string
  explanation: string
  cta: string
  lane: 'workload' | 'agent' | 'decision'
}> = [
  { id: 'alarm', label: 'Alarm', kicker: 'What happened?', explanation: 'One PTP alarm can point to hardware or platform timing.', cta: 'Run live investigation', lane: 'workload' },
  { id: 'investigate', label: 'Investigate', kicker: 'What did the agent find?', explanation: 'The agent collected current diagnostics and approved history with provenance.', cta: 'Follow the evidence', lane: 'agent' },
  { id: 'decide', label: 'Decide', kicker: 'What does the evidence support?', explanation: 'Policy supports the cause. CPU inference may explain it. The operator retains authority.', cta: 'Change the evidence', lane: 'decision' },
  { id: 'compare', label: 'Measured comparison', kicker: 'What changed?', explanation: 'The same alarm produced two evidence-backed causes and no automated action.', cta: '', lane: 'decision' },
]

const audienceActs = [
  { label: 'Alarm', detail: 'Frame the ambiguity', start: 0, end: 0 },
  { label: 'Investigate', detail: 'Collect live evidence', start: 1, end: 1 },
  { label: 'Decide', detail: 'Bound the conclusion', start: 2, end: 2 },
  { label: 'Compare', detail: 'Change the evidence', start: 3, end: 3 },
]

const titleCase = (value: string) => value.replaceAll('_', ' ')

const signalCopy: Record<string, { title: string; fault: string; healthy: string }> = {
  timing_alarm: {
    title: 'PTP clock synchronization alarm',
    fault: 'The network clock is no longer reliably locked to its timing source.',
    healthy: 'The network timing alarm is clear.',
  },
  nic_timestamp_fault: {
    title: 'NIC hardware timestamping',
    fault: 'The adapter reports unreliable packet timestamping at the hardware boundary.',
    healthy: 'The adapter timestamping check is healthy, so the fault is not at the NIC.',
  },
  platform_timing_fault: {
    title: 'Platform timing service',
    fault: 'The host timing stack reports a synchronization fault above the NIC.',
    healthy: 'The host timing service is healthy, so the platform path is not implicated.',
  },
}

const observationTitle = (item: Observation) => signalCopy[item.signal]?.title ?? titleCase(item.signal)
const observationMeaning = (item: Observation) => item.state === 'present'
  ? signalCopy[item.signal]?.fault ?? 'The signal is active in the current evidence.'
  : signalCopy[item.signal]?.healthy ?? 'The signal is clear in the current evidence.'
const observationState = (item: Observation) => item.state === 'present' ? 'FAULT DETECTED' : 'CHECK HEALTHY'
const observedTime = (value: string) => value.includes('T') ? `${value.split('T')[1].replace('Z', '')}Z` : value

const topologyForPhase: Record<Phase, { active: TopologyNodeId[]; focus: TopologyNodeId[] }> = {
  alarm: { active: ['browser', 'route', 'app-service', 'app'], focus: ['browser', 'route', 'app-service', 'app'] },
  investigate: { active: ['browser', 'route', 'app-service', 'app', 'diagnostics-service', 'mcp', 'history'], focus: ['diagnostics-service', 'mcp', 'history'] },
  decide: { active: ['browser', 'route', 'app-service', 'app', 'diagnostics-service', 'mcp', 'history', 'policy', 'model', 'operator'], focus: ['policy', 'model', 'operator'] },
  compare: { active: ['browser', 'route', 'app-service', 'app', 'diagnostics-service', 'mcp', 'history', 'policy', 'model', 'operator'], focus: ['policy', 'model', 'operator'] },
}

export function LiveJourney({ scene }: { scene: LiveJourneyScene }) {
  const [phaseIndex, setPhaseIndex] = useState(0)
  const [status, setStatus] = useState<Status>('idle')
  const [error, setError] = useState('')
  const [evidence, setEvidence] = useState<InvestigationEvidence[]>(() => readJourneyEvidence())
  const [results, setResults] = useState<Partial<Record<ScenarioId, Result>>>({})
  const [showTopology, setShowTopology] = useState(false)
  const controller = useRef<AbortController | null>(null)
  const phase = phases[phaseIndex]

  useEffect(() => () => controller.current?.abort(), [])
  useEffect(() => {
    if (!showTopology) return
    const close = (event: KeyboardEvent) => event.key === 'Escape' && setShowTopology(false)
    window.addEventListener('keydown', close)
    return () => window.removeEventListener('keydown', close)
  }, [showTopology])

  const runRequest = async (scenarioId: ScenarioId) => {
    const startedAt = performance.now()
    const response = await fetch('/api/investigate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ scenario_id: scenarioId }),
      signal: controller.current!.signal,
    })
    if (!response.ok) throw new Error(`Investigation returned HTTP ${response.status}`)
    const result = await response.json() as Result
    const latencyMs = Math.round(performance.now() - startedAt)
    setResults((current) => ({ ...current, [scenarioId]: result }))
    recordJourneyEvidence({
      scenarioId,
      cause: result.primary_hypothesis.cause,
      observationCount: result.current_observations_with_tool_provenance.length,
      historicalSourceCount: result.historical_context_with_source_revision.length,
      supportingEvidenceIds: result.primary_hypothesis.supporting_evidence_ids,
      actionExecuted: result.action_executed,
      model: result.model_draft?.model,
      modelRuntime: result.model_draft?.runtime,
      modelStatus: result.model_draft?.status,
      modelLatencyMs: result.model_draft?.latency_ms,
      latencyMs,
      collectedAt: new Date().toISOString(),
    })
    setEvidence(readJourneyEvidence())
  }

  const execute = async () => {
    if (status === 'running') return
    setError('')
    controller.current?.abort()
    controller.current = new AbortController()

    try {
      if (phase.id === 'alarm') {
        setStatus('running')
        const response = await fetch('/ready', { signal: controller.current.signal })
        if (!response.ok || (await response.json()).status !== 'ready') throw new Error('The live system is not ready')
        await runRequest('ptp-hardware')
      } else if (phase.id === 'decide') {
        setStatus('running')
        await runRequest('ptp-platform')
      }

      setPhaseIndex((current) => Math.min(current + 1, phases.length - 1))
      setStatus(phaseIndex >= phases.length - 2 ? 'complete' : 'paused')
    } catch (cause) {
      if ((cause as Error).name === 'AbortError') return
      setError(cause instanceof Error ? cause.message : 'Live journey failed')
      setStatus('error')
    }
  }

  const hardwareEvidence = evidence.find((item) => item.scenarioId === 'ptp-hardware')
  const platformEvidence = evidence.find((item) => item.scenarioId === 'ptp-platform')
  const hardware = results['ptp-hardware']
  const platform = results['ptp-platform']
  const currentResult = phase.id === 'compare' ? platform : hardware
  const currentEvidence = phase.id === 'compare' ? platformEvidence : hardwareEvidence
  const phaseNumber = phaseIndex + 1
  const audienceActIndex = audienceActs.findIndex((act) => phaseIndex >= act.start && phaseIndex <= act.end)
  const topologyState = topologyForPhase[phase.id]
  const topologyResult = currentResult ?? hardware ?? platform
  const topologyMetrics: Partial<Record<TopologyNodeId, string>> = {
    route: status === 'running' ? 'request in flight' : phaseIndex > 0 ? 'OpenShift live' : undefined,
    app: topologyResult?.alarm_id ? topologyResult.alarm_id : phaseIndex > 0 ? 'readiness verified' : undefined,
    mcp: topologyResult ? `${topologyResult.current_observations_with_tool_provenance.length} live observations` : status === 'running' ? 'collecting diagnostics' : undefined,
    history: topologyResult ? `${topologyResult.historical_context_with_source_revision.length} versioned sources` : status === 'running' ? 'retrieving context' : undefined,
    policy: topologyResult ? titleCase(topologyResult.primary_hypothesis.cause) : status === 'running' ? 'evaluating evidence' : undefined,
    model: topologyResult?.model_draft?.model ? topologyResult.model_draft.status : status === 'running' ? 'drafting explanation' : undefined,
    operator: topologyResult ? `approval ${topologyResult.action_requires_human_approval ? 'required' : 'not required'} · action ${topologyResult.action_executed ? 'executed' : 'stopped'}` : undefined,
  }

  const reset = () => {
    clearJourneyEvidence()
    setEvidence([])
    setResults({})
    setPhaseIndex(0)
    setStatus('idle')
    setError('')
  }

  return <SceneFrame scene={scene}>
    <div className="operator-workspace" data-testid="live-operator-workspace">
      <div className="workspace-rail" aria-label="Live journey progress">
        <div className="rail-title">LIVE JOURNEY</div>
        {audienceActs.map((act, index) => <button key={act.label} className={index === audienceActIndex ? 'active' : index < audienceActIndex ? 'complete' : ''} disabled={index > audienceActIndex} onClick={() => index < audienceActIndex && setPhaseIndex(act.start)}><span>{index < audienceActIndex ? '✓' : index + 1}</span><div><strong>{act.label}</strong><small>{act.detail}</small></div></button>)}
        <div className="checkpoint-count">checkpoint {phaseNumber} / {phases.length}</div>
      </div>

      <section className="workspace-main">
        <header className="workspace-act">
          <div><span>ACT {phaseNumber} OF {phases.length} · {phase.lane}</span><h2>{phase.label}</h2><strong>{phase.kicker}</strong></div>
          <div className={`workspace-state ${status}`}><i />{status === 'running' ? 'RUNNING LIVE' : status === 'error' ? 'LIVE ERROR' : phaseIndex > 0 ? 'LIVE SESSION' : 'NOT RUN'}</div>
        </header>
        <p className="workspace-explanation">{phase.explanation}</p>

        {phase.id === 'alarm' && <div className="incident-intake">
          <div><span>NOC ALARM</span><strong>PTP synchronization degraded</strong><small>A network clock is no longer reliably locked to its grandmaster timing source.</small></div>
          <div><span>OPERATIONAL IMPACT</span><strong>Timestamps can no longer be trusted</strong><small>Event ordering, telemetry correlation, and time-sensitive traffic may become unreliable.</small></div>
          <div><span>THE AMBIGUITY</span><strong>NIC hardware or host timing service?</strong><small>The same alarm appears for two faults that require different operator responses.</small></div>
        </div>}

        {phase.id === 'investigate' && hardware && <div className="evidence-list">
          {hardware.current_observations_with_tool_provenance.map((item, index) => <motion.article key={item.evidence_id} className={hardware.primary_hypothesis.supporting_evidence_ids.includes(item.evidence_id) ? 'supporting' : ''} initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: index * .12 }}>
            <span>LIVE · {item.scope}</span><div><strong>{observationTitle(item)}</strong><small>{observationMeaning(item)}</small></div><code className={item.state === 'present' ? 'fault' : 'healthy'}>{observationState(item)} · {observedTime(item.observed_at)}</code>
          </motion.article>)}
          <motion.article className="history-summary supporting" initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: .36 }}>
            <span>APPROVED HISTORY</span><strong>{hardware.historical_context_with_source_revision.length} versioned sources retrieved</strong><small>Context remains separate from current observations.</small>
          </motion.article>
        </div>}

        {phase.id === 'decide' && hardware && <div className="decision-transform" aria-label="Evidence to decision boundaries">
          <motion.div className="decision-stage agent" initial={{ opacity: 0, x: -18 }} animate={{ opacity: 1, x: 0 }}>
            <span>AGENT</span><strong>{hardware.current_observations_with_tool_provenance.length} observations collected</strong><small>Preserves source and provenance</small>
          </motion.div>
          <div className="decision-arrow">→</div>
          <motion.div className="decision-stage policy" initial={{ opacity: 0, scale: .94 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: .12 }}>
            <span>DETERMINISTIC POLICY</span><strong>{titleCase(hardware.primary_hypothesis.cause)}</strong><small>{hardware.decision_policy.name}/{hardware.decision_policy.version} · {hardware.primary_hypothesis.supporting_evidence_ids.length} fault supports this cause</small><small>{hardware.decision_policy.rule}</small><em>{hardware.decision_policy.source} · reviewed code, not learned by the LLM</em>
          </motion.div>
          <div className="decision-arrow">→</div>
          <motion.div className="decision-stage human" initial={{ opacity: 0, x: 18 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: .24 }}>
            <span>HUMAN AUTHORITY</span><strong>Review required</strong><small>No automated action</small>
          </motion.div>
          <motion.div className="llm-bypass" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: .34 }}>
            <div className="llm-exchange-heading"><span>{hardware.model_draft?.model ? 'INTEL CPU LIVE' : 'INTEL CPU TARGET'}</span><strong>{hardware.model_draft?.model ?? 'Not configured in this environment'}</strong><small>{hardware.model_draft?.runtime ?? 'The evidence decision is complete without inference.'}{hardware.model_draft?.latency_ms !== undefined ? ` · ${hardware.model_draft.latency_ms}ms inference` : ''}</small></div>
            {hardware.model_draft?.prompt && hardware.model_draft.summary ? <div className="llm-exchange">
              <section><span>PROMPT IN</span><strong>“Draft a brief explanation of the supplied hypothesis, using only the provided evidence.”</strong><small>{titleCase(hardware.model_draft.prompt.evidence.hypothesis.cause)} · current evidence: {hardware.model_draft.prompt.evidence.current_observations.map((item) => item.evidence_id).join(', ')} · approved history: {hardware.model_draft.prompt.evidence.historical_context.map((item) => item.evidence_id).join(', ') || 'none'} · provisional · human review · no action</small></section>
              <section><span>DRAFT OUT</span><strong>{hardware.model_draft.summary}</strong><small>Cited evidence: {hardware.model_draft.evidence_ids?.join(', ') ?? 'none'} · unverified wording only</small></section>
            </div> : <div className="llm-not-called"><b>LLM NOT CALLED</b><span>No prompt or draft was produced for this response.</span></div>}
          </motion.div>
        </div>}

        {phase.id === 'compare' && hardwareEvidence && platformEvidence && hardware && platform && <div className="comparison-workspace">
          <div className="comparison-thesis"><span>SAME ALARM</span><strong>PTP synchronization degraded</strong><small>Evidence—not the label—changed the decision.</small></div>
          {[{ label: 'Hardware signal', evidence: hardwareEvidence, result: hardware }, { label: 'Platform signal', evidence: platformEvidence, result: platform }].map((item) => <article key={item.evidence.scenarioId}>
            <span>{item.label}</span><strong>{titleCase(item.evidence.cause)}</strong>
            <div className="comparison-journey" aria-label={`${item.label} journey from alarm to human review`}>
              <div><b>1</b><span>ALARM</span><small>{item.result.alarm_id}</small></div>
              <i>→</i><div><b>2</b><span>EVIDENCE</span><small>{item.evidence.observationCount} observations</small></div>
              <i>→</i><div><b>3</b><span>POLICY</span><small>{item.result.decision_policy.name}/{item.result.decision_policy.version}</small></div>
              <i>→</i><div><b>4</b><span>LLM DRAFT</span><small>{item.evidence.modelLatencyMs !== undefined ? `${item.evidence.modelLatencyMs}ms` : 'not called'}</small></div>
              <i>→</i><div><b>5</b><span>HUMAN REVIEW</span><small>no action</small></div>
            </div>
            <div className="comparison-evidence-log" aria-label={`${item.label} evidence records`}>
              {item.result.current_observations_with_tool_provenance.map((observation) => <code className={item.result.primary_hypothesis.supporting_evidence_ids.includes(observation.evidence_id) ? 'supporting' : ''} key={observation.evidence_id}>
                <b>{observedTime(observation.observed_at)}</b><span>{observationTitle(observation)}</span><em>{observationState(observation)}</em>
              </code>)}
            </div>
            <small>Supported by {item.evidence.supportingEvidenceIds.join(', ')} · {item.evidence.latencyMs}ms alarm-to-review · no automated action</small>
          </article>)}
        </div>}

        <div className="workspace-footer">
          <div className="runtime-strip">
            <span>SOURCE <b>{currentResult ? 'LIVE · OpenShift' : 'awaiting run'}</b></span>
            <span>EVIDENCE <b>{currentResult ? `${currentResult.current_observations_with_tool_provenance.length} observations` : 'not collected'}</b></span>
            <span>METRICS <b>{currentEvidence ? `${currentEvidence.latencyMs}ms end-to-end${currentEvidence.modelLatencyMs !== undefined ? ` · ${currentEvidence.modelLatencyMs}ms model` : ''}` : 'not measured'}</b></span>
            <span>AUTHORITY <b>{currentResult ? 'human · no action executed' : 'human approval required'}</b></span>
          </div>
          {error && <div className="error-panel">Live operation stopped: {error}</div>}
          <div className="workspace-actions">
            <button className="button button-secondary" onClick={() => setShowTopology((value) => !value)}>{showTopology ? 'Hide' : 'Inspect'} technical topology</button>
            {phase.id !== 'compare' ? <button className="button button-primary" disabled={status === 'running'} onClick={() => void execute()}>{status === 'running' ? 'Running live…' : status === 'error' ? 'Retry live operation' : phase.cta} →</button> : <span className="action-placeholder" aria-hidden="true" />}
            {phase.id === 'compare' ? <button className="button button-quiet" onClick={reset}>Restart proof</button> : <span className="action-placeholder" aria-hidden="true" />}
          </div>
        </div>
      </section>

    </div>
    {showTopology && <div className="topology-drawer" role="dialog" aria-modal="true" aria-label="Technical topology detail" onClick={() => setShowTopology(false)}><div className="topology-drawer-panel" onClick={(event) => event.stopPropagation()}><div className="topology-drawer-header"><div><span>LIVE ARCHITECTURE · {phase.label}</span><strong>{phase.explanation}</strong></div><button className="button button-secondary" autoFocus onClick={() => setShowTopology(false)}>Close topology ×</button></div><TechnicalTopology activeIds={topologyState.active} focusIds={topologyState.focus} metrics={topologyMetrics} model={{ name: topologyResult?.model_draft?.model, runtime: topologyResult?.model_draft?.runtime }} running={status === 'running'} /></div></div>}
  </SceneFrame>
}
