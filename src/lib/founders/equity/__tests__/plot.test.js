import { describe, expect, it } from 'vitest'

import { EXAMPLE } from '../benchmarks.js'
import { LADDERS } from '../company-comp.js'
import { computeRead } from '../engine.js'
import { computeAsk } from '../negotiation.js'
import { SEGMENTS, buildPlot } from '../plot.js'

const build = (over = {}, options = {}) => {
  /* EXAMPLE is a CTO; default these to the engineer seat so the IC ladder is
     what is under test unless a case says otherwise. */
  const read = computeRead({ ...EXAMPLE, role: 'engineer', ...over })
  return buildPlot(read, computeAsk(read), options)
}

describe('the seat decides the ladder (plan tests 29 and 29b)', () => {
  it('gives the engineer seat the IC ladder', () => {
    const p = build({ role: 'engineer' })
    expect(p.withheld).toBe(false)
    expect(p.ladderId).toBe('ic')
    expect(p.rows).toHaveLength(LADDERS.ic.rows.length)
  })

  it('gives the CTO seat the leadership ladder, never labelled CTO', () => {
    const p = build({ role: 'cto' })
    expect(p.ladderId).toBe('leadership')
    expect(p.axisLabel).toMatch(/engineering leadership/i)
    expect(p.axisLabel).not.toMatch(/\bCTO\b/)
  })

  it('withholds it for the CEO seat and says why', () => {
    const p = build({ role: 'ceo_builder' })
    expect(p.withheld).toBe(true)
    expect(p.reason).toMatch(/no published pay ladder/i)
    expect(p.reason).toMatch(/wrong people/i)
  })
})

describe('the user row is annualised (plan test DD11)', () => {
  /* Company figures are a four-year grant divided by four. A scenario value is
     the whole grant at once. Stacking them without annualising overstates the
     reader's package roughly fourfold. */
  it('divides the scenario value by the vesting years', () => {
    const read = computeRead({
      ...EXAMPLE,
      role: 'engineer',
      offeredSalary: 180_000,
      vestingYears: 4,
    })
    const p = buildPlot(read, computeAsk(read), { scenarioId: 'base' })
    const card = read.scenarios[read.preselectedPath].find(
      (c) => c.id === 'base'
    )
    expect(p.user.equity).toBe(Math.round(card.value / 4))
    expect(p.user.total).toBe(180_000 + p.user.equity)
  })

  it('labels the segment with its time basis', () => {
    expect(SEGMENTS.modeled.label).toMatch(/per vesting year/i)
    expect(SEGMENTS.liquid.label).toMatch(/annual/i)
  })

  it('collapses to cash alone at the zero outcome', () => {
    const p = build({ offeredSalary: 180_000 }, { scenarioId: 'zero' })
    expect(p.user.equity).toBe(0)
    expect(p.user.total).toBe(180_000)
    expect(p.user.allCash).toBe(true)
  })

  it('carries the exercise cost through rather than ignoring it', () => {
    const read = computeRead({
      ...EXAMPLE,
      role: 'engineer',
      offerMode: 'shares',
      optionCount: 100_000,
      fullyDilutedShares: 10_000_000,
      strikePrice: 1.5,
      offeredSalary: 180_000,
    })
    const p = buildPlot(read, computeAsk(read), { scenarioId: 'conservative' })
    expect(p.user.exerciseCost).toBe(150_000)
    /* scenarios.js already subtracts it, so the annualised figure must never
       be larger than the gross divided by the years. */
    expect(p.user.equity).toBeLessThanOrEqual(
      Math.round(p.user.scenario.gross / 4)
    )
  })

  it('falls back to the target ask when no salary was entered', () => {
    const read = computeRead({
      ...EXAMPLE,
      role: 'engineer',
      offeredSalary: '',
    })
    const ask = computeAsk(read)
    const p = buildPlot(read, ask, {})
    expect(p.user.usingTarget).toBe(true)
    expect(p.user.cash).toBe(ask.target.cash)
    expect(p.user.label).toMatch(/target ask/i)
  })
})

describe('the domain and the overflow', () => {
  /* Scaling to the reader's upside would shrink every company to a twelfth of
     the axis and make the comparison unreadable at the outcome most people
     look at. */
  it('scales to the widest company bar, not the widest possible user bar', () => {
    const widest = Math.max(...LADDERS.ic.rows.map((r) => r.total))
    for (const scenarioId of ['zero', 'conservative', 'base', 'upside']) {
      const p = build({ offeredSalary: 180_000 }, { scenarioId })
      expect(p.domain, scenarioId).toBe(widest)
    }
  })

  it('flags an overflow rather than rescaling everything', () => {
    const modest = build({ offeredSalary: 180_000 }, { scenarioId: 'zero' })
    expect(modest.overflow).toBe(false)
    const great = build({ offeredSalary: 180_000 }, { scenarioId: 'upside' })
    expect(great.overflow).toBe(true)
  })
})

describe('the thesis (plan test DD7)', () => {
  it('always explains why their bar moves and the others do not', () => {
    const p = build({ offeredSalary: 180_000 })
    expect(p.thesis).toMatch(/vest whatever happens/i)
    expect(p.thesis).toMatch(/has not happened yet/i)
    expect(p.thesis).toMatch(/paid in risk/i)
  })

  it('names the real ratio when there is a real gap', () => {
    /* A modest offer against big-tech packages: the gap is the point, so say
       how big it is rather than letting the reader guess. */
    const p = build(
      { offeredSalary: 90_000, offeredEquityPct: 0.05 },
      { scenarioId: 'zero' }
    )
    expect(p.thesis).toMatch(/times this one/i)
  })

  it('does not invent a gap when there is not one', () => {
    const p = build({ offeredSalary: 180_000 }, { scenarioId: 'upside' })
    expect(p.thesis).not.toMatch(/times this one/i)
  })
})

describe('rows carry what the disclosure needs (plan tests 26 and 29c)', () => {
  it('gives every row a breakdown, a liquidity kind and a total that adds up', () => {
    const p = build({ offeredSalary: 180_000 })
    for (const row of [...p.rows, p.user]) {
      expect(row.breakdown.length, row.id).toBeGreaterThan(0)
      expect(row.liquidity.label, row.id).toBeTruthy()
      expect(row.total, row.id).toBe(row.cash + row.equity)
    }
  })

  it('sorts the rows by what is displayed, highest first', () => {
    const p = build({ offeredSalary: 180_000 })
    const totals = p.rows.map((r) => r.total)
    expect(totals).toEqual([...totals].sort((a, b) => b - a))
  })

  it('marks Netflix as all cash rather than as a missing value', () => {
    const p = build({ role: 'engineer' })
    const netflix = p.rows.find((r) => r.id === 'netflix')
    expect(netflix.allCash).toBe(true)
    expect(netflix.equity).toBe(0)
    expect(netflix.note).toMatch(/design/i)
  })

  it('gives the user the options badge, the least liquid kind on the board', () => {
    const p = build({ offeredSalary: 180_000 })
    expect(p.user.liquidity.label).toBe('Options')
    expect(p.user.liquidity.detail).toMatch(/strike price/i)
  })

  /* Plan test 29d. */
  it('marks every leadership row as thin-n so the plot can say so', () => {
    const p = build({ role: 'cto' })
    for (const row of p.rows) expect(row.confidence, row.id).not.toBe('sourced')
  })
})

describe('robustness', () => {
  it('never throws and never yields NaN on odd input', () => {
    for (const over of [
      { offeredSalary: '' },
      { vestingYears: 0 },
      { offeredEquityPct: null, offerMode: 'shares', optionCount: null },
      { path: 'bootstrap' },
    ]) {
      const p = build(over)
      expect(Number.isFinite(p.user.total), JSON.stringify(over)).toBe(true)
      expect(Number.isFinite(p.domain), JSON.stringify(over)).toBe(true)
      expect(p.domain).toBeGreaterThan(0)
    }
  })

  it('freezes what it returns', () => {
    const p = build()
    expect(Object.isFrozen(p)).toBe(true)
    expect(Object.isFrozen(p.user)).toBe(true)
    expect(Object.isFrozen(p.rows)).toBe(true)
  })
})
