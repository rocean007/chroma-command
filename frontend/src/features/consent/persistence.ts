import { CONSENT_COOKIE_NAME, CONSENT_MAX_AGE_MS, CONSENT_STORAGE_KEY, defaultChoices } from './constants'
import type { ConsentSnapshot } from './types'
import { deleteClientCookie, getClientCookie, setClientCookie } from './cookieUtils'
import { emitConsentChange } from './consentEvents'

function nowIso() {
  return new Date().toISOString()
}

export function buildSnapshot(
  partial: Partial<ConsentSnapshot['choices']> & { source?: ConsentSnapshot['source'] }
): ConsentSnapshot {
  const base = defaultChoices()
  const decidedAt = nowIso()
  const expires = new Date(Date.now() + CONSENT_MAX_AGE_MS).toISOString()
  return {
    version: 1,
    decidedAt,
    expiresAt: expires,
    source: partial.source ?? 'preferences',
    choices: {
      necessary: true,
      functional: partial.functional ?? base.functional,
      analytics: partial.analytics ?? base.analytics,
      targeting: partial.targeting ?? base.targeting,
    },
  }
}

export function isSnapshotExpired(s: ConsentSnapshot): boolean {
  return Date.now() > new Date(s.expiresAt).getTime()
}

/** Necessary mirror: consent record + version cookie (full JSON in localStorage). */
export function persistConsent(snapshot: ConsentSnapshot): void {
  try {
    localStorage.setItem(CONSENT_STORAGE_KEY, JSON.stringify(snapshot))
  } catch {
    /* quota / private mode */
  }
  const maxAge = Math.floor(CONSENT_MAX_AGE_MS / 1000)
  setClientCookie(CONSENT_COOKIE_NAME, String(snapshot.version), Math.min(maxAge, 31536000))
}

export function loadConsent(): ConsentSnapshot | null {
  try {
    const raw = localStorage.getItem(CONSENT_STORAGE_KEY)
    if (raw) {
      const s = JSON.parse(raw) as ConsentSnapshot
      if (s?.version === 1 && s.choices?.necessary === true && s.expiresAt) {
        if (isSnapshotExpired(s)) {
          clearStoredConsent()
          return null
        }
        return s
      }
    }
  } catch {
    /* corrupt */
  }
  if (getClientCookie(CONSENT_COOKIE_NAME)) {
    /* Cookie hints consent existed; full prefs must be in localStorage — treat as unknown */
  }
  return null
}

export function clearStoredConsent(): void {
  try {
    localStorage.removeItem(CONSENT_STORAGE_KEY)
  } catch {
    /* ignore */
  }
  deleteClientCookie(CONSENT_COOKIE_NAME)
}

export function withdrawConsent(): void {
  clearStoredConsent()
  emitConsentChange(null)
}

export function saveConsent(snapshot: ConsentSnapshot): void {
  persistConsent(snapshot)
  emitConsentChange(snapshot)
}
