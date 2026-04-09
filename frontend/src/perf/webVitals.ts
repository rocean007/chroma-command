import { onCLS, onINP, onLCP } from 'web-vitals'

function send(metric: { name: string; value: number; id: string; rating?: string }) {
  if (import.meta.env.DEV) {
    console.debug('[perf]', metric.name, Math.round(metric.value * 1000) / 1000)
    return
  }
  const endpoint = import.meta.env.VITE_PERF_ENDPOINT as string | undefined
  const payload = JSON.stringify({
    name: metric.name,
    value: metric.value,
    id: metric.id,
    rating: metric.rating,
    path: typeof location !== 'undefined' ? location.pathname : '',
  })
  if (endpoint) {
    try {
      if (navigator.sendBeacon?.(endpoint, payload)) return
    } catch {
      /* fall through */
    }
    void fetch(endpoint, { method: 'POST', body: payload, keepalive: true }).catch(() => {})
  }
}

export function initWebVitals(): void {
  onLCP(send)
  onINP(send)
  onCLS(send)
}
