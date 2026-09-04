import { afterEach, beforeEach, describe, expect, it } from 'vitest'

/* The node project has no window. Stub sessionStorage BEFORE importing the
   store, because zustand resolves its storage getter on first use. This is the
   same pattern the old handoff test used. */
const backing = new Map()
globalThis.window = {
  sessionStorage: {
    getItem: (key) => (backing.has(key) ? backing.get(key) : null),
    setItem: (key, value) => backing.set(key, value),
    removeItem: (key) => backing.delete(key),
  },
}

const { ENGINE_KEYS, INITIAL, INITIAL_KEYS, STORAGE_KEY, useOfferStore } =
  await import('../offer-store.js')
const { normalizeInputs } = await import('../equity/normalize.js')
const { computeRead } = await import('../equity/engine.js')

const stored = () => {
  const raw = backing.get(STORAGE_KEY)
  return raw ? JSON.parse(raw).state : null
}

beforeEach(() => {
  useOfferStore.setState({ ...INITIAL })
  backing.clear()
})
afterEach(() => backing.clear())

describe('field names match the engine (plan test 17)', () => {
  /* The plan's first draft called these `seat` and `stageKey`. normalizeInputs
     reads `role` and `stage`, so that store would have defaulted every seat to
     CTO and every stage to pre-seed, silently, with no error. */
  it('feeds normalizeInputs without anything falling back to a default', () => {
    useOfferStore.getState().set({
      role: 'engineer',
      stage: 'series_a',
      joining: 'hired_after',
    })
    const n = normalizeInputs(useOfferStore.getState().inputs())
    expect(n.role).toBe('engineer')
    expect(n.stageKey).toBe('series_a')
    expect(n.joining).toBe('hired_after')
  })

  it('names the engine inputs exactly, never seat or stageKey', () => {
    expect(INITIAL_KEYS).toContain('role')
    expect(INITIAL_KEYS).toContain('stage')
    expect(INITIAL_KEYS).not.toContain('seat')
    expect(INITIAL_KEYS).not.toContain('stageKey')
  })

  it('produces a real read from the untouched defaults', () => {
    /* CTO at pre-seed is the shipped default AND was a missing band row until
       T1 interpolated it. A default that lands in a fallback is a bug. */
    const read = computeRead(useOfferStore.getState().inputs())
    expect(read.inputs.role).toBe('cto')
    expect(read.inputs.stageKey).toBe('preseed')
    expect(Number.isFinite(read.inputs.marketSalary)).toBe(true)
    expect(read.inputs.marketSalary).toBeGreaterThan(0)
  })

  it('keeps bookkeeping out of the engine inputs', () => {
    expect(ENGINE_KEYS).not.toContain('askedAt')
    expect(ENGINE_KEYS).not.toContain('workAnswered')
    expect(Object.keys(useOfferStore.getState().inputs()).sort()).toEqual(
      [...ENGINE_KEYS].sort()
    )
  })
})

describe('shares mode survives the round trip (plan test 15)', () => {
  it('carries the option count, the fully diluted total and the strike', () => {
    useOfferStore.getState().set({
      offerMode: 'shares',
      optionCount: 250_000,
      fullyDilutedShares: 10_000_000,
      strikePrice: 0.42,
    })
    const inputs = useOfferStore.getState().inputs()
    expect(inputs.offerMode).toBe('shares')
    expect(inputs.optionCount).toBe(250_000)
    expect(inputs.fullyDilutedShares).toBe(10_000_000)
    expect(inputs.strikePrice).toBe(0.42)
    /* And the engine can actually resolve a percent from them, which is the
       point of carrying them across the hop at all. */
    const read = computeRead(inputs)
    expect(read.offer.mode).toBe('shares')
    expect(read.offer.pct).toBeCloseTo(2.5, 4)
  })
})

describe('persistence and clearing (plan test 18)', () => {
  it('writes to sessionStorage under one key', () => {
    useOfferStore.getState().set({ offeredSalary: 180_000 })
    expect(stored().offeredSalary).toBe(180_000)
    expect([...backing.keys()]).toEqual([STORAGE_KEY])
  })

  it('removes the key rather than writing the defaults back over it', () => {
    useOfferStore.getState().set({ offeredSalary: 180_000, role: 'engineer' })
    expect(backing.has(STORAGE_KEY)).toBe(true)
    useOfferStore.getState().clear()
    /* Order matters inside clear(): defaults first, clearStorage second. The
       other order leaves a fresh copy of the defaults on disk. */
    expect(backing.has(STORAGE_KEY)).toBe(false)
    expect(useOfferStore.getState().role).toBe('cto')
    expect(useOfferStore.getState().offeredSalary).toBeNull()
  })

  it('clears the asked marker too, so the contact form stops prefilling', () => {
    useOfferStore.getState().markAsked()
    expect(useOfferStore.getState().askedAt).toBeTruthy()
    useOfferStore.getState().clear()
    expect(useOfferStore.getState().askedAt).toBeNull()
  })

  it('persists only data, never the actions', () => {
    useOfferStore.getState().set({ offeredSalary: 1 })
    const keys = Object.keys(stored())
    expect(keys.sort()).toEqual([...INITIAL_KEYS].sort())
    expect(keys).not.toContain('set')
    expect(keys).not.toContain('clear')
  })
})

describe('pristine detection', () => {
  it('is pristine until a real answer changes', () => {
    expect(useOfferStore.getState().isPristine()).toBe(true)
    useOfferStore.getState().set({ role: 'engineer' })
    expect(useOfferStore.getState().isPristine()).toBe(false)
  })

  it('is pristine again after a clear, so a sync cannot re-hydrate it', () => {
    useOfferStore.getState().set({ offeredSalary: 200_000 })
    useOfferStore.getState().clear()
    expect(useOfferStore.getState().isPristine()).toBe(true)
  })

  it('does not count the asked marker as an answer', () => {
    useOfferStore.getState().markAsked()
    expect(useOfferStore.getState().isPristine()).toBe(true)
  })
})

describe('the asked marker', () => {
  it('starts null and records an ISO timestamp', () => {
    expect(INITIAL.askedAt).toBeNull()
    useOfferStore.getState().markAsked()
    expect(useOfferStore.getState().askedAt).toMatch(
      /^\d{4}-\d{2}-\d{2}T[\d:.]+Z$/
    )
  })
})
