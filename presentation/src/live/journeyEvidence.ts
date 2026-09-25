export type InvestigationEvidence = {
  scenarioId: string
  cause: string
  observationCount: number
  historicalSourceCount: number
  supportingEvidenceIds: string[]
  actionExecuted: boolean
  model?: string
  modelRuntime?: string
  modelStatus?: string
  modelLatencyMs?: number
  latencyMs: number
  collectedAt: string
}

const KEY = 'network-operations:journey-evidence'

export function readJourneyEvidence(): InvestigationEvidence[] {
  try {
    return JSON.parse(window.sessionStorage.getItem(KEY) ?? '[]') as InvestigationEvidence[]
  } catch {
    return []
  }
}

export function recordJourneyEvidence(evidence: InvestigationEvidence) {
  const next = readJourneyEvidence().filter((item) => item.scenarioId !== evidence.scenarioId)
  next.push(evidence)
  window.sessionStorage.setItem(KEY, JSON.stringify(next))
}

export function clearJourneyEvidence() {
  window.sessionStorage.removeItem(KEY)
}
