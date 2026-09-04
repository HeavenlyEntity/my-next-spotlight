import { describe, expect, it } from 'vitest'

import { HEADLINE_IDS, headlineFor } from '../headline'
import { EXAMPLE } from '@/lib/founders/equity/benchmarks'
import { computeRead } from '@/lib/founders/equity/engine'
import { computeAsk } from '@/lib/founders/equity/negotiation'

/* Six variants, each asserted, because without them an implementer ships a
   static label in the highest-value place on the page. */

const askWith = (over = {}) => computeAsk(computeRead({ ...EXAMPLE, ...over }))

const idFor = (over) => headlineFor(askWith(over)).id

describe('headline variants', () => {
  it('says nothing was offered when nothing was entered', () => {
    expect(idFor({ offeredSalary: '', offeredEquityPct: null })).toBe(
      'no_offer'
    )
  })

  it('leads with the gap when the offer is below the floor', () => {
    const ask = askWith({ offeredSalary: 40_000 })
    const h = headlineFor(ask)
    expect(h.id).toBe('below_floor')
    expect(h.line).toMatch(/below the least this seat pays/i)
  })

  it('points at the equity when the cash is already above the band', () => {
    const ask = askWith({ offeredSalary: 400_000 })
    const h = headlineFor(ask)
    expect(h.id).toBe('above_ceiling')
    expect(h.line).toMatch(/equity, not the salary/i)
  })

  it('names the poor trade rate at Series B and later', () => {
    /* Inside the band at a stage where cash buys almost no equity. */
    const ask = askWith({ stage: 'series_b_plus', offeredSalary: 210_000 })
    expect(ask.offer.position).toBe('within')
    const h = headlineFor(ask)
    expect(h.id).toBe('late_stage_trade')
    expect(h.line).toMatch(/poor deal/i)
  })

  it('calls reaching the middle a reasonable request when under target', () => {
    const ask = askWith({ offeredSalary: 90_000 })
    expect(ask.offer.position).toBe('within')
    expect(ask.offer.cash).toBeLessThan(ask.target.cash)
    const h = headlineFor(ask)
    expect(h.id).toBe('below_target')
    expect(h.line).toMatch(/not an aggressive request/i)
  })

  it('redirects to equity and terms when the cash is already at target', () => {
    const ask = askWith({ offeredSalary: 112_000 })
    expect(ask.offer.position).toBe('within')
    const h = headlineFor(ask)
    expect(h.id).toBe('above_target')
    expect(h.line).toMatch(/equity and the terms/i)
  })

  it('always returns something, even for a broken ladder', () => {
    for (const bad of [null, undefined, {}, { offer: undefined }]) {
      const h = headlineFor(bad)
      expect(h.id).toBe('no_offer')
      expect(h.line.length).toBeGreaterThan(0)
    }
  })

  it('exposes exactly six variants', () => {
    expect(HEADLINE_IDS).toHaveLength(6)
    expect(new Set(HEADLINE_IDS).size).toBe(6)
  })
})
