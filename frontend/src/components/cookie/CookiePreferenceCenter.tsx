import { useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { CATEGORY_META } from '@/features/consent/constants'
import { useConsentStore } from '@/features/consent/consentStore'

export default function CookiePreferenceCenter() {
  const open = useConsentStore(s => s.preferencesOpen)
  const draft = useConsentStore(s => s.draft)
  const updateDraft = useConsentStore(s => s.updateDraft)
  const saveDraft = useConsentStore(s => s.saveDraft)
  const close = useConsentStore(s => s.closePreferences)
  const withdraw = useConsentStore(s => s.withdraw)
  const panelRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const el = panelRef.current?.querySelector<HTMLElement>('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])')
    el?.focus()
  }, [open])

  useEffect(() => {
    if (!open) return
        const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, close])

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[10000] flex items-end justify-center p-3 sm:items-center sm:p-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          aria-hidden={!open}
        >
          <button
            type="button"
            className="absolute inset-0 cursor-default bg-black/70"
            aria-label="Close preference center backdrop"
            onClick={close}
          />
          <motion.div
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="cookie-pref-title"
            className="panel-glass-bright scrollbar-thin relative z-[10001] max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-sm p-5 shadow-2xl sm:p-6"
            initial={{ y: 24, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 16, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 320, damping: 28 }}
          >
            <h2 id="cookie-pref-title" className="font-display text-lg font-bold tracking-widest text-ember sm:text-xl">
              Cookie preferences
            </h2>
            <p className="mt-2 text-xs leading-relaxed text-bronze sm:text-sm">
              Control how we use storage and similar technologies. You can change this anytime. See your privacy policy for legal bases and retention.
            </p>

            <div className="mt-5 space-y-4 border-t border-[rgba(139,58,43,0.35)] pt-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-display text-xs font-bold uppercase tracking-widest text-molten">Strictly necessary</p>
                  <p className="mt-1 text-xs text-bronze">
                    Required for security, consent storage, and core functionality. Always active.
                  </p>
                </div>
                <span className="label-text shrink-0 text-sulfur">On</span>
              </div>

              {(Object.keys(CATEGORY_META) as Array<keyof typeof CATEGORY_META>).map(key => {
                const m = CATEGORY_META[key]
                const on = draft[m.id]
                return (
                  <div key={m.id} className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-display text-xs font-bold uppercase tracking-widest text-ash">{m.label}</p>
                      <p className="mt-1 text-xs text-bronze">{m.description}</p>
                    </div>
                    <button
                      type="button"
                      role="switch"
                      aria-checked={on}
                      aria-label={`Toggle ${m.label}`}
                      onClick={() => updateDraft({ [m.id]: !on })}
                      className="relative h-7 w-12 shrink-0 rounded-full border transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--accent-active)]"
                      style={{
                        background: on ? 'rgba(232,93,4,0.35)' : 'rgba(62,59,55,0.9)',
                        borderColor: on ? 'var(--accent-active)' : 'rgba(139,58,43,0.5)',
                      }}
                    >
                      <span
                        className="absolute top-0.5 h-6 w-6 rounded-full transition-transform"
                        style={{
                          left: on ? 'calc(100% - 1.5rem - 2px)' : '2px',
                          background: on ? 'var(--accent-critical)' : 'var(--neutral)',
                        }}
                      />
                    </button>
                  </div>
                )
              })}
            </div>

            <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:justify-end">
              <button type="button" className="btn-secondary order-3 sm:order-1" onClick={() => withdraw()}>
                Withdraw consent
              </button>
              <button type="button" className="btn-secondary order-2 sm:order-2" onClick={close}>
                Cancel
              </button>
              <button type="button" className="btn-primary order-1 sm:order-3" onClick={() => saveDraft()}>
                Save preferences
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
