import { motion } from 'framer-motion'
import { useEnvironmentStore } from '../store/environmentStore'

export default function EnvironmentPanel() {
  const { interference, aggressionScore, nextEvent, eventCountdown, eventHistory } = useEnvironmentStore()

  const aggDots = Array.from({ length: 5 }, (_, i) => i < Math.floor(aggressionScore / 20))

  const getSeverityColor = (severity?: string) => {
    if (severity === 'high') return 'var(--enemy)'
    if (severity === 'medium') return 'var(--accent-critical)'
    return 'var(--text-success)'
  }

  const getEffectColor = (effect?: string) => {
    if (effect === 'hostile') return 'var(--enemy)'
    if (effect === 'beneficial') return 'var(--text-success)'
    return 'var(--neutral)'
  }

  return (
    <motion.div
      className="pointer-events-auto fixed z-[21] max-md:left-2 max-md:right-2 max-md:top-32 max-md:max-h-[min(38vh,280px)] max-md:w-auto max-md:overflow-y-auto max-md:overscroll-y-contain md:left-3 md:right-auto md:top-1/2 md:w-48 md:max-h-none md:-translate-y-1/2 md:overflow-visible"
      initial={{ x: -60, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ delay: 0.4 }}
    >
      <div className="panel-glass flex w-full flex-col gap-3 rounded-sm p-3 sm:gap-4 sm:p-4 md:w-48">
        {/* Header */}
        <div>
          <p className="label-text" style={{ color: 'var(--accent-active)' }}>CHROMA FIELD</p>
          <div className="h-px mt-1" style={{ background: 'linear-gradient(to right, var(--accent-active), transparent)' }} />
        </div>

        {/* Interference */}
        <div>
          <div className="flex justify-between mb-1">
            <span className="label-text">INTERFERENCE</span>
            <span className="font-mono-cc text-xs" style={{
              color: interference > 70 ? 'var(--enemy)' : interference > 40 ? 'var(--accent-critical)' : 'var(--text-success)'
            }}>{Math.round(interference)}%</span>
          </div>
          <div className="progress-bar-track" style={{ height: '6px' }}>
            <motion.div
              className="interference-fill"
              style={{ height: '100%', borderRadius: 0 }}
              animate={{ width: `${interference}%` }}
              transition={{ duration: 0.5 }}
            />
          </div>
          {interference > 70 && (
            <p className="text-xs mt-1 text-blood">⚠ Field destabilizing</p>
          )}
        </div>

        {/* Aggression */}
        <div>
          <p className="label-text mb-2">FIELD AGGRESSION</p>
          <div className="flex gap-1">
            {aggDots.map((active, i) => (
              <motion.div
                key={i}
                className="w-2 h-2 rounded-full"
                animate={{ background: active ? 'var(--enemy)' : 'rgba(62,59,55,0.8)' }}
                transition={{ duration: 0.3 }}
              />
            ))}
          </div>
          <p className="text-xs text-bronze mt-1">
            {aggressionScore < 30 ? 'Passive' : aggressionScore < 60 ? 'Reactive' : 'Hostile'}
          </p>
        </div>

        {/* Next Event */}
        {nextEvent && (
          <div>
            <p className="label-text mb-2">INCOMING EVENT</p>
            <div className="rounded-sm p-2 border" style={{
              borderColor: getSeverityColor(nextEvent.severity),
              background: `rgba(${nextEvent.effect === 'hostile' ? '186,24,27' : nextEvent.effect === 'beneficial' ? '106,153,78' : '156,122,77'},0.08)`,
            }}>
              <p className="font-display text-xs tracking-wider mb-1" style={{ color: getSeverityColor(nextEvent.severity) }}>
                {nextEvent.name}
              </p>
              <p className="label-text">IN {eventCountdown} TURN{eventCountdown !== 1 ? 'S' : ''}</p>
            </div>
          </div>
        )}

        {/* Event History */}
        {eventHistory.length > 0 && (
          <div>
            <p className="label-text mb-2">RECENT EVENTS</p>
            <div className="flex flex-col gap-1">
              {eventHistory.slice(0, 3).map((ev, i) => (
                <div key={i} className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: getEffectColor(ev.effect) }} />
                  <p className="text-xs text-bronze truncate">{ev.name}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </motion.div>
  )
}
