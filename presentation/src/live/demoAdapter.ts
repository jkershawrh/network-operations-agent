import type { LiveDataAdapter } from '../types'
import { registerAdapter } from './adapters'

type InvestigationResponse = {
  alarm_id: string
  primary_hypothesis: { cause: string; supporting_evidence_ids: string[] }
  current_observations_with_tool_provenance: unknown[]
  action_requires_human_approval: boolean
  action_executed: boolean
}

type InvestigationSummary = Record<string, unknown> & {
  alarm: string
  cause: string
  observations: number
  support: string
  approval: string
  executed: string
}

const summarize = (result: InvestigationResponse): InvestigationSummary => ({
  alarm: result.alarm_id,
  cause: result.primary_hypothesis.cause,
  observations: result.current_observations_with_tool_provenance.length,
  support: result.primary_hypothesis.supporting_evidence_ids.join(', ') || 'none',
  approval: result.action_requires_human_approval ? 'required' : 'not required',
  executed: result.action_executed ? 'yes' : 'no',
})

function investigationAdapter(options: { id: string; scenarioId: string; fixture: InvestigationSummary }): LiveDataAdapter<InvestigationSummary> {
  return {
    id: options.id,
    timeoutMs: 8_000,
    rehearsal: { data: options.fixture, collectedAt: '2026-09-22T08:31:00.000Z' },
    async load(signal) {
      const response = await fetch('/api/investigate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scenario_id: options.scenarioId }),
        signal,
      })
      if (!response.ok) throw new Error(`Investigation endpoint returned HTTP ${response.status}`)
      return summarize(await response.json() as InvestigationResponse)
    },
  }
}

registerAdapter(investigationAdapter({
  id: 'hardware-investigation',
  scenarioId: 'ptp-hardware',
  fixture: { alarm: 'synthetic-ptp-001', cause: 'hardware_timing', observations: 3, support: 'hardware-1', approval: 'required', executed: 'no' },
}))

registerAdapter(investigationAdapter({
  id: 'platform-investigation',
  scenarioId: 'ptp-platform',
  fixture: { alarm: 'synthetic-ptp-002', cause: 'platform_timing', observations: 3, support: 'openshift_platform-1', approval: 'required', executed: 'no' },
}))
