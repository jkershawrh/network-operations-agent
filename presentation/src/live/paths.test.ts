import { describe, expect, it } from 'vitest'

import { storyEndpoint } from './paths'

describe('storyEndpoint', () => {
  it('uses the application root on a direct Route', () => {
    window.history.replaceState(null, '', '/story/?act=2')
    expect(storyEndpoint('api/investigate')).toBe('/api/investigate')
    expect(storyEndpoint('/ready')).toBe('/ready')
  })

  it('stays inside the order-scoped Launchpad tool gateway', () => {
    window.history.replaceState(
      null,
      '',
      '/labs/network-operations-agent-order/proxy/tool/story/story/?act=2',
    )
    expect(storyEndpoint('api/investigate')).toBe(
      '/labs/network-operations-agent-order/proxy/tool/story/api/investigate',
    )
    expect(storyEndpoint('ready')).toBe(
      '/labs/network-operations-agent-order/proxy/tool/story/ready',
    )
  })
})

