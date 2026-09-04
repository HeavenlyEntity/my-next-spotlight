import { describe, it, expect } from 'vitest'
import { founderBand, resolveBand } from '../bands.js'
import { normalizeInputs } from '../normalize.js'
import { classify } from '../classify.js'
import {
  CLASSES,
  NON_FOUNDER_BANDS,
  ROLES,
  STAGES,
  TEAM_POOL,
  CHIPS,
} from '../benchmarks.js'

const NON_FOUNDER = ['founding_executive', 'hired_executive', 'hire']

describe('benchmark rows', () => {
  it('carry lo, hi, source, asOf and confidence for every role × class × stage', () => {
    for (const role of ROLES) {
      for (const cls of NON_FOUNDER) {
        for (const stage of STAGES) {
          const r = NON_FOUNDER_BANDS[role][cls][stage]
          expect(r, `${role}/${cls}/${stage}`).toBeDefined()
          expect(r.lo).toBeGreaterThan(0)
          expect(r.hi).toBeGreaterThan(r.lo)
          expect(typeof r.source).toBe('string')
          expect(typeof r.asOf).toBe('string')
          expect(['sourced', 'inferred']).toContain(r.confidence)
        }
      }
    }
  })

  it('mark engineer and ceo_builder rows as inferred', () => {
    for (const cls of NON_FOUNDER) {
      for (const stage of STAGES) {
        expect(NON_FOUNDER_BANDS.engineer[cls][stage].confidence).toBe(
          'inferred'
        )
        expect(NON_FOUNDER_BANDS.ceo_builder[cls][stage].confidence).toBe(
          'inferred'
        )
        expect(NON_FOUNDER_BANDS.cto[cls][stage].confidence).toBe('sourced')
      }
    }
  })

  it('define the team pool per stage with provenance', () => {
    expect(TEAM_POOL.preseed.value).toBe(90)
    expect(TEAM_POOL.seed.value).toBe(56)
    expect(TEAM_POOL.series_a.value).toBe(36)
    expect(TEAM_POOL.series_b_plus.value).toBe(27)
    for (const stage of STAGES) {
      expect(['sourced', 'inferred']).toContain(TEAM_POOL[stage].confidence)
      expect(typeof TEAM_POOL[stage].source).toBe('string')
    }
  })

  it('list the four classes', () => {
    expect(CLASSES).toEqual([
      'founder',
      'founding_executive',
      'hired_executive',
      'hire',
    ])
  })
})

describe('founderBand', () => {
  it('never exceeds the pool for founders 1..6 at any role and stage', () => {
    for (const role of ROLES) {
      for (const stageKey of STAGES) {
        const pool = TEAM_POOL[stageKey].value
        for (let founders = 1; founders <= 6; founders += 1) {
          const b = founderBand({ role, stageKey, founders })
          expect(b.lo).toBeGreaterThan(0)
          expect(b.hi).toBeGreaterThan(b.lo)
          expect(b.hi).toBeLessThanOrEqual(pool + 1e-9)
          if (founders > 1) {
            const base = pool / founders
            expect(b.hi).toBeLessThanOrEqual(
              pool - (founders - 1) * 0.5 * base + 1e-9
            )
            expect(b.hi).toBeLessThanOrEqual(1.25 * base + 1e-9)
            if (role === 'ceo_builder') expect(b.lo).toBeCloseTo(base, 9)
            else expect(b.lo).toBeCloseTo(0.75 * base, 9)
          }
        }
      }
    }
  })

  it('gives a solo founder 0.75·pool to pool', () => {
    const b = founderBand({ role: 'cto', stageKey: 'seed', founders: 1 })
    expect(b.lo).toBeCloseTo(0.75 * 56, 9)
    expect(b.hi).toBe(56)
  })

  it('matches the worked example: two CTO founders at pre-seed', () => {
    const b = founderBand({ role: 'cto', stageKey: 'preseed', founders: 2 })
    expect(b.lo).toBeCloseTo(33.75, 9)
    expect(b.hi).toBeCloseTo(56.25, 9)
  })
})

describe('resolveBand', () => {
  const allChips = (role) => CHIPS[role].map((c) => c.id)

  it('returns the founder band for formation and the bottom third when light', () => {
    const full = normalizeInputs({
      joining: 'formation',
      founders: 2,
      responsibilities: allChips('cto'),
    })
    const fb = resolveBand(full, classify(full))
    expect(fb.lo).toBeCloseTo(33.75, 9)
    expect(fb.hi).toBeCloseTo(56.25, 9)
    expect(fb.pool).toBe(90)
    expect(fb.label).toBe('Founder')

    const light = normalizeInputs({
      joining: 'formation',
      founders: 2,
      responsibilities: [],
    })
    const lb = resolveBand(light, classify(light))
    expect(lb.lo).toBeCloseTo(33.75, 9)
    expect(lb.hi).toBeCloseTo(33.75 + (56.25 - 33.75) / 3, 9)
    expect(lb.label).toMatch(/light/i)
  })

  it('resolves every non-founder cell with provenance', () => {
    for (const role of ROLES) {
      for (const cls of NON_FOUNDER) {
        for (const stageKey of STAGES) {
          const b = resolveBand({ role, stageKey, founders: 2 }, { class: cls })
          const r = NON_FOUNDER_BANDS[role][cls][stageKey]
          expect(b.lo).toBe(r.lo)
          expect(b.hi).toBe(r.hi)
          expect(b.source).toBe(r.source)
          expect(b.asOf).toBe(r.asOf)
          expect(b.confidence).toBe(r.confidence)
          expect(typeof b.label).toBe('string')
        }
      }
    }
  })

  it('spans hire.lo to founding_executive.hi for an unknown class', () => {
    for (const role of ROLES) {
      for (const stageKey of STAGES) {
        const b = resolveBand(
          { role, stageKey, founders: 2 },
          { class: 'unknown', pending: true }
        )
        expect(b.lo).toBe(NON_FOUNDER_BANDS[role].hire[stageKey].lo)
        expect(b.hi).toBe(
          NON_FOUNDER_BANDS[role].founding_executive[stageKey].hi
        )
        expect(b.label).toBe('Possible range')
      }
    }
  })

  it('maps idea to the preseed tables', () => {
    const n = normalizeInputs({
      stage: 'idea',
      joining: 'hired_after',
      responsibilities: ['infra_oncall'],
    })
    const b = resolveBand(n, classify(n))
    expect(b.lo).toBe(NON_FOUNDER_BANDS.cto.hire.preseed.lo)
  })
})
