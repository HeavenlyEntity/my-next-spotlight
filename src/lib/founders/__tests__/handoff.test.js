import { describe, expect, it } from 'vitest'

import { EXAMPLE } from '../equity/benchmarks.js'
import { computeRead } from '../equity/engine.js'
import { computeAsk } from '../equity/negotiation.js'
import { GEO_OPTIONS, INDUSTRY_OPTIONS } from '../offer-steps.js'
import { askForClipboard, briefForContact } from '../handoff.js'

describe('briefForContact', () => {
  it('fills every template line with the read instead of blanks', () => {
    const read = computeRead({
      ...EXAMPLE,
      offeredSalary: 90000,
      severanceMonths: 6,
    })
    const { subject, message } = briefForContact(read)
    expect(subject).toBe('Offer review: CTO at pre-seed')
    expect(message).toContain(
      'Role and seat: CTO, converting from fractional or contract'
    )
    expect(message).toContain('Stage (last closed round): pre-seed')
    expect(message).toContain('Offered equity: 3% fully diluted')
    expect(message).toContain(
      'Salary vs market: $90k offered vs $143k market ($53k below)'
    )
    expect(message).toContain('Company’s stated exit path: IPO')
    expect(message).toMatch(
      /The read: Founding executive, range [\d.]+–[\d.]+%, offer below the band/
    )
    expect(message).toContain('severance 6 mo')
    expect(message).toContain('--- Full brief ---')
    /* the only line left for the user to fill is the one asking what they want */
    const blanks = message.split('\n').filter((l) => /:\s*$/.test(l))
    expect(blanks).toEqual(['What I want help with: '])
  })

  it('says "not entered" rather than leaving a blank when there is no offer', () => {
    const { message } = briefForContact(
      computeRead({ ...EXAMPLE, offeredEquityPct: null })
    )
    expect(message).toContain('Offered equity: not entered')
  })
})

describe('askForClipboard', () => {
  const labels = { industryOptions: INDUSTRY_OPTIONS, geoOptions: GEO_OPTIONS }
  const askWith = (over = {}, options = {}) =>
    computeAsk(computeRead({ ...EXAMPLE, role: 'engineer', ...over }), options)
  const copy = (ask) => askForClipboard(ask, labels)

  it('writes the ask as sentences a person can send, not a table', () => {
    const ask = askWith(
      { offeredSalary: 180_000 },
      { industry: 'ai', geo: 'bay_nyc' }
    )
    const text = copy(ask)
    /* No key: value rows, no pipes, no leading dashes: this is prose that goes
       into a reply, which is the whole difference from briefForContact(). */
    for (const line of text.split('\n').filter(Boolean)) {
      expect(line, line).not.toMatch(/^[-|*]/)
    }
    expect(text).toMatch(/^Ask: \$[\d,]+ base and [\d.]+% fully diluted\.$/m)
  })

  it('spells salaries out in full rather than in the display grain', () => {
    const text = copy(askWith({ offeredSalary: 180_000 }))
    /* The screen says $184k because it is a tabular figure. A number written
       into a negotiation is written in full. */
    expect(text).toMatch(/\$\d{3},\d{3}/)
    expect(text).not.toMatch(/\$\d+k/)
  })

  it('leaves the multiplier clause out entirely when nothing is adjusted', () => {
    const text = copy(askWith({}, { industry: 'saas', geo: 'us_hub' }))
    expect(text).not.toContain('times')
    expect(text).not.toContain('nationally')
  })

  it('names a derived median as derived instead of pointing at an unseen note', () => {
    /* This text travels away from the page, so "see the note on the row" would
       be a dead reference. */
    const text = copy(askWith())
    expect(text).not.toContain('see the note on the row')
    expect(text).toMatch(/Source: derived — /)
  })

  it('claims the age of the OLDEST source, never the freshest', () => {
    const ask = askWith({}, { industry: 'ai', geo: 'bay_nyc' })
    const dates = [
      ask.bands.cash.asOf,
      ask.bands.industry.asOf,
      ask.bands.geo.asOf,
      ask.target.read.band.asOf,
    ].sort()
    expect(copy(ask)).toContain(`Market figures as of ${dates[0]}`)
  })

  it('returns an empty string on a malformed ladder rather than throwing', () => {
    expect(askForClipboard(null)).toBe('')
    expect(askForClipboard({})).toBe('')
    expect(askForClipboard({ target: {}, bands: {} })).toBe('')
  })
})
