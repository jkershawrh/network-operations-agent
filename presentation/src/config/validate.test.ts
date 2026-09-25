import { describe, expect, it } from 'vitest'
import { demoConfig } from '../demo.config'
import { validateDemoConfig } from './validate'

describe('validateDemoConfig', () => {
  it('accepts the starter story', () => {
    expect(validateDemoConfig(demoConfig)).toEqual([])
  })

  it('warns when stakes, proof, and payoff are missing', () => {
    const warnings = validateDemoConfig({ ...demoConfig, acts: [{ id: 'empty', label: '00', title: 'Empty', scenes: [] }] })
    expect(warnings).toEqual(expect.arrayContaining([
      expect.stringContaining('stakes'),
      expect.stringContaining('proof'),
      expect.stringContaining('payoff'),
    ]))
  })
})
