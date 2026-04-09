/**
 * Consent-gated wrappers — only `necessary` keys should bypass checks.
 * Use prefixes from STORAGE_PREFIX so categories map cleanly.
 */

import { STORAGE_PREFIX } from './constants'
import type { ConsentCategory } from './types'

type Backend = Pick<Storage, 'getItem' | 'setItem' | 'removeItem' | 'length' | 'key'>

let getConsentChoices: (() => {
  functional: boolean
  analytics: boolean
  targeting: boolean
}) | null = null

export function registerConsentGetter(
  fn: () => { functional: boolean; analytics: boolean; targeting: boolean }
): void {
  getConsentChoices = fn
}

function allowedForPrefix(prefix: string): boolean {
  const g = getConsentChoices?.()
  if (!g) return false
  if (prefix === STORAGE_PREFIX.functional) return g.functional
  if (prefix === STORAGE_PREFIX.analytics) return g.analytics
  if (prefix === STORAGE_PREFIX.targeting) return g.targeting
  return false
}

function createScopedStorage(backend: Backend, requiredPrefix: string): Storage {
  return {
    get length() {
      let n = 0
      for (let i = 0; i < backend.length; i++) {
        const k = backend.key(i)
        if (k?.startsWith(requiredPrefix)) n++
      }
      return n
    },
    key(index: number): string | null {
      const keys: string[] = []
      for (let i = 0; i < backend.length; i++) {
        const k = backend.key(i)
        if (k?.startsWith(requiredPrefix)) keys.push(k)
      }
      return keys[index] ?? null
    },
    clear(): void {
      const toRemove: string[] = []
      for (let i = 0; i < backend.length; i++) {
        const k = backend.key(i)
        if (k?.startsWith(requiredPrefix)) toRemove.push(k)
      }
      toRemove.forEach(k => backend.removeItem(k))
    },
    getItem(key: string): string | null {
      const full = requiredPrefix + key
      if (!allowedForPrefix(requiredPrefix)) return null
      return backend.getItem(full)
    },
    setItem(key: string, value: string): void {
      if (!allowedForPrefix(requiredPrefix)) return
      try {
        backend.setItem(requiredPrefix + key, value)
      } catch {
        /* quota */
      }
    },
    removeItem(key: string): void {
      backend.removeItem(requiredPrefix + key)
    },
  }
}

/** Functional / UI prefs (theme, dismissed tips …). */
export const functionalStorage = createScopedStorage(localStorage, STORAGE_PREFIX.functional)

/** Analytics buffers or IDs — gated on analytics consent. */
export const analyticsStorage = createScopedStorage(localStorage, STORAGE_PREFIX.analytics)

/** Ad / targeting IDs — gated on targeting consent. */
export const targetingStorage = createScopedStorage(localStorage, STORAGE_PREFIX.targeting)

/** Always allowed — auth tokens if you move them client-side (prefer HttpOnly cookies server-side). */
export const necessaryLocalStorage: Pick<Storage, 'getItem' | 'setItem' | 'removeItem'> = {
  getItem: (k: string) => localStorage.getItem(k),
  setItem: (k: string, v: string) => {
    try {
      localStorage.setItem(k, v)
    } catch {
      /* ignore */
    }
  },
  removeItem: (k: string) => localStorage.removeItem(k),
}

/** Strip disallowed category data when user revokes (best-effort). */
export function purgeCategoryData(category: Exclude<ConsentCategory, 'necessary'>): void {
  const prefix =
    category === 'functional'
      ? STORAGE_PREFIX.functional
      : category === 'analytics'
        ? STORAGE_PREFIX.analytics
        : STORAGE_PREFIX.targeting
  const toRemove: string[] = []
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i)
    if (k?.startsWith(prefix)) toRemove.push(k)
  }
  toRemove.forEach(k => localStorage.removeItem(k))
}

export function getPrefixForCategory(cat: Exclude<ConsentCategory, 'necessary'>): string {
  return STORAGE_PREFIX[cat]
}
