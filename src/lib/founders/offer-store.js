import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'

/*
 * Founders' Desk — the inputs both tools share.
 *
 * FIELD NAMES ARE NOT DECORATIVE. `normalizeInputs()` reads `src.role` and
 * `src.stage` (normalize.js:133 and :135) and OUTPUTS `stageKey`. A store that
 * called these `seat` and `stageKey` would fail `pickEnum` silently and default
 * every non-CTO seat to CTO and every stage to pre-seed, with no error anywhere.
 * The first draft of the plan did exactly that. `INITIAL_KEYS` and its test
 * exist so it cannot happen again.
 *
 * WHAT LIVES HERE: only what both the equity calculator and the job offer
 * calculator need. Step index, scenario overrides and the fractional sliders
 * stay in the equity wizard's own reducer.
 *
 * PERSISTENCE: sessionStorage, so answers survive a reload and die with the
 * tab. The desk's privacy line changes from "nothing stored" to "nothing leaves
 * your browser" to match (design review D3). `clear()` genuinely removes the
 * key rather than writing defaults back over it.
 */

export const STORAGE_KEY = 'amw:offer'

export const INITIAL = Object.freeze({
  /* Who and where. `role` and `stage` are the engine's own input names. */
  role: 'cto',
  joining: 'fractional_conversion',
  stage: 'preseed',
  industry: 'saas',
  /* Must exist in the GEO table. `us_national` did not, and no test caught it
     until an outside reviewer read the two declarations side by side. */
  geo: 'remote_national',

  /* What the classifier needs. Without these a cold start comes back pending
     on any non-formation path, which is the tool's headline persona
     (classify.js:58). `responsibilities: []` is ambiguous on its own, so the
     wizard offers an explicit "none of these" and sets `workAnswered`. */
  responsibilities: [],
  workAnswered: false,
  fullTimeOnSigning: null,
  finalTechnicalSay: null,

  /* The offer. Shares mode carries three more fields; dropping them would lose
     an option count crossing between the two tools. */
  offerMode: 'percent',
  offeredEquityPct: null,
  optionCount: null,
  fullyDilutedShares: null,
  strikePrice: null,
  offeredSalary: null,
  vestingYears: 4,

  /* Set when the user asks for a review, so the contact form knows they
     actually came from the tool rather than typing the URL. */
  askedAt: null,
})

/** Every key the store owns. The engine-name test walks this. */
export const INITIAL_KEYS = Object.freeze(Object.keys(INITIAL))

/** The subset that goes to `computeRead`. `askedAt` and `workAnswered` are
    bookkeeping, not inputs. */
export const ENGINE_KEYS = Object.freeze(
  INITIAL_KEYS.filter((k) => k !== 'askedAt' && k !== 'workAnswered')
)

/* sessionStorage does not exist on the server, and touching it during a
   thumbnail or a preview render can throw. Returning undefined makes zustand
   skip persistence rather than blow up. */
const safeStorage = () => {
  try {
    return typeof window !== 'undefined' && window.sessionStorage
      ? window.sessionStorage
      : undefined
  } catch {
    return undefined
  }
}

export const useOfferStore = create(
  persist(
    (set, get) => ({
      ...INITIAL,

      /** Merge a patch. The wizard calls this on blur or Enter, never per
          keystroke, so a half-typed salary never reaches the store (D9). */
      set: (patch) => set(patch),

      /** Record that the user asked for a review, which is what lets the
          contact form prefill. */
      markAsked: () => set({ askedAt: new Date().toISOString() }),

      /**
       * Empty the store AND the key. Order matters: writing defaults first and
       * clearing second leaves storage genuinely empty, because any set() after
       * clearStorage() would immediately write the defaults back.
       */
      clear: () => {
        set({ ...INITIAL })
        try {
          useOfferStore.persist.clearStorage()
        } catch {
          /* storage may be unavailable; memory is already reset */
        }
      },

      /** True when nothing has been answered yet. The equity wizard's sync uses
          this so it cannot re-hydrate the store straight after a clear. */
      isPristine: () => {
        const s = get()
        return ENGINE_KEYS.every((k) => {
          const a = s[k]
          const b = INITIAL[k]
          return Array.isArray(a) ? a.length === b.length : a === b
        })
      },

      /** Just the engine inputs, ready for `computeRead`. */
      inputs: () => {
        const s = get()
        const out = {}
        for (const k of ENGINE_KEYS) out[k] = s[k]
        return out
      },
    }),
    {
      name: STORAGE_KEY,
      version: 1,
      storage: createJSONStorage(safeStorage),
      /* Persist only data. Functions are recreated on load, and a stale one
         written to storage would be dropped anyway. */
      partialize: (state) => {
        const out = {}
        for (const k of INITIAL_KEYS) out[k] = state[k]
        return out
      },
      /* A payload from an older shape is discarded rather than merged, so a
         renamed field can never resurrect as a silent default. */
      migrate: () => ({ ...INITIAL }),
    }
  )
)

/**
 * Whether persisted state has arrived yet.
 *
 * This matters more than it sounds. `persist` hydrates AFTER mount, so the
 * server paints `INITIAL` — CTO at pre-seed. On a page whose design system
 * counts numbers up as they arrive, an engineer at Series A would watch a CTO's
 * pre-seed figures animate and then jump to their own. Gate the render on this,
 * show a fixed-geometry skeleton, and suppress the count-up on the first real
 * paint (design review DD5).
 */
export function hasHydrated() {
  try {
    return useOfferStore.persist.hasHydrated()
  } catch {
    return true
  }
}

/** Subscribe to hydration finishing. Returns an unsubscribe function. */
export function onHydrated(fn) {
  try {
    return useOfferStore.persist.onFinishHydration(fn)
  } catch {
    return () => {}
  }
}
