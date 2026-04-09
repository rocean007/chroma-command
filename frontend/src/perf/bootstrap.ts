/** Idle-time perf hooks: Core Web Vitals + SW registration — keeps first paint path clean. */
export function bootstrapPostPaint(): void {
  const run = () => {
    void import('./webVitals').then((m) => m.initWebVitals())
  }
  if ('requestIdleCallback' in window) {
    requestIdleCallback(run, { timeout: 4000 })
  } else {
    setTimeout(run, 1)
  }

  if (!import.meta.env.PROD || !('serviceWorker' in navigator)) return

  const registerSw = () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {})
  }
  if ('requestIdleCallback' in window) {
    requestIdleCallback(registerSw, { timeout: 8000 })
  } else {
    setTimeout(registerSw, 2000)
  }
}
