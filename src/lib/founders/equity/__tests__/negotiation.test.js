import { describe, expect, it } from 'vitest'

import { CHIPS, EXAMPLE, ROLES, STAGES } from '../benchmarks.js'
import { computeRead } from '../engine.js'
import { computeAsk } from '../negotiation.js'
import { SALARY_BANDS, multipliersFor } from '../salary-bands.js'

const read = (over = {}) => computeRead({ ...EXAMPLE, ...over })
const ask = (over = {}, opts = {}) => computeAsk(read(over), opts)

describe('rung ordering', () => {
  /* Plan test 1. */
  it('orders the cash floor <= target <= ceiling', () => {
    const a = ask()
    expect(a.floor.cash).toBeLessThan(a.target.cash)
    expect(a.target.cash).toBeLessThan(a.ceiling.cash)
  })

  /* Plan test 2, corrected. The rungs ascend TOGETHER: "open with" has to be
     the biggest ask on both axes or the label is a lie. The trade lives in the
     band underneath, which the next test covers. */
  it('orders the equity the same way for a seat whose answers match it', () => {
    for (const role of ROLES) {
      for (const stage of STAGES) {
        const a = ask({
          role,
          stage,
          joining: 'formation',
          responsibilities: CHIPS[role].map((c) => c.id),
        })
        const where = `${role}.${stage}`
        expect(a.ceiling.equityPct, where).toBeGreaterThanOrEqual(
          a.target.equityPct
        )
        expect(a.target.equityPct, where).toBeGreaterThanOrEqual(
          a.floor.equityPct
        )
      }
    }
  })

  it('flags the inversion when the band is narrow against the cash spread', () => {
    /* A seat whose equity band is narrower than the point swing across the cash
       band genuinely loses equity by reaching for the top of the cash range.
       That is information, not an error, so it is flagged rather than clamped. */
    const a = ask({ role: 'ceo_builder', stage: 'seed' })
    expect(a.ceiling.equityPct).toBeLessThan(a.target.equityPct)
    const flag = a.flags.find((f) => f.id === 'equity_inverts')
    expect(flag).toBeDefined()
    expect(flag.promoted).toBe(true)
  })

  /* Plan test 4: the floor must never collapse into the target, which is what
     happened before each rung recomputed at its own cash. */
  it('never collapses the floor into the target', () => {
    for (const role of ROLES) {
      for (const stage of STAGES) {
        const a = ask({ role, stage })
        expect(a.floor.cash, `${role}.${stage}`).not.toBe(a.target.cash)
      }
    }
  })
})

describe('per-rung recomputation (D10)', () => {
  /* Plan test 3. This is the whole point: the equity beside a rung was
     computed at that rung's cash, not at the user's current salary. */
  it('computes each rung against a read taken at that rung own cash', () => {
    const a = ask()
    for (const id of a.order) {
      const rung = a[id]
      expect(rung.read.inputs.offeredSalary, id).toBe(rung.cash)
    }
    expect(a.ceiling.equityPct).toBe(a.ceiling.read.offer.range.hi)
    expect(a.target.equityPct).toBe(a.target.read.offer.range.mid)
    expect(a.floor.equityPct).toBe(a.floor.read.offer.range.lo)
  })

  it('moves the defensible band up as the cash comes down', () => {
    /* The trade, where it actually lives. A bigger pay cut is a stronger
       argument, so the whole band sits higher at the floor's cash. */
    const a = ask()
    expect(a.bandShift.floor.lo).toBeGreaterThan(a.bandShift.ceiling.lo)
    expect(a.bandShift.floor.hi).toBeGreaterThan(a.bandShift.ceiling.hi)
  })

  it('is not the naive ladder: more cash than the user has means a lower defensible high', () => {
    /* The naive version paired range.hi computed at the USER's salary with the
       p75 cash. Here the ceiling asks for more cash than they were offered, so
       the high it can defend must come out below that naive number. */
    const base = read({ offeredSalary: 60_000 })
    const a = computeAsk(base)
    expect(a.ceiling.cash).toBeGreaterThan(base.inputs.offeredSalary)
    expect(a.ceiling.equityPct).toBeLessThan(base.offer.range.hi)
  })

  it('accepts an injected computeRead', () => {
    let calls = 0
    const spy = (inputs) => {
      calls += 1
      return computeRead(inputs)
    }
    const a = computeAsk(read(), { computeRead: spy })
    expect(calls).toBe(3)
    expect(a.target.cash).toBeGreaterThan(0)
  })
})

describe('bucket and bands (D4)', () => {
  /* Plan test 5. */
  it('takes the bucket from the computed classification, not from joining', () => {
    const founding = ask({ joining: 'formation' })
    expect(founding.bucket).toBe('founding')
    /* A hire with no founder-level responsibilities classifies as a hire, and
       the cash band follows the classification rather than the raw answer. */
    const hire = ask({ joining: 'hired_after', responsibilities: [] })
    expect(hire.bucket).toBe('hired')
  })

  /* Plan test 6. */
  it('gives two identical conversions different cash when they classify differently', () => {
    const asFounder = ask({ joining: 'fractional_conversion' })
    const asHire = ask({
      joining: 'fractional_conversion',
      responsibilities: [],
      fullTimeOnSigning: false,
    })
    expect(asFounder.bucket).not.toBe(asHire.bucket)
    expect(asFounder.target.cash).not.toBe(asHire.target.cash)
  })

  it('reads the cash rungs off the band for that bucket and stage', () => {
    const a = ask({ role: 'cto', stage: 'seed', joining: 'formation' })
    const band = SALARY_BANDS.cto[a.bucket].seed
    const m = multipliersFor('cto', 'saas', 'us_hub').combined
    expect(a.ceiling.cash).toBe(Math.round((band.p75 * m) / 1000) * 1000)
    expect(a.target.cash).toBe(Math.round((band.p50 * m) / 1000) * 1000)
    expect(a.floor.cash).toBe(Math.round((band.p25 * m) / 1000) * 1000)
  })
})

describe('industry and geography (plan tests 7-10)', () => {
  it('moves the cash and never the equity band', () => {
    const plain = ask({}, { industry: 'saas', geo: 'us_hub' })
    const boosted = ask({}, { industry: 'ai', geo: 'bay_nyc' })
    expect(boosted.target.cash).toBeGreaterThan(plain.target.cash)
    /* The industry multiplier touches cash only: no source publishes equity
       grant size by industry at a fixed stage. */
    expect(boosted.bands.cash).toBe(plain.bands.cash)
  })

  it('keys the industry curve by role', () => {
    const engAi = computeAsk(read({ role: 'engineer' }), { industry: 'ai' })
    const engFin = computeAsk(read({ role: 'engineer' }), {
      industry: 'fintech',
    })
    const ctoAi = computeAsk(read({ role: 'cto' }), { industry: 'ai' })
    const ctoFin = computeAsk(read({ role: 'cto' }), { industry: 'fintech' })
    expect(engAi.bands.industry.multiplier).toBeGreaterThan(
      engFin.bands.industry.multiplier
    )
    expect(ctoFin.bands.industry.multiplier).toBeGreaterThan(
      ctoAi.bands.industry.multiplier
    )
  })

  it('leaves the cash untouched for the neutral defaults and says so', () => {
    const neutral = ask({}, { industry: 'other', geo: 'us_hub' })
    expect(neutral.bands.combined).toBe(1)
    const band = SALARY_BANDS[neutral.target.read.inputs.role][neutral.bucket]
    expect(neutral.target.cash).toBe(
      band[neutral.target.read.inputs.stageKey].p50
    )
  })
})

describe('the trade rate (plan tests 11-12)', () => {
  it('generates the rate from EXCHANGE_RATES at every stage', () => {
    const expected = {
      preseed: 0.15,
      seed: 0.1,
      series_a: 0.08,
      series_b_plus: 0.04,
    }
    for (const [stage, perTenK] of Object.entries(expected)) {
      expect(ask({ stage }).trade.perTenK, stage).toBe(perTenK)
    }
  })

  it('warns only at Series B and later, where the rate stops being worth it', () => {
    expect(ask({ stage: 'preseed' }).sentences.tradeWarning).toBeNull()
    expect(ask({ stage: 'seed' }).sentences.tradeWarning).toBeNull()
    const late = ask({ stage: 'series_b_plus' })
    expect(late.sentences.tradeWarning).toMatch(/rarely worth/i)
    expect(late.flags.map((f) => f.id)).toContain('trade_rate_poor')
  })

  it('quotes the two real bands rather than claiming a rung inversion', () => {
    const a = ask()
    expect(a.sentences.trade).toContain('computed at that rung')
    expect(a.sentences.trade).not.toMatch(/comes down/i)
  })
})

describe('the offer already on the table (DD12)', () => {
  it('places it against the rungs and reports both deltas', () => {
    const a = ask({ offeredSalary: 60_000, offeredEquityPct: 1 })
    expect(a.offer.position).toBe('below_floor')
    expect(a.offer.vsTarget.cash).toBe(a.target.cash - 60_000)
    expect(a.offer.vsTarget.equityPts).toBeCloseTo(a.target.equityPct - 1, 2)
    expect(a.flags.map((f) => f.id)).toContain('offer_below_floor')
    expect(a.sentences.offer).toMatch(/below the minimum/i)
  })

  it('is null when neither a salary nor an equity figure was entered', () => {
    const a = ask({ offeredSalary: '', offeredEquityPct: null })
    expect(a.offer).toBeNull()
    expect(a.sentences.offer).toMatch(/enter what they offered/i)
  })

  /* Plan test 14. */
  it('still renders the cash rungs with no salary entered', () => {
    const a = ask({ offeredSalary: '' })
    for (const id of a.order) {
      expect(Number.isFinite(a[id].cash), id).toBe(true)
      expect(a[id].cash, id).toBeGreaterThan(0)
    }
    expect(a.flags.map((f) => f.id)).toContain('no_salary_entered')
  })
})

describe('provenance (plan test 13) and copy', () => {
  it('gives every rung a confidence and at least one citation', () => {
    const a = ask()
    for (const id of a.order) {
      expect(a[id].cites.length, id).toBeGreaterThan(0)
      expect(['sourced', 'interpolated', 'estimate'], id).toContain(
        a[id].cashConfidence
      )
    }
  })

  it('always flags that the outer rungs come from a derived spread', () => {
    expect(ask().flags.map((f) => f.id)).toContain('spread_derived')
  })

  it('marks the outer rungs interpolated even when the median is sourced', () => {
    const a = ask({ role: 'cto', stage: 'seed', joining: 'formation' })
    expect(a.target.cashConfidence).toBe('sourced')
    expect(a.ceiling.cashConfidence).toBe('interpolated')
    expect(a.floor.cashConfidence).toBe('interpolated')
  })

  it('writes the verdict sentence the results page leads with', () => {
    const a = ask()
    expect(a.sentences.target).toMatch(/^Ask for \$[\d.]+k and [\d.]+%\.$/)
  })
})

describe('never throws, never NaN (plan test 16)', () => {
  it('survives garbage input', () => {
    for (const bad of [null, undefined, {}, { inputs: {} }, 42, 'nope', []]) {
      const a = computeAsk(bad)
      expect(a, JSON.stringify(bad)).not.toBeNull()
      for (const id of a.order) {
        expect(
          Number.isFinite(a[id].cash),
          `${JSON.stringify(bad)} ${id}`
        ).toBe(true)
        expect(
          Number.isFinite(a[id].equityPct),
          `${JSON.stringify(bad)} ${id}`
        ).toBe(true)
      }
    }
  })

  it('survives a computeRead that throws', () => {
    const a = computeAsk(read(), {
      computeRead: () => {
        throw new Error('boom')
      },
    })
    expect(a).not.toBeNull()
    expect(Number.isFinite(a.target.cash)).toBe(true)
  })

  it('produces finite numbers for every role and stage', () => {
    for (const role of ROLES) {
      for (const stage of STAGES) {
        const a = ask({ role, stage })
        for (const id of a.order) {
          const where = `${role}.${stage}.${id}`
          expect(Number.isFinite(a[id].cash), where).toBe(true)
          expect(Number.isFinite(a[id].equityPct), where).toBe(true)
          expect(a[id].equityPct, where).toBeGreaterThan(0)
        }
      }
    }
  })

  it('freezes the ladder', () => {
    const a = ask()
    expect(Object.isFrozen(a)).toBe(true)
    expect(Object.isFrozen(a.target)).toBe(true)
    expect(Object.isFrozen(a.flags)).toBe(true)
  })
})
