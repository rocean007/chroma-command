import { motion } from 'framer-motion'
import { useConsentStore } from '@/features/consent/consentStore'

export default function CookieBanner() {
  const visible = useConsentStore(s => s.bannerVisible)
  const hydrated = useConsentStore(s => s.hydrated)
  const acceptAll = useConsentStore(s => s.acceptAll)
  const rejectNonEssential = useConsentStore(s => s.rejectNonEssential)
  const openPreferences = useConsentStore(s => s.openPreferences)

  if (!hydrated || !visible) return null

  return (
    <motion.div
      role="region"
      aria-label="Cookie consent"
      className="pointer-events-auto fixed bottom-0 left-0 right-0 z-[9998] p-3 sm:p-4 [padding-bottom:max(0.75rem,env(safe-area-inset-bottom))]"
      initial={{ y: 48, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 280, damping: 28 }}
    >
      <div className="panel-glass mx-auto flex max-w-3xl flex-col gap-3 rounded-sm border border-[rgba(232,93,4,0.25)] p-4 shadow-[0_-8px_40px_rgba(0,0,0,0.45)] sm:flex-row sm:items-center sm:gap-4">
        <div className="min-w-0 flex-1">
          <p className="font-display text-xs font-bold uppercase tracking-widest text-molten">Cookies & privacy</p>
          <p className="mt-1 text-xs leading-relaxed text-bronze sm:text-sm">
            We use strictly necessary storage for consent and core features. With your permission we also use optional categories for experience,
            analytics, and marketing. You can customise or withdraw anytime.
          </p>
          <button
            type="button"
            onClick={openPreferences}
            className="mt-2 text-left font-display text-xs tracking-wider text-ember underline decoration-dotted underline-offset-2 hover:text-molten"
          >
            Preference centre
          </button>
        </div>
        <div className="flex flex-shrink-0 flex-col gap-2 sm:flex-col sm:gap-2 md:flex-row">
          <button type="button" className="btn-secondary py-2 text-[0.65rem] sm:text-xs" onClick={rejectNonEssential}>
            Reject non-essential
          </button>
          <button type="button" className="btn-primary py-2 text-[0.65rem] sm:text-xs" onClick={acceptAll}>
            Accept all
          </button>
        </div>
      </div>
    </motion.div>
  )
}
