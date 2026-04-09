import { lazy, Suspense, useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useWebGL } from './hooks/useWebGL'
import { useGameStore } from './store/gameStore'
import { useEnvironmentStore } from './store/environmentStore'
import { openCookiePreferences } from './features/consent'

const CommanderSelect = lazy(() => import('./components/CommanderSelect'))
const MatchmakingQueue = lazy(() => import('./components/MatchmakingQueue'))
const VictoryScreen = lazy(() => import('./components/VictoryScreen'))
const Leaderboard = lazy(() => import('./components/Leaderboard'))
const GameBoard = lazy(() => import('./components/GameBoard'))
const PlayerHUD = lazy(() => import('./components/PlayerHUD'))
const EnvironmentPanel = lazy(() => import('./components/EnvironmentPanel'))
const EventToast = lazy(() => import('./components/EventToast'))

const MENU_TABS = ['PLAY', 'LEADERBOARD', 'HOW TO PLAY'] as const
type MenuTab = typeof MENU_TABS[number]

function ScreenFallback() {
  return (
    <div
      className="fixed inset-0 z-50 flex min-h-[100dvh] items-center justify-center"
      style={{ background: '#2D2A26' }}
      role="status"
      aria-live="polite"
    >
      <span className="sr-only">Loading…</span>
      <div className="h-8 w-8 animate-pulse rounded border border-amber-500/30" aria-hidden />
    </div>
  )
}

function MenuScreen() {
  const { setScreen, setPlayer1Name, player1, connectWallet, walletConnected, walletAddress, walletError } = useGameStore()
  const [tab, setTab] = useState<MenuTab>('PLAY')
  const [name, setName] = useState(player1.name)
  const [mode, setMode] = useState<'ai' | 'human'>('ai')

  if (tab === 'LEADERBOARD') {
    return (
      <Suspense fallback={<ScreenFallback />}>
        <Leaderboard />
      </Suspense>
    )
  }

  return (
    <motion.div
      className="fixed inset-0 z-50 flex flex-col items-center overflow-y-auto overscroll-y-contain py-6 sm:justify-center sm:py-8 [padding-bottom:max(1.5rem,env(safe-area-inset-bottom))] [padding-top:max(1rem,env(safe-area-inset-top))]"
      style={{ background: 'rgba(45,42,38,0.96)' }}
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
    >
      {/* Hex background */}
      <div className="absolute inset-0 opacity-[0.04] pointer-events-none" style={{
        backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'56\' height=\'100\'%3E%3Cpath d=\'M28 66L0 50V16L28 0l28 16v34L28 66zm0 34L0 84V50l28 16 28-16v34L28 100z\' fill=\'none\' stroke=\'%23E85D04\' stroke-width=\'1\'/%3E%3C/svg%3E")',
      }} />

      <div className="relative z-10 my-auto w-full max-w-lg px-4 sm:px-6">
        {/* Logo */}
        <motion.div className="mb-6 text-center sm:mb-8"
          initial={{ y: -30, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ type: 'spring', stiffness: 150 }}>
          <div className="font-display mb-1 text-4xl font-black tracking-[0.12em] text-molten text-glow-ember sm:text-5xl sm:tracking-[0.15em]">
            CHROMA
          </div>
          <div className="font-display text-xl font-bold tracking-[0.25em] text-ember sm:text-2xl sm:tracking-[0.3em]">
            COMMAND
          </div>
          <div className="label-text tracking-[0.4em]" style={{ color: 'var(--neutral)' }}>
            THE LIVING PROTOCOL
          </div>
          <div className="flex items-center justify-center gap-2 mt-3">
            <div className="h-px w-16" style={{ background: 'linear-gradient(to right, transparent, var(--accent-active))' }} />
            <span className="font-display text-xs text-molten">◈</span>
            <div className="h-px w-16" style={{ background: 'linear-gradient(to left, transparent, var(--accent-active))' }} />
          </div>
        </motion.div>

        {/* Tab Bar */}
        <motion.div className="flex gap-1 mb-4 p-1 rounded-sm panel-glass"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}>
          {MENU_TABS.map(t => (
            <button key={t} type="button" onClick={() => setTab(t)}
              className="min-h-[40px] flex-1 touch-manipulation rounded-sm py-2 text-[0.65rem] font-display tracking-widest transition-all sm:text-xs"
              style={{
                background: tab === t ? 'var(--accent-active)' : 'transparent',
                color: tab === t ? 'var(--primary-bg)' : 'var(--neutral)',
                fontWeight: tab === t ? 700 : 400,
              }}>
              {t}
            </button>
          ))}
        </motion.div>

        {/* Card */}
        <motion.div className="panel-glass-bright rounded-sm p-4 sm:p-6"
          initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.25 }}>

          {tab === 'PLAY' && (
            <div className="flex flex-col gap-4">
              <div>
                <label className="label-text block mb-2">YOUR NAME</label>
                <input
                  type="text"
                  value={name}
                  onChange={e => { setName(e.target.value); setPlayer1Name(e.target.value) }}
                  className="w-full px-3 py-2 rounded-sm text-sm font-mono-cc"
                  style={{ background: 'var(--primary-bg)', border: '1px solid rgba(139,58,43,0.5)', color: 'var(--text-primary)', outline: 'none' }}
                  maxLength={20}
                  onFocus={e => e.target.style.borderColor = 'var(--accent-active)'}
                  onBlur={e => e.target.style.borderColor = 'rgba(139,58,43,0.5)'}
                />
              </div>

              <div>
                <label className="label-text block mb-2">GAME MODE</label>
                <div className="flex gap-2">
                  {(['ai', 'human'] as const).map(m => (
                    <button key={m} type="button" onClick={() => setMode(m)}
                      className="min-h-[44px] flex-1 touch-manipulation rounded-sm border py-2 font-display text-xs tracking-widest transition-all"
                      style={{
                        borderColor: mode === m ? 'var(--accent-active)' : 'rgba(139,58,43,0.3)',
                        background: mode === m ? 'rgba(232,93,4,0.15)' : 'transparent',
                        color: mode === m ? 'var(--accent-active)' : 'var(--neutral)',
                      }}>
                      {m === 'ai' ? '⚡ VS AI' : '◈ VS HUMAN'}
                    </button>
                  ))}
                </div>
              </div>

              <button type="button" className="btn-primary mt-2 w-full touch-manipulation text-center"
                onClick={() => { setPlayer1Name(name); setScreen('commander_select') }}>
                ENTER THE CHROMA FIELD
              </button>

              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <button type="button" className="btn-secondary touch-manipulation text-xs"
                  onClick={() => { void connectWallet() }}>
                  {walletConnected ? '✓ WALLET LINKED' : 'CONNECT WALLET'}
                </button>
                {walletConnected && (
                  <span className="label-text text-sulfur">{walletAddress ? `${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}` : 'Connected'}</span>
                )}
              </div>
              {walletError && (
                <div className="label-text text-blood">{walletError}</div>
              )}
            </div>
          )}

          {tab === 'HOW TO PLAY' && (
            <div className="space-y-4 text-sm text-bronze leading-relaxed">
              <div>
                <p className="label-text text-molten mb-1">OBJECTIVE</p>
                <p>Be first to reach <span className="text-ember">500 Resonance Points</span>. You cannot attack each other directly — all conflict is through the living field.</p>
              </div>
              <div>
                <p className="label-text text-amber-shard mb-1">ACTIONS (2 per turn)</p>
                <p>◈ <span className="text-ash">Harvest Crystal</span> — +20 pts, gain 1 crystal<br/>
                ◉ <span className="text-ash">Neutralize Anomaly</span> — +50 pts, high risk<br/>
                ⬡ <span className="text-ash">Build Conduit</span> — +30 pts, +passive income</p>
              </div>
              <div>
                <p className="label-text text-crimson mb-1">THE LIVING FIELD</p>
                <p>Every action generates <span className="text-blood">Interference</span>. High interference triggers hostile events against both players. The field adapts to your strategy.</p>
              </div>
              <div>
                <p className="label-text text-sulfur mb-1">COMMANDERS</p>
                <p>Choose a Commander with unique bonuses. The Forge harvests more. The Echo fights harder. The Bastion builds better. The Mirage sees further.</p>
              </div>
            </div>
          )}
        </motion.div>

        {/* Version + cookie settings */}
        <div className="mt-4 flex flex-col items-center gap-2 text-center sm:flex-row sm:justify-center sm:gap-4">
          <span className="label-text" style={{ color: 'rgba(156,122,77,0.5)' }}>v1.0.0-ALPHA · MONAD TESTNET</span>
          <button
            type="button"
            onClick={() => openCookiePreferences()}
            className="label-text touch-manipulation text-molten underline decoration-dotted underline-offset-2 hover:text-ember"
          >
            Cookie settings
          </button>
        </div>
      </div>
    </motion.div>
  )
}

export default function App() {
  const { supported, loading } = useWebGL()
  const { screen, setScreen, currentPlayer, endTurn, aiTakeTurn, player1, player2: p2, winTarget } = useGameStore()
  const { activeEvent, clearActiveEvent, tickEventCountdown, addInterference, spawnCrystal, spawnAnomaly } = useEnvironmentStore()

  // Apply event effects
  useEffect(() => {
    if (!activeEvent) return
    if (activeEvent.effect === 'hostile' && activeEvent.id === 'crystal_bloom') spawnCrystal()
    if (activeEvent.id === 'anomaly_surge') spawnAnomaly()
  }, [activeEvent])

  // Check win condition
  useEffect(() => {
    if (screen !== 'game') return
    if (player1.score >= winTarget || p2.score >= winTarget) {
      setScreen('victory')
    }
  }, [player1.score, p2.score, screen])

  // AI turn handler
  const handleTurnEnd = () => {
    if (currentPlayer === 2) {
      tickEventCountdown()
      setTimeout(() => {
        aiTakeTurn(40)
        addInterference(7)
        setTimeout(() => {
          endTurn()
        }, 1000)
      }, 600)
    }
  }

  if (loading) return null

  if (!supported) {
    return (
      <div className="webgl-fallback">
        <div className="font-display text-4xl text-molten">◈</div>
        <h2 className="font-display text-xl text-ash">WebGL Not Supported</h2>
        <p className="text-bronze text-sm max-w-sm">
          CHROMA COMMAND requires WebGL to render the 3D hex grid. Please enable hardware acceleration in your browser settings or try a different browser.
        </p>
      </div>
    )
  }

  return (
    <div className="relative h-full min-h-[100dvh] w-full overflow-hidden" style={{ background: 'var(--primary-bg)' }}>
      {/* Screen routing */}
      <AnimatePresence mode="wait">
        {screen === 'menu' && <MenuScreen key="menu" />}
        {screen === 'commander_select' && (
          <Suspense key="cmd" fallback={<ScreenFallback />}>
            <CommanderSelect />
          </Suspense>
        )}
        {screen === 'matchmaking' && (
          <Suspense key="queue" fallback={<ScreenFallback />}>
            <MatchmakingQueue />
          </Suspense>
        )}
        {screen === 'victory' && (
          <Suspense key="victory" fallback={<ScreenFallback />}>
            <VictoryScreen />
          </Suspense>
        )}
      </AnimatePresence>

      {/* 3D board + HUD load only when entering match */}
      {screen === 'game' && (
        <Suspense fallback={<ScreenFallback />}>
          <GameBoard />
          <PlayerHUD onTurnEnd={handleTurnEnd} />
          <EnvironmentPanel />
          <EventToast event={activeEvent} onDismiss={clearActiveEvent} />
        </Suspense>
      )}
    </div>
  )
}
