import { motion, AnimatePresence } from 'framer-motion'
import { useGameStore } from '../store/gameStore'
import { useTurnTimer } from '../hooks/useTurnTimer'
import { useEffect } from 'react'

interface PlayerHUDProps {
  onTurnEnd: () => void
}

export default function PlayerHUD({ onTurnEnd }: PlayerHUDProps) {
  const { player1, player2, currentPlayer, turn, winTarget, doAction, endTurn, maxActions } = useGameStore()
  const { timeLeft, urgent, pct, start, stop } = useTurnTimer(45, onTurnEnd)

  useEffect(() => {
    if (currentPlayer === 1) start()
    else stop()
  }, [currentPlayer, turn])

  const isMyTurn = currentPlayer === 1
  const actionsLeft = maxActions - player1.actionsThisTurn

  const handleAction = (type: 'harvest' | 'attack' | 'build') => {
    if (!isMyTurn || actionsLeft <= 0) return
    doAction(type)
  }

  const handleEndTurn = () => {
    stop()
    endTurn()
    onTurnEnd()
  }

  const scoreBar = (score: number, cls: string) => (
    <div className="progress-bar-track mt-1">
      <motion.div
        className={`progress-bar-fill ${cls}`}
        animate={{ width: `${Math.min((score / winTarget) * 100, 100)}%` }}
        transition={{ duration: 0.5 }}
      />
    </div>
  )

  return (
    <div className="fixed inset-0 pointer-events-none z-20">
      {/* Top Bar: stack on small viewports; row from md up */}
      <div
        className="absolute top-0 left-0 right-0 flex flex-col gap-2 p-2 sm:p-3 pt-[max(0.5rem,env(safe-area-inset-top))] md:flex-row md:items-start"
      >
        {/* P1 Stats */}
        <motion.div
          className="panel-glass rounded-sm p-2 sm:p-3 pointer-events-auto order-2 min-w-0 flex-1 md:order-1 md:max-w-[min(100%,14rem)] lg:max-w-none lg:min-w-[160px]"
          initial={{ x: -40, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: 0.2 }}
        >
          <div className="label-text mb-1 truncate" style={{ color: 'var(--accent-active)' }} title={player1.name}>
            {player1.name}
          </div>
          <div className="flex items-baseline gap-2">
            <span className="value-text text-xl">{player1.score}</span>
            <span className="label-text">/ {winTarget}</span>
          </div>
          {scoreBar(player1.score, 'resonance-fill-p1')}
          <div className="flex gap-3 mt-2">
            <div>
              <span className="label-text">CRYSTALS </span>
              <span className="text-xs font-bold text-amber-shard">{player1.crystals}</span>
            </div>
            <div>
              <span className="label-text">CONDUITS </span>
              <span className="text-gold text-xs font-bold">{player1.conduits}</span>
            </div>
          </div>
          {player1.commander && (
            <div className="mt-2 text-xs font-display tracking-wider" style={{ color: player1.commander.color }}>
              {player1.commander.icon} {player1.commander.name}
            </div>
          )}
        </motion.div>

        {/* Center Timer */}
        <motion.div
          className="order-1 flex w-full flex-col items-center panel-glass rounded-sm p-2 sm:p-3 pointer-events-auto md:order-2 md:flex-1 md:min-w-0"
          initial={{ y: -30, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.1 }}
        >
          <div
            className="label-text mb-1 max-w-full truncate px-1 text-center"
            style={{ color: isMyTurn ? 'var(--accent-active)' : 'var(--structure)' }}
            title={isMyTurn ? `${player1.name}'s turn` : `${player2.name} thinking`}
          >
            {isMyTurn ? `${player1.name}'s TURN` : `${player2.name} THINKING...`}
          </div>
          <AnimatePresence mode="wait">
            <motion.div
              key={timeLeft}
              className="font-display text-2xl font-bold sm:text-3xl"
              style={{ color: urgent ? 'var(--text-error)' : 'var(--accent-critical)', fontVariantNumeric: 'tabular-nums' }}
              animate={urgent ? { scale: [1, 1.05, 1] } : {}}
              transition={{ duration: 0.5 }}
            >
              {isMyTurn ? String(timeLeft).padStart(2, '0') : '—'}
            </motion.div>
          </AnimatePresence>
          <div className="progress-bar-track w-full mt-2" style={{ height: '2px' }}>
            <motion.div className="progress-bar-fill resonance-fill-p1 w-full"
              style={{ width: `${pct}%` }} transition={{ duration: 0.3 }} />
          </div>
          <div className="label-text mt-2">TURN {turn} &nbsp;·&nbsp; {actionsLeft} ACTIONS LEFT</div>
        </motion.div>

        {/* P2 Stats */}
        <motion.div
          className="panel-glass rounded-sm p-2 sm:p-3 pointer-events-auto order-3 min-w-0 flex-1 md:max-w-[min(100%,14rem)] lg:max-w-none lg:min-w-[160px]"
          initial={{ x: 40, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: 0.2 }}
        >
          <div className="label-text mb-1 truncate" style={{ color: 'var(--structure)' }} title={player2.name}>
            {player2.name}
          </div>
          <div className="flex items-baseline gap-2">
            <span className="value-text text-xl" style={{ color: 'var(--structure)' }}>{player2.score}</span>
            <span className="label-text">/ {winTarget}</span>
          </div>
          {scoreBar(player2.score, 'resonance-fill-p2')}
          <div className="flex gap-3 mt-2">
            <div>
              <span className="label-text">CRYSTALS </span>
              <span className="text-xs font-bold text-amber-shard">{player2.crystals}</span>
            </div>
            <div>
              <span className="label-text">CONDUITS </span>
              <span className="text-gold text-xs font-bold">{player2.conduits}</span>
            </div>
          </div>
          {player2.commander && (
            <div className="mt-2 text-xs font-display tracking-wider" style={{ color: player2.commander.color }}>
              {player2.commander.icon} {player2.commander.name}
            </div>
          )}
        </motion.div>
      </div>

      {/* Bottom Action Bar — scrolls horizontally on narrow screens */}
      <motion.div
        className="pointer-events-none absolute bottom-0 left-0 right-0 flex justify-center px-1 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-1 sm:px-3 sm:pb-[max(1rem,env(safe-area-inset-bottom))] sm:pt-2"
        initial={{ y: 40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.3 }}
      >
        <div className="panel-glass pointer-events-auto flex max-w-full flex-nowrap gap-1 overflow-x-auto overscroll-x-contain rounded-sm p-1.5 sm:gap-2 sm:p-2 md:flex-wrap md:justify-center md:overflow-visible [scrollbar-width:thin]">
          {[
            { type: 'harvest' as const, label: 'HARVEST CRYSTAL', icon: '◈', color: 'var(--resource)', pts: '+20 pts' },
            { type: 'attack' as const, label: 'NEUTRALIZE ANOMALY', icon: '◉', color: 'var(--enemy)', pts: '+50 pts' },
            { type: 'build' as const, label: 'BUILD CONDUIT', icon: '⬡', color: 'var(--structure)', pts: '+30 pts' },
          ].map(({ type, label, icon, color, pts }) => {
            const disabled = !isMyTurn || actionsLeft <= 0
            const actionTint =
              type === 'harvest' ? 'rgba(244, 140, 6, 0.14)'
                : type === 'attack' ? 'rgba(186, 24, 27, 0.14)'
                  : 'rgba(212, 175, 55, 0.14)'
            return (
              <motion.button
                key={type}
                whileHover={disabled ? {} : { scale: 1.03, y: -2 }}
                whileTap={disabled ? {} : { scale: 0.97 }}
                onClick={() => handleAction(type)}
                disabled={disabled}
                type="button"
                className="touch-manipulation flex min-h-[4.5rem] min-w-[4.75rem] shrink-0 flex-col items-center justify-center rounded-sm border px-2 py-2 text-center transition-all sm:min-h-[5rem] sm:min-w-0 sm:px-4"
                style={{
                  borderColor: disabled ? 'rgba(62,59,55,0.5)' : color,
                  background: disabled ? 'rgba(45,42,38,0.5)' : actionTint,
                  opacity: disabled ? 0.4 : 1,
                  cursor: disabled ? 'not-allowed' : 'pointer',
                }}
              >
                <span className="text-lg sm:text-xl mb-0.5 sm:mb-1" style={{ color: disabled ? 'var(--neutral)' : color }}>{icon}</span>
                <span
                  className="label-text max-w-[5.25rem] whitespace-normal leading-snug sm:max-w-none [font-size:8px] sm:text-[9px] sm:tracking-[0.15em]"
                  style={{ color: disabled ? 'var(--neutral)' : color }}
                >
                  {label}
                </span>
                <span className="text-[10px] text-sulfur mt-0.5 sm:mt-1 sm:text-xs">{pts}</span>
              </motion.button>
            )
          })}

          <div className="hidden w-px shrink-0 self-stretch bg-[rgba(139,58,43,0.4)] sm:mx-1 md:block" />

          <motion.button
            type="button"
            whileHover={{ scale: 1.03, y: -2 }}
            whileTap={{ scale: 0.97 }}
            onClick={handleEndTurn}
            disabled={!isMyTurn}
            className="touch-manipulation flex min-h-[4.5rem] min-w-[4.5rem] shrink-0 flex-col items-center justify-center rounded-sm border px-3 py-2 transition-all sm:min-h-[5rem] sm:min-w-0 sm:px-5"
            style={{
              borderColor: 'var(--accent-active)',
              background: 'rgba(232,93,4,0.12)',
              opacity: isMyTurn ? 1 : 0.4,
              cursor: isMyTurn ? 'pointer' : 'not-allowed',
            }}
          >
            <span className="text-xl mb-1 text-molten">→</span>
            <span className="label-text text-molten">END TURN</span>
            <span className="text-xs text-bronze mt-1">PASS</span>
          </motion.button>
        </div>
      </motion.div>
    </div>
  )
}
