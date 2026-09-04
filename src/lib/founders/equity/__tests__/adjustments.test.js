import { describe, it, expect } from 'vitest'
import { computeAdjustments, dollarsToPts } from '../adjustments.js'
import { normalizeInputs } from '../normalize.js'
import { EXCHANGE_RATES, STAGES } from '../benchmarks.js'

const adj = (raw) => computeAdjustments(normalizeInputs(raw))

describe('exchange rates', () => {
  it('convert linearly per stage', () => {
    expect(dollarsToPts(50_000, 'preseed')).toBeCloseTo(0.75, 9)
    expect(dollarsToPts(50_000, 'seed')).toBeCloseTo(0.5, 9)
    expect(dollarsToPts(100_000, 'series_a')).toBeCloseTo(0.75, 9)
    expect(dollarsToPts(100_000, 'series_b_plus')).toBeCloseTo(0.4, 9)
    expect(dollarsToPts(25_000, 'preseed')).toBeCloseTo(0.375, 9)
    for (const stage of STAGES) expect(EXCHANGE_RATES[stage]).toBeDefined()
  })
})

describe('banked work', () => {
  const work = { months: 6, hoursPerWeek: 10, ratePerHour: 150, feesBilled: 0 }

  it('applies only to fractional conversions', () => {
    const f = adj({ ...work, joining: 'fractional_conversion' })
    expect(f.banked.applied).toBe(true)
    expect(f.banked.dollars).toBe(Math.round(6 * 4.33 * 10 * 150))
    expect(f.banked.pts).toBeCloseTo(((6 * 4.33 * 10 * 150) / 50_000) * 0.75, 2)
    for (const joining of ['formation', 'hired_after']) {
      const o = adj({ ...work, joining })
      expect(o.banked.applied).toBe(false)
      expect(o.banked.pts).toBe(0)
      expect(o.banked.dollars).toBe(0)
      expect(o.total).toBe(0)
    }
  })

  it('subtracts fees billed and never goes negative', () => {
    const paid = adj({
      ...work,
      joining: 'fractional_conversion',
      feesBilled: 1_000_000,
    })
    expect(paid.banked.dollars).toBe(0)
    expect(paid.banked.pts).toBe(0)
  })

  it('caps at +5 points', () => {
    const big = adj({
      joining: 'fractional_conversion',
      months: 120,
      hoursPerWeek: 80,
      ratePerHour: 1000,
      feesBilled: 0,
    })
    expect(big.banked.pts).toBe(5)
    expect(big.banked.capped).toBe(true)
  })
})

describe('salary', () => {
  it('applies only when an offered salary is present, and zero counts', () => {
    const none = adj({ marketSalary: 120_000, offeredSalary: '' })
    expect(none.salary.applied).toBe(false)
    expect(none.salary.gap).toBeNull()
    expect(none.salary.pts).toBe(0)
    const zero = adj({
      joining: 'hired_after',
      marketSalary: 120_000,
      offeredSalary: 0,
    })
    expect(zero.salary.applied).toBe(true)
    expect(zero.salary.gap).toBe(120_000)
  })

  it('prices the gap over min(vesting, 2) years', () => {
    // preseed: 50k gap × 2 years = 100k → 1.5 pts
    const s = adj({
      joining: 'hired_after',
      marketSalary: 150_000,
      offeredSalary: 100_000,
      vestingYears: 4,
    })
    expect(s.salary.pts).toBeCloseTo(1.5, 2)
    const oneYear = adj({
      joining: 'hired_after',
      marketSalary: 150_000,
      offeredSalary: 100_000,
      vestingYears: 1,
    })
    expect(oneYear.salary.pts).toBeCloseTo(0.75, 2)
  })

  it('caps at +4 and floors at −2', () => {
    const cut = adj({
      joining: 'hired_after',
      marketSalary: 2_000_000,
      offeredSalary: 0,
    })
    expect(cut.salary.pts).toBe(4)
    expect(cut.salary.capped).toBe(true)
    const raise = adj({
      joining: 'hired_after',
      marketSalary: 0,
      offeredSalary: 2_000_000,
    })
    expect(raise.salary.pts).toBe(-2)
    expect(raise.salary.capped).toBe(true)
  })
})

describe('combined', () => {
  it('caps the total at +7 and floors at −2', () => {
    const both = adj({
      joining: 'fractional_conversion',
      months: 120,
      hoursPerWeek: 80,
      ratePerHour: 1000,
      marketSalary: 2_000_000,
      offeredSalary: 0,
    })
    expect(both.banked.pts).toBe(5)
    expect(both.salary.pts).toBe(4)
    expect(both.total).toBe(7)
    const neg = adj({
      joining: 'hired_after',
      marketSalary: 0,
      offeredSalary: 2_000_000,
    })
    expect(neg.total).toBe(-2)
  })

  it('states the caps', () => {
    const a = adj({})
    expect(a.caps).toEqual({
      banked: 5,
      salary: 4,
      salaryFloor: -2,
      combined: 7,
      floor: -2,
    })
  })
})
