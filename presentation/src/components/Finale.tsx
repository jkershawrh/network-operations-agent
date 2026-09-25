import { useState } from 'react'
import { motion } from 'motion/react'
import type { DemoConfig } from '../types'

export function Finale({ config, onRestart }: { config: DemoConfig; onRestart: () => void }) {
  const [closed, setClosed] = useState(false)
  const nextJourney = config.relatedStories?.[0]

  return (
    <main className="finale">
      {!closed ? <motion.div key="closure" initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }}>
          <div className="eyebrow">Story complete</div>
          <h1>{config.cta}</h1>
          <div className="finale-actions"><button className="button button-primary" onClick={() => setClosed(true)}>Close presentation</button><button className="button button-quiet" onClick={onRestart}>Restart</button></div>
          <div className="attribution">{config.brand.attribution}</div>
        </motion.div> : <motion.div key="post-demo" initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }}>
          <div className="eyebrow">Presentation closed</div>
          <h1>The lab is the next journey.</h1>
          {nextJourney && <div className="guided-handoff"><div className="journey-meta">Separate Launchpad environment · {nextJourney.duration}</div><strong>{nextJourney.title}</strong><span>{nextJourney.instruction}</span>{nextJourney.href && <a className="button button-primary" href={nextJourney.href} target="_blank" rel="noreferrer">Order the hands-on lab →</a>}</div>}
          <div className="finale-actions"><button className="button button-secondary" onClick={onRestart}>Restart presentation</button></div>
        </motion.div>}
    </main>
  )
}
