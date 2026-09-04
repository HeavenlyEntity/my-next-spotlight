import { readFileSync } from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'

import {
  AS_OF,
  CAVEATS,
  EXCLUSIONS,
  LADDERS,
  LADDER_FOR_ROLE,
  LIQUIDITY,
  STALE_AFTER_MONTHS,
  isStale,
  ladderForRole,
} from '../company-comp.js'
import {
  BOUNDS,
  MAX_DRIFT,
  asOfStamp,
  checkRow,
  gate,
  parseLevelsPage,
} from '../company-comp-parse.js'

/* A real Levels.fyi page, captured 2026-09-04, not a hand-written sample. It is
   the contract: when the site changes shape this fixture stops matching and the
   parser test fails loudly rather than the live run writing nonsense. */
const fixture = readFileSync(
  path.resolve(__dirname, 'fixtures/levels-google-l5.txt'),
  'utf8'
)

describe('the parser, against a real captured page (plan test 19)', () => {
  it('pulls the four figures out', () => {
    const r = parseLevelsPage(fixture)
    expect(r.ok).toBe(true)
    expect(r.total).toBe(422_759)
    expect(r.base).toBe(228_880)
    expect(r.stock).toBe(163_516)
    expect(r.bonus).toBe(30_363)
  })

  it('the captured figures pass their own sanity gate', () => {
    expect(checkRow(parseLevelsPage(fixture)).ok).toBe(true)
  })

  it('fails loudly rather than quietly when the markup changes', () => {
    const redesigned = fixture.replace('Stock Grant (/yr)', 'Equity Per Year')
    const r = parseLevelsPage(redesigned)
    expect(r.ok).toBe(false)
    expect(r.reason).toMatch(/changed its markup/i)
  })

  it('refuses empty or non-string input', () => {
    for (const bad of ['', null, undefined, 42, {}]) {
      expect(parseLevelsPage(bad).ok, JSON.stringify(bad)).toBe(false)
    }
  })
})

describe('the sanity gate refuses bad data (plan test 20)', () => {
  const good = {
    ok: true,
    base: 228_880,
    stock: 163_516,
    bonus: 30_363,
    total: 422_759,
  }

  it('accepts a clean row', () => {
    expect(checkRow(good).ok).toBe(true)
  })

  it('rejects figures outside the plausible bounds', () => {
    const r = checkRow({ ...good, base: 12, total: 12 })
    expect(r.ok).toBe(false)
    expect(r.problems.join(' ')).toMatch(/outside/)
  })

  /* The dangerous case: every number individually plausible, but pulled from
     different blocks so the parts do not make the whole. */
  it('rejects a row whose parts do not add up to its total', () => {
    const r = checkRow({ ...good, bonus: 250_000 })
    expect(r.ok).toBe(false)
    expect(r.problems.join(' ')).toMatch(/off by/)
  })

  it('rejects a total that moved further than the review threshold', () => {
    const r = checkRow(good, { total: 180_000 })
    expect(r.ok).toBe(false)
    expect(r.problems.join(' ')).toMatch(/review threshold/)
    expect(MAX_DRIFT).toBeGreaterThan(0)
  })

  it('computes the previous total from components when it is not given', () => {
    /* The stored rows carry base/stock/bonus and no total. Requiring callers to
       remember to add one is how the drift check silently stops firing. */
    const r = checkRow(good, { base: 90_000, stock: 60_000, bonus: 30_000 })
    expect(r.ok).toBe(false)
    expect(r.problems.join(' ')).toMatch(/review threshold/)
  })

  it('allows ordinary drift, because the window is rolling', () => {
    /* The real page moved from 428,550 to 422,759 between the research pass and
       the capture. Normal movement must not trip the gate. */
    expect(checkRow(good, { total: 428_550 }).ok).toBe(true)
  })

  it('refuses the whole refresh when any single row fails', () => {
    const result = gate([
      { id: 'google', parsed: good },
      { id: 'meta', parsed: { ok: false, reason: 'block not found' } },
    ])
    expect(result.ok).toBe(false)
    expect(result.failures).toHaveLength(1)
    expect(result.failures[0].id).toBe('meta')
  })

  it('passes a refresh where every row is clean', () => {
    expect(gate([{ id: 'google', parsed: good }]).ok).toBe(true)
  })

  it('publishes bounds for every field it checks', () => {
    for (const field of ['base', 'stock', 'bonus', 'total']) {
      expect(BOUNDS[field], field).toHaveLength(2)
      expect(BOUNDS[field][0]).toBeLessThan(BOUNDS[field][1])
    }
  })
})

describe('the as-of stamp is the retrieval date (plan test 20b)', () => {
  it('comes from the clock, never from the page', () => {
    const fixed = new Date('2027-03-09T11:22:33Z')
    expect(asOfStamp(fixed)).toBe('2027-03-09')
  })

  it('ignores any date the page happens to print', () => {
    /* Every Levels.fyi page prints today's date in "Last updated", because it
       is the page-generation timestamp. Trusting it would stamp today forever
       and the staleness banner would never fire. */
    const stamp = asOfStamp(new Date('2027-03-09T00:00:00Z'))
    expect(fixture).not.toContain(stamp)
    expect(stamp).toBe('2027-03-09')
  })

  it('the shipped stamp is a plain date', () => {
    expect(AS_OF).toMatch(/^\d{4}-\d{2}-\d{2}$/)
  })
})

describe('staleness', () => {
  it('is fresh on the day it was retrieved', () => {
    expect(isStale(new Date(`${AS_OF}T12:00:00Z`))).toBe(false)
  })

  it('warns once it passes the threshold', () => {
    const then = new Date(`${AS_OF}T00:00:00Z`)
    const later = new Date(then)
    later.setMonth(later.getMonth() + STALE_AFTER_MONTHS)
    expect(isStale(later)).toBe(true)
  })

  it('is not stale one month before the threshold', () => {
    const then = new Date(`${AS_OF}T00:00:00Z`)
    const soon = new Date(then)
    soon.setMonth(soon.getMonth() + STALE_AFTER_MONTHS - 1)
    expect(isStale(soon)).toBe(false)
  })

  it('never throws on a bad clock', () => {
    expect(isStale('not a date')).toBe(false)
  })
})

describe('the two ladders', () => {
  it('gives the engineer seat the IC ladder and the CTO seat leadership', () => {
    expect(ladderForRole('engineer').id).toBe('ic')
    expect(ladderForRole('cto').id).toBe('leadership')
  })

  /* No CTO row exists anywhere: no CTO track on Levels.fyi, and CTOs are not
     named executive officers in proxies. So the axis says leadership. */
  it('never labels the leadership axis as CTO compensation', () => {
    expect(LADDERS.leadership.axisLabel).toMatch(/engineering leadership/i)
    expect(LADDERS.leadership.axisLabel).not.toMatch(/\bCTO\b/)
  })

  it('withholds the plot for the CEO seat rather than comparing wrong people', () => {
    expect(LADDER_FOR_ROLE.ceo_builder).toBeNull()
    expect(ladderForRole('ceo_builder')).toBeNull()
    expect(ladderForRole('nope')).toBeNull()
  })

  it('carries enough rows on each ladder to be a comparison', () => {
    expect(LADDERS.ic.rows.length).toBeGreaterThanOrEqual(10)
    expect(LADDERS.leadership.rows.length).toBeGreaterThanOrEqual(6)
  })

  it('makes every row add up and carry a known liquidity kind', () => {
    for (const ladder of Object.values(LADDERS)) {
      for (const r of ladder.rows) {
        const where = `${ladder.id}.${r.id}`
        expect(r.total, where).toBe(r.base + r.stock + r.bonus)
        expect(Object.keys(LIQUIDITY), where).toContain(r.liquidity)
        expect(r.base, where).toBeGreaterThan(0)
        expect(['sourced', 'interpolated', 'estimate'], where).toContain(
          r.confidence
        )
      }
    }
  })

  it('keeps Netflix as an all-cash row with a note explaining it', () => {
    for (const ladder of Object.values(LADDERS)) {
      const netflix = ladder.rows.find((r) => r.id === 'netflix')
      expect(netflix.stock, ladder.id).toBe(0)
      expect(netflix.stockShare, ladder.id).toBe(0)
      expect(netflix.note, ladder.id).toMatch(/policy|design/i)
    }
  })

  it('marks every director-rung row as thin-n', () => {
    for (const r of LADDERS.leadership.rows) {
      expect(r.confidence, r.id).not.toBe('sourced')
      expect(r.note, r.id).toBeTruthy()
    }
  })

  it('records why Cursor and the AI labs are left off', () => {
    const text = EXCLUSIONS.map((e) => `${e.company} ${e.reason}`).join(' ')
    expect(text).toMatch(/cursor/i)
    expect(text).toMatch(/sample of one/i)
    expect(text).toMatch(/openai/i)
  })

  it('carries the caveats every surface has to show', () => {
    const text = CAVEATS.join(' ')
    expect(text).toMatch(/US medians/i)
    expect(text).toMatch(/four-year grant divided by four/i)
    expect(text).toMatch(/not equivalent across companies/i)
  })
})
