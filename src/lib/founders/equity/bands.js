import { LABELS, NON_FOUNDER_BANDS, TEAM_POOL } from './benchmarks.js'

const FOUNDER_LO = 0.75
const FOUNDER_HI = 1.25
const SIBLING_FLOOR = 0.5
const SOLO_LO = 0.75

/**
 * Founder band from the stage's founding-team pool.
 * base = pool / founders; lo = 0.75·base (ceo_builder: base);
 * hi = min(1.25·base, pool − (founders − 1)·0.5·base). Solo: [0.75·pool, pool].
 * @param {{ role: string, stageKey: string, founders: number }} args
 * @returns {{ lo: number, hi: number, pool: number, base: number }}
 */
export function founderBand({ role, stageKey, founders }) {
  const pool = TEAM_POOL[stageKey].value
  const n = Math.min(6, Math.max(1, Math.round(founders || 1)))
  if (n === 1) return { lo: SOLO_LO * pool, hi: pool, pool, base: pool }
  const base = pool / n
  const lo = role === 'ceo_builder' ? base : FOUNDER_LO * base
  const hi = Math.min(FOUNDER_HI * base, pool - (n - 1) * SIBLING_FLOOR * base)
  return { lo, hi, pool, base }
}

/**
 * Resolve the unadjusted band for a classified seat.
 * `unknown` spans hire.lo → founding_executive.hi for the role and stage.
 * A light-load founder sits in the bottom third of the founder band.
 * @param {object} inputs normalized inputs
 * @param {{ class: string, light?: boolean }} classification
 * @returns {{ lo: number, hi: number, pool: number, source: string, asOf: string,
 *   confidence: 'sourced'|'inferred', label: string }}
 */
export function resolveBand(inputs, classification) {
  const { role, stageKey, founders } = inputs
  const cls = classification.class
  const pool = TEAM_POOL[stageKey]

  if (cls === 'founder') {
    const f = founderBand({ role, stageKey, founders })
    const lo = f.lo
    const hi = classification.light ? lo + (f.hi - lo) / 3 : f.hi
    return Object.freeze({
      lo,
      hi,
      pool: f.pool,
      source: `Founding-team pool ${f.pool}% at ${LABELS.stage[stageKey]} (${
        pool.source
      }) split across ${founders} founder${founders === 1 ? '' : 's'}`,
      asOf: pool.asOf,
      confidence: pool.confidence,
      label: classification.light
        ? `${LABELS.class.founder} (light load)`
        : LABELS.class.founder,
    })
  }

  const rows = NON_FOUNDER_BANDS[role]
  if (cls === 'unknown') {
    const lo = rows.hire[stageKey]
    const hi = rows.founding_executive[stageKey]
    return Object.freeze({
      lo: lo.lo,
      hi: hi.hi,
      pool: pool.value,
      source: `Span from hire to founding executive (${hi.source})`,
      asOf: hi.asOf,
      confidence:
        lo.confidence === 'sourced' && hi.confidence === 'sourced'
          ? 'sourced'
          : 'inferred',
      label: LABELS.class.unknown,
    })
  }

  const r = rows[cls][stageKey]
  return Object.freeze({
    lo: r.lo,
    hi: r.hi,
    pool: pool.value,
    source: r.source,
    asOf: r.asOf,
    confidence: r.confidence,
    label: LABELS.class[cls],
  })
}
