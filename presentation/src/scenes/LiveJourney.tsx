import { useEffect, useRef, useState } from 'react'
import type { LiveJourneyScene } from '../types'
import { SceneFrame } from './SceneFrame'
import { TechnicalTopology } from './TechnicalTopology'
import { clearJourneyEvidence, readJourneyEvidence, recordJourneyEvidence, type InvestigationEvidence } from '../live/journeyEvidence'

type Result = {
  current_observations_with_tool_provenance: Array<{ evidence_id: string }>
  historical_context_with_source_revision: Array<{ source_id: string }>
  primary_hypothesis: { cause: string; supporting_evidence_ids: string[] }
  next_discriminating_test: string
  action_executed: boolean
}

const path = [
  { title: 'Verify Flightpath', explanation: 'Before making a claim, the story asks the deployed app and approved diagnostics service whether they are ready.', activeIds: ['browser', 'route', 'app-service', 'app', 'diagnostics-service', 'mcp'], action: 'ready' },
  { title: 'Send the hardware condition', explanation: 'The operator starts a real investigation. HTTPS crosses the OpenShift Route and stable Service before reaching the app pod.', activeIds: ['browser', 'route', 'app-service', 'app'], action: 'hardware' },
  { title: 'Collect current observations', explanation: 'The app uses its NetworkPolicy-approved MCP connection to call three allowlisted, read-only diagnostics. These observations describe now—not history.', activeIds: ['browser', 'route', 'app-service', 'app', 'diagnostics-service', 'mcp'], metric: 'observations' },
  { title: 'Add approved history', explanation: 'Versioned cases and runbooks are retrieved separately. They provide context, but they cannot overwrite what the current diagnostics observed.', activeIds: ['browser', 'route', 'app-service', 'app', 'diagnostics-service', 'mcp', 'history'], metric: 'history' },
  { title: 'Apply evidence policy', explanation: 'The deterministic policy compares current signals with approved context. It may support a cause only with evidence IDs returned in this run.', activeIds: ['browser', 'route', 'app-service', 'app', 'diagnostics-service', 'mcp', 'history', 'policy'], metric: 'cause' },
  { title: 'Stop at human authority', explanation: 'The system recommends the next discriminating test, then stops. The operator retains the decision and no remediation is executed.', activeIds: ['browser', 'route', 'app-service', 'app', 'diagnostics-service', 'mcp', 'history', 'policy', 'operator'], metric: 'authority' },
  { title: 'Change the condition', explanation: 'The same deployed path now receives a platform timing fault. Only the evidence changes; the architecture and policy stay fixed.', activeIds: ['browser', 'route', 'app-service', 'app', 'diagnostics-service', 'mcp'], action: 'platform' },
  { title: 'Compare the live evidence', explanation: 'The second set of observations selects a different supported cause. That is the proof: the diagnosis follows evidence, not the alarm label.', activeIds: ['browser', 'route', 'app-service', 'app', 'diagnostics-service', 'mcp', 'history', 'policy', 'operator'], metric: 'compare' },
] as const

export function LiveJourney({ scene }: { scene: LiveJourneyScene }) {
  const [step, setStep] = useState(-1)
  const [status, setStatus] = useState<'idle' | 'running' | 'paused' | 'complete' | 'error'>('idle')
  const [error, setError] = useState('')
  const [evidence, setEvidence] = useState<InvestigationEvidence[]>(() => readJourneyEvidence())
  const [results, setResults] = useState<Record<string, Result>>({})
  const controller = useRef<AbortController | null>(null)
  useEffect(() => () => controller.current?.abort(), [])

  const runRequest = async (scenarioId: 'ptp-hardware' | 'ptp-platform') => {
    const startedAt = performance.now()
    const response = await fetch('/api/investigate', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ scenario_id: scenarioId }), signal: controller.current!.signal })
    if (!response.ok) throw new Error(`Investigation returned HTTP ${response.status}`)
    const result = await response.json() as Result
    setResults((current) => ({ ...current, [scenarioId]: result }))
    recordJourneyEvidence({ scenarioId, cause: result.primary_hypothesis.cause, observationCount: result.current_observations_with_tool_provenance.length, historicalSourceCount: result.historical_context_with_source_revision.length, supportingEvidenceIds: result.primary_hypothesis.supporting_evidence_ids, actionExecuted: result.action_executed, latencyMs: Math.round(performance.now() - startedAt), collectedAt: new Date().toISOString() })
    setEvidence(readJourneyEvidence())
  }

  const advance = async () => {
    if (status === 'running' || status === 'complete') return
    const next = step + 1
    controller.current?.abort(); controller.current = new AbortController()
    setStep(next); setStatus('running'); setError('')
    try {
      const action = 'action' in path[next] ? path[next].action : undefined
      if (action === 'ready') {
        const response = await fetch('/ready', { signal: controller.current.signal })
        if (!response.ok || (await response.json()).status !== 'ready') throw new Error('Flightpath is not ready')
      } else if (action === 'hardware') await runRequest('ptp-hardware')
      else if (action === 'platform') await runRequest('ptp-platform')
      setStatus(next === path.length - 1 ? 'complete' : 'paused')
    } catch (cause) {
      if ((cause as Error).name === 'AbortError') return
      setError(cause instanceof Error ? cause.message : 'Live journey failed'); setStatus('error')
    }
  }

  const hardware = evidence.find((item) => item.scenarioId === 'ptp-hardware')
  const platform = evidence.find((item) => item.scenarioId === 'ptp-platform')
  const current = step >= 6 ? platform : hardware
  const result = step >= 6 ? results['ptp-platform'] : results['ptp-hardware']
  const metric = step >= 0 && 'metric' in path[step] ? path[step].metric : undefined
  const metricContent = metric === 'observations' && current ? [`${current.observationCount}`, 'current observations', current.supportingEvidenceIds.join(', ')]
    : metric === 'history' && current ? [`${current.historicalSourceCount}`, 'approved historical sources', 'Kept separate from current evidence']
    : metric === 'cause' && current ? [current.cause, 'supported cause', current.supportingEvidenceIds.join(', ')]
    : metric === 'authority' && current ? [String(current.actionExecuted), 'remediation executed', result?.next_discriminating_test ?? 'Human review required']
    : metric === 'compare' && hardware && platform ? [`${hardware.cause} → ${platform.cause}`, 'condition changed the diagnosis', `${hardware.latencyMs}ms / ${platform.latencyMs}ms · ${hardware.observationCount + platform.observationCount} observations total`]
    : current && (step === 1 || step === 6) ? [`${current.latencyMs}ms`, 'live request latency', current.scenarioId]
    : step === 0 ? ['READY', 'deployed services', 'Flightpath readiness response'] : undefined

  return <SceneFrame scene={scene}><div className="live-click-stage" data-testid="live-click-stage" onClick={(event) => { event.stopPropagation(); if (!(event.target as HTMLElement).closest('button, a')) void advance() }}>
    <div className="journey-status"><span className={`journey-step-count ${status === 'complete' ? 'complete' : ''}`}>{step < 0 ? 'START' : `${step + 1} / ${path.length}`}</span><strong>{step < 0 ? 'Trace one request through the live system' : path[step].title}</strong></div>
    <TechnicalTopology activeIds={step < 0 ? [] : [...path[step].activeIds]} running={status === 'running'} />
    <div className="journey-explanation"><span>What is happening</span><strong>{step < 0 ? 'Each click advances one infrastructure boundary and reveals the live measurement or decision produced there.' : path[step].explanation}</strong></div>
    {metricContent && <div className="journey-live-metric"><strong>{metricContent[0]}</strong><span>{metricContent[1]}</span><small>{metricContent[2]}</small></div>}
    {error && <div className="error-panel">Live journey stopped at this boundary: {error}</div>}
    <div className="journey-controls">
      {status === 'idle' && <button className="button button-primary" onClick={() => void advance()}>Start the live path</button>}
      {status === 'running' && <button className="button button-secondary" disabled>Running on Flightpath…</button>}
      {status === 'paused' && <button className="button button-primary" onClick={() => void advance()}>Next boundary →</button>}
      {status === 'error' && <button className="button button-primary" onClick={() => { setStep((value) => value - 1); setStatus('paused') }}>Retry boundary</button>}
      {status === 'complete' && <><button className="button button-secondary" onClick={() => { clearJourneyEvidence(); setEvidence([]); setResults({}); setStep(-1); setStatus('idle') }}>Replay path</button><a className="button button-primary journey-link" href="/">Open guided investigation →</a></>}
    </div>
    {status !== 'running' && status !== 'complete' && <div className="click-hint">Click anywhere to {step < 0 ? 'start' : 'advance the live path'} →</div>}
  </div></SceneFrame>
}
