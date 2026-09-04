import { DILUTION_ROUNDS, REMAINING_ROUNDS } from './benchmarks.js'

export const EXIT_PATHS = Object.freeze(['bootstrap', 'acquisition', 'ipo'])
const ACQUISITION_ROUNDS = 2

/**
 * Rounds still ahead of a company at a stage, with their median dilution.
 * @param {string} stageKey
 * @returns {Array<{ round: string, label: string, d: number }>}
 */
export function remainingRounds(stageKey) {
  const ids = REMAINING_ROUNDS[stageKey] || REMAINING_ROUNDS.preseed
  return ids.map((id) => {
    const r = DILUTION_ROUNDS[id]
    return { round: r.id, label: r.label, d: r.d }
  })
}

/**
 * Default number of rounds before exit per path: bootstrap 0, acquisition the
 * first two remaining, ipo all remaining.
 * @param {string} path
 * @param {number} remainingCount
 * @returns {number}
 */
export function defaultRoundsForPath(path, remainingCount) {
  if (path === 'bootstrap') return 0
  if (path === 'acquisition')
    return Math.min(ACQUISITION_ROUNDS, remainingCount)
  return remainingCount
}

/**
 * Apply the first `count` rounds to the offer and midpoint stakes.
 * @param {Array<{ round: string, label: string, d: number }>} remaining
 * @param {number} count
 * @param {number|null} offerPct
 * @param {number} midPct
 * @returns {Array<{ round: string, label: string, d: number, stakeOffer: number|null, stakeMid: number }>}
 */
export function applyRounds(remaining, count, offerPct, midPct) {
  const series = []
  let offer = offerPct
  let mid = midPct
  for (let i = 0; i < count && i < remaining.length; i += 1) {
    const r = remaining[i]
    offer = offer === null ? null : offer * (1 - r.d)
    mid = mid * (1 - r.d)
    series.push({
      round: r.round,
      label: r.label,
      d: r.d,
      stakeOffer: offer === null ? null : Number(offer.toFixed(4)),
      stakeMid: Number(mid.toFixed(4)),
    })
  }
  return series
}

/**
 * Stake series through the rounds for all three exit paths. `roundsBeforeExit`
 * overrides per path are clamped to the rounds remaining at the stage.
 * @param {object} inputs normalized inputs (stageKey, roundsBeforeExit)
 * @param {{ offerPct: number|null, midPct: number }} start
 * @returns {{ series: Record<string, Array>, applied: Record<string, number>,
 *   defaults: Record<string, number>, clamped: Record<string, boolean>,
 *   remaining: Array, exitStakes: Record<string, { offer: number|null, mid: number }> }}
 */
export function computeDilution(inputs, { offerPct, midPct }) {
  const remaining = remainingRounds(inputs.stageKey)
  const overrides = inputs.roundsBeforeExit || {}
  const series = {}
  const applied = {}
  const defaults = {}
  const clamped = {}
  const exitStakes = {}
  const safeOffer = Number.isFinite(offerPct) ? offerPct : null
  const safeMid = Number.isFinite(midPct) ? midPct : 0

  for (const path of EXIT_PATHS) {
    const def = defaultRoundsForPath(path, remaining.length)
    const override = overrides[path]
    let count = def
    let wasClamped = false
    if (Number.isFinite(override)) {
      count = Math.min(remaining.length, Math.max(0, Math.round(override)))
      wasClamped = count !== override
    }
    const s = applyRounds(remaining, count, safeOffer, safeMid)
    const last = s[s.length - 1]
    series[path] = Object.freeze(s)
    applied[path] = count
    defaults[path] = def
    clamped[path] = wasClamped
    exitStakes[path] = Object.freeze({
      offer: last ? last.stakeOffer : safeOffer,
      mid: last ? last.stakeMid : safeMid,
    })
  }

  return Object.freeze({
    series: Object.freeze(series),
    applied: Object.freeze(applied),
    defaults: Object.freeze(defaults),
    clamped: Object.freeze(clamped),
    remaining: Object.freeze(remaining),
    exitStakes: Object.freeze(exitStakes),
  })
}
