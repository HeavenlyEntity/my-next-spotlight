import { describe, it, expect } from 'vitest'
import {
  computeRead,
  EXAMPLE_READ,
  positionFor,
  resolveOfferPct,
} from '../engine.js'
import { resolveBand } from '../bands.js'
import { roundRange } from '../rounding.js'
import { normalizeInputs } from '../normalize.js'
import {
  CHIPS,
  EXAMPLE,
  JOINING,
  PATHS,
  ROLES,
  SOURCES,
  STAGES,
} from '../benchmarks.js'
import { chipsForClass, findBadNumbers, seededRandom } from './helpers.js'

const ADJUSTMENTS = [-2, 0, 1.8, 7]
const NON_FOUNDER = ['founding_executive', 'hired_executive', 'hire']
const ALL_STAGES = ['idea', ...STAGES]

describe('table: every band × adjustment rounds to 0 < lo < hi', () => {
  it('holds for founders 1..6, every non-founder class, and the unknown span', () => {
    let cells = 0
    for (const role of ROLES) {
      for (const stageKey of STAGES) {
        const bands = []
        for (let founders = 1; founders <= 6; founders += 1) {
          bands.push(
            resolveBand(
              { role, stageKey, founders },
              { class: 'founder', light: false }
            )
          )
          bands.push(
            resolveBand(
              { role, stageKey, founders },
              { class: 'founder', light: true }
            )
          )
        }
        for (const cls of NON_FOUNDER)
          bands.push(
            resolveBand({ role, stageKey, founders: 2 }, { class: cls })
          )
        bands.push(
          resolveBand(
            { role, stageKey, founders: 2 },
            { class: 'unknown', pending: true }
          )
        )
        for (const band of bands) {
          expect(band.lo).toBeGreaterThan(0)
          expect(band.hi).toBeGreaterThan(band.lo)
          for (const adj of ADJUSTMENTS) {
            const r = roundRange(band.lo + adj, band.hi + adj)
            cells += 1
            expect(
              r.lo,
              `${role}/${stageKey}/${band.label}/${adj}`
            ).toBeGreaterThan(0)
            expect(
              r.hi,
              `${role}/${stageKey}/${band.label}/${adj}`
            ).toBeGreaterThan(r.lo)
            expect(r.lo).toBeGreaterThanOrEqual(0.05)
          }
        }
      }
    }
    expect(cells).toBe(
      ROLES.length * STAGES.length * (12 + 3 + 1) * ADJUSTMENTS.length
    )
  })
})

describe('table: computeRead over role × joining × stage × class', () => {
  it('resolves the expected class and a positive rounded range', () => {
    for (const role of ROLES) {
      for (const joining of JOINING) {
        for (const stage of ALL_STAGES) {
          for (const cls of ['founder', ...NON_FOUNDER]) {
            const raw = {
              role,
              joining,
              stage,
              founders: 3,
              months: 12,
              responsibilities: chipsForClass(role, cls),
              offeredEquityPct: 2,
            }
            const read = computeRead(raw)
            const label = `${role}/${joining}/${stage}/${cls}`
            expect(findBadNumbers(read), label).toEqual([])
            expect(read.offer.range.lo, label).toBeGreaterThan(0)
            expect(read.offer.range.hi, label).toBeGreaterThan(
              read.offer.range.lo
            )
            expect(typeof read.band.source).toBe('string')
            expect(['sourced', 'inferred']).toContain(read.band.confidence)
            expect(['below', 'within', 'above']).toContain(read.offer.position)

            if (joining === 'formation') {
              expect(read.classification.class, label).toBe('founder')
            } else if (cls === 'founder') {
              const reachable =
                joining === 'fractional_conversion' &&
                read.inputs.stageKey === 'preseed'
              expect(read.classification.class, label).toBe(
                reachable ? 'founder' : 'founding_executive'
              )
              expect(read.classification.deFacto, label).toBe(reachable)
            } else {
              expect(read.classification.class, label).toBe(cls)
            }
          }
        }
      }
    }
  })

  it('formation founders never exceed the pool cap for founders 1..6', () => {
    for (const stage of STAGES) {
      for (let founders = 1; founders <= 6; founders += 1) {
        const read = computeRead({
          joining: 'formation',
          stage,
          founders,
          responsibilities: CHIPS.cto.map((c) => c.id),
        })
        const pool = read.band.pool
        if (founders === 1) {
          expect(read.band.hi).toBe(pool)
        } else {
          const base = pool / founders
          expect(read.band.hi).toBeLessThanOrEqual(
            pool - (founders - 1) * 0.5 * base + 1e-9
          )
        }
      }
    }
  })
})

describe('offer resolution', () => {
  it('converts shares to percent with a fully diluted count', () => {
    const r = computeRead({
      ...EXAMPLE,
      offerMode: 'shares',
      optionCount: 50_000,
      fullyDilutedShares: 10_000_000,
    })
    expect(r.offer.mode).toBe('shares')
    expect(r.offer.pct).toBe(0.5)
    expect(r.offer.position).toBe('below')
    expect(
      resolveOfferPct(
        normalizeInputs({
          offerMode: 'shares',
          optionCount: 5,
          fullyDilutedShares: 0,
        })
      )
    ).toEqual({
      pct: null,
      mode: 'shares',
      missingFullyDiluted: true,
    })
    expect(
      resolveOfferPct(
        normalizeInputs({
          offerMode: 'shares',
          optionCount: 20,
          fullyDilutedShares: 10,
        })
      ).pct
    ).toBe(100)
  })

  it('ignores share fields in percent mode', () => {
    const r = computeRead({
      ...EXAMPLE,
      offerMode: 'percent',
      offeredEquityPct: '',
      optionCount: 10,
      fullyDilutedShares: 100,
    })
    expect(r.offer.pct).toBeNull()
    expect(r.offer.position).toBe('unknown')
  })

  it('positions against the rounded range', () => {
    const range = { lo: 8, hi: 15 }
    expect(positionFor(7.99, range, false)).toBe('below')
    expect(positionFor(8, range, false)).toBe('within')
    expect(positionFor(15, range, false)).toBe('within')
    expect(positionFor(15.01, range, false)).toBe('above')
    expect(positionFor(null, range, false)).toBe('unknown')
    expect(positionFor(10, range, true)).toBe('unknown')
  })

  it('reports the gap in points only when below', () => {
    expect(computeRead(EXAMPLE).offer.gapPts).toEqual([5, 12])
    expect(
      computeRead({ ...EXAMPLE, offeredEquityPct: 9 }).offer.gapPts
    ).toBeNull()
  })
})

describe('EXAMPLE_READ', () => {
  it('is the canonical hero read', () => {
    expect(EXAMPLE_READ.inputs.role).toBe('cto')
    expect(EXAMPLE_READ.inputs.stageKey).toBe('preseed')
    expect(EXAMPLE_READ.inputs.joining).toBe('fractional_conversion')
    expect(EXAMPLE_READ.classification.class).toBe('founding_executive')
    expect(EXAMPLE_READ.band).toMatchObject({
      lo: 8,
      hi: 15,
      confidence: 'sourced',
    })
    expect(EXAMPLE_READ.adjustments.total).toBe(0)
    expect(EXAMPLE_READ.offer).toMatchObject({
      pct: 3,
      mode: 'percent',
      position: 'below',
    })
    expect(EXAMPLE_READ.offer.range).toEqual({
      lo: 8,
      hi: 15,
      grain: 0.5,
      mid: 11.5,
    })
    expect(EXAMPLE_READ.offer.gapPts).toEqual([5, 12])
    expect(EXAMPLE_READ.offer.numberToSay.value).toBe(11.5)
    expect(EXAMPLE_READ.preselectedPath).toBe('ipo')
    expect(Object.isFrozen(EXAMPLE_READ)).toBe(true)
  })

  it('exposes the Read contract keys', () => {
    for (const key of [
      'inputs',
      'classification',
      'band',
      'adjustments',
      'offer',
      'rounds',
      'scenarios',
      'brief',
      'sources',
    ]) {
      expect(EXAMPLE_READ).toHaveProperty(key)
    }
    expect(Object.keys(EXAMPLE_READ.rounds)).toEqual([
      'bootstrap',
      'acquisition',
      'ipo',
    ])
    expect(Object.keys(EXAMPLE_READ.scenarios)).toEqual([
      'bootstrap',
      'acquisition',
      'ipo',
    ])
    expect(EXAMPLE_READ.sources).toHaveLength(SOURCES.length)
    for (const s of EXAMPLE_READ.sources) {
      expect(typeof s.name).toBe('string')
      expect(typeof s.asOf).toBe('string')
    }
    expect(EXAMPLE_READ.askSanity).toEqual({
      acquisition: EXAMPLE_READ.scenarios.acquisition[2].value,
      ipo: EXAMPLE_READ.scenarios.ipo[2].value,
    })
  })
})

describe('adjustments and rounds through the engine', () => {
  it('banks work only for fractional conversions', () => {
    const work = { ...EXAMPLE, feesBilled: 0, offeredSalary: '' }
    const f = computeRead(work)
    expect(f.adjustments.banked.applied).toBe(true)
    expect(f.adjustments.banked.pts).toBeGreaterThan(0)
    expect(f.offer.range.lo).toBeGreaterThan(8)
    const h = computeRead({ ...work, joining: 'hired_after' })
    expect(h.adjustments.banked.applied).toBe(false)
    expect(h.offer.range.lo).toBe(8)
  })

  it('applies the salary adjustment only when an offered salary is entered', () => {
    const none = computeRead({ ...EXAMPLE, offeredSalary: '' })
    expect(none.adjustments.salary.applied).toBe(false)
    const zero = computeRead({ ...EXAMPLE, offeredSalary: 0 })
    expect(zero.adjustments.salary.applied).toBe(true)
    expect(zero.adjustments.salary.pts).toBe(3.6)
    expect(zero.offer.range.lo).toBe(11.5)
  })

  it('preselects acquisition when the path is unknown and still computes all paths', () => {
    const r = computeRead({ ...EXAMPLE, path: 'unknown' })
    expect(r.preselectedPath).toBe('acquisition')
    expect(r.rounds.ipo).toHaveLength(6)
    expect(r.scenarios.ipo).toHaveLength(4)
    for (const path of PATHS)
      expect(computeRead({ ...EXAMPLE, path }).preselectedPath).not.toBe(
        'unknown'
      )
  })

  it('passes roundsBeforeExit through with the clamp', () => {
    const r = computeRead({
      ...EXAMPLE,
      stage: 'series_a',
      roundsBeforeExit: { acquisition: 9 },
    })
    expect(r.dilution.applied.acquisition).toBe(4)
    expect(r.dilution.clamped.acquisition).toBe(true)
    expect(r.rounds.acquisition).toHaveLength(4)
  })

  it('accepts valuation overrides', () => {
    const r = computeRead(EXAMPLE, {
      valuations: { ipo: { base: 1_000_000_000 } },
    })
    expect(r.scenarios.ipo[2].valuation).toBe(1_000_000_000)
    expect(r.askSanity.ipo).toBe(r.scenarios.ipo[2].value)
  })
})

describe('never throws, never NaN', () => {
  it('survives garbage inputs', () => {
    const cases = [
      undefined,
      null,
      'x',
      42,
      [],
      { role: {}, stage: [], responsibilities: { a: 1 } },
      {
        months: Infinity,
        hoursPerWeek: -Infinity,
        offeredEquityPct: NaN,
        founders: 'many',
      },
      { offerMode: 'shares', optionCount: 1e300, fullyDilutedShares: 1e-300 },
      { roundsBeforeExit: 'lots', path: null },
    ]
    for (const c of cases) {
      const read = computeRead(c)
      expect(findBadNumbers(read)).toEqual([])
      expect(typeof read.brief.text).toBe('string')
    }
    expect(computeRead(EXAMPLE, 'bad options').offer.pct).toBe(3)
  })

  it('fuzz: 1,000 seeded random inputs', () => {
    const rnd = seededRandom(20260903)
    const pick = (arr) => arr[Math.floor(rnd() * arr.length)]
    const junk = () =>
      pick([
        '',
        null,
        undefined,
        NaN,
        Infinity,
        -Infinity,
        'abc',
        '1e9',
        '$120,000',
        '3%',
        true,
        [],
        {},
        -1,
        0,
        0.001,
        1e15,
        rnd() * 100,
        rnd() * 1e7,
        Math.round(rnd() * 200) - 50,
      ])
    const enumOrJunk = (arr) => (rnd() < 0.8 ? pick(arr) : junk())
    const allChipIds = [
      ...new Set(
        Object.values(CHIPS)
          .flat()
          .map((c) => c.id)
      ),
    ]
    for (let i = 0; i < 1000; i += 1) {
      const role = enumOrJunk(ROLES)
      const raw = {
        role,
        joining: enumOrJunk(JOINING),
        stage: enumOrJunk(ALL_STAGES),
        path: enumOrJunk(PATHS),
        founders: junk(),
        fullTimeOnSigning: pick([true, false, 'no', 'yes', undefined, junk()]),
        finalTechnicalSay: pick([true, false, 'no', 'yes', undefined, junk()]),
        responsibilities:
          rnd() < 0.85 ? allChipIds.filter(() => rnd() < 0.5) : junk(),
        months: junk(),
        hoursPerWeek: junk(),
        ratePerHour: junk(),
        feesBilled: junk(),
        marketSalary: junk(),
        offeredSalary: junk(),
        offerMode: enumOrJunk(['percent', 'shares']),
        offeredEquityPct: junk(),
        optionCount: junk(),
        fullyDilutedShares: junk(),
        strikePrice: junk(),
        instrument: enumOrJunk(['options', 'restricted_stock', 'unsure']),
        vestingYears: junk(),
        cliffMonths: junk(),
        roundsBeforeExit:
          rnd() < 0.5
            ? { bootstrap: junk(), acquisition: junk(), ipo: junk() }
            : junk(),
      }
      let read
      expect(() => {
        read = computeRead(
          raw,
          rnd() < 0.3 ? { valuations: { acquisition: { base: junk() } } } : {}
        )
      }, `case ${i}`).not.toThrow()
      expect(findBadNumbers(read), `case ${i}: ${JSON.stringify(raw)}`).toEqual(
        []
      )
      expect(read.offer.range.lo, `case ${i}`).toBeGreaterThan(0)
      expect(read.offer.range.hi, `case ${i}`).toBeGreaterThan(
        read.offer.range.lo
      )
      expect(['below', 'within', 'above', 'unknown']).toContain(
        read.offer.position
      )
      expect(read.brief.text).not.toMatch(/NaN|undefined/)
      for (const path of ['bootstrap', 'acquisition', 'ipo']) {
        expect(read.scenarios[path]).toHaveLength(4)
        expect(read.scenarios[path][0].id).toBe('zero')
      }
    }
  })
})
