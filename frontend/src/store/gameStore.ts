import { create } from 'zustand'
import type { Commander } from '../components/CommanderSelect'
import { getAIAction } from '../utils/environmentAI'
import { useEnvironmentStore } from './environmentStore'

export type GameScreen = 'menu' | 'commander_select' | 'matchmaking' | 'game' | 'victory'
export type ActionType = 'harvest' | 'attack' | 'build'

export interface PlayerState {
  id: 1 | 2
  name: string
  commander: Commander | null
  score: number
  crystals: number
  conduits: number
  actionsThisTurn: number
}

export interface GameAction {
  type: ActionType
  player: 1 | 2
  points: number
  turn: number
  timestamp: number
}

interface GameStore {
  screen: GameScreen
  player1: PlayerState
  player2: PlayerState
  currentPlayer: 1 | 2
  turn: number
  maxActions: number
  winTarget: number
  commanderSelectStep: 1 | 2
  actionLog: GameAction[]
  walletConnected: boolean

  setScreen: (s: GameScreen) => void
  setPlayer1Name: (name: string) => void
  setCommander: (player: 1 | 2, cmd: Commander) => void
  setCommanderSelectStep: (s: 1 | 2) => void
  doAction: (type: ActionType) => void
  endTurn: () => void
  aiTakeTurn: (aggression: number) => void
  resetGame: () => void
  connectWallet: () => void
  addConduit: (player: 1 | 2) => void
}

const defaultPlayer = (id: 1 | 2, name: string): PlayerState => ({
  id, name, commander: null, score: 0, crystals: 0, conduits: 0, actionsThisTurn: 0,
})

export const useGameStore = create<GameStore>((set, get) => ({
  screen: 'menu',
  player1: defaultPlayer(1, 'Commander Alpha'),
  player2: defaultPlayer(2, 'AI Opponent'),
  currentPlayer: 1,
  turn: 1,
  maxActions: 2,
  winTarget: 500,
  commanderSelectStep: 1,
  actionLog: [],
  walletConnected: false,

  setScreen: (screen) => set({ screen }),
  setPlayer1Name: (name) => set(s => ({ player1: { ...s.player1, name } })),
  setCommander: (player, cmd) => set(s =>
    player === 1
      ? { player1: { ...s.player1, commander: cmd } }
      : { player2: { ...s.player2, commander: cmd } }
  ),
  setCommanderSelectStep: (step) => set({ commanderSelectStep: step }),
  connectWallet: () => set({ walletConnected: true }),

  doAction: (type) => {
    const { player1, currentPlayer, actionLog, turn, maxActions } = get()
    if (currentPlayer !== 1) return
    const p = player1
    if (p.actionsThisTurn >= maxActions) return

    let pts = 0, crystals = 0, conduits = 0
    const cmdId = p.commander?.id ?? 'forge'
    if (type === 'harvest') {
      pts = 20 + (cmdId === 'forge' ? 10 : 0)
      crystals = 1
    } else if (type === 'attack') {
      pts = 50 + (cmdId === 'echo' ? 20 : 0)
    } else if (type === 'build') {
      pts = 30
      conduits = 1
    }

    const action: GameAction = { type, player: 1, points: pts, turn, timestamp: Date.now() }
    useEnvironmentStore.getState().recordAction(type)
    set(s => ({
      player1: {
        ...s.player1,
        score: s.player1.score + pts,
        crystals: s.player1.crystals + crystals,
        conduits: s.player1.conduits + conduits,
        actionsThisTurn: s.player1.actionsThisTurn + 1,
      },
      actionLog: [action, ...s.actionLog].slice(0, 20),
    }))
  },

  endTurn: () => {
    const { currentPlayer, turn, player2 } = get()
    if (currentPlayer === 1) {
      set(s => ({
        currentPlayer: 2,
        player1: { ...s.player1, actionsThisTurn: 0 },
        player2: { ...s.player2, score: s.player2.score + s.player2.conduits * 10 },
      }))
    } else {
      set(s => ({
        currentPlayer: 1,
        turn: turn + 1,
        player2: { ...s.player2, actionsThisTurn: 0 },
      }))
    }
  },

  aiTakeTurn: (aggression) => {
    const { player2, actionLog, turn } = get()
    const type = getAIAction(aggression)
    const cmdId = player2.commander?.id ?? 'echo'
    let pts = 0, crystals = 0, conduits = 0
    if (type === 'harvest') { pts = 20 + (cmdId === 'forge' ? 10 : 0); crystals = 1 }
    else if (type === 'attack') { pts = 50 + (cmdId === 'echo' ? 20 : 0) }
    else { pts = 30; conduits = 1 }

    const action: GameAction = { type, player: 2, points: pts, turn, timestamp: Date.now() }
    useEnvironmentStore.getState().recordAction(type)
    set(s => ({
      player2: {
        ...s.player2,
        score: s.player2.score + pts,
        crystals: s.player2.crystals + crystals,
        conduits: s.player2.conduits + conduits,
      },
      actionLog: [action, ...s.actionLog].slice(0, 20),
    }))
  },

  addConduit: (player) => {
    if (player === 1) set(s => ({ player1: { ...s.player1, conduits: s.player1.conduits + 1 } }))
    else set(s => ({ player2: { ...s.player2, conduits: s.player2.conduits + 1 } }))
  },

  resetGame: () => {
    useEnvironmentStore.getState().resetEnvironment()
    set({
      screen: 'menu',
      player1: defaultPlayer(1, 'Commander Alpha'),
      player2: defaultPlayer(2, 'AI Opponent'),
      currentPlayer: 1,
      turn: 1,
      commanderSelectStep: 1,
      actionLog: [],
    })
  },
}))
