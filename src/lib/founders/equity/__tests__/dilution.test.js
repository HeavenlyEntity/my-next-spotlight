import { describe, it, expect } from 'vitest'
import {
  applyRounds,
  computeDilution,
  defaultRoundsForPath,
  remainingRounds,
} from '../dilution.js'
import { normalizeInputs } from '../normalize.js'
import { DILUTION_ROUNDS } from '../benchmarks.js'

describe('remainingRounds', () => {
  it('lists the rounds ahead per stage', () => {
    expect(remainingRounds('preseed').map((r) => r.round)).toEqual([
      'seed',
      'series_a',
      'series_b',
      'series_c',
      'series_d',
      'ipo',
    ])
    expect(remainingRounds('seed').map((r) => r.round)).toEqual([
      'series_a',
      'series_b',
      'series_c',
      'series_d',
      'ipo',
    ])
    expect(remainingRounds('series_a').map((r) => r.round)).toEqual([
      'series_b',
      'series_c',
      'series_d',
      'ipo',
    ])
    expect(remainingRounds('series_b_plus').map((r) => r.round)).toEqual([
      'series_c',
      'series_d',
      'ipo',
    ])
  })

  it('carries the designed medians', () => {
    expect(DILUTION_ROUNDS.seed.d).toBe(0.2)
    expect(DILUTION_ROUNDS.series_a.d).toBe(0.25)
    expect(DILUTION_ROUNDS.series_b.d).toBe(0.18)
    expect(DILUTION_ROUNDS.series_c.d).toBe(0.15)
    expect(DILUTION_ROUNDS.series_d.d).toBe(0.12)
    expect(DILUTION_ROUNDS.ipo.d).toBe(0.15)
    for (const r of remainingRounds('preseed'))
      expect(r.d).toBe(DILUTION_ROUNDS[r.round].d)
  })
})

describe('defaultRoundsForPath', () => {
  it('is 0 / 2 / all', () => {
    expect(defaultRoundsForPath('bootstrap', 6)).toBe(0)
    expect(defaultRoundsForPath('acquisition', 6)).toBe(2)
    expect(defaultRoundsForPath('acquisition', 1)).toBe(1)
    expect(defaultRoundsForPath('ipo', 6)).toBe(6)
    expect(defaultRoundsForPath('ipo', 3)).toBe(3)
  })
})

describe('applyRounds', () => {
  it('compounds (1 − d) from both the offer and the midpoint', () => {
    const s = applyRounds(remainingRounds('preseed'), 2, 3, 11.5)
    expect(s).toHaveLength(2)
    expect(s[0]).toMatchObject({
      round: 'seed',
      d: 0.2,
      stakeOffer: 2.4,
      stakeMid: 9.2,
    })
    expect(s[1].stakeOffer).toBeCloseTo(1.8, 4)
    expect(s[1].stakeMid).toBeCloseTo(6.9, 4)
  })

  it('is null-safe on the offer', () => {
    const s = applyRounds(remainingRounds('seed'), 1, null, 4)
    expect(s[0].stakeOffer).toBeNull()
    expect(s[0].stakeMid).toBe(3)
  })
})

describe('computeDilution', () => {
  it('computes all three paths with the path defaults', () => {
    const d = computeDilution(normalizeInputs({ stage: 'preseed' }), {
      offerPct: 3,
      midPct: 11.5,
    })
    expect(d.series.bootstrap).toEqual([])
    expect(d.series.acquisition).toHaveLength(2)
    expect(d.series.ipo).toHaveLength(6)
    expect(d.applied).toEqual({ bootstrap: 0, acquisition: 2, ipo: 6 })
    expect(d.defaults).toEqual({ bootstrap: 0, acquisition: 2, ipo: 6 })
    expect(d.clamped).toEqual({
      bootstrap: false,
      acquisition: false,
      ipo: false,
    })
    expect(d.exitStakes.bootstrap).toEqual({ offer: 3, mid: 11.5 })
    expect(d.exitStakes.acquisition.offer).toBeCloseTo(1.8, 4)
    expect(d.exitStakes.ipo.offer).toBeCloseTo(
      3 * 0.8 * 0.75 * 0.82 * 0.85 * 0.88 * 0.85,
      3
    )
  })

  it('applies per-stage remaining counts on the ipo path', () => {
    const counts = {
      preseed: 6,
      seed: 5,
      series_a: 4,
      series_b_plus: 3,
      idea: 6,
    }
    for (const [stage, n] of Object.entries(counts)) {
      const d = computeDilution(normalizeInputs({ stage }), {
        offerPct: 5,
        midPct: 5,
      })
      expect(d.series.ipo, stage).toHaveLength(n)
      expect(d.remaining).toHaveLength(n)
    }
  })

  it('clamps roundsBeforeExit to the rounds remaining', () => {
    const d = computeDilution(
      normalizeInputs({
        stage: 'series_b_plus',
        roundsBeforeExit: { ipo: 6, acquisition: 1, bootstrap: 2 },
      }),
      { offerPct: 2, midPct: 2 }
    )
    expect(d.applied).toEqual({ bootstrap: 2, acquisition: 1, ipo: 3 })
    expect(d.clamped.ipo).toBe(true)
    expect(d.clamped.acquisition).toBe(false)
    expect(d.series.bootstrap).toHaveLength(2)
  })

  it('keeps the offer series null without an offer', () => {
    const d = computeDilution(normalizeInputs({}), {
      offerPct: null,
      midPct: 10,
    })
    expect(d.series.ipo.every((r) => r.stakeOffer === null)).toBe(true)
    expect(d.exitStakes.ipo.offer).toBeNull()
    expect(d.exitStakes.ipo.mid).toBeGreaterThan(0)
  })
})
