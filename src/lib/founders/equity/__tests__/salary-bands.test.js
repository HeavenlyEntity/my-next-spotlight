import { describe, expect, it } from 'vitest'

import { CLASSES, ROLES, STAGES } from '../benchmarks.js'
import {
  BUCKETS,
  GEO,
  GEOS,
  INDUSTRIES,
  INDUSTRY,
  SALARY_BANDS,
  SALARY_SOURCES,
  bandFor,
  bucketFor,
  marketSalaryFor,
  multipliersFor,
} from '../salary-bands.js'

/* The defaults the store ships with. Test 30e in the plan: every INITIAL key
   must resolve in its own lookup table. The geo default was `us_national` in
   the first draft, which does not exist in GEO, and no test caught it. */
const STORE_DEFAULTS = { industry: 'saas', geo: 'remote_national', role: 'cto' }

const CONFIDENCES = ['sourced', 'interpolated', 'estimate']

describe('salary bands — shape and coverage', () => {
  it('covers every role, bucket and stage', () => {
    for (const role of ROLES) {
      for (const bucket of BUCKETS) {
        for (const stage of STAGES) {
          expect(
            SALARY_BANDS[role]?.[bucket]?.[stage],
            `${role}.${bucket}.${stage}`
          ).toBeDefined()
        }
      }
    }
  })

  /* Plan test 13. */
  it('every band row carries source, asOf and a known confidence', () => {
    for (const role of ROLES) {
      for (const bucket of BUCKETS) {
        for (const stage of STAGES) {
          const row = SALARY_BANDS[role][bucket][stage]
          const where = `${role}.${bucket}.${stage}`
          expect(typeof row.source, where).toBe('string')
          expect(row.source.length, where).toBeGreaterThan(0)
          expect(row.asOf, where).toMatch(/^\d{4}$/)
          expect(CONFIDENCES, where).toContain(row.confidence)
          /* p25 and p75 are derived everywhere, so they say so separately. */
          expect(row.spreadConfidence, where).toBe('interpolated')
        }
      }
    }
  })

  it('orders every band and keeps it positive', () => {
    for (const role of ROLES) {
      for (const bucket of BUCKETS) {
        for (const stage of STAGES) {
          const { p25, p50, p75 } = SALARY_BANDS[role][bucket][stage]
          const where = `${role}.${bucket}.${stage}`
          expect(p25, where).toBeGreaterThan(0)
          expect(p25, where).toBeLessThan(p50)
          expect(p50, where).toBeLessThan(p75)
        }
      }
    }
  })

  it('explains every row whose median is not sourced', () => {
    for (const role of ROLES) {
      for (const bucket of BUCKETS) {
        for (const stage of STAGES) {
          const row = SALARY_BANDS[role][bucket][stage]
          if (row.confidence === 'sourced') continue
          expect(
            row.note,
            `${role}.${bucket}.${stage} is ${row.confidence} and must say how it was derived`
          ).toBeTruthy()
        }
      }
    }
  })

  it('pays a founding CTO less than a hired one at every stage', () => {
    for (const stage of STAGES) {
      const founding = SALARY_BANDS.cto.founding[stage].p50
      const hired = SALARY_BANDS.cto.hired[stage].p50
      expect(founding, stage).toBeLessThan(hired)
      /* Kruze puts the discount at 30-40%; allow the derived rows some room. */
      const discount = 1 - founding / hired
      expect(discount, stage).toBeGreaterThan(0.2)
      expect(discount, stage).toBeLessThan(0.5)
    }
  })

  it('gives the engineer seat one band per stage, deliberately', () => {
    /* No public source splits engineer cash by founding versus hired, so both
       buckets share a row rather than the tool inventing a difference. */
    for (const stage of STAGES) {
      expect(SALARY_BANDS.engineer.founding[stage]).toBe(
        SALARY_BANDS.engineer.hired[stage]
      )
    }
  })

  it('rises with stage inside every role and bucket', () => {
    for (const role of ROLES) {
      for (const bucket of BUCKETS) {
        const medians = STAGES.map((s) => SALARY_BANDS[role][bucket][s].p50)
        for (let i = 1; i < medians.length; i += 1) {
          expect(
            medians[i],
            `${role}.${bucket} ${STAGES[i - 1]} -> ${STAGES[i]}`
          ).toBeGreaterThan(medians[i - 1])
        }
      }
    }
  })
})

describe('bucket resolution', () => {
  it('maps every classification, and pending falls back to hired', () => {
    for (const cls of CLASSES) {
      expect(BUCKETS, cls).toContain(bucketFor(cls))
    }
    expect(bucketFor('founder')).toBe('founding')
    expect(bucketFor('founding_executive')).toBe('founding')
    expect(bucketFor('hired_executive')).toBe('hired')
    expect(bucketFor('hire')).toBe('hired')
    /* A pending classification means we do not know they are a founder, and
       "market" is what the seat pays a hire. */
    expect(bucketFor('unknown')).toBe('hired')
    expect(bucketFor(undefined)).toBe('hired')
  })
})

describe('lookups never throw', () => {
  it('falls back rather than returning undefined on garbage', () => {
    for (const args of [
      ['nope', 'founding', 'seed'],
      ['cto', 'nope', 'seed'],
      ['cto', 'founding', 'nope'],
      [undefined, undefined, undefined],
    ]) {
      const row = bandFor(...args)
      expect(row, JSON.stringify(args)).toBeDefined()
      expect(typeof row.p50, JSON.stringify(args)).toBe('number')
      expect(Number.isFinite(row.p50)).toBe(true)
    }
  })

  it('falls back on unknown industry or geography', () => {
    const m = multipliersFor('cto', 'nope', 'nope')
    expect(m.industry.multiplier).toBe(1)
    expect(m.geo.multiplier).toBe(1)
    expect(m.combined).toBe(1)
  })
})

describe('industry and geography multipliers', () => {
  /* Plan test 13, second half. */
  it('every multiplier carries source, asOf and confidence', () => {
    for (const key of INDUSTRIES) {
      for (const role of ROLES) {
        const cell = INDUSTRY[key][role]
        const where = `INDUSTRY.${key}.${role}`
        expect(typeof cell.multiplier, where).toBe('number')
        expect(cell.multiplier, where).toBeGreaterThan(0)
        expect(cell.source, where).toBeTruthy()
        expect(cell.asOf, where).toMatch(/^\d{4}$/)
        expect(CONFIDENCES, where).toContain(cell.confidence)
      }
    }
    for (const key of GEOS) {
      const cell = GEO[key]
      expect(typeof cell.multiplier, key).toBe('number')
      expect(cell.source, key).toBeTruthy()
      expect(cell.asOf, key).toMatch(/^\d{4}$/)
      expect(CONFIDENCES, key).toContain(cell.confidence)
    }
  })

  /* Plan test 10. */
  it('saas and the US hub baseline are exactly 1.00', () => {
    for (const role of ROLES) {
      expect(INDUSTRY.saas[role].multiplier).toBe(1)
      expect(INDUSTRY.other[role].multiplier).toBe(1)
    }
    expect(GEO.us_hub.multiplier).toBe(1)
  })

  /* Plan test 8: the curves run in opposite directions, which is why the
     table is keyed by role rather than being a single scalar. */
  it('keys the curves by role: AI favours engineers, fintech favours executives', () => {
    expect(INDUSTRY.ai.engineer.multiplier).toBeGreaterThan(
      INDUSTRY.ai.cto.multiplier
    )
    expect(INDUSTRY.fintech.cto.multiplier).toBeGreaterThan(
      INDUSTRY.fintech.engineer.multiplier
    )
  })

  it('keeps the AI premium near 1.1x, not the frontier-lab 3x', () => {
    /* Strip OpenAI and Anthropic out and the vertical collapses to about 1.1x.
       A large multiplier would be wrong for almost every AI startup. */
    expect(INDUSTRY.ai.engineer.multiplier).toBeLessThan(1.25)
    expect(INDUSTRY.ai.engineer.multiplier).toBeGreaterThan(1.05)
  })

  it('combines industry and geography multiplicatively', () => {
    const m = multipliersFor('engineer', 'ai', 'bay_nyc')
    expect(m.combined).toBeCloseTo(
      INDUSTRY.ai.engineer.multiplier * GEO.bay_nyc.multiplier,
      4
    )
  })
})

describe('the single market number (DD4)', () => {
  it('is the hired band median for every role and stage', () => {
    for (const role of ROLES) {
      for (const stage of STAGES) {
        expect(marketSalaryFor(role, stage), `${role}.${stage}`).toBe(
          SALARY_BANDS[role].hired[stage].p50
        )
      }
    }
  })

  it('always exceeds the founding band, which is the founder discount', () => {
    for (const stage of STAGES) {
      expect(marketSalaryFor('cto', stage), stage).toBeGreaterThan(
        SALARY_BANDS.cto.founding[stage].p50
      )
    }
  })

  it('never returns NaN, even for a role or stage that does not exist', () => {
    expect(Number.isFinite(marketSalaryFor('nope', 'nope'))).toBe(true)
  })
})

describe('store defaults resolve (plan test 30e)', () => {
  it('every documented default exists in its own table', () => {
    expect(INDUSTRIES).toContain(STORE_DEFAULTS.industry)
    expect(GEOS).toContain(STORE_DEFAULTS.geo)
    expect(ROLES).toContain(STORE_DEFAULTS.role)
    expect(GEO[STORE_DEFAULTS.geo]).toBeDefined()
    expect(INDUSTRY[STORE_DEFAULTS.industry]).toBeDefined()
  })

  it('the default combination produces a real multiplier, not undefined', () => {
    const m = multipliersFor(
      STORE_DEFAULTS.role,
      STORE_DEFAULTS.industry,
      STORE_DEFAULTS.geo
    )
    expect(Number.isFinite(m.combined)).toBe(true)
    expect(m.combined).toBeGreaterThan(0)
  })
})

describe('sources', () => {
  it('every source has an id, a name, a year and a url', () => {
    for (const s of SALARY_SOURCES) {
      expect(s.id, s.name).toMatch(/^[a-z_]+$/)
      expect(s.name.length).toBeGreaterThan(0)
      expect(s.asOf).toMatch(/^\d{4}$/)
      expect(s.url).toMatch(/^https:\/\//)
    }
  })

  it('names Pilot without letting it be averaged with Kruze', () => {
    /* The two disagree roughly 2x on founder pay for methodological reasons.
       Pilot is disclosed for contrast, never blended into a row. */
    const pilot = SALARY_SOURCES.find((s) => s.id === 'pilot_founder')
    expect(pilot).toBeDefined()
    expect(pilot.name).toMatch(/never averaged/i)
  })
})
