import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { useGameStore } from '../store/gameStore'

const FAKE_PLAYERS = [
  'VoidForger_X', 'CrimsonEcho', 'IronBastion99', 'NullMirage', 'EmberLord',
  'AshWarden', 'MoltenPeak', 'SulfurRift', 'ChromaDaemon', 'ForgedGhost',
]

export default function MatchmakingQueue() {
  const { setScreen, player1 } = useGameStore()
  const [queueTime, setQueueTime] = useState(0)
  const [playersOnline, setPlayersOnline] = useState(Math.floor(Math.random() * 200) + 80)
  const [inQueue, setInQueue] = useState(Math.floor(Math.random() * 12) + 3)
  const [found, setFound] = useState(false)
  const [opponent, setOpponent] = useState('')
  const [dots, setDots] = useState('')

  useEffect(() => {
    const timer = setInterval(() => {
      setQueueTime(p => p + 1)
      setDots(p => p.length >= 3 ? '' : p + '.')
    }, 1000)

    const matchTimer = setTimeout(() => {
      const opp = FAKE_PLAYERS[Math.floor(Math.random() * FAKE_PLAYERS.length)]
      setOpponent(opp)
      setFound(true)
      setTimeout(() => setScreen('game'), 2500)
    }, 4000 + Math.random() * 3000)

    const onlineInterval = setInterval(() => {
      setPlayersOnline(p => p + Math.floor(Math.random() * 5) - 2)
      setInQueue(p => Math.max(1, p + Math.floor(Math.random() * 3) - 1))
    }, 2000)

    return () => { clearInterval(timer); clearTimeout(matchTimer); clearInterval(onlineInterval) }
  }, [])

  const fmt = (s: number) => `${String(Math.floor(s / 60)).padStart(2,'0')}:${String(s % 60).padStart(2,'0')}`

  return (
    <motion.div
      className="fixed inset-0 z-50 flex flex-col items-center overflow-y-auto overscroll-y-contain py-8 sm:justify-center [padding-bottom:max(1.5rem,env(safe-area-inset-bottom))] [padding-top:max(1rem,env(safe-area-inset-top))]"
      style={{ background: 'var(--primary-bg)' }}
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
    >
      {/* bg hex pattern */}
      <div className="absolute inset-0 opacity-5 pointer-events-none" style={{
        backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'56\' height=\'100\'%3E%3Cpath d=\'M28 66L0 50V16L28 0l28 16v34L28 66zm0 34L0 84V50l28 16 28-16v34L28 100z\' fill=\'none\' stroke=\'%23E85D04\' stroke-width=\'1\'/%3E%3C/svg%3E")',
      }} />

      <div className="relative z-10 my-auto w-full max-w-md px-4 text-center sm:px-6">
        <motion.div initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }}>
          <p className="label-text mb-2" style={{ color: 'var(--accent-active)' }}>CHROMA COMMAND</p>
          <h2 className="font-display mb-8 text-2xl font-bold tracking-wider text-ember text-glow-ember sm:text-3xl sm:tracking-widest">
            {found ? 'MATCH FOUND' : 'SEARCHING FIELD'}
          </h2>
        </motion.div>

        {!found ? (
          <>
            {/* Spinning hex */}
            <motion.div className="relative mx-auto mb-8 w-32 h-32 flex items-center justify-center">
              <motion.div
                className="absolute inset-0 border-2 rounded-sm"
                style={{ borderColor: 'var(--accent-active)', clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)' }}
                animate={{ rotate: 360 }}
                transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
              />
              <motion.div
                className="absolute inset-4 border rounded-sm"
                style={{ borderColor: 'var(--accent-critical)', clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)' }}
                animate={{ rotate: -360 }}
                transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
              />
              <span className="font-display text-2xl text-molten">◈</span>
            </motion.div>

            <div className="mb-2 truncate px-1 font-display text-lg text-ash sm:text-xl" title={player1.name}>
              {player1.name}<span className="text-molten">{dots}</span>
            </div>

            <div className="panel-glass mb-6 rounded-sm p-3 sm:p-4">
              <div className="mb-3 grid grid-cols-3 gap-2">
                <div>
                  <p className="label-text">QUEUE TIME</p>
                  <p className="font-mono-cc text-lg text-ember sm:text-xl">{fmt(queueTime)}</p>
                </div>
                <div>
                  <p className="label-text">IN QUEUE</p>
                  <p className="font-mono-cc text-lg text-amber-shard sm:text-xl">{inQueue}</p>
                </div>
                <div>
                  <p className="label-text">ONLINE</p>
                  <p className="font-mono-cc text-lg text-sulfur sm:text-xl">{playersOnline}</p>
                </div>
              </div>
              <div className="progress-bar-track">
                <motion.div
                  className="progress-bar-fill resonance-fill-p1"
                  animate={{ width: ['0%', '100%'] }}
                  transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
                />
              </div>
            </div>

            <button type="button" className="btn-secondary touch-manipulation" onClick={() => setScreen('menu')}>CANCEL SEARCH</button>
          </>
        ) : (
          <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 200 }}>
            <div className="panel-glass mb-6 rounded-sm p-5 glow-molten sm:p-8">
              <div className="flex flex-col items-center justify-center gap-4 sm:flex-row sm:gap-6">
                <div className="min-w-0 text-center">
                  <p className="truncate font-display text-base tracking-wider text-molten sm:text-lg sm:tracking-widest" title={player1.name}>{player1.name}</p>
                  <p className="label-text mt-1 truncate">{player1.commander?.name ?? 'COMMANDER'}</p>
                </div>
                <div className="font-display text-2xl font-bold text-ember sm:text-3xl">VS</div>
                <div className="min-w-0 text-center">
                  <p className="truncate font-display text-base tracking-wider text-gold sm:text-lg sm:tracking-widest" title={opponent}>{opponent}</p>
                  <p className="label-text mt-1">UNKNOWN</p>
                </div>
              </div>
            </div>
            <p className="label-text text-sulfur">Entering the Chroma Field...</p>
          </motion.div>
        )}
      </div>
    </motion.div>
  )
}
