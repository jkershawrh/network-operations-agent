import { motion } from 'motion/react'
import type { DemoConfig } from '../types'

export function Finale({ config, onRestart }: { config: DemoConfig; onRestart: () => void }) {
  return (
    <main className="finale">
      <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }}>
        <div className="eyebrow">The next journey</div>
        <h1>{config.cta}</h1>
        {config.relatedStories && <div className="related-grid">{config.relatedStories.map((story) => <a className="related-card" href={story.href ?? '#'} key={story.title}><strong>{story.title}</strong><em>{story.question}</em><span>{story.technology}</span></a>)}</div>}
        <button className="button button-secondary" onClick={onRestart}>Restart presentation</button>
        <div className="attribution">{config.brand.attribution}</div>
      </motion.div>
    </main>
  )
}
