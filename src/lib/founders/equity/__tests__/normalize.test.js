import { describe, it, expect } from 'vitest'
import { normalizeInputs, parseNumber } from '../normalize.js'
import { BOUNDS } from '../bounds.js'
import { marketSalaryFor } from '../salary-bands.js'

describe('parseNumber', () => {
  it('parses typed strings and rejects blanks', () => {
    expect(parseNumber('120,000')).toBe(120000)
    expect(parseNumber('$150')).toBe(150)
    expect(parseNumber('3%')).toBe(3)
    expect(parseNumber('1e9')).toBe(1e9)
    expect(parseNumber('')).toBeNull()
    expect(parseNumber('   ')).toBeNull()
    expect(parseNumber('abc')).toBeNull()
    expect(parseNumber(NaN)).toBeNull()
    expect(parseNumber(Infinity)).toBeNull()
    expect(parseNumber(true)).toBeNull()
    expect(parseNumber(0)).toBe(0)
  })
})

describe('normalizeInputs', () => {
  it('defaults every field from an empty object and freezes the result', () => {
    const n = normalizeInputs({})
    expect(Object.isFrozen(n)).toBe(true)
    expect(n.role).toBe('cto')
    expect(n.joining).toBe('fractional_conversion')
    expect(n.stage).toBe('preseed')
    expect(n.stageKey).toBe('preseed')
    expect(n.path).toBe('ipo')
    expect(n.months).toBe(BOUNDS.months.default)
    expect(n.hoursPerWeek).toBe(BOUNDS.hoursPerWeek.default)
    expect(n.ratePerHour).toBe(BOUNDS.ratePerHour.default)
    expect(n.feesBilled).toBe(0)
    expect(n.founders).toBe(2)
    expect(n.vestingYears).toBe(4)
    expect(n.cliffMonths).toBe(12)
    expect(n.marketSalary).toBe(marketSalaryFor('cto', 'preseed'))
    expect(n.offeredSalary).toBeNull()
    expect(n.offeredEquityPct).toBeNull()
    expect(n.responsibilities).toEqual([])
    expect(n.clamped).toEqual({})
  })

  it('accepts null and non-object input', () => {
    expect(normalizeInputs(null).role).toBe('cto')
    expect(normalizeInputs(undefined).role).toBe('cto')
    expect(normalizeInputs('nope').role).toBe('cto')
  })

  it('distinguishes blank, null and zero on optional fields', () => {
    expect(normalizeInputs({ offeredSalary: '' }).offeredSalary).toBeNull()
    expect(normalizeInputs({ offeredSalary: null }).offeredSalary).toBeNull()
    expect(
      normalizeInputs({ offeredSalary: undefined }).offeredSalary
    ).toBeNull()
    expect(normalizeInputs({ offeredSalary: 0 }).offeredSalary).toBe(0)
    expect(normalizeInputs({ offeredSalary: '0' }).offeredSalary).toBe(0)
    expect(normalizeInputs({ offeredEquityPct: 0 }).offeredEquityPct).toBe(0)
    expect(
      normalizeInputs({ offeredEquityPct: '' }).offeredEquityPct
    ).toBeNull()
  })

  it('restores defaults for blank required fields and keeps zero', () => {
    expect(normalizeInputs({ months: '' }).months).toBe(6)
    expect(normalizeInputs({ months: NaN }).months).toBe(6)
    expect(normalizeInputs({ months: 0 }).months).toBe(0)
    expect(normalizeInputs({ hoursPerWeek: 'x' }).hoursPerWeek).toBe(10)
  })

  it('clamps out-of-bounds values and records them', () => {
    const n = normalizeInputs({
      months: 500,
      hoursPerWeek: -3,
      offeredEquityPct: 250,
      strikePrice: 99999,
      optionCount: '1e15',
    })
    expect(n.months).toBe(120)
    expect(n.hoursPerWeek).toBe(0)
    expect(n.offeredEquityPct).toBe(100)
    expect(n.strikePrice).toBe(10000)
    expect(n.optionCount).toBe(1e12)
    expect(n.clamped).toEqual({
      months: true,
      hoursPerWeek: true,
      offeredEquityPct: true,
      strikePrice: true,
      optionCount: true,
    })
    expect(normalizeInputs({ months: 12 }).clamped.months).toBeUndefined()
  })

  it('clamps founders to 1..6', () => {
    expect(normalizeInputs({ founders: 0 }).founders).toBe(1)
    expect(normalizeInputs({ founders: 10 }).founders).toBe(6)
    expect(normalizeInputs({ founders: 2.6 }).founders).toBe(3)
    expect(normalizeInputs({ founders: '' }).founders).toBe(2)
  })

  it('maps idea to preseed while keeping the raw stage', () => {
    const n = normalizeInputs({ stage: 'idea' })
    expect(n.stage).toBe('idea')
    expect(n.stageKey).toBe('preseed')
    expect(normalizeInputs({ stage: 'series_a' }).stageKey).toBe('series_a')
    expect(normalizeInputs({ stage: 'bogus' }).stageKey).toBe('preseed')
  })

  it('validates enums with defaults', () => {
    const n = normalizeInputs({
      role: 'designer',
      joining: 'x',
      path: 'moon',
      instrument: 'warrants',
      offerMode: 'units',
    })
    expect(n.role).toBe('cto')
    expect(n.joining).toBe('fractional_conversion')
    expect(n.path).toBe('ipo')
    expect(n.instrument).toBe('options')
    expect(n.offerMode).toBe('percent')
    expect(normalizeInputs({ path: 'unknown' }).path).toBe('unknown')
    expect(normalizeInputs({ offerMode: 'shares' }).offerMode).toBe('shares')
  })

  it('parses the two gates as booleans, missing means yes', () => {
    expect(normalizeInputs({}).fullTimeOnSigning).toBe(true)
    expect(
      normalizeInputs({ fullTimeOnSigning: false }).fullTimeOnSigning
    ).toBe(false)
    expect(normalizeInputs({ finalTechnicalSay: 'no' }).finalTechnicalSay).toBe(
      false
    )
    expect(
      normalizeInputs({ finalTechnicalSay: 'yes' }).finalTechnicalSay
    ).toBe(true)
  })

  it("filters responsibilities to the role's chip ids and dedupes", () => {
    const n = normalizeInputs({
      role: 'cto',
      responsibilities: [
        'architecture',
        'wrote_product',
        'architecture',
        42,
        'shipped_mvp',
      ],
    })
    expect(n.responsibilities).toEqual(['architecture', 'shipped_mvp'])
    expect(Object.isFrozen(n.responsibilities)).toBe(true)
    expect(
      normalizeInputs({ responsibilities: 'nope' }).responsibilities
    ).toEqual([])
  })

  it('uses the role × stage market salary default', () => {
    expect(
      normalizeInputs({ role: 'engineer', stage: 'seed' }).marketSalary
    ).toBe(marketSalaryFor('engineer', 'seed'))
    expect(normalizeInputs({ marketSalary: 0 }).marketSalary).toBe(0)
    const n = normalizeInputs({ marketSalary: 9e9 })
    expect(n.marketSalary).toBe(2_000_000)
    expect(n.clamped.marketSalary).toBe(true)
  })

  it('accepts the nested work/comp shape from the design doc', () => {
    const n = normalizeInputs({
      work: { months: 9, responsibilities: ['architecture'] },
      comp: { offeredSalary: 90000 },
    })
    expect(n.months).toBe(9)
    expect(n.responsibilities).toEqual(['architecture'])
    expect(n.offeredSalary).toBe(90000)
  })

  it('normalizes roundsBeforeExit per path with clamping', () => {
    const n = normalizeInputs({
      roundsBeforeExit: { acquisition: 9, ipo: '', bootstrap: -1 },
    })
    expect(n.roundsBeforeExit).toEqual({
      bootstrap: 0,
      acquisition: 6,
      ipo: null,
    })
    expect(n.clamped['roundsBeforeExit.acquisition']).toBe(true)
    expect(normalizeInputs({ roundsBeforeExit: 3 }).roundsBeforeExit).toEqual({
      bootstrap: null,
      acquisition: null,
      ipo: null,
    })
  })
})
