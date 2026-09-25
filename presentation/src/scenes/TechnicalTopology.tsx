import { motion } from 'motion/react'

export type TopologyNodeId = 'browser' | 'route' | 'app-service' | 'app' | 'diagnostics-service' | 'mcp' | 'history' | 'policy' | 'model' | 'operator'

type Props = {
  activeThrough?: 'idle' | 'ready' | 'investigation'
  activeIds?: TopologyNodeId[]
  focusIds?: TopologyNodeId[]
  metrics?: Partial<Record<TopologyNodeId, string>>
  model?: { name?: string; runtime?: string }
  running?: boolean
}

const activeFor = (node: string, through: Props['activeThrough']) => {
  if (through === 'idle') return false
  if (through === 'ready') return ['browser', 'route', 'app-service', 'app', 'diagnostics-service', 'mcp'].includes(node)
  return node !== 'model'
}

function Node({ id, kind, title, detail, port, active, focus, metric, running }: { id: TopologyNodeId; kind: string; title: string; detail: string; port?: string; active: boolean; focus?: boolean; metric?: string; running?: boolean }) {
  return <motion.div data-node={id} className={`topology-node topology-${kind} ${active ? 'active' : ''} ${focus ? 'focus' : ''}`} animate={focus && running ? { scale: [1, 1.025, 1] } : { scale: 1 }} transition={{ repeat: focus && running ? Infinity : 0, duration: 1 }}>
    <span className="topology-kind">{kind}</span><strong>{title}</strong><small>{detail}</small>{port && <code>{port}</code>}{metric && <em>{metric}</em>}
  </motion.div>
}

function Edge({ label, active, dashed }: { label: string; active: boolean; dashed?: boolean }) {
  return <div className={`topology-edge ${active ? 'active' : ''} ${dashed ? 'dashed' : ''}`}><span>{label}</span><b>→</b></div>
}

export function TechnicalTopology({ activeThrough = 'idle', activeIds, focusIds = [], metrics = {}, model, running }: Props) {
  const on = (id: TopologyNodeId) => activeIds ? activeIds.includes(id) : activeFor(id, activeThrough)
  const focused = (id: TopologyNodeId) => focusIds.includes(id)
  return <div className="technical-topology" aria-label="Live technical deployment topology">
    <div className="topology-legend"><span><i className="legend-live" /> live request and evidence path</span><span><i className="legend-policy" /> enforced namespace boundary</span><span><i className="legend-optional" /> optional wording path</span></div>
    <div className="topology-graph">
      <Node id="browser" kind="operator" title="NOC browser" detail="story + workspace" active={on('browser')} focus={focused('browser')} metric={metrics.browser} running={running} />
      <Edge label="HTTPS" active={on('route')} />
      <div className="openshift-boundary">
        <div className="boundary-title"><strong>OpenShift namespace</strong><span>network-operations-demo</span></div>
        <div className="topology-main-path">
          <Node id="route" kind="route" title="Route" detail="edge TLS termination" port="443 → 8080" active={on('route')} focus={focused('route')} metric={metrics.route} running={running} />
          <Edge label="HTTP" active={on('app-service')} />
          <Node id="app-service" kind="service" title="app Service" detail="stable cluster endpoint" port=":8080" active={on('app-service')} focus={focused('app-service')} metric={metrics['app-service']} running={running} />
          <Edge label="selects pod" active={on('app')} />
          <Node id="app" kind="deployment" title="app Deployment" detail="React story + Python API + evidence policy" port="POST /api/investigate" active={on('app')} focus={focused('app')} metric={metrics.app} running={running} />
          <Edge label="MCP / HTTP" active={on('diagnostics-service')} />
          <Node id="diagnostics-service" kind="service" title="diagnostics Service" detail="NetworkPolicy: app pods only" port=":8095/mcp" active={on('diagnostics-service')} focus={focused('diagnostics-service')} metric={metrics['diagnostics-service']} running={running} />
          <Edge label="selects pod" active={on('mcp')} />
          <Node id="mcp" kind="deployment" title="diagnostics Deployment" detail="3 allowlisted read-only MCP tools" active={on('mcp')} focus={focused('mcp')} metric={metrics.mcp} running={running} />
        </div>
        <div className="topology-support-paths">
          <Node id="history" kind="data" title="Approved history" detail="versioned cases + runbooks" active={on('history')} focus={focused('history')} metric={metrics.history} running={running} />
          <Edge label="local retrieval" active={on('history')} />
          <div data-node="policy" className={`topology-policy ${on('policy') ? 'active' : ''} ${focused('policy') ? 'focus' : ''}`}><span>inside app pod</span><strong>Deterministic evidence policy</strong><small>validate → compare → support or abstain</small>{metrics.policy && <em>{metrics.policy}</em>}</div>
          <Edge label="proposal only" active={on('browser')} />
          <Node id="operator" kind="authority" title="Human review" detail="zero remediation executed" active={on('operator')} focus={focused('operator')} metric={metrics.operator} running={running} />
        </div>
      </div>
      <div className="topology-optional-path"><Edge label="OpenAI-compatible API" active={on('model')} dashed /><Node id="model" kind="external" title={model?.name ?? 'Intel CPU inference'} detail={model?.runtime ?? 'Granite wording only · post-decision'} active={on('model')} focus={focused('model')} metric={metrics.model} running={running} /></div>
    </div>
  </div>
}
