import { useEffect, useRef, useState } from 'react'
import { motion } from 'motion/react'
import type { LiveJourneyScene } from '../types'
import { SceneFrame } from './SceneFrame'
import { TechnicalTopology } from './TechnicalTopology'
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
  primary_hypothesis: { cause: string; supporting_evidence_ids: string[] }
  alternate_hypotheses: string[]
  unknowns_and_conflicts: string[]
  next_discriminating_test: string
  proposed_action: string
  action_requires_human_approval: boolean
  action_executed: boolean
  model_draft?: { status?: string; model?: string; text?: string }
}

type ScenarioId = 'ptp-hardware' | 'ptp-platform'
type Phase = 'ready' | 'run-hardware' | 'observations' | 'history' | 'decision' | 'authority' | 'run-platform' | 'compare'
type Status = 'idle' | 'running' | 'paused' | 'complete' | 'error'

const phases: Array<{
  id: Phase
  label: string
  kicker: string
  explanation: string
  cta: string
  lane: 'workload' | 'agent' | 'decision'
}> = [
  { id: 'ready', label: 'Incident intake', kicker: 'What entered the system?', explanation: 'Verify the deployed application and its approved diagnostic boundary before submitting the synthetic PTP alarm.', cta: 'Verify Flightpath readiness', lane: 'workload' },
  { id: 'run-hardware', label: 'Run investigation', kicker: 'What is running now?', explanation: 'Submit the hardware-signal scenario once. The Network Operations agent collects current diagnostics, retrieves approved context, applies evidence policy, and returns one bounded investigation record.', cta: 'Investigate hardware signal', lane: 'agent' },
  { id: 'observations', label: 'Current diagnostics', kicker: 'What did the systems report?', explanation: 'Inspect the completed response. These observations describe the current incident and retain the diagnostic scope, collection time, and source provenance.', cta: 'Inspect approved history', lane: 'workload' },
  { id: 'history', label: 'Historical context', kicker: 'What context was retrieved?', explanation: 'Versioned synthetic cases and runbooks add context. They remain visually and logically separate from current observations.', cta: 'Evaluate the evidence', lane: 'agent' },
  { id: 'decision', label: 'Evidence decision', kicker: 'Why this cause?', explanation: 'Deterministic policy selects a cause only when the current evidence supports it. Optional model wording cannot change the evidence IDs or hypothesis.', cta: 'Review the authority boundary', lane: 'decision' },
  { id: 'authority', label: 'Human authority', kicker: 'Where does the agent stop?', explanation: 'The agent recommends the next discriminating test, but executes nothing. A qualified operator owns the next action.', cta: 'Change the incident condition', lane: 'decision' },
  { id: 'run-platform', label: 'Changed condition', kicker: 'Does the diagnosis follow the evidence?', explanation: 'Run the same workflow with a platform timing signal. The architecture and policy stay fixed; only the observed condition changes.', cta: 'Investigate platform signal', lane: 'agent' },
  { id: 'compare', label: 'Measured comparison', kicker: 'What changed?', explanation: 'Compare both completed live responses. The alarm class is the same, but the supporting evidence leads to a different cause while the no-action boundary remains intact.', cta: 'Open guided investigation', lane: 'decision' },
]

const audienceActs = [
  { label: 'Intake', detail: 'Frame the alarm', start: 0, end: 0 },
  { label: 'Investigate', detail: 'Build the evidence', start: 1, end: 3 },
  { label: 'Decide', detail: 'Bound the conclusion', start: 4, end: 5 },
  { label: 'Compare', detail: 'Change the condition', start: 6, end: 7 },
]

const titleCase = (value: string) => value.replaceAll('_', ' ')

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
      if (phase.id === 'ready') {
        setStatus('running')
        const response = await fetch('/ready', { signal: controller.current.signal })
        if (!response.ok || (await response.json()).status !== 'ready') throw new Error('Flightpath is not ready')
      } else if (phase.id === 'run-hardware') {
        setStatus('running')
        await runRequest('ptp-hardware')
      } else if (phase.id === 'run-platform') {
        setStatus('running')
        await runRequest('ptp-platform')
      }

      if (phase.id === 'compare') {
        window.location.assign('/')
        return
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
  const currentResult = phase.id === 'run-platform' || phase.id === 'compare' ? platform : hardware
  const currentEvidence = phase.id === 'run-platform' || phase.id === 'compare' ? platformEvidence : hardwareEvidence
  const phaseNumber = phaseIndex + 1
  const audienceActIndex = audienceActs.findIndex((act) => phaseIndex >= act.start && phaseIndex <= act.end)

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

        {phase.id === 'ready' && <div className="incident-intake">
          <div><span>ALARM</span><strong>PTP synchronization degraded</strong><small>synthetic-ptp-001 · production-network profile</small></div>
          <div><span>AMBIGUITY</span><strong>Hardware or platform timing</strong><small>Same symptom · different operational response</small></div>
          <div><span>SAFETY</span><strong>Read-only investigation</strong><small>No mutation tools · no remediation authority</small></div>
        </div>}

        {phase.id === 'run-hardware' && <div className="agent-run">
          <div className={status === 'running' ? 'running' : ''}><span>01</span><strong>Normalize alarm</strong><small>Validate bounded scenario</small></div>
          <b>→</b><div className={status === 'running' ? 'running' : ''}><span>02</span><strong>Collect diagnostics</strong><small>3 allowlisted MCP scopes</small></div>
          <b>→</b><div className={status === 'running' ? 'running' : ''}><span>03</span><strong>Retrieve context</strong><small>Approved versioned sources</small></div>
          <b>→</b><div className={status === 'running' ? 'running' : ''}><span>04</span><strong>Apply policy</strong><small>Evidence IDs decide</small></div>
        </div>}

        {phase.id === 'observations' && hardware && <div className="evidence-list">
          {hardware.current_observations_with_tool_provenance.map((item, index) => <motion.article key={item.evidence_id} className={hardware.primary_hypothesis.supporting_evidence_ids.includes(item.evidence_id) ? 'supporting' : ''} initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: index * .12 }}>
            <span>{item.scope}</span><strong>{titleCase(item.signal)} · {item.state}</strong><small>{item.evidence_id} · {item.provenance}</small>
          </motion.article>)}
        </div>}

        {phase.id === 'history' && hardware && <div className="history-list">
          {hardware.historical_context_with_source_revision.map((item) => <article key={item.evidence_id}><span>{item.source_id} · {item.source_revision}</span><strong>{item.excerpt}</strong></article>)}
        </div>}

        {phase.id === 'decision' && hardware && <div className="decision-board">
          <div><span>SUPPORTED CAUSE</span><strong>{titleCase(hardware.primary_hypothesis.cause)}</strong><small>{hardware.primary_hypothesis.supporting_evidence_ids.join(', ')}</small></div>
          <div><span>ALTERNATE</span><strong>{hardware.alternate_hypotheses.map(titleCase).join(', ')}</strong><small>{hardware.unknowns_and_conflicts.length ? hardware.unknowns_and_conflicts.join('; ') : 'No conflicting required evidence'}</small></div>
          <div><span>LLM ROLE</span><strong>{hardware.model_draft?.status ? titleCase(hardware.model_draft.status) : 'Not used'}</strong><small>{hardware.model_draft?.model ?? 'Evidence policy produced the decision; no model authority'}</small></div>
        </div>}

        {phase.id === 'authority' && hardware && <div className="authority-board">
          <div><span>NEXT DISCRIMINATING TEST</span><strong>{hardware.next_discriminating_test}</strong></div>
          <div><span>AGENT RECOMMENDATION</span><strong>{hardware.proposed_action}</strong></div>
          <div className="authority-stop"><span>AUTHORITY STOP</span><strong>Action executed: {String(hardware.action_executed)}</strong><small>Human approval required: {String(hardware.action_requires_human_approval)}</small></div>
        </div>}

        {phase.id === 'run-platform' && <div className="condition-change">
          <div className="prior"><span>COMPLETED CONDITION</span><strong>Hardware signal</strong><small>{hardwareEvidence ? `${titleCase(hardwareEvidence.cause)} · ${hardwareEvidence.latencyMs}ms` : 'Run required'}</small></div>
          <div className="change-arrow">same workflow →</div>
          <div className="next"><span>NEW CONDITION</span><strong>Platform signal</strong><small>Architecture and policy unchanged</small></div>
        </div>}

        {phase.id === 'compare' && hardwareEvidence && platformEvidence && hardware && platform && <div className="comparison-workspace">
          <div className="comparison-thesis"><span>SAME ALARM</span><strong>PTP synchronization degraded</strong><small>Evidence—not the label—changed the decision.</small></div>
          {[{ label: 'Hardware signal', evidence: hardwareEvidence, result: hardware }, { label: 'Platform signal', evidence: platformEvidence, result: platform }].map((item) => <article key={item.evidence.scenarioId}>
            <span>{item.label}</span><strong>{titleCase(item.evidence.cause)}</strong><div><b>{item.evidence.observationCount}</b> observations <b>{item.evidence.latencyMs}ms</b> request</div><small>Support: {item.evidence.supportingEvidenceIds.join(', ')} · action executed: {String(item.result.action_executed)}</small>
          </article>)}
        </div>}

        <div className="workspace-footer">
          <div className="runtime-strip">
            <span>WORKLOAD <b>{currentResult?.alarm_id ?? 'awaiting input'}</b></span>
            <span>AGENT <b>{currentResult ? 'investigation complete' : status === 'running' ? 'running' : 'ready'}</b></span>
            <span>LLM <b>{currentResult?.model_draft?.model ?? 'not required'}</b></span>
            <span>SOURCE <b>{currentResult ? 'LIVE · Flightpath' : 'not collected'}</b></span>
          </div>
          {error && <div className="error-panel">Live operation stopped: {error}</div>}
          <div className="workspace-actions">
            <button className="button button-secondary" onClick={() => setShowTopology((value) => !value)}>{showTopology ? 'Hide' : 'Inspect'} technical topology</button>
            {phase.id === 'compare' ? <a className="button button-primary journey-link" href="/">{phase.cta} →</a> : <button className="button button-primary" disabled={status === 'running'} onClick={() => void execute()}>{status === 'running' ? 'Running on Flightpath…' : status === 'error' ? 'Retry live operation' : phase.cta} →</button>}
            {phaseIndex > 0 && <button className="button button-quiet" onClick={reset}>Restart proof</button>}
          </div>
        </div>
      </section>

      <aside className="activity-rail">
        <span className="rail-label">LIVE ACTIVITY</span>
        <strong>{status === 'running' ? 'Agent working' : currentResult ? 'Response collected' : 'Waiting for run'}</strong>
        <ol>
          <li className={phaseIndex >= 1 ? 'done' : ''}><b>Scenario contract</b><small>Validated input</small></li>
          <li className={phaseIndex >= 2 ? 'done' : ''}><b>MCP diagnostics</b><small>{currentEvidence ? `${currentEvidence.observationCount} observations` : 'Network · platform · hardware'}</small></li>
          <li className={phaseIndex >= 3 ? 'done' : ''}><b>Approved retrieval</b><small>{currentEvidence ? `${currentEvidence.historicalSourceCount} sources` : 'Versioned context'}</small></li>
          <li className={phaseIndex >= 4 ? 'done' : ''}><b>Evidence policy</b><small>{currentEvidence ? titleCase(currentEvidence.cause) : 'Awaiting evidence'}</small></li>
          <li className={phaseIndex >= 5 ? 'done' : ''}><b>Human boundary</b><small>No action executed</small></li>
        </ol>
        <div className="how-it-works"><span>HOW IT WORKS</span><p>The API completed one bounded investigation. Subsequent steps inspect sections of that same response; they do not pretend to launch additional backend work.</p></div>
      </aside>
    </div>
    {showTopology && <div className="topology-drawer"><TechnicalTopology activeIds={['browser', 'route', 'app-service', 'app', 'diagnostics-service', 'mcp', 'history', 'policy', 'operator']} running={status === 'running'} /></div>}
  </SceneFrame>
}
