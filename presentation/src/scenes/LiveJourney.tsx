import { useEffect, useRef, useState } from 'react'
import { motion } from 'motion/react'
import type { LiveJourneyScene } from '../types'
import { SceneFrame } from './SceneFrame'

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

const stages = [
  { id: 'alarm', label: 'Timing alarm', detail: 'validated event' },
  { id: 'agent', label: 'OpenShift agent', detail: 'bounded orchestration' },
  { id: 'mcp', label: 'Read-only MCP', detail: '3 current diagnostics' },
  { id: 'history', label: 'Approved history', detail: 'versioned context' },
  { id: 'policy', label: 'Evidence policy', detail: 'compare or abstain' },
  { id: 'wording', label: 'Optional wording', detail: 'never authority' },
  { id: 'operator', label: 'NOC operator', detail: 'human decision' },
]

const journeySteps = [
  { title: 'Verify the deployed system', subtitle: 'Readiness must include the approved diagnostic boundary.', active: 2 },
  { title: 'Investigate the hardware signal', subtitle: 'Current observations activate the evidence path.', active: 6, scenario: 'ptp-hardware' },
  { title: 'Change the evidence', subtitle: 'The same architecture must select a different cause.', active: 6, scenario: 'ptp-platform' },
]

export function LiveJourney({ scene }: { scene: LiveJourneyScene }) {
  const [step, setStep] = useState(-1)
  const [status, setStatus] = useState<'idle' | 'running' | 'paused' | 'complete' | 'error'>('idle')
  const [source, setSource] = useState<'LIVE' | 'ERROR'>('LIVE')
  const [result, setResult] = useState<Result | null>(null)
  const [error, setError] = useState('')
  const controller = useRef<AbortController | null>(null)

  useEffect(() => () => controller.current?.abort(), [])

  const runStep = async (index: number) => {
    controller.current?.abort()
    controller.current = new AbortController()
    setStep(index); setStatus('running'); setError(''); setResult(null); setSource('LIVE')
    try {
      if (index === 0) {
        const response = await fetch('/ready', { signal: controller.current.signal })
        if (!response.ok) throw new Error(`Readiness returned HTTP ${response.status}`)
        const data = await response.json()
        if (data.status !== 'ready') throw new Error('Diagnostics are not ready')
      } else {
        const response = await fetch('/api/investigate', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ scenario_id: journeySteps[index].scenario }), signal: controller.current.signal })
        if (!response.ok) throw new Error(`Investigation returned HTTP ${response.status}`)
        setResult(await response.json() as Result)
      }
      setStatus(index === journeySteps.length - 1 ? 'complete' : 'paused')
    } catch (cause) {
      if ((cause as Error).name === 'AbortError') return
      setSource('ERROR'); setError(cause instanceof Error ? cause.message : 'Live journey failed'); setStatus('error')
    }
  }

  const active = step < 0 ? -1 : journeySteps[step].active
  return <SceneFrame scene={scene}>
    <div className="journey-status"><span className={`source-badge source-${source === 'LIVE' ? 'live' : 'offline'}`}>{source}</span><strong>{step < 0 ? 'Ready to begin' : journeySteps[step].title}</strong><span>{step < 0 ? 'The diagram will activate from the deployed responses.' : journeySteps[step].subtitle}</span></div>
    <div className="system-flow" aria-label="Live network operations architecture">
      {stages.map((stage, index) => <div className="system-flow-wrap" key={stage.id}>
        <motion.div className={`system-node ${index <= active ? 'active' : ''} ${index < active ? 'done' : ''}`} animate={index === active && status === 'running' ? { scale: [1, 1.03, 1] } : { scale: 1 }} transition={{ repeat: index === active && status === 'running' ? Infinity : 0, duration: 1 }}><strong>{stage.label}</strong><span>{stage.detail}</span></motion.div>
        {index < stages.length - 1 && <div className={`system-edge ${index < active ? 'active' : ''}`}><span>→</span></div>}
      </div>)}
    </div>
    {result && <div className="journey-evidence">
      <div><span>Supported cause</span><strong>{result.primary_hypothesis.cause}</strong></div>
      <div><span>Current evidence</span><strong>{result.current_observations_with_tool_provenance.length} observations</strong><small>{result.primary_hypothesis.supporting_evidence_ids.join(', ')}</small></div>
      <div><span>Historical context</span><strong>{result.historical_context_with_source_revision.length} sources</strong><small>{result.historical_context_with_source_revision.map(item => `${item.source_id}@${item.source_revision}`).join(' · ')}</small></div>
      <div><span>Authority</span><strong>{result.action_requires_human_approval ? 'Human approval' : 'Unbounded'}</strong><small>Action executed: {String(result.action_executed)}</small></div>
      <div className="journey-next"><span>Next discriminating test</span><strong>{result.next_discriminating_test}</strong></div>
    </div>}
    {error && <div className="error-panel">Live journey stopped at the failed boundary: {error}</div>}
    <div className="journey-controls">
      {status === 'idle' && <button className="button button-primary" onClick={() => void runStep(0)}>Run the live journey</button>}
      {status === 'running' && <button className="button button-secondary" disabled>Running against Flightpath…</button>}
      {status === 'paused' && <button className="button button-primary" onClick={() => void runStep(step + 1)}>Next live act →</button>}
      {status === 'complete' && <><button className="button button-secondary" onClick={() => { setStep(-1); setStatus('idle'); setResult(null) }}>Replay</button><a className="button button-primary journey-link" href="/">Open the live workspace →</a></>}
      {status === 'error' && <button className="button button-primary" onClick={() => void runStep(Math.max(step, 0))}>Retry failed act</button>}
    </div>
  </SceneFrame>
}
