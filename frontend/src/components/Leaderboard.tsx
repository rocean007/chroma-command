import { motion } from 'framer-motion'
import { useGameStore } from '../store/gameStore'

const LB_DATA = [
  { rank: 1, name: 'VoidForger_X', wins: 247, losses: 38, winRate: 87, commander: 'THE FORGE', score: 98400 },
  { rank: 2, name: 'CrimsonEcho_7', wins: 218, losses: 51, winRate: 81, commander: 'THE ECHO', score: 87200 },
  { rank: 3, name: 'IronBastion99', wins: 194, losses: 72, winRate: 73, commander: 'THE BASTION', score: 77600 },
  { rank: 4, name: 'NullMirage', wins: 176, losses: 89, winRate: 66, commander: 'THE MIRAGE', score: 70400 },
  { rank: 5, name: 'EmberLord_Zero', wins: 162, losses: 94, winRate: 63, commander: 'THE FORGE', score: 64800 },
  { rank: 6, name: 'AshWarden', wins: 144, losses: 103, winRate: 58, commander: 'THE BASTION', score: 57600 },
  { rank: 7, name: 'MoltenPeak', wins: 138, losses: 112, winRate: 55, commander: 'THE ECHO', score: 55200 },
  { rank: 8, name: 'SulfurRift', wins: 121, losses: 119, winRate: 50, commander: 'THE MIRAGE', score: 48400 },
]

const RANK_COLORS: Record<number, string> = {
  1: '#FFB703', 2: '#C0C0C0', 3: '#CD7F32',
}

const RANK_ICONS: Record<number, string> = { 1: '◈', 2: '◉', 3: '⬡' }

export default function Leaderboard() {
  const { setScreen } = useGameStore()

  return (
    <motion.div
      className="fixed inset-0 z-50 flex flex-col items-center overflow-y-auto overscroll-y-contain py-6 sm:justify-center sm:py-8 [padding-bottom:max(1.5rem,env(safe-area-inset-bottom))] [padding-top:max(0.75rem,env(safe-area-inset-top))]"
      style={{ background: 'var(--primary-bg)' }}
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
    >
      <div className="relative z-10 my-auto w-full max-w-2xl px-4 py-6 sm:px-6 sm:py-8">
        <motion.div className="text-center mb-8"
          initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }}>
          <p className="label-text mb-2" style={{ color: 'var(--accent-active)' }}>SEASON 1</p>
          <h2 className="font-display text-2xl font-bold tracking-wider text-ember text-glow-ember sm:text-3xl sm:tracking-widest">
            RESONANCE RANKINGS
          </h2>
          <div className="flex items-center justify-center gap-3 mt-3">
            <div className="h-px flex-1 max-w-24" style={{ background: 'linear-gradient(to right, transparent, var(--accent-active))' }} />
            <span className="label-text">GLOBAL LEADERBOARD</span>
            <div className="h-px flex-1 max-w-24" style={{ background: 'linear-gradient(to left, transparent, var(--accent-active))' }} />
          </div>
        </motion.div>

        {/* Table */}
        <motion.div className="panel-glass mb-6 overflow-hidden rounded-sm"
          initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.15 }}>
          <div className="overflow-x-auto overscroll-x-contain [-webkit-overflow-scrolling:touch]">
          {/* Header */}
          <div className="grid min-w-[320px] gap-1.5 border-b px-3 py-2.5 sm:gap-2 sm:px-4 sm:py-3" style={{ borderColor: 'rgba(139,58,43,0.4)', gridTemplateColumns: '36px minmax(0,1fr) 2.75rem 3.25rem 4rem' }}>
            <span className="label-text">#</span>
            <span className="label-text">COMMANDER</span>
            <span className="label-text text-right">WIN%</span>
            <span className="label-text text-right">W/L</span>
            <span className="label-text text-right">SCORE</span>
          </div>

          {LB_DATA.map((row, i) => (
            <motion.div
              key={row.rank}
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.1 + i * 0.06 }}
              className="grid min-w-[320px] cursor-pointer items-center gap-1.5 border-b px-3 py-2.5 transition-all hover:bg-white hover:bg-opacity-5 sm:gap-2 sm:px-4 sm:py-3"
              style={{ borderColor: 'rgba(62,59,55,0.5)', gridTemplateColumns: '36px minmax(0,1fr) 2.75rem 3.25rem 4rem' }}
            >
              {/* Rank */}
              <div className="font-display font-bold text-base"
                style={{ color: RANK_COLORS[row.rank] ?? 'var(--neutral)' }}>
                {RANK_ICONS[row.rank] ?? row.rank}
              </div>

              {/* Name + Commander */}
              <div className="min-w-0">
                <p className="truncate font-display text-xs tracking-wider text-ash sm:text-sm" title={row.name}>{row.name}</p>
                <p className="label-text truncate" style={{ color: 'var(--neutral)' }} title={row.commander}>{row.commander}</p>
              </div>

              {/* Win Rate */}
              <div className="text-right">
                <p className="font-mono-cc text-sm"
                  style={{ color: row.winRate >= 70 ? 'var(--text-success)' : row.winRate >= 50 ? 'var(--accent-critical)' : 'var(--text-error)' }}>
                  {row.winRate}%
                </p>
              </div>

              {/* W/L */}
              <div className="text-right">
                <p className="font-mono-cc text-xs">
                  <span className="text-sulfur">{row.wins}</span>
                  <span className="text-bronze">/</span>
                  <span className="text-blood">{row.losses}</span>
                </p>
              </div>

              {/* Score */}
              <div className="text-right">
                <p className="font-mono-cc text-sm text-ember">{row.score.toLocaleString()}</p>
              </div>
            </motion.div>
          ))}
          </div>
        </motion.div>

        {/* Stats Row */}
        <motion.div className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-3"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }}>
          {[
            { label: 'ACTIVE PLAYERS', value: '1,247', color: 'var(--text-success)' },
            { label: 'MATCHES TODAY', value: '8,934', color: 'var(--accent-critical)' },
            { label: 'AVG MATCH TIME', value: '18:42', color: 'var(--accent-active)' },
          ].map(s => (
            <div key={s.label} className="stat-card text-center">
              <p className="label-text mb-1">{s.label}</p>
              <p className="font-mono-cc text-lg" style={{ color: s.color }}>{s.value}</p>
            </div>
          ))}
        </motion.div>

        <div className="flex justify-center">
          <button type="button" className="btn-secondary touch-manipulation" onClick={() => setScreen('menu')}>BACK TO MENU</button>
        </div>
      </div>
    </motion.div>
  )
}
