import { useEffect, useRef } from 'react'
import { useConsentStore } from '@/features/consent/consentStore'

function isDoNotTrack(): boolean {
  if (typeof navigator === 'undefined') return false
  const dnt = navigator.doNotTrack
  const ms = (navigator as unknown as { msDoNotTrack?: string }).msDoNotTrack
  return dnt === '1' || dnt === 'yes' || ms === '1'
}

/**
 * Loads GA4 only when analytics consent is granted and DNT is not enabled.
 * Set VITE_GA_MEASUREMENT_ID in env. CSP must allow https://www.googletagmanager.com and https://www.google-analytics.com.
 */
export default function AnalyticsBridge() {
  const analytics = useConsentStore(s => s.snapshot?.choices.analytics)
  const hydrated = useConsentStore(s => s.hydrated)
  const injected = useRef(false)

  useEffect(() => {
    if (!hydrated || !analytics || isDoNotTrack()) {
      if (typeof document !== 'undefined') {
        document.querySelectorAll('script[data-chroma-ga="1"]').forEach(el => el.remove())
      }
      injected.current = false
      if (typeof window !== 'undefined' && window.gtag) {
        try {
          window.gtag('consent', 'update', { analytics_storage: 'denied', ad_storage: 'denied' })
        } catch {
          /* ignore */
        }
      }
      return
    }

    const id = import.meta.env.VITE_GA_MEASUREMENT_ID
    if (!id || injected.current) return
    injected.current = true

    const s = document.createElement('script')
    s.async = true
    s.dataset.chromaGa = '1'
    s.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(id)}`
    document.head.appendChild(s)

    window.dataLayer = window.dataLayer || []
    function gtag(...args: unknown[]) {
      window.dataLayer.push(args)
    }
    window.gtag = gtag
    gtag('js', new Date())
    gtag('config', id, { anonymize_ip: true, send_page_view: true })
  }, [hydrated, analytics])

  return null
}

declare global {
  interface Window {
    dataLayer: unknown[]
    gtag?: (...args: unknown[]) => void
  }
}
