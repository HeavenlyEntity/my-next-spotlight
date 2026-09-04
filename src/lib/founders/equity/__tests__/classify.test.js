import { describe, it, expect } from 'vitest'
import { classify, scoreResponsibilities } from '../classify.js'
import { normalizeInputs } from '../normalize.js'
import { CHIPS, ROLES, STAGES } from '../benchmarks.js'
import { chipsForClass } from './helpers.js'

const read = (raw) => classify(normalizeInputs(raw))
const allChips = (role) => CHIPS[role].map((c) => c.id)

describe('chip weights', () => {
  it('sum to 8.5 for every role', () => {
    for (const role of ROLES) {
      const sum = CHIPS[role].reduce((s, c) => s + c.weight, 0)
      expect(sum).toBeCloseTo(8.5, 5)
    }
  })

  it('scores selected chips and reports counts', () => {
    const s = scoreResponsibilities('cto', ['architecture', 'shipped_mvp'])
    expect(s.score).toBe(2.5)
    expect(s.selected).toBe(2)
    expect(s.total).toBe(8)
  })
})

describe('formation', () => {
  it('is always founder for every role and stage, light below score 3', () => {
    for (const role of ROLES) {
      for (const stage of STAGES) {
        const none = read({
          role,
          stage,
          joining: 'formation',
          responsibilities: [],
        })
        expect(none.class).toBe('founder')
        expect(none.light).toBe(true)
        expect(none.pending).toBe(false)
        const full = read({
          role,
          stage,
          joining: 'formation',
          responsibilities: allChips(role),
        })
        expect(full.class).toBe('founder')
        expect(full.light).toBe(false)
      }
    }
  })

  it('ignores the gates', () => {
    const c = read({
      joining: 'formation',
      fullTimeOnSigning: false,
      finalTechnicalSay: false,
      responsibilities: allChips('cto'),
    })
    expect(c.class).toBe('founder')
    expect(c.gated).toBeNull()
  })
})

describe('fractional conversion to founder', () => {
  const base = {
    role: 'cto',
    joining: 'fractional_conversion',
    responsibilities: allChips('cto'),
    months: 6,
    stage: 'preseed',
  }

  it('reaches founder only with score ≥ 6, months ≥ 6 and stage ≤ preseed', () => {
    const ok = read(base)
    expect(ok.class).toBe('founder')
    expect(ok.deFacto).toBe(true)
    expect(read({ ...base, stage: 'idea' }).class).toBe('founder')
    expect(read({ ...base, months: 5 }).class).toBe('founding_executive')
    expect(read({ ...base, stage: 'seed' }).class).toBe('founding_executive')
    expect(read({ ...base, stage: 'series_a' }).class).toBe(
      'founding_executive'
    )
    expect(
      read({
        ...base,
        responsibilities: chipsForClass('cto', 'founding_executive'),
      }).class
    ).toBe('founding_executive')
  })

  it('needs a score of exactly 6 or more', () => {
    // architecture 1 + shipped_mvp 1.5 + hired_engineers 1 + owned_roadmap 1 + investor_diligence 1 + ops_vendors 1 = 6.5
    const six = [
      'architecture',
      'shipped_mvp',
      'hired_engineers',
      'owned_roadmap',
      'investor_diligence',
      'ops_vendors',
    ]
    expect(read({ ...base, responsibilities: six }).class).toBe('founder')
    // drop ops_vendors → 5.5
    expect(read({ ...base, responsibilities: six.slice(0, 5) }).class).toBe(
      'founding_executive'
    )
  })

  it('never reaches founder when hired after formation', () => {
    const c = read({ ...base, joining: 'hired_after', months: 24 })
    expect(c.class).toBe('founding_executive')
    expect(c.deFacto).toBe(false)
  })
})

describe('score thresholds', () => {
  it('maps score to class for every role', () => {
    for (const role of ROLES) {
      for (const cls of ['founding_executive', 'hired_executive', 'hire']) {
        const c = read({
          role,
          joining: 'hired_after',
          responsibilities: chipsForClass(role, cls),
        })
        expect(c.class).toBe(cls)
      }
    }
  })

  it('uses 3.5 and 2 as the boundaries', () => {
    // cto: architecture 1 + shipped_mvp 1.5 + hired_engineers 1 = 3.5
    expect(
      read({
        joining: 'hired_after',
        responsibilities: ['architecture', 'shipped_mvp', 'hired_engineers'],
      }).class
    ).toBe('founding_executive')
    // 1 + 1.5 = 2.5
    expect(
      read({
        joining: 'hired_after',
        responsibilities: ['architecture', 'shipped_mvp'],
      }).class
    ).toBe('hired_executive')
    // 1 + 1 = 2
    expect(
      read({
        joining: 'hired_after',
        responsibilities: ['architecture', 'hired_engineers'],
      }).class
    ).toBe('hired_executive')
    // 0.5 + 1 = 1.5
    expect(
      read({
        joining: 'hired_after',
        responsibilities: ['infra_oncall', 'architecture'],
      }).class
    ).toBe('hire')
  })
})

describe('gates', () => {
  it('cap non-formation classes at hired_executive and name the gate', () => {
    const full = {
      joining: 'fractional_conversion',
      responsibilities: allChips('cto'),
      months: 12,
    }
    const ft = read({ ...full, fullTimeOnSigning: false })
    expect(ft.class).toBe('hired_executive')
    expect(ft.gated).toBe('fullTime')
    expect(ft.deFacto).toBe(false)
    expect(ft.gloss).toMatch(/full-time/i)
    const fs = read({ ...full, finalTechnicalSay: false })
    expect(fs.class).toBe('hired_executive')
    expect(fs.gated).toBe('finalSay')
    expect(fs.gloss).toMatch(/technical say/i)
    const hire = read({
      joining: 'hired_after',
      responsibilities: ['infra_oncall'],
      fullTimeOnSigning: false,
    })
    expect(hire.class).toBe('hire')
    expect(hire.gated).toBe('fullTime')
  })

  it('reports gate booleans', () => {
    const c = read({
      joining: 'hired_after',
      responsibilities: ['architecture'],
      finalTechnicalSay: 'no',
    })
    expect(c.gates).toEqual({ fullTime: true, finalSay: false })
  })
})

describe('pending', () => {
  it('is unknown with zero chips on a non-formation path', () => {
    for (const joining of ['fractional_conversion', 'hired_after']) {
      const c = read({ joining, responsibilities: [] })
      expect(c.class).toBe('unknown')
      expect(c.pending).toBe(true)
      expect(c.score).toBe(0)
      expect(c.gloss).toMatch(/pick what was yours/i)
    }
  })
})
