export type EventType = 'chroma_storm' | 'crystal_bloom' | 'anomaly_surge' | 'resonance_wave' | 'field_collapse'

export interface EnvironmentEvent {
  id: EventType
  name: string
  description: string
  severity: 'low' | 'medium' | 'high'
  effect: 'hostile' | 'beneficial' | 'neutral'
  pointsEffect: number
  interferenceEffect: number
}

export const EVENTS: Record<EventType, EnvironmentEvent> = {
  chroma_storm: {
    id: 'chroma_storm', name: 'Chroma Storm',
    description: 'The field convulses. Structures take 10 damage. All players lose 5 points.',
    severity: 'high', effect: 'hostile', pointsEffect: -5, interferenceEffect: 15,
  },
  crystal_bloom: {
    id: 'crystal_bloom', name: 'Crystal Bloom',
    description: '3 new resource nodes erupt from the terrain. Gather quickly.',
    severity: 'low', effect: 'beneficial', pointsEffect: 10, interferenceEffect: -10,
  },
  anomaly_surge: {
    id: 'anomaly_surge', name: 'Anomaly Surge',
    description: 'Hostile entities reinforce. A new Anomaly materializes.',
    severity: 'high', effect: 'hostile', pointsEffect: 0, interferenceEffect: 20,
  },
  resonance_wave: {
    id: 'resonance_wave', name: 'Resonance Wave',
    description: 'The field pulses with energy. All commanders gain 15 points.',
    severity: 'low', effect: 'beneficial', pointsEffect: 15, interferenceEffect: -15,
  },
  field_collapse: {
    id: 'field_collapse', name: 'Field Collapse',
    description: 'A sector of the grid goes dark. One Conduit is destroyed.',
    severity: 'medium', effect: 'hostile', pointsEffect: -10, interferenceEffect: 10,
  },
}

export interface AggressionState {
  harvestCount: number
  combatCount: number
  buildCount: number
  score: number
}

export function calculateAggressionScore(state: AggressionState): number {
  const total = state.harvestCount + state.combatCount + state.buildCount
  if (total === 0) return 0
  const harvestWeight = (state.harvestCount / total) * 40
  const combatWeight = (state.combatCount / total) * 60
  return Math.min(100, Math.round(harvestWeight + combatWeight))
}

export function selectNextEvent(aggression: number, interference: number): EnvironmentEvent {
  const weights: [EventType, number][] = [
    ['chroma_storm', aggression > 60 ? 30 : 10],
    ['crystal_bloom', interference > 50 ? 25 : 15],
    ['anomaly_surge', aggression > 40 ? 25 : 10],
    ['resonance_wave', interference > 70 ? 20 : 10],
    ['field_collapse', interference > 80 ? 20 : 5],
  ]
  const totalWeight = weights.reduce((s, [, w]) => s + w, 0)
  let rand = Math.random() * totalWeight
  for (const [id, weight] of weights) {
    rand -= weight
    if (rand <= 0) return EVENTS[id]
  }
  return EVENTS['crystal_bloom']
}

export function getAIAction(aggression: number): 'harvest' | 'attack' | 'build' {
  const r = Math.random()
  if (aggression > 60) {
    if (r < 0.5) return 'attack'
    if (r < 0.8) return 'harvest'
    return 'build'
  } else if (aggression < 30) {
    if (r < 0.5) return 'harvest'
    if (r < 0.75) return 'build'
    return 'attack'
  }
  if (r < 0.4) return 'harvest'
  if (r < 0.7) return 'attack'
  return 'build'
}
