import { useConsentStore } from './consentStore'
import type { ConsentCategory } from './types'

export function useConsent() {
  const snapshot = useConsentStore(s => s.snapshot)
  const hydrated = useConsentStore(s => s.hydrated)
  return {
    hydrated,
    snapshot,
    choices: snapshot?.choices ?? null,
    hasConsent: !!snapshot,
    isAllowed: (cat: ConsentCategory) => {
      if (cat === 'necessary') return true
      if (!snapshot) return false
      return !!snapshot.choices[cat]
    },
  }
}
