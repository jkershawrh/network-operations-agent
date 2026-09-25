import { describe, expect, it } from 'vitest'
import { demoConfig } from '../demo.config'
import { validateDemoConfig } from './validate'

describe('validateDemoConfig', () => {
  it('accepts the starter story', () => {
    expect(validateDemoConfig(demoConfig)).toEqual([])
  })

  it('does not repeat the opening title as the first story scene', () => {
    expect(demoConfig.acts[0].scenes[0].title).not.toBe(demoConfig.title)
  })

  it('warns when stakes, proof, and payoff are missing', () => {
    const warnings = validateDemoConfig({ ...demoConfig, acts: [{ id: 'empty', label: '00', title: 'Empty', scenes: [] }] })
    expect(warnings).toEqual(expect.arrayContaining([
      expect.stringContaining('stakes'),
      expect.stringContaining('proof'),
      expect.stringContaining('payoff'),
    ]))
  })

  it('warns when the presenter journey is long or lacks guided handoffs', () => {
    const repeated = Array.from({ length: 8 }, (_, index) => ({
      id: `scene-${index}`, type: 'metric' as const, beat: 'stakes' as const, value: '0', label: 'test',
    }))
    const warnings = validateDemoConfig({ ...demoConfig, relatedStories: [], acts: [{ id: 'long', label: '00', title: 'Long', scenes: repeated }] })
    expect(warnings).toEqual(expect.arrayContaining([
      expect.stringContaining('7 or fewer'),
      expect.stringContaining('guided architecture'),
      expect.stringContaining('live proof'),
      expect.stringContaining('guided handoff'),
    ]))
  })
})
