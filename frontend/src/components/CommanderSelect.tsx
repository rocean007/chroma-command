import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useGameStore } from '../store/gameStore'
import { useEnvironmentStore } from '../store/environmentStore'

export interface Commander {
  id: 'forge' | 'echo' | 'bastion' | 'mirage'
  name: string
  title: string
  description: string
  ability: string
  abilityName: string
  icon: string
  harvestBonus: number
  combatBonus: number
  buildBonus: number
  color: string
}

export const COMMANDERS: Commander[] = [
  {
    id: 'forge',
    name: 'THE FORGE',
    title: 'Resource Sovereign',
    description: 'Masters of extraction who bend the material world to their will. Every harvest yields more than expected.',
    ability: 'Harvest grants +10 bonus points. Interference can be converted into raw crystals.',
    abilityName: 'SLAG CONVERSION',
    icon: '◈',
    harvestBonus: 10, combatBonus: 0, buildBonus: 0,
    color: '#F48C06',
  },
  {
    id: 'echo',
    name: 'THE ECHO',
    title: 'Anomaly Slayer',
    description: 'Combat specialists who feed on destruction. Each enemy neutralized amplifies their power.',
    ability: 'Anomaly defeat grants +20 bonus points. Can temporarily pacify hostile units for 1 turn.',
    abilityName: 'RESONANT KILL',
    icon: '◉',
    harvestBonus: 0, combatBonus: 20, buildBonus: 0,
    color: '#BA181B',
  },
  {
    id: 'bastion',
    name: 'THE BASTION',
    title: 'Fortress Architect',
    description: 'Defensive engineers who outlast every storm. Their structures endure where others crumble.',
    ability: 'Build actions are instant. Conduits resist Environmental Events and generate +5 passive income.',
    abilityName: 'IRON FOUNDATION',
    icon: '⬡',
    harvestBonus: 0, combatBonus: 0, buildBonus: 15,
    color: '#D4AF37',
  },
  {
    id: 'mirage',
    name: 'THE MIRAGE',
    title: 'Information Broker',
    description: 'Shadows who see the future. What the field hides from others, Mirage reads like an open book.',
    ability: 'Preview the next 2 Environmental Events. Plant decoy Crystal nodes to mislead opponents.',
    abilityName: 'BLIND ORACLE',
    icon: '◫',
    harvestBonus: 0, combatBonus: 0, buildBonus: 0,
    color: '#9C7A4D',
  },
]

export default function CommanderSelect() {
  const { commanderSelectStep, setCommander, setCommanderSelectStep, setScreen, player1, player2 } = useGameStore()
  const [selected, setSelected] = useState<Commander | null>(null)
  const [hovered, setHovered] = useState<Commander | null>(null)

  const isP1 = commanderSelectStep === 1
  const display = hovered || selected

  const handleConfirm = () => {
    if (!selected) return
    if (isP1) {
      setCommander(1, selected)
      setCommanderSelectStep(2)
      setSelected(null)
      setHovered(null)
    } else {
      setCommander(2, selected)
      useEnvironmentStore.getState().resetEnvironment()
      setScreen('game')
    }
  }

  const statBar = (label: string, value: number, color: string) => (
    <div className="mb-2">
      <div className="flex justify-between mb-1">
        <span className="label-text">{label}</span>
        <span className="label-text" style={{ color }}>{value}/100</span>
      </div>
      <div className="progress-bar-track">
        <motion.div
          className="progress-bar-fill"
          style={{ background: color }}
          initial={{ width: 0 }}
          animate={{ width: `${value}%` }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
        />
      </div>
    </div>
  )

  return (
    <motion.div
      className="fixed inset-0 z-50 flex flex-col items-center overflow-y-auto overscroll-y-contain py-6 sm:justify-center sm:py-8 [padding-bottom:max(1.5rem,env(safe-area-inset-bottom))] [padding-top:max(0.75rem,env(safe-area-inset-top))]"
      style={{ background: 'var(--primary-bg)' }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      {/* Background hex pattern */}
      <div className="absolute inset-0 opacity-5 pointer-events-none" style={{
        backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'56\' height=\'100\'%3E%3Cpath d=\'M28 66L0 50V16L28 0l28 16v34L28 66zm0 34L0 84V50l28 16 28-16v34L28 100z\' fill=\'none\' stroke=\'%23E85D04\' stroke-width=\'1\'/%3E%3C/svg%3E")',
      }} />

      <div className="relative z-10 mx-auto my-auto w-full max-w-5xl px-4 sm:px-6">
        {/* Header */}
        <motion.div className="mb-6 text-center sm:mb-8"
          initial={{ y: -30, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.1 }}>
          <p className="label-text mb-2 truncate px-1" style={{ color: 'var(--accent-active)' }} title={isP1 ? player1.name : 'AI'}>
            {isP1 ? `${player1.name} — PLAYER 1` : `AI OPPONENT — PLAYER 2`}
          </p>
          <h2 className="font-display text-xl font-bold tracking-wider text-ember text-glow-ember sm:text-3xl sm:tracking-widest">
            CHOOSE YOUR COMMANDER
          </h2>
          <div className="flex items-center justify-center gap-3 mt-3">
            <div className="h-px flex-1 max-w-32" style={{ background: 'linear-gradient(to right, transparent, var(--accent-active))' }} />
            <span className="label-text">STEP {isP1 ? '1' : '2'} OF 2</span>
            <div className="h-px flex-1 max-w-32" style={{ background: 'linear-gradient(to left, transparent, var(--accent-active))' }} />
          </div>
        </motion.div>

        <div className="flex flex-col gap-4 md:flex-row md:gap-6">
          {/* Commander Cards */}
          <div className="grid flex-1 grid-cols-2 gap-2 sm:gap-3">
            {COMMANDERS.map((cmd, i) => (
              <motion.div
                key={cmd.id}
                role="button"
                tabIndex={0}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 + i * 0.08 }}
                className="commander-card-hover relative min-h-[5.5rem] cursor-pointer touch-manipulation rounded-sm border p-3 sm:min-h-0 sm:p-4"
                onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setSelected(cmd) } }}
                style={{
                  background: selected?.id === cmd.id
                    ? `rgba(${parseInt(cmd.color.slice(1,3),16)},${parseInt(cmd.color.slice(3,5),16)},${parseInt(cmd.color.slice(5,7),16)},0.12)`
                    : 'rgba(62,59,55,0.5)',
                  borderColor: selected?.id === cmd.id ? cmd.color : 'rgba(139,58,43,0.3)',
                  boxShadow: selected?.id === cmd.id ? `0 0 20px ${cmd.color}33` : 'none',
                }}
                onClick={() => setSelected(cmd)}
                onMouseEnter={() => setHovered(cmd)}
                onMouseLeave={() => setHovered(null)}
              >
                {selected?.id === cmd.id && (
                  <div className="absolute top-2 right-2 w-2 h-2 rounded-full" style={{ background: cmd.color }} />
                )}
                <div className="font-display mb-1 text-xl sm:mb-2 sm:text-2xl" style={{ color: cmd.color }}>{cmd.icon}</div>
                <div className="font-display mb-1 text-[0.65rem] font-bold tracking-wider sm:text-sm sm:tracking-widest" style={{ color: cmd.color }}>{cmd.name}</div>
                <div className="label-text mb-2">{cmd.title}</div>
                <div className="text-xs text-bronze leading-relaxed hidden sm:block">{cmd.description}</div>
              </motion.div>
            ))}
          </div>

          {/* Detail Panel */}
          <motion.div
            className="w-64 panel-glass rounded-sm p-5 flex-shrink-0 hidden md:flex flex-col"
            animate={{ opacity: display ? 1 : 0.4 }}
          >
            <AnimatePresence mode="wait">
              {display ? (
                <motion.div key={display.id}
                  initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }}>
                  <div className="font-display text-4xl mb-3" style={{ color: display.color }}>{display.icon}</div>
                  <h3 className="font-display font-bold text-lg tracking-wider mb-1" style={{ color: display.color }}>{display.name}</h3>
                  <p className="label-text mb-4">{display.title}</p>
                  <p className="text-xs text-bronze leading-relaxed mb-5">{display.description}</p>

                  <div className="mb-4">
                    <p className="label-text mb-1" style={{ color: 'var(--accent-critical)' }}>SIGNATURE ABILITY</p>
                    <p className="font-display text-xs tracking-wider mb-2" style={{ color: display.color }}>{display.abilityName}</p>
                    <p className="text-xs text-bronze leading-relaxed">{display.ability}</p>
                  </div>

                  <div className="border-t pt-4" style={{ borderColor: 'rgba(139,58,43,0.3)' }}>
                    <p className="label-text mb-3">COMBAT PROFILE</p>
                    {statBar('HARVEST', 40 + display.harvestBonus, 'var(--resource)')}
                    {statBar('COMBAT', 40 + display.combatBonus, 'var(--enemy)')}
                    {statBar('CONSTRUCT', 40 + display.buildBonus, 'var(--structure)')}
                  </div>
                </motion.div>
              ) : (
                <motion.div key="empty" className="flex flex-col items-center justify-center h-full gap-3 text-center"
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                  <div className="text-4xl text-bronze opacity-30">◈</div>
                  <p className="label-text">Hover a Commander to inspect</p>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </div>

        {/* Mobile: selected commander summary (detail panel is md+) */}
        {display && (
          <div className="panel-glass mt-4 rounded-sm p-3 md:hidden">
            <p className="font-display text-sm font-bold tracking-wider" style={{ color: display.color }}>
              {display.icon} {display.name}
            </p>
            <p className="label-text mt-1">{display.title}</p>
            <p className="mt-2 text-xs leading-relaxed text-bronze">{display.description}</p>
          </div>
        )}

        {/* Confirm Button */}
        <motion.div className="mt-6 flex flex-col-reverse flex-wrap justify-center gap-3 sm:mt-8 sm:flex-row sm:gap-4"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}>
          <button type="button" className="btn-secondary touch-manipulation" onClick={() => setScreen('menu')}>BACK</button>
          <button type="button" className="btn-primary touch-manipulation" onClick={handleConfirm} disabled={!selected}
            style={{ opacity: selected ? 1 : 0.4, cursor: selected ? 'pointer' : 'not-allowed' }}>
            {isP1 ? 'CONFIRM & CONTINUE' : 'DEPLOY TO FIELD'}
          </button>
        </motion.div>
      </div>
    </motion.div>
  )
}
