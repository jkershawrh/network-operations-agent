import { useEffect, useRef, useState } from 'react'
import type { LiveJourneyScene } from '../types'
import { SceneFrame } from './SceneFrame'
import { TechnicalTopology } from './TechnicalTopology'
import { clearJourneyEvidence, readJourneyEvidence, recordJourneyEvidence, type InvestigationEvidence } from '../live/journeyEvidence'

type Result = {
  alarm_id: string
  current_observations_with_tool_provenance: Array<{ evidence_id: string; scope: string; state: string; provenance: string }>
  historical_context_with_source_revision: Array<{ source_id: string; source_revision: string }>
  primary_hypothesis: { cause: string; supporting_evidence_ids: string[] }
  unknowns_and_conflicts: string[]
  next_discriminating_test: string
  action_requires_human_approval: boolean
  action_executed: boolean
}

const journeySteps = [
  { title: 'Verify the deployed system', subtitle: 'The app pod reaches only the approved MCP diagnostic service.', phase: 'ready' as const },
  { title: 'Investigate the hardware signal', subtitle: 'The API orchestrates current diagnostics, history, and deterministic evidence policy.', phase: 'investigation' as const, scenario: 'ptp-hardware' },
  { title: 'Change the evidence', subtitle: 'The same deployed path must select a different supported cause.', phase: 'investigation' as const, scenario: 'ptp-platform' },
]

export function LiveJourney({ scene }: { scene: LiveJourneyScene }) {
  const [step, setStep] = useState(-1)
  const [status, setStatus] = useState<'idle' | 'running' | 'paused' | 'complete' | 'error'>('idle')
  const [source, setSource] = useState<'LIVE' | 'ERROR'>('LIVE')
  const [result, setResult] = useState<Result | null>(null)
  const [error, setError] = useState('')
  const [evidence, setEvidence] = useState<InvestigationEvidence[]>(() => readJourneyEvidence())
  const controller = useRef<AbortController | null>(null)

  useEffect(() => () => controller.current?.abort(), [])

  const runStep = async (index: number) => {
    controller.current?.abort()
    controller.current = new AbortController()
    setStep(index); setStatus('running'); setError(''); setResult(null); setSource('LIVE')
    const startedAt = performance.now()
    try {
      if (index === 0) {
        const response = await fetch('/ready', { signal: controller.current.signal })
        if (!response.ok) throw new Error(`Readiness returned HTTP ${response.status}`)
        const data = await response.json()
        if (data.status !== 'ready') throw new Error('Diagnostics are not ready')
      } else {
        const response = await fetch('/api/investigate', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ scenario_id: journeySteps[index].scenario }), signal: controller.current.signal })
        if (!response.ok) throw new Error(`Investigation returned HTTP ${response.status}`)
        const nextResult = await response.json() as Result
        setResult(nextResult)
        const recorded = {
          scenarioId: journeySteps[index].scenario!,
          cause: nextResult.primary_hypothesis.cause,
          observationCount: nextResult.current_observations_with_tool_provenance.length,
          historicalSourceCount: nextResult.historical_context_with_source_revision.length,
          supportingEvidenceIds: nextResult.primary_hypothesis.supporting_evidence_ids,
          actionExecuted: nextResult.action_executed,
          latencyMs: Math.round(performance.now() - startedAt),
          collectedAt: new Date().toISOString(),
        }
        recordJourneyEvidence(recorded)
        setEvidence(readJourneyEvidence())
      }
      setStatus(index === journeySteps.length - 1 ? 'complete' : 'paused')
    } catch (cause) {
      if ((cause as Error).name === 'AbortError') return
      setSource('ERROR'); setError(cause instanceof Error ? cause.message : 'Live journey failed'); setStatus('error')
    }
  }

  const advance = () => {
    if (status === 'idle') void runStep(0)
    else if (status === 'paused') void runStep(step + 1)
  }

  return <SceneFrame scene={scene}>
    <div className="live-click-stage" onClick={(event) => { event.stopPropagation(); if (!(event.target as HTMLElement).closest('button, a')) advance() }} data-testid="live-click-stage">
    <div className="journey-status"><span className={`source-badge source-${source === 'LIVE' ? 'live' : 'offline'}`}>{source}</span><strong>{step < 0 ? 'Ready to begin' : journeySteps[step].title}</strong><span>{step < 0 ? 'The diagram will activate from the deployed responses.' : journeySteps[step].subtitle}</span></div>
    <TechnicalTopology activeThrough={step < 0 ? 'idle' : journeySteps[step].phase} running={status === 'running'} />
    {evidence.length > 0 && <div className="live-run-grid">{evidence.map((item) => <div className="live-run-card" key={item.scenarioId}><span>{item.scenarioId}</span><strong>{item.cause}</strong><div><b>{item.latencyMs}ms</b><b>{item.observationCount} observations</b><b>{item.historicalSourceCount} sources</b></div><small>{item.supportingEvidenceIds.join(', ')} · action executed: {String(item.actionExecuted)}</small></div>)}</div>}
    {result && <div className="journey-next"><span>Next discriminating test</span><strong>{result.next_discriminating_test}</strong></div>}
    {error && <div className="error-panel">Live journey stopped at the failed boundary: {error}</div>}
    <div className="journey-controls">
      {status === 'idle' && <button className="button button-primary" onClick={() => void runStep(0)}>Run the live journey</button>}
      {status === 'running' && <button className="button button-secondary" disabled>Running against Flightpath…</button>}
      {status === 'paused' && <button className="button button-primary" onClick={() => void runStep(step + 1)}>Next live act →</button>}
      {status === 'complete' && <><button className="button button-secondary" onClick={() => { clearJourneyEvidence(); setEvidence([]); setStep(-1); setStatus('idle'); setResult(null) }}>Replay</button><a className="button button-primary journey-link" href="/">Open the live workspace →</a></>}
      {status === 'error' && <button className="button button-primary" onClick={() => void runStep(Math.max(step, 0))}>Retry failed act</button>}
    </div>
    {status !== 'running' && status !== 'complete' && <div className="click-hint">Click anywhere to {status === 'idle' ? 'verify Flightpath' : 'run the next live condition'} →</div>}
    </div>
  </SceneFrame>
}
