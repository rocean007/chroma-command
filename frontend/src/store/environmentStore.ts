import { create } from 'zustand'
import { EnvironmentEvent, selectNextEvent, calculateAggressionScore, AggressionState } from '../utils/environmentAI'

interface EnvironmentStore {
  interference: number
  aggression: AggressionState
  aggressionScore: number
  nextEvent: EnvironmentEvent | null
  eventCountdown: number
  activeEvent: EnvironmentEvent | null
  eventHistory: EnvironmentEvent[]
  spawnedCrystals: number
  spawnedAnomalies: number

  addInterference: (amount: number) => void
  reduceInterference: (amount: number) => void
  recordAction: (type: 'harvest' | 'attack' | 'build') => void
  tickEventCountdown: () => EnvironmentEvent | null
  clearActiveEvent: () => void
  spawnCrystal: () => void
  spawnAnomaly: () => void
  resetEnvironment: () => void
}

const defaultAggression = (): AggressionState => ({
  harvestCount: 0, combatCount: 0, buildCount: 0, score: 0,
})

export const useEnvironmentStore = create<EnvironmentStore>((set, get) => ({
  interference: 0,
  aggression: defaultAggression(),
  aggressionScore: 0,
  nextEvent: null,
  eventCountdown: 3,
  activeEvent: null,
  eventHistory: [],
  spawnedCrystals: 6,
  spawnedAnomalies: 4,

  addInterference: (amount) => set(s => ({
    interference: Math.min(100, s.interference + amount),
  })),

  reduceInterference: (amount) => set(s => ({
    interference: Math.max(0, s.interference - amount),
  })),

  recordAction: (type) => {
    set(s => {
      const newAgg = {
        ...s.aggression,
        harvestCount: s.aggression.harvestCount + (type === 'harvest' ? 1 : 0),
        combatCount: s.aggression.combatCount + (type === 'attack' ? 1 : 0),
        buildCount: s.aggression.buildCount + (type === 'build' ? 1 : 0),
      }
      const score = calculateAggressionScore(newAgg)
      return { aggression: { ...newAgg, score }, aggressionScore: score }
    })
    const aggressionScore = get().aggressionScore
    const intAmount = type === 'harvest' ? 8 : type === 'attack' ? 12 : 6
    set(s => ({ interference: Math.min(100, s.interference + intAmount) }))
    if (!get().nextEvent) {
      const { interference } = get()
      set({ nextEvent: selectNextEvent(aggressionScore, interference), eventCountdown: Math.floor(Math.random() * 3) + 2 })
    }
  },

  tickEventCountdown: () => {
    const { eventCountdown, nextEvent, interference, aggressionScore, eventHistory } = get()
    if (eventCountdown <= 1 && nextEvent) {
      set({
        activeEvent: nextEvent,
        eventHistory: [nextEvent, ...eventHistory].slice(0, 8),
        interference: Math.min(100, Math.max(0, interference + nextEvent.interferenceEffect)),
        nextEvent: selectNextEvent(aggressionScore, interference),
        eventCountdown: Math.floor(Math.random() * 3) + 2,
      })
      return nextEvent
    }
    set(s => ({
      eventCountdown: s.eventCountdown - 1,
    }))
    return null
  },

  clearActiveEvent: () => set({ activeEvent: null }),

  spawnCrystal: () => set(s => ({ spawnedCrystals: s.spawnedCrystals + 1 })),
  spawnAnomaly: () => set(s => ({ spawnedAnomalies: s.spawnedAnomalies + 1 })),

  resetEnvironment: () => set({
    interference: 0,
    aggression: defaultAggression(),
    aggressionScore: 0,
    nextEvent: null,
    eventCountdown: 3,
    activeEvent: null,
    eventHistory: [],
    spawnedCrystals: 6,
    spawnedAnomalies: 4,
  }),
}))
