import { motion } from 'motion/react'

type Props = { activeThrough?: 'idle' | 'ready' | 'investigation'; activeIds?: string[]; running?: boolean }

const activeFor = (node: string, through: Props['activeThrough']) => {
  if (through === 'idle') return false
  if (through === 'ready') return ['browser', 'route', 'app-service', 'app', 'diagnostics-service', 'mcp'].includes(node)
  return node !== 'model'
}

function Node({ id, kind, title, detail, port, active, running }: { id: string; kind: string; title: string; detail: string; port?: string; active: boolean; running?: boolean }) {
  return <motion.div data-node={id} className={`topology-node topology-${kind} ${active ? 'active' : ''}`} animate={active && running ? { scale: [1, 1.018, 1] } : { scale: 1 }} transition={{ repeat: active && running ? Infinity : 0, duration: 1 }}>
    <span className="topology-kind">{kind}</span><strong>{title}</strong><small>{detail}</small>{port && <code>{port}</code>}
  </motion.div>
}

function Edge({ label, active, dashed }: { label: string; active: boolean; dashed?: boolean }) {
  return <div className={`topology-edge ${active ? 'active' : ''} ${dashed ? 'dashed' : ''}`}><span>{label}</span><b>→</b></div>
}

export function TechnicalTopology({ activeThrough = 'idle', activeIds, running }: Props) {
  const on = (id: string) => activeIds ? activeIds.includes(id) : activeFor(id, activeThrough)
  return <div className="technical-topology" aria-label="Live technical deployment topology">
    <div className="topology-legend"><span><i className="legend-live" /> live request and evidence path</span><span><i className="legend-policy" /> enforced namespace boundary</span><span><i className="legend-optional" /> optional wording path</span></div>
    <div className="topology-graph">
      <Node id="browser" kind="operator" title="NOC browser" detail="story + workspace" active={on('browser')} running={running} />
      <Edge label="HTTPS" active={on('route')} />
      <div className="openshift-boundary">
        <div className="boundary-title"><strong>OpenShift namespace</strong><span>network-operations-demo · Flightpath</span></div>
        <div className="topology-main-path">
          <Node id="route" kind="route" title="Route" detail="edge TLS termination" port="443 → 8080" active={on('route')} running={running} />
          <Edge label="HTTP" active={on('app-service')} />
          <Node id="app-service" kind="service" title="app Service" detail="stable cluster endpoint" port=":8080" active={on('app-service')} running={running} />
          <Edge label="selects pod" active={on('app')} />
          <Node id="app" kind="deployment" title="app Deployment" detail="React story + Python API + evidence policy" port="POST /api/investigate" active={on('app')} running={running} />
          <Edge label="MCP / HTTP" active={on('diagnostics-service')} />
          <Node id="diagnostics-service" kind="service" title="diagnostics Service" detail="NetworkPolicy: app pods only" port=":8095/mcp" active={on('diagnostics-service')} running={running} />
          <Edge label="selects pod" active={on('mcp')} />
          <Node id="mcp" kind="deployment" title="diagnostics Deployment" detail="3 allowlisted read-only MCP tools" active={on('mcp')} running={running} />
        </div>
        <div className="topology-support-paths">
          <Node id="history" kind="data" title="Approved history" detail="versioned cases + runbooks" active={on('history')} running={running} />
          <Edge label="local retrieval" active={on('history')} />
          <div className={`topology-policy ${on('policy') ? 'active' : ''}`}><span>inside app pod</span><strong>Deterministic evidence policy</strong><small>validate → compare → support or abstain</small></div>
          <Edge label="proposal only" active={on('browser')} />
          <Node id="operator" kind="authority" title="Human review" detail="zero remediation executed" active={on('operator')} running={running} />
        </div>
      </div>
      <div className="topology-optional-path"><Edge label="OpenAI-compatible API" active={false} dashed /><Node id="model" kind="external" title="Optional model" detail="wording only · no new evidence or authority" active={false} /></div>
    </div>
  </div>
}
