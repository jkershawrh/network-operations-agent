import { useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import type { SceneConfig } from '../types'
import { LiveProof } from './LiveProof'
import { LiveJourney } from './LiveJourney'
import { SceneFrame } from './SceneFrame'
import { TechnicalTopology, type TopologyNodeId } from './TechnicalTopology'
import { readJourneyEvidence } from '../live/journeyEvidence'

const toneClass = (tone?: string) => tone ? `tone-${tone}` : ''

const architectureNodes: TopologyNodeId[][] = [
  ['browser', 'route', 'app-service', 'app'],
  ['diagnostics-service', 'mcp'],
  ['history'],
  ['policy'],
  ['model'],
  ['operator'],
]

function GuidedArchitecture({ scene }: { scene: Extract<SceneConfig, { type: 'guided-architecture' }> }) {
  const [step, setStep] = useState(0)
  const [revealed, setRevealed] = useState(false)
  const layer = scene.layers[step]
  const complete = step === scene.layers.length
  const earnedNodes = architectureNodes.slice(0, complete ? architectureNodes.length : step + (revealed ? 1 : 0)).flat()
  const focusedNodes = !complete && revealed ? architectureNodes[step] : []
  const advance = () => {
    if (!revealed) setRevealed(true)
    else { setStep((value) => value + 1); setRevealed(false) }
  }

  return (
    <SceneFrame scene={scene}>
      <div className="guided-architecture guided-technical" data-testid="guided-architecture">
        <div className="architecture-map" aria-label="Architecture progress">
          {scene.layers.map((item, index) => (
            <div className={`architecture-map-item ${toneClass(item.tone)} ${index < step ? 'done' : ''} ${index === step ? 'active' : ''}`} key={item.id}>
              <span>{index + 1}</span><strong>{item.component}</strong>
            </div>
          ))}
        </div>
        <AnimatePresence mode="wait">
          {!complete ? (
            <motion.div className="architecture-dialog" key={layer.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}>
              <div className="architecture-question"><span>Operator question</span><h2>{layer.question}</h2></div>
              {revealed && <motion.div className="architecture-answer" initial={{ opacity: 0 }} animate={{ opacity: 1 }}><span>Architecture answer</span><h3>{layer.answer}</h3><p>{layer.detail}</p></motion.div>}
              <button className="button button-primary" onClick={advance}>
                {!revealed ? 'Reveal technical boundary' : step === scene.layers.length - 1 ? 'Complete architecture' : 'Ask next question →'}
              </button>
            </motion.div>
          ) : (
            <motion.div className="architecture-dialog architecture-complete" key="complete" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <div className="eyebrow">Architecture complete</div>
              <h2>Every claim now has an owner, a boundary, and a reviewer.</h2>
              <p>Continue to live proof and watch the evidence—not the alarm label—select the hypothesis.</p>
              <button className="button button-secondary" onClick={() => { setStep(0); setRevealed(false) }}>Replay architecture</button>
            </motion.div>
          )}
        </AnimatePresence>
        <TechnicalTopology activeIds={earnedNodes} focusIds={focusedNodes} running={revealed} />
      </div>
    </SceneFrame>
  )
}

function IncidentOpening({ scene }: { scene: Extract<SceneConfig, { type: 'incident-open' }> }) {
  const [beat, setBeat] = useState(0)
  return <SceneFrame scene={scene}>
    <div className={`incident-open incident-beat-${beat}`} onClick={(event) => event.stopPropagation()}>
      <div className="opening-beat-marker">{beat + 1} / 3</div>
      <AnimatePresence mode="wait">
        {beat === 0 && <motion.div className="incident-focus" key="alarm" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
          <span>02:17 · PRODUCTION NETWORK</span><strong>{scene.alarm}</strong><small>One alarm is not one cause.</small>
        </motion.div>}
        {beat === 1 && <motion.div className="incident-ambiguity" key="causes" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <div className="incident-ambiguity-title">The same alarm supports two plausible stories.</div>
          <div className="incident-split">{scene.possibilities.map((possibility) => <div className={`incident-cause tone-${possibility.tone}`} key={possibility.label}><span>Possible cause</span><strong>{possibility.label}</strong><small>{possibility.signal}</small></div>)}</div>
        </motion.div>}
        {beat === 2 && <motion.div className="incident-synthesis" key="decision" initial={{ opacity: 0, scale: .97 }} animate={{ opacity: 1, scale: 1 }}>
          <span>THE OPERATOR'S PROBLEM</span><strong>{scene.decision}</strong><small>{scene.symptom}</small>
        </motion.div>}
      </AnimatePresence>
      <button className="button button-primary opening-advance" onClick={() => setBeat((current) => current === 2 ? 0 : current + 1)}>{beat === 0 ? 'Reveal the ambiguity' : beat === 1 ? 'Reframe the decision' : 'Replay opening' } →</button>
    </div>
  </SceneFrame>
}

export function SceneRenderer({ scene, brand }: { scene: SceneConfig; brand: { primary: { logo: string; alt: string }; partner: { logo: string; alt: string } } }) {
  if (scene.type === 'custom') {
    const Custom = scene.component
    return <Custom />
  }
  if (scene.type === 'live-proof') return <LiveProof scene={scene} />
  if (scene.type === 'live-journey') return <LiveJourney scene={scene} />
  if (scene.type === 'guided-architecture') return <GuidedArchitecture scene={scene} />
  if (scene.type === 'mechanisms') return <SceneFrame scene={scene}><div className="mechanism-grid">{scene.mechanisms.map((mechanism, index) => <div className={`mechanism-card ${toneClass(mechanism.tone)}`} key={mechanism.id}><span>{String(index + 1).padStart(2, '0')}</span><strong>{mechanism.label}</strong><em>{mechanism.claim}</em><small>{mechanism.detail}</small></div>)}</div></SceneFrame>
  if (scene.type === 'evidence-payoff') {
    const evidence = readJourneyEvidence()
    const causes = new Set(evidence.map((item) => item.cause)).size
    const safe = evidence.length > 0 && evidence.every((item) => !item.actionExecuted)
    const modelProof = evidence.find((item) => item.model)
    return <SceneFrame scene={scene}><div className="evidence-payoff">
      {evidence.length ? <><div className="evidence-payoff-status"><span className="source-badge source-live">LIVE</span><strong>{evidence.length} infrastructure investigations completed</strong></div><div className="proof-equation"><div><span>ONE ALARM</span><strong>PTP degraded</strong></div><b>+</b><div><span>{evidence.length} LIVE CONDITIONS</span><strong>{evidence.reduce((sum, item) => sum + item.observationCount, 0)} observations</strong></div><b>=</b><div className="proof-equation-result"><span>SUPPORTED DECISIONS</span><strong>{causes} causes</strong></div><div className="proof-safety"><span>ZERO AUTOMATED ACTIONS</span><strong>{safe ? 'Human authority preserved' : 'Review required'}</strong></div></div>{modelProof && <div className="payoff-model-proof"><span>INTEL CPU LIVE</span><strong>{modelProof.model}</strong><small>{modelProof.modelRuntime} · explanation only · no evidence or action authority</small></div>}<div className="journey-evidence">{evidence.map((item) => <div key={item.scenarioId}><span>{item.scenarioId}</span><strong>{item.cause}</strong><small>{item.observationCount} observations · {item.latencyMs}ms · no action</small></div>)}</div></> : <div className="evidence-empty"><span className="source-badge source-offline">NOT RUN</span><strong>{scene.emptyState}</strong></div>}
      <div className="punchline"><div>{scene.line1}</div><strong>{scene.line2}</strong>{scene.cta && <span>{scene.cta}</span>}</div>
    </div></SceneFrame>
  }

  if (scene.type === 'incident-open') return <IncidentOpening scene={scene} />

  if (scene.type === 'intro') {
    return (
      <SceneFrame scene={scene}>
        <div className="brand-lockup brand-lockup-hero">
          <img src={brand.primary.logo} alt={brand.primary.alt} />
          <span>×</span>
          <img src={brand.partner.logo} alt={brand.partner.alt} />
        </div>
        <h1>{scene.title}</h1>
        <div className="subtitle">{scene.subtitle}</div>
      </SceneFrame>
    )
  }

  if (scene.type === 'metric') {
    return <SceneFrame scene={scene}><div className={`hero-metric ${toneClass(scene.tone)}`}>{scene.value}</div><div className="hero-label">{scene.label}</div></SceneFrame>
  }

  if (scene.type === 'quote') {
    return <SceneFrame scene={scene}><blockquote>“{scene.quote}”</blockquote>{scene.attribution && <div className="quote-attribution">— {scene.attribution}</div>}</SceneFrame>
  }

  if (scene.type === 'stat-grid') {
    return <SceneFrame scene={scene}><div className="stat-grid">{scene.stats.map((stat) => <div className="stat" key={`${stat.value}-${stat.label}`}><div className={`stat-value ${toneClass(stat.tone)}`}>{stat.value}</div><div>{stat.label}</div></div>)}</div></SceneFrame>
  }

  if (scene.type === 'reframe') {
    return <SceneFrame scene={scene}><div className="reframe"><div className="reframe-before">{scene.before}</div><div className="reframe-arrow">→</div><div className="reframe-after">{scene.after}</div></div>{scene.detail && <p className="supporting">{scene.detail}</p>}</SceneFrame>
  }

  if (scene.type === 'architecture') {
    return <SceneFrame scene={scene}><div className="architecture">{scene.nodes.map((node, index) => <motion.div className={`architecture-node ${toneClass(node.tone)}`} key={node.id} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.12 }}><strong>{node.label}</strong>{node.detail && <span>{node.detail}</span>}</motion.div>)}</div></SceneFrame>
  }

  if (scene.type === 'architecture-flow') {
    return <SceneFrame scene={scene}><div className="architecture-flow">{scene.steps.map((step, index) => <div className="flow-wrap" key={step.id}><motion.div className={`architecture-node ${toneClass(step.tone)}`} initial={{ opacity: 0, x: -14 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: index * 0.12 }}><strong>{step.label}</strong>{step.detail && <span>{step.detail}</span>}</motion.div>{index < scene.steps.length - 1 && <div className="flow-transition"><span>{step.transition ?? '→'}</span></div>}</div>)}</div></SceneFrame>
  }

  if (scene.type === 'architecture-layers') {
    return <SceneFrame scene={scene}><div className="architecture-layers">{scene.layers.map((layer, index) => <motion.div className={`architecture-layer ${toneClass(layer.tone)}`} key={layer.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.12 }}><strong>{layer.label}</strong><span>{layer.responsibility}</span></motion.div>)}</div></SceneFrame>
  }

  if (scene.type === 'architecture-compare') {
    const renderSide = (side: typeof scene.before, state: string) => <div className={`architecture-side ${state}`}><div className="metric-label">{side.label}</div>{side.nodes.map((node) => <div className="architecture-chip" key={node}>{node}</div>)}</div>
    return <SceneFrame scene={scene}><div className="architecture-compare">{renderSide(scene.before, 'before')}<div className="reframe-arrow">→</div>{renderSide(scene.after, 'after')}</div><div className="decision">{scene.insight}</div></SceneFrame>
  }

  if (scene.type === 'trust-boundary') {
    return <SceneFrame scene={scene}><div className="boundary-grid">{scene.zones.map((zone) => <div className={`boundary-zone ${toneClass(zone.tone)}`} key={zone.id}><div className="boundary-label">{zone.boundary}</div><h2>{zone.label}</h2>{zone.items.map((item) => <span key={item}>{item}</span>)}</div>)}</div></SceneFrame>
  }

  if (scene.type === 'deployment-topology') {
    return <SceneFrame scene={scene}><div className="topology-grid">{scene.locations.map((location) => <div className={`topology-location ${toneClass(location.tone)}`} key={location.id}><h2>{location.label}</h2>{location.detail && <p>{location.detail}</p>}<div>{location.workloads.map((workload) => <span className="architecture-chip" key={workload}>{workload}</span>)}</div></div>)}</div></SceneFrame>
  }

  if (scene.type === 'pipeline') {
    return <SceneFrame scene={scene}><div className="pipeline">{scene.steps.map((step, index) => <div className="pipeline-wrap" key={step.label}><motion.div className="pipeline-step" initial={{ opacity: 0, scale: 0.94 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: index * 0.14 }}><span>{index + 1}</span><strong>{step.label}</strong>{step.detail && <small>{step.detail}</small>}</motion.div>{index < scene.steps.length - 1 && <div className="connector">→</div>}</div>)}</div></SceneFrame>
  }

  if (scene.type === 'comparison') {
    return <SceneFrame scene={scene}><div className="comparison-grid">{scene.columns.map((column) => <div className={`comparison-card ${toneClass(column.tone)}`} key={column.label}><div className="metric-label">{column.label}</div><div className="comparison-value">{column.value}</div>{column.detail && <p>{column.detail}</p>}</div>)}</div></SceneFrame>
  }

  if (scene.type === 'scale') {
    return <SceneFrame scene={scene}><div className="scale-track">{scene.stages.map((stage, index) => <motion.div className="scale-stage" key={stage.label} initial={{ opacity: 0, x: -15 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: index * 0.14 }}><div><strong>{stage.label}</strong><span>{stage.detail}</span></div><b>{stage.value}</b></motion.div>)}</div></SceneFrame>
  }

  if (scene.type === 'tradeoff') {
    return <SceneFrame scene={scene}><div className="tradeoff-grid">{scene.options.map((option) => <div className="tradeoff-card" key={option.title}><h2>{option.title}</h2><p className="strength">{option.strength}</p><p>{option.tradeoff}</p></div>)}</div><div className="decision">{scene.decision}</div></SceneFrame>
  }

  return <SceneFrame scene={scene}><div className="punchline"><div>{scene.line1}</div><strong>{scene.line2}</strong>{scene.cta && <span>{scene.cta}</span>}</div></SceneFrame>
}
