import { motion } from 'framer-motion'
import { useGameStore } from '../store/gameStore'
import { useEnvironmentStore } from '../store/environmentStore'

export default function VictoryScreen() {
  const { player1, player2, turn, resetGame, winTarget } = useGameStore()
  const { eventHistory, interference } = useEnvironmentStore()

  const winner = player1.score >= winTarget ? player1 : player2
  const loser = winner.id === 1 ? player2 : player1
  const isP1Win = winner.id === 1

  return (
    <motion.div
      className="fixed inset-0 z-50 flex flex-col items-center overflow-y-auto overscroll-y-contain px-3 py-8 sm:justify-center sm:px-6 [padding-bottom:max(2rem,env(safe-area-inset-bottom))] [padding-top:max(1rem,env(safe-area-inset-top))]"
      style={{ background: 'rgba(45,42,38,0.97)' }}
      initial={{ opacity: 0 }} animate={{ opacity: 1 }}
    >
      {/* Animated bg rings */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {[1,2,3].map(i => (
          <motion.div key={i} className="absolute rounded-full border"
            style={{
              width: i * 300, height: i * 300,
              left: '50%', top: '50%',
              transform: 'translate(-50%, -50%)',
              borderColor: isP1Win ? `rgba(232,93,4,${0.15/i})` : `rgba(212,175,55,${0.15/i})`,
            }}
            animate={{ scale: [1, 1.05, 1], opacity: [0.3, 0.6, 0.3] }}
            transition={{ duration: 2 + i, repeat: Infinity, delay: i * 0.3 }}
          />
        ))}
      </div>

      <div className="relative z-10 my-auto w-full max-w-2xl text-center">
        {/* Victory header */}
        <motion.div initial={{ y: -40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ type: 'spring', stiffness: 200 }}>
          <p className="label-text mb-2" style={{ color: 'var(--accent-active)' }}>RESONANCE TARGET ACHIEVED</p>
          <h1 className="font-display mb-2 break-words text-3xl font-black tracking-wider text-glow-ember sm:text-5xl sm:tracking-widest"
            style={{ color: isP1Win ? 'var(--accent-critical)' : 'var(--structure)' }}>
            {winner.name}
          </h1>
          <p className="font-display mb-1 text-base tracking-widest text-ash sm:text-xl">CONQUERS THE CHROMA FIELD</p>
          {winner.commander && (
            <p className="label-text" style={{ color: winner.commander.color }}>
              {winner.commander.icon} {winner.commander.name} · {winner.commander.title}
            </p>
          )}
        </motion.div>

        <div className="mb-6 mt-8 flex flex-col items-stretch gap-4 md:flex-row md:items-stretch">
          {/* Winner card */}
          <motion.div className="panel-glass flex-1 rounded-sm p-4 sm:p-5"
            style={{ borderColor: isP1Win ? 'var(--accent-active)' : 'var(--structure)', boxShadow: isP1Win ? '0 0 24px rgba(232,93,4,0.3)' : '0 0 24px rgba(212,175,55,0.3)' }}
            initial={{ x: -30, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: 0.2 }}>
            <p className="label-text text-sulfur mb-3">VICTOR</p>
            <p className="font-display text-lg font-bold tracking-wider mb-4"
              style={{ color: isP1Win ? 'var(--accent-critical)' : 'var(--structure)' }}>
              {winner.name}
            </p>
            <div className="flex flex-col gap-2">
              {[
                { l: 'RESONANCE', v: winner.score },
                { l: 'CRYSTALS', v: winner.crystals },
                { l: 'CONDUITS', v: winner.conduits },
              ].map(({ l, v }) => (
                <div key={l} className="flex justify-between">
                  <span className="label-text">{l}</span>
                  <span className="font-mono-cc text-sm text-ember">{v}</span>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Center VS */}
          <div className="flex flex-row items-center justify-center gap-4 px-2 py-1 md:flex-col md:gap-3 md:py-0">
            <div className="font-display text-2xl font-bold text-bronze">VS</div>
            <div className="font-mono-cc text-xs text-bronze">TURN {turn}</div>
            <div className="font-mono-cc text-xs" style={{ color: interference > 60 ? 'var(--text-error)' : 'var(--neutral)' }}>
              {Math.round(interference)}% INT
            </div>
          </div>

          {/* Loser card */}
          <motion.div className="panel-glass flex-1 rounded-sm p-4 opacity-70 sm:p-5"
            initial={{ x: 30, opacity: 0 }} animate={{ x: 0, opacity: 0.7 }} transition={{ delay: 0.2 }}>
            <p className="label-text text-blood mb-3">DEFEATED</p>
            <p className="font-display text-lg font-bold tracking-wider text-bronze mb-4">{loser.name}</p>
            <div className="flex flex-col gap-2">
              {[
                { l: 'RESONANCE', v: loser.score },
                { l: 'CRYSTALS', v: loser.crystals },
                { l: 'CONDUITS', v: loser.conduits },
              ].map(({ l, v }) => (
                <div key={l} className="flex justify-between">
                  <span className="label-text">{l}</span>
                  <span className="font-mono-cc text-sm text-bronze">{v}</span>
                </div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* Event history */}
        {eventHistory.length > 0 && (
          <motion.div className="panel-glass rounded-sm p-4 mb-6 text-left"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}>
            <p className="label-text mb-3" style={{ color: 'var(--accent-active)' }}>FIELD EVENTS THIS MATCH</p>
            <div className="flex flex-wrap gap-2">
              {eventHistory.map((ev, i) => (
                <span key={i} className="text-xs px-2 py-1 rounded-sm border font-mono-cc"
                  style={{
                    borderColor: ev.effect === 'hostile' ? 'var(--enemy)' : ev.effect === 'beneficial' ? 'var(--text-success)' : 'var(--neutral)',
                    color: ev.effect === 'hostile' ? 'var(--enemy)' : ev.effect === 'beneficial' ? 'var(--text-success)' : 'var(--neutral)',
                    background: 'rgba(45,42,38,0.5)',
                  }}>
                  {ev.name}
                </span>
              ))}
            </div>
          </motion.div>
        )}

        <motion.div className="flex flex-col items-stretch justify-center gap-3 sm:flex-row sm:items-center sm:gap-4"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}>
          <button type="button" className="btn-primary touch-manipulation sm:min-w-[12rem]" onClick={resetGame}>PLAY AGAIN</button>
          <button type="button" className="btn-secondary touch-manipulation sm:min-w-[12rem]" onClick={resetGame}>MAIN MENU</button>
        </motion.div>
      </div>
    </motion.div>
  )
}
