import type { ConsentCategory, ConsentSnapshot } from './types'

export const CONSENT_STORAGE_KEY = 'chroma_consent_v1'
export const CONSENT_COOKIE_NAME = 'cc_consent_v1'

/** Default persistence: 1 year */
export const CONSENT_MAX_AGE_MS = 365 * 24 * 60 * 60 * 1000

/** Key prefixes → category required for writes */
export const STORAGE_PREFIX = {
  functional: 'cc_fn_',
  analytics: 'cc_an_',
  targeting: 'cc_ad_',
} as const

export const CATEGORY_META: Record<
  Exclude<ConsentCategory, 'necessary'>,
  { id: ConsentCategory; label: string; description: string }
> = {
  functional: {
    id: 'functional',
    label: 'Functional',
    description:
      'Remember UI choices, session convenience, and non-essential features that improve the experience.',
  },
  analytics: {
    id: 'analytics',
    label: 'Analytics',
    description:
      'Measure usage and performance to understand how the application is used (e.g. aggregated stats).',
  },
  targeting: {
    id: 'targeting',
    label: 'Targeting / advertising',
    description:
      'Personalised content or ads, measurement across sites, and similar marketing technologies.',
  },
}

export function defaultChoices(): ConsentSnapshot['choices'] {
  return {
    necessary: true,
    functional: false,
    analytics: false,
    targeting: false,
  }
}
