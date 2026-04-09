/**
 * Consent model — wire to your privacy policy / DPA.
 * Not legal advice; have counsel review for GDPR/CCPA/LGPD/ePrivacy.
 */

export type ConsentCategory = 'necessary' | 'functional' | 'analytics' | 'targeting'

export interface ConsentChoices {
  necessary: true
  functional: boolean
  analytics: boolean
  targeting: boolean
}

export interface ConsentSnapshot {
  version: 1
  decidedAt: string
  expiresAt: string
  choices: ConsentChoices
  source: 'banner' | 'preferences' | 'dnt'
}

export type ConsentListener = (snapshot: ConsentSnapshot | null) => void
