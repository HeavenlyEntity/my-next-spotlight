import { describe, it, expect } from 'vitest'
import { computeRead } from '../engine.js'
import {
  HEADLINES,
  NUMBER_SENTENCES,
  QUESTIONS_TO_ASK,
  fmtMoney,
  fmtPct,
} from '../brief.js'
import { EXAMPLE } from '../benchmarks.js'

const flagIds = (read) => read.brief.flags.map((f) => f.id)

describe('headline and number to say', () => {
  it('below: the hire-while-doing-founder-work sentence and the midpoint', () => {
    const r = computeRead(EXAMPLE)
    expect(r.offer.position).toBe('below')
    expect(r.brief.headline).toBe(HEADLINES.below)
    expect(r.offer.numberToSay.value).toBe(12)
    expect(r.offer.numberToSay.sentence).toContain(
      'sits at 8.5 to 15.5 percent fully diluted'
    )
    expect(r.offer.numberToSay.sentence).toContain("I'm at 3 percent")
    expect(r.offer.numberToSay.sentence).toContain('Ask for 12')
    expect(r.brief.numberToSay).toEqual(r.offer.numberToSay)
  })

  it('within: hold the percent, negotiate terms; the offer is the number', () => {
    const r = computeRead({ ...EXAMPLE, offeredEquityPct: 10 })
    expect(r.offer.position).toBe('within')
    expect(r.brief.headline).toBe(HEADLINES.within)
    expect(r.offer.numberToSay).toEqual({
      value: 10,
      sentence: NUMBER_SENTENCES.within,
    })
    expect(r.offer.gapPts).toBeNull()
  })

  it('above: hold the number', () => {
    const r = computeRead({ ...EXAMPLE, offeredEquityPct: 20 })
    expect(r.offer.position).toBe('above')
    expect(r.brief.headline).toBe(HEADLINES.above)
    expect(r.offer.numberToSay).toEqual({
      value: 20,
      sentence: NUMBER_SENTENCES.above,
    })
  })

  it('no offer: the class/stage/range sentence with no "I\'m at" clause and a null number', () => {
    const r = computeRead({ ...EXAMPLE, offeredEquityPct: '' })
    expect(r.offer.pct).toBeNull()
    expect(r.offer.position).toBe('unknown')
    expect(r.brief.headline).toBe(
      'Founding executive work at pre-seed sits at 8.5 to 15.5 percent. Enter the offer to see the gap.'
    )
    expect(r.offer.numberToSay.value).toBeNull()
    expect(r.offer.numberToSay.sentence).not.toContain("I'm at")
    expect(r.askSanity).toBeNull()
  })

  it('formation founder: the founder-shares sentence regardless of the offer', () => {
    const r = computeRead({
      ...EXAMPLE,
      joining: 'formation',
      offeredEquityPct: 3,
    })
    expect(r.classification.class).toBe('founder')
    expect(r.brief.headline).toBe(HEADLINES.formation)
    expect(r.offer.position).toBe('below')
    expect(r.offer.numberToSay.value).toBe(r.offer.range.mid)
    const none = computeRead({
      ...EXAMPLE,
      joining: 'formation',
      offeredEquityPct: null,
    })
    expect(none.brief.headline).toBe(HEADLINES.formation)
  })

  it('hire class: the employee-role sentence', () => {
    const r = computeRead({
      ...EXAMPLE,
      responsibilities: ['infra_oncall'],
      offeredEquityPct: 1,
    })
    expect(r.classification.class).toBe('hire')
    expect(r.brief.headline).toBe(HEADLINES.hire)
    const none = computeRead({
      ...EXAMPLE,
      responsibilities: ['infra_oncall'],
      offeredEquityPct: null,
    })
    expect(none.brief.headline).toBe(HEADLINES.hire)
  })

  it('pending class: asks for the chips and keeps the position unknown even with an offer', () => {
    const r = computeRead({
      ...EXAMPLE,
      responsibilities: [],
      offeredEquityPct: 3,
    })
    expect(r.classification.pending).toBe(true)
    expect(r.offer.position).toBe('unknown')
    expect(r.brief.headline).toMatch(/Pick what was yours/)
    expect(r.offer.numberToSay.value).toBeNull()
  })
})

describe('flags', () => {
  it('are empty for the clean example', () => {
    expect(flagIds(computeRead(EXAMPLE))).toEqual([
      'exercise_window',
      'acceleration_coc',
    ])
  })

  it('flag a cliff over 12 months and vesting over 4 years', () => {
    expect(flagIds(computeRead({ ...EXAMPLE, cliffMonths: 18 }))).toContain(
      'cliff'
    )
    expect(flagIds(computeRead({ ...EXAMPLE, cliffMonths: 12 }))).not.toContain(
      'cliff'
    )
    expect(flagIds(computeRead({ ...EXAMPLE, vestingYears: 5 }))).toContain(
      'vesting'
    )
    expect(flagIds(computeRead({ ...EXAMPLE, vestingYears: 4 }))).not.toContain(
      'vesting'
    )
  })

  it('flag an unsure instrument', () => {
    expect(
      flagIds(computeRead({ ...EXAMPLE, instrument: 'unsure' }))
    ).toContain('instrument')
    expect(
      flagIds(computeRead({ ...EXAMPLE, instrument: 'restricted_stock' }))
    ).not.toContain('instrument')
  })

  it('flag a failed gate by name', () => {
    expect(
      flagIds(computeRead({ ...EXAMPLE, fullTimeOnSigning: false }))
    ).toContain('gate_fullTime')
    expect(
      flagIds(computeRead({ ...EXAMPLE, finalTechnicalSay: false }))
    ).toContain('gate_finalSay')
    expect(
      flagIds(
        computeRead({
          ...EXAMPLE,
          joining: 'formation',
          finalTechnicalSay: false,
        })
      )
    ).not.toContain('gate_finalSay')
  })

  it('flag an inferred band', () => {
    const r = computeRead({
      ...EXAMPLE,
      role: 'engineer',
      responsibilities: ['architecture', 'shipped_mvp', 'infra_oncall'],
    })
    expect(r.band.confidence).toBe('inferred')
    expect(flagIds(r)).toContain('inferred_band')
  })

  it('promote the missing fully diluted count in shares mode', () => {
    const r = computeRead({
      ...EXAMPLE,
      offerMode: 'shares',
      optionCount: 50_000,
      fullyDilutedShares: '',
    })
    expect(r.offer.pct).toBeNull()
    expect(r.offer.missingFullyDiluted).toBe(true)
    const f = r.brief.flags.find((x) => x.id === 'missing_fully_diluted')
    expect(f).toBeDefined()
    expect(f.promoted).toBe(true)
    const blank = computeRead({
      ...EXAMPLE,
      offerMode: 'shares',
      optionCount: '',
      fullyDilutedShares: '',
    })
    expect(blank.offer.missingFullyDiluted).toBe(false)
  })
})

describe('questions and text', () => {
  it('lists the four questions to ask', () => {
    const r = computeRead(EXAMPLE)
    expect(r.brief.questionsToAsk).toBe(QUESTIONS_TO_ASK)
    expect(r.brief.questionsToAsk).toHaveLength(6)
    expect(r.brief.questionsToAsk.join(' ')).toMatch(/fully diluted/)
    expect(r.brief.questionsToAsk.join(' ')).toMatch(/option pool/)
    expect(r.brief.questionsToAsk.join(' ')).toMatch(/preference/)
    expect(r.brief.questionsToAsk.join(' ')).toMatch(/acceleration/)
  })

  it('renders a plain-text brief with every section', () => {
    const r = computeRead({ ...EXAMPLE, cliffMonths: 18 })
    const t = r.brief.text
    expect(t).toContain("AMWARE // FOUNDERS' DESK")
    expect(t).toContain(r.brief.headline)
    expect(t).toContain('Range: 8.5–15.5%')
    expect(t).toContain('Offer: 3%')
    expect(t).toContain('Adjustments')
    expect(t).toContain('Banked work')
    expect(t).toContain('Rounds')
    expect(t).toContain('no priced rounds assumed')
    expect(t).toContain('Exit scenarios')
    expect(t).toContain('not subtracted')
    expect(t).toContain('Flags')
    expect(t).toContain('Questions to ask')
    expect(t).toContain('Sources:')
    expect(t).toContain('Benchmarks updated')
    expect(t).toMatch(/not legal or financial advice/i)
    expect(t).not.toMatch(/NaN|undefined/)
  })

  it('says n/a (salaried) and not entered when adjustments do not apply', () => {
    const t = computeRead({
      ...EXAMPLE,
      joining: 'hired_after',
      offeredSalary: '',
    }).brief.text
    expect(t).toContain('Banked work: n/a (salaried)')
    expect(t).toContain('Salary: not entered')
  })
})

describe('formatters', () => {
  it('format percents and money for copy', () => {
    expect(fmtPct(11.5)).toBe('11.5')
    expect(fmtPct(0.1 + 0.2)).toBe('0.3')
    expect(fmtPct(null)).toBe('—')
    expect(fmtMoney(1_500_000_000)).toBe('$1.5B')
    expect(fmtMoney(25_000_000)).toBe('$25M')
    expect(fmtMoney(52_000)).toBe('$52k')
    expect(fmtMoney(850)).toBe('$850')
    expect(fmtMoney(-30_000)).toBe('-$30k')
  })
})
