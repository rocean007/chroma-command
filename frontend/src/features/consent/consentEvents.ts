import type { ConsentListener, ConsentSnapshot } from './types'

const listeners = new Set<ConsentListener>()

export function subscribeConsent(listener: ConsentListener): () => void {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export function emitConsentChange(snapshot: ConsentSnapshot | null): void {
  listeners.forEach(fn => {
    try {
      fn(snapshot)
    } catch {
      /* non-fatal subscriber */
    }
  })

  try {
    window.dispatchEvent(
      new CustomEvent('chroma:consent', {
        detail: snapshot,
      })
    )
  } catch {
    /* SSR */
  }
}

/** Call from app code instead of polling the store. */
export function getConsentFromEventDetail(detail: unknown): ConsentSnapshot | null {
  if (detail && typeof detail === 'object' && 'version' in detail) {
    return detail as ConsentSnapshot
  }
  return null
}
