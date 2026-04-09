type PerfMetric = {
  name: 'LCP' | 'CLS'
  value: number
  id: string
  rating?: string
}

function send(metric: PerfMetric) {
  if (import.meta.env.DEV) {
    console.debug('[perf]', metric.name, metric.value)
    return
  }

  const endpoint = import.meta.env.VITE_PERF_ENDPOINT as string | undefined
  if (!endpoint) return

  const payload = JSON.stringify({
    name: metric.name,
    value: metric.value,
    id: metric.id,
    rating: metric.rating,
    path: typeof location !== 'undefined' ? location.pathname : '',
  })

  try {
    if (navigator.sendBeacon?.(endpoint, payload)) return
  } catch {
    /* ignore */
  }
  void fetch(endpoint, { method: 'POST', body: payload, keepalive: true }).catch(() => {})
}

function ratingForLcp(ms: number): string {
  if (ms <= 2500) return 'good'
  if (ms <= 4000) return 'needs-improvement'
  return 'poor'
}

function ratingForCls(value: number): string {
  if (value <= 0.1) return 'good'
  if (value <= 0.25) return 'needs-improvement'
  return 'poor'
}

export function initWebVitals(): void {
  if (typeof PerformanceObserver === 'undefined') return

  // LCP
  try {
    const lcpObserver = new PerformanceObserver((list) => {
      const entries = list.getEntries()
      const last = entries[entries.length - 1] as any
      if (!last) return
      const value = Number(last.startTime || 0)
      send({ name: 'LCP', value, id: `lcp-${last.id || last.element?.tagName || 'unknown'}`, rating: ratingForLcp(value) })
    })
    // buffered: true catches the entry even if observer starts late (after paint)
    lcpObserver.observe({ type: 'largest-contentful-paint', buffered: true as any })
  } catch {
    /* ignore */
  }

  // CLS
  try {
    let cls = 0
    const clsObserver = new PerformanceObserver((list) => {
      for (const entry of list.getEntries() as any[]) {
        if (!entry || entry.hadRecentInput) continue
        cls += Number(entry.value || 0)
      }
      send({ name: 'CLS', value: cls, id: 'cls', rating: ratingForCls(cls) })
    })
    clsObserver.observe({ type: 'layout-shift', buffered: true as any })
  } catch {
    /* ignore */
  }
}
