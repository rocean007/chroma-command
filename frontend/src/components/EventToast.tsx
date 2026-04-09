import { useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { EnvironmentEvent } from '../utils/environmentAI'

interface EventToastProps {
  event: EnvironmentEvent | null
  onDismiss: () => void
}

const EFFECT_COLORS = {
  hostile: { border: '#BA181B', bg: 'rgba(186,24,27,0.12)', text: '#BA181B', icon: '⚠' },
  beneficial: { border: '#6A994E', bg: 'rgba(106,153,78,0.12)', text: '#6A994E', icon: '✦' },
  neutral: { border: '#9C7A4D', bg: 'rgba(156,122,77,0.12)', text: '#9C7A4D', icon: '◈' },
}

export default function EventToast({ event, onDismiss }: EventToastProps) {
  useEffect(() => {
    if (!event) return
    const t = setTimeout(onDismiss, 3500)
    return () => clearTimeout(t)
  }, [event, onDismiss])

  const colors = event ? EFFECT_COLORS[event.effect] : EFFECT_COLORS.neutral

  return (
    <AnimatePresence>
      {event && (
        <motion.div
          className="pointer-events-none fixed left-1/2 top-1/2 z-[60] w-[calc(100vw-1.25rem)] max-w-md -translate-x-1/2 -translate-y-1/2 px-2 sm:w-auto sm:max-w-lg sm:px-3"
          initial={{ opacity: 0, scale: 0.8, y: -20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 10 }}
          transition={{ type: 'spring', stiffness: 300, damping: 20 }}
        >
          <div
            className="rounded-sm border-2 px-4 py-4 text-center sm:px-8 sm:py-6"
            style={{
              background: colors.bg,
              borderColor: colors.border,
              backdropFilter: 'blur(20px)',
              WebkitBackdropFilter: 'blur(20px)',
              boxShadow: `0 0 40px ${colors.border}44, 0 8px 32px rgba(0,0,0,0.6)`,
            }}
          >
            <div className="font-display mb-2 text-2xl sm:text-3xl" style={{ color: colors.text }}>
              {colors.icon}
            </div>
            <p className="label-text mb-1" style={{ color: colors.text }}>ENVIRONMENTAL EVENT</p>
            <h3 className="font-display mb-3 text-base font-bold tracking-wider sm:text-xl sm:tracking-widest break-words" style={{ color: colors.text }}>
              {event.name}
            </h3>
            <p className="mb-3 text-xs leading-relaxed sm:text-sm" style={{ color: 'rgba(245,242,235,0.88)' }}>{event.description}</p>
            <div className="flex justify-center gap-4">
              {event.pointsEffect !== 0 && (
                <span className="label-text" style={{ color: event.pointsEffect > 0 ? 'var(--text-success)' : 'var(--text-error)' }}>
                  {event.pointsEffect > 0 ? '+' : ''}{event.pointsEffect} pts
                </span>
              )}
              {event.interferenceEffect !== 0 && (
                <span className="label-text" style={{ color: event.interferenceEffect > 0 ? 'var(--text-error)' : 'var(--text-success)' }}>
                  Interference {event.interferenceEffect > 0 ? '+' : ''}{event.interferenceEffect}%
                </span>
              )}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
