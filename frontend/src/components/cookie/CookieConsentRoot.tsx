import { useEffect } from 'react'
import { useConsentStore } from '@/features/consent/consentStore'
import CookieBanner from './CookieBanner'
import CookiePreferenceCenter from './CookiePreferenceCenter'
import AnalyticsBridge from './AnalyticsBridge'

export default function CookieConsentRoot() {
  const hydrate = useConsentStore(s => s.hydrate)

  useEffect(() => {
    hydrate()
  }, [hydrate])

  return (
    <>
      <CookieBanner />
      <CookiePreferenceCenter />
      <AnalyticsBridge />
    </>
  )
}
