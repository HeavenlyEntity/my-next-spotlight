import { describe, it, expect } from 'vitest'
import { grainFor, roundRange, roundToGrain } from '../rounding.js'

describe('grain', () => {
  it('is 0.05 below 2 and 0.5 from 2 up, judged on the raw low end', () => {
    expect(grainFor(0.1)).toBe(0.05)
    expect(grainFor(1.99)).toBe(0.05)
    expect(grainFor(2)).toBe(0.5)
    expect(grainFor(8)).toBe(0.5)
  })

  it('rounds to a grain without float noise', () => {
    expect(roundToGrain(11.4999, 0.5)).toBe(11.5)
    expect(roundToGrain(0.1 + 0.2, 0.05)).toBe(0.3)
    expect(roundToGrain(1.32, 0.05)).toBe(1.3)
  })
})

describe('roundRange', () => {
  it('rounds both ends to the grain', () => {
    expect(roundRange(8, 15)).toEqual({ lo: 8, hi: 15, grain: 0.5, mid: 11.5 })
    expect(roundRange(8.3, 15.2)).toEqual({
      lo: 8.5,
      hi: 15,
      grain: 0.5,
      mid: 12,
    })
    expect(roundRange(0.12, 0.33)).toEqual({
      lo: 0.1,
      hi: 0.35,
      grain: 0.05,
      mid: 0.25,
    })
  })

  it('handles the collision case 0.1–0.3 + 1.8', () => {
    const r = roundRange(0.1 + 1.8, 0.3 + 1.8)
    expect(r.grain).toBe(0.05)
    expect(r.lo).toBe(1.9)
    expect(r.hi).toBe(2.1)
    expect(r.lo).toBeLessThan(r.hi)
  })

  it('widens a collapsed range by one grain', () => {
    const r = roundRange(2.1, 2.2)
    expect(r.grain).toBe(0.5)
    expect(r.lo).toBe(2)
    expect(r.hi).toBe(2.5)
    const tiny = roundRange(0.51, 0.52)
    expect(tiny.lo).toBe(0.5)
    expect(tiny.hi).toBe(0.55)
  })

  it('floors the low end at 0.05 after rounding and keeps lo < hi', () => {
    expect(roundRange(0.01, 0.02)).toEqual({
      lo: 0.05,
      hi: 0.1,
      grain: 0.05,
      mid: 0.1,
    })
    const neg = roundRange(0.05 - 2, 0.25 - 2)
    expect(neg.lo).toBe(0.05)
    expect(neg.hi).toBeGreaterThan(neg.lo)
    expect(neg.hi).toBe(0.1)
    const bigNeg = roundRange(-10, -3)
    expect(bigNeg.lo).toBe(0.05)
    expect(bigNeg.hi).toBe(0.1)
  })

  it('is safe against non-finite input', () => {
    const r = roundRange(NaN, NaN)
    expect(r.lo).toBe(0.05)
    expect(r.hi).toBeGreaterThan(r.lo)
    const inf = roundRange(1, Infinity)
    expect(Number.isFinite(inf.hi)).toBe(true)
  })
})
