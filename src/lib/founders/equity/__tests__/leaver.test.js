import { describe, expect, it } from 'vitest'

import { EXAMPLE, LEAVER } from '../benchmarks.js'
import { computeRead } from '../engine.js'
import { computeLeaver, keptFractions, vestedFraction } from '../leaver.js'
import { normalizeInputs } from '../normalize.js'

const base = { ...EXAMPLE, offeredEquityPct: 12 }

describe('vestedFraction', () => {
  it('is zero before the cliff and linear after it', () => {
    expect(vestedFraction(11, 12, 4)).toBe(0)
    expect(vestedFraction(12, 12, 4)).toBe(0.25)
    expect(vestedFraction(24, 12, 4)).toBe(0.5)
    expect(vestedFraction(60, 12, 4)).toBe(1)
  })
})

describe('keptFractions', () => {
  it('applies termination acceleration and change-of-control triggers', () => {
    const inputs = normalizeInputs({
      ...base,
      accelerationTerminationMonths: 6,
      accelerationCoC: 'double',
    })
    const k = keptFractions(24, inputs)
    expect(k.resign).toBe(0.5)
    expect(k.terminated).toBe(0.63)
    expect(k.changeOfControl).toBe(1)
  })

  it('keeps the standard terms at the vested fraction', () => {
    const inputs = normalizeInputs(base)
    const k = keptFractions(24, inputs)
    expect(k).toEqual({ resign: 0.5, terminated: 0.5, changeOfControl: 0.5 })
  })
})

describe('computeLeaver via computeRead', () => {
  it('defaults to the market standard and produces four horizons from the offer', () => {
    const read = computeRead(base)
    expect(read.inputs.exerciseWindow).toBe(LEAVER.standard.exerciseWindow)
    expect(read.leaver.basis).toBe('offer')
    expect(read.leaver.horizons.map((h) => h.months)).toEqual([12, 24, 36, 48])
    expect(read.leaver.horizons[0].resign).toBe(3)
    expect(read.leaver.horizons[3].resign).toBe(12)
    expect(read.leaver.exercise.days).toBe(90)
  })

  it('uses the range midpoint when there is no offer', () => {
    const read = computeRead({ ...base, offeredEquityPct: null })
    expect(read.leaver.basis).toBe('mid')
    expect(read.leaver.stake).toBe(read.offer.range.mid)
  })

  it('restricted stock has no exercise window', () => {
    const read = computeRead({ ...base, instrument: 'restricted_stock' })
    expect(read.leaver.exercise.applies).toBe(false)
  })

  it('computes exercise cost in shares mode with a strike', () => {
    const read = computeRead({
      ...base,
      offerMode: 'shares',
      optionCount: 400000,
      fullyDilutedShares: 10000000,
      strikePrice: 0.5,
    })
    /* a year's vesting is 25% of 400k options at $0.50 */
    expect(read.leaver.exercise.cost).toBe(50000)
  })

  it('prices severance off the offered salary when present', () => {
    const read = computeRead({
      ...base,
      offeredSalary: 120000,
      severanceMonths: 6,
    })
    expect(read.leaver.severance.dollars).toBe(60000)
    expect(read.leaver.severance.basis).toBe('offered')
  })

  it('raises the leaver flags and questions in the brief', () => {
    const read = computeRead({ ...base, repurchaseVested: 'fmv_any' })
    const ids = read.brief.flags.map((f) => f.id)
    expect(ids).toContain('exercise_window')
    expect(ids).toContain('acceleration_coc')
    expect(ids).toContain('repurchase_fmv_any')
    expect(
      read.brief.questionsToAsk.some((q) => /exercise window/i.test(q))
    ).toBe(true)
    expect(read.brief.text).toContain('If it ends')
  })

  it('clamps the leaver numerics and never NaNs', () => {
    const inputs = normalizeInputs({
      ...base,
      severanceMonths: 99,
      accelerationTerminationMonths: -3,
    })
    expect(inputs.severanceMonths).toBe(24)
    expect(inputs.accelerationTerminationMonths).toBe(0)
    const leaver = computeLeaver(inputs, { offerPct: null, midPct: 10 })
    expect(JSON.stringify(leaver)).not.toContain('null,null')
    expect(Number.isFinite(leaver.severance.dollars)).toBe(true)
  })
})
