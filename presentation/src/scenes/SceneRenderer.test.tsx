import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { demoConfig } from '../demo.config'
import '../live/demoAdapter'
import type { SceneConfig } from '../types'
import { SceneRenderer } from './SceneRenderer'

describe('SceneRenderer', () => {
  const scenes = demoConfig.acts.flatMap((act) => act.scenes)

  for (const scene of scenes) {
    it(`renders ${scene.type}: ${scene.id}`, () => {
      const { container } = render(<SceneRenderer scene={scene} brand={demoConfig.brand} />)
      expect(container.querySelector('.scene')).toBeInTheDocument()
    })
  }

  it('labels rehearsal data instead of presenting it as live', async () => {
    const scene: SceneConfig = { id: 'fallback-proof', type: 'live-proof', beat: 'live-proof', title: 'Fallback proof', adapterId: 'hardware-investigation', cta: 'Run proof', resultFields: [{ key: 'cause', label: 'Cause' }] }
    render(<SceneRenderer scene={scene} brand={demoConfig.brand} />)
    fireEvent.click(screen.getByRole('button', { name: scene.type === 'live-proof' ? scene.cta : '' }))
    expect(await screen.findByText('rehearsal')).toBeInTheDocument()
  })

  it('renders a live infrastructure journey with the complete architecture flow', () => {
    const scene = scenes.find((item) => item.type === 'live-journey')!
    render(<SceneRenderer scene={scene} brand={demoConfig.brand} />)
    expect(screen.getByLabelText('Live technical deployment topology')).toBeInTheDocument()
    expect(screen.getByText('network-operations-demo · Flightpath')).toBeInTheDocument()
    expect(screen.getByText('NetworkPolicy: app pods only')).toBeInTheDocument()
    expect(screen.getByText('app Deployment')).toBeInTheDocument()
    expect(screen.getByText('diagnostics Deployment')).toBeInTheDocument()
    expect(screen.getByText(':8095/mcp')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Run the live journey' })).toBeInTheDocument()
  })

  it('renders the statistic-grid scene', () => {
    const scene: SceneConfig = {
      id: 'coverage-stat-grid',
      type: 'stat-grid',
      beat: 'stakes',
      title: 'The stakes',
      stats: [{ value: '3×', label: 'Faster', tone: 'success' }],
    }
    render(<SceneRenderer scene={scene} brand={demoConfig.brand} />)
    expect(screen.getByText('3×')).toBeInTheDocument()
    expect(screen.getByText('Faster')).toBeInTheDocument()
  })

  it('guides architecture as operator questions and revealed answers', async () => {
    const scene = scenes.find((item) => item.type === 'guided-architecture')!
    render(<SceneRenderer scene={scene} brand={demoConfig.brand} />)
    expect(screen.getByText('What exactly happened?')).toBeInTheDocument()
    expect(screen.queryByText('A validated synthetic event starts the investigation.')).not.toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Reveal technical boundary' }))
    expect(await screen.findByText('A validated synthetic event starts the investigation.')).toBeInTheDocument()
    expect(document.querySelector('[data-node="route"]')).toHaveClass('active')
    fireEvent.click(screen.getByRole('button', { name: 'Ask next question →' }))
    expect(await screen.findByText('What do the systems show right now?')).toBeInTheDocument()
  })

  it('keeps the presenter pitch at seven scenes or fewer', () => {
    expect(scenes.length).toBeLessThanOrEqual(7)
  })

  it('renders the custom React scene escape hatch', () => {
    const scene: SceneConfig = {
      id: 'coverage-custom',
      type: 'custom',
      beat: 'live-proof',
      component: () => <div>Custom proof scene</div>,
    }
    render(<SceneRenderer scene={scene} brand={demoConfig.brand} />)
    expect(screen.getByText('Custom proof scene')).toBeInTheDocument()
  })

  const architectureScenes: SceneConfig[] = [
    {
      id: 'coverage-flow', type: 'architecture-flow', beat: 'system-reveal', title: 'Request flow',
      steps: [{ id: 'entry', label: 'Entry', transition: 'route' }, { id: 'model', label: 'Model' }],
    },
    {
      id: 'coverage-layers', type: 'architecture-layers', beat: 'system-reveal', title: 'Layers',
      layers: [{ id: 'platform', label: 'Platform', responsibility: 'Schedules the workload' }],
    },
    {
      id: 'coverage-compare', type: 'architecture-compare', beat: 'reframe', title: 'Structural change',
      before: { label: 'Before', nodes: ['Fixed path'] }, after: { label: 'After', nodes: ['Measured route'] }, insight: 'Measure before routing.',
    },
    {
      id: 'coverage-boundary', type: 'trust-boundary', beat: 'system-reveal', title: 'Trust boundaries',
      zones: [{ id: 'trusted', label: 'Trusted zone', boundary: 'Policy boundary', items: ['Private data'] }],
    },
    {
      id: 'coverage-topology', type: 'deployment-topology', beat: 'system-reveal', title: 'Placement',
      locations: [{ id: 'edge', label: 'Edge', workloads: ['Router'] }],
    },
  ]

  for (const scene of architectureScenes) {
    it(`renders architecture view: ${scene.type}`, () => {
      const { container } = render(<SceneRenderer scene={scene} brand={demoConfig.brand} />)
      expect(container.querySelector('.scene')).toBeInTheDocument()
    })
  }
})
