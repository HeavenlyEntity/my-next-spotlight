import { describe, it, expect } from 'vitest'
import { computeScenarios, exerciseCost, SCENARIO_IDS } from '../scenarios.js'
import { normalizeInputs } from '../normalize.js'
import { SCENARIO_VALUATIONS } from '../benchmarks.js'

const stakes = {
  bootstrap: { offer: 3, mid: 11.5 },
  acquisition: { offer: 1.8, mid: 6.9 },
  ipo: { offer: 0.94, mid: 3.6 },
}

describe('computeScenarios', () => {
  it('yields four cards per path with zero first', () => {
    const s = computeScenarios(normalizeInputs({}), stakes)
    for (const path of ['bootstrap', 'acquisition', 'ipo']) {
      expect(s[path]).toHaveLength(4)
      expect(s[path].map((c) => c.id)).toEqual(SCENARIO_IDS)
      expect(s[path][0]).toMatchObject({ id: 'zero', valuation: 0, value: 0 })
      expect(s[path][0].note).toMatch(/most startup equity ends here/)
      for (const c of s[path]) expect(c.footer).toMatch(/fully vested/)
    }
  })

  it('values each card as stake × valuation from the offer', () => {
    const s = computeScenarios(normalizeInputs({}), stakes)
    expect(s.acquisition[2]).toMatchObject({
      id: 'base',
      valuation: 100_000_000,
      basis: 'offer',
    })
    expect(s.acquisition[2].value).toBe(Math.round(0.018 * 100_000_000))
    expect(s.ipo[3].value).toBe(Math.round(0.0094 * 5_000_000_000))
    expect(s.bootstrap[1].value).toBe(Math.round(0.03 * 3_000_000))
  })

  it('falls back to the midpoint series without an offer', () => {
    const s = computeScenarios(normalizeInputs({}), {
      bootstrap: { offer: null, mid: 10 },
      acquisition: { offer: null, mid: 6 },
      ipo: { offer: null, mid: 3 },
    })
    expect(s.acquisition[2].basis).toBe('midpoint')
    expect(s.acquisition[2].value).toBe(6_000_000)
  })

  it('subtracts the exercise cost only in shares mode with a strike', () => {
    const percentWithStrike = normalizeInputs({
      offerMode: 'percent',
      strikePrice: 2,
      optionCount: 100_000,
    })
    expect(exerciseCost(percentWithStrike)).toBeNull()
    const p = computeScenarios(percentWithStrike, stakes)
    expect(p.acquisition[2].subtracted).toBe(false)
    expect(p.acquisition[2].exerciseNote).toMatch(/not subtracted/)
    expect(p.acquisition[2].value).toBe(1_800_000)

    const shares = normalizeInputs({
      offerMode: 'shares',
      optionCount: 100_000,
      fullyDilutedShares: 10_000_000,
      strikePrice: 2,
    })
    expect(exerciseCost(shares)).toBe(200_000)
    const s = computeScenarios(shares, stakes)
    expect(s.acquisition[2].subtracted).toBe(true)
    expect(s.acquisition[2].exerciseCost).toBe(200_000)
    expect(s.acquisition[2].value).toBe(1_600_000)
    expect(s.acquisition[2].exerciseNote).toBeNull()

    const noStrike = normalizeInputs({
      offerMode: 'shares',
      optionCount: 100_000,
      fullyDilutedShares: 10_000_000,
    })
    expect(computeScenarios(noStrike, stakes).acquisition[2].subtracted).toBe(
      false
    )
  })

  it('floors the value at zero when the strike exceeds the exit', () => {
    const shares = normalizeInputs({
      offerMode: 'shares',
      optionCount: 1_000_000,
      fullyDilutedShares: 10_000_000,
      strikePrice: 10_000,
    })
    const s = computeScenarios(shares, stakes)
    expect(s.bootstrap[1].value).toBe(0)
    expect(s.bootstrap[3].value).toBe(0)
    expect(s.acquisition[1].value).toBe(0)
  })

  it('accepts editable valuations per path and ignores bad overrides', () => {
    const s = computeScenarios(normalizeInputs({}), stakes, {
      acquisition: { base: 80_000_000, upside: 'nope', conservative: -5 },
    })
    expect(s.acquisition[2].valuation).toBe(80_000_000)
    expect(s.acquisition[2].value).toBe(Math.round(0.018 * 80_000_000))
    expect(s.acquisition[3].valuation).toBe(
      SCENARIO_VALUATIONS.acquisition.upside
    )
    expect(s.acquisition[1].valuation).toBe(
      SCENARIO_VALUATIONS.acquisition.conservative
    )
    expect(s.ipo[2].valuation).toBe(SCENARIO_VALUATIONS.ipo.base)
  })
})
