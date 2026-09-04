import { describe, expect, it } from 'vitest'

import { EXAMPLE } from '../equity/benchmarks.js'
import { computeRead } from '../equity/engine.js'
import { briefForContact } from '../handoff.js'

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
