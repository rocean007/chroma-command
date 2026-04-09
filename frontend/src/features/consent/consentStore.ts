import { create } from 'zustand'
import type { ConsentChoices, ConsentSnapshot } from './types'
import {
  buildSnapshot,
  clearStoredConsent,
  loadConsent,
  saveConsent as persistAndEmit,
  withdrawConsent,
} from './persistence'
import { defaultChoices } from './constants'
import { purgeCategoryData, registerConsentGetter } from './storageWrapper'

type ConsentState = {
  snapshot: ConsentSnapshot | null
  hydrated: boolean
  bannerVisible: boolean
  preferencesOpen: boolean
  /** Draft toggles in preference center */
  draft: ConsentChoices
  hydrate: () => void
  acceptAll: () => void
  rejectNonEssential: () => void
  saveDraft: () => void
  updateDraft: (partial: Partial<Omit<ConsentChoices, 'necessary'>>) => void
  openPreferences: () => void
  closePreferences: () => void
  withdraw: () => void
}

function choicesFromSnapshot(s: ConsentSnapshot | null): ConsentChoices {
  if (!s) return { ...defaultChoices(), necessary: true }
  return { ...s.choices }
}

export const useConsentStore = create<ConsentState>((set, get) => ({
  snapshot: null,
  hydrated: false,
  bannerVisible: false,
  preferencesOpen: false,
  draft: choicesFromSnapshot(null),

  hydrate: () => {
    const snap = loadConsent()
    registerConsentGetter(() => {
      const c = get().snapshot?.choices
      return {
        functional: !!c?.functional,
        analytics: !!c?.analytics,
        targeting: !!c?.targeting,
      }
    })
    set({
      snapshot: snap,
      hydrated: true,
      bannerVisible: !snap,
      draft: choicesFromSnapshot(snap),
    })
  },

  acceptAll: () => {
    const snap = buildSnapshot({
      source: 'banner',
      functional: true,
      analytics: true,
      targeting: true,
    })
    persistAndEmit(snap)
    set({ snapshot: snap, bannerVisible: false, preferencesOpen: false, draft: choicesFromSnapshot(snap) })
  },

  rejectNonEssential: () => {
    const snap = buildSnapshot({
      source: 'banner',
      functional: false,
      analytics: false,
      targeting: false,
    })
    purgeCategoryData('functional')
    purgeCategoryData('analytics')
    purgeCategoryData('targeting')
    persistAndEmit(snap)
    set({ snapshot: snap, bannerVisible: false, preferencesOpen: false, draft: choicesFromSnapshot(snap) })
  },

  updateDraft: partial => {
    set(s => ({
      draft: {
        ...s.draft,
        ...partial,
        necessary: true,
      },
    }))
  },

  saveDraft: () => {
    const { draft } = get()
    const snap = buildSnapshot({
      source: 'preferences',
      functional: draft.functional,
      analytics: draft.analytics,
      targeting: draft.targeting,
    })
    if (!draft.functional) purgeCategoryData('functional')
    if (!draft.analytics) purgeCategoryData('analytics')
    if (!draft.targeting) purgeCategoryData('targeting')
    persistAndEmit(snap)
    set({ snapshot: snap, bannerVisible: false, preferencesOpen: false })
  },

  openPreferences: () => {
    const { snapshot } = get()
    set({ preferencesOpen: true, draft: choicesFromSnapshot(snapshot) })
  },

  closePreferences: () => set({ preferencesOpen: false }),

  withdraw: () => {
    purgeCategoryData('functional')
    purgeCategoryData('analytics')
    purgeCategoryData('targeting')
    withdrawConsent()
    set({
      snapshot: null,
      bannerVisible: true,
      preferencesOpen: false,
      draft: choicesFromSnapshot(null),
    })
  },
}))

export function openCookiePreferences(): void {
  useConsentStore.getState().openPreferences()
}
