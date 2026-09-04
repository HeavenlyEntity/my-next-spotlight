import { SCENARIO_VALUATIONS } from './benchmarks.js'
import { EXIT_PATHS } from './dilution.js'

export const SCENARIO_IDS = Object.freeze([
  'zero',
  'conservative',
  'base',
  'upside',
])
export const CARD_FOOTER =
  'Assumes fully vested, no liquidation preferences, no tax.'
export const ZERO_NOTE = 'most startup equity ends here'
export const ZERO_BASE_RATE =
  'Most venture-backed companies return nothing to common holders. Plan around this row; treat the others as upside.'
export const EXERCISE_NOT_SUBTRACTED =
  'not subtracted (enter your option count and strike to include it)'

const LABELS = Object.freeze({
  zero: '$0',
  conservative: 'Conservative',
  base: 'Base',
  upside: 'Upside',
})

function pickValuation(path, id, overrides) {
  const table = SCENARIO_VALUATIONS[path]
  const o = overrides && overrides[path] ? overrides[path][id] : undefined
  const n = typeof o === 'string' ? Number(o) : o
  return Number.isFinite(n) && n >= 0 ? n : table[id]
}

/**
 * Exercise cost for options entered as shares: count × strike, else null.
 * @param {object} inputs normalized inputs
 * @returns {number|null}
 */
export function exerciseCost(inputs) {
  if (inputs.offerMode !== 'shares') return null
  if (inputs.strikePrice === null || inputs.optionCount === null) return null
  return inputs.optionCount * inputs.strikePrice
}

/**
 * Four cards per path (`zero` first). value = stake × valuation, minus the
 * exercise cost only in shares mode with a strike (floored at 0). Valuations
 * can be overridden per path: `{ acquisition: { base: 80e6 } }`.
 * @param {object} inputs normalized inputs
 * @param {Record<string, { offer: number|null, mid: number }>} exitStakes percent at exit per path
 * @param {object} [overrides]
 * @returns {Record<string, Array<object>>}
 */
export function computeScenarios(inputs, exitStakes, overrides = {}) {
  const cost = exerciseCost(inputs)
  const out = {}
  for (const path of EXIT_PATHS) {
    const stakes = exitStakes[path] || { offer: null, mid: 0 }
    const basis = stakes.offer === null ? 'midpoint' : 'offer'
    const stake = basis === 'offer' ? stakes.offer : stakes.mid
    const safeStake = Number.isFinite(stake) ? stake : 0
    out[path] = Object.freeze(
      SCENARIO_IDS.map((id) => {
        const valuation = id === 'zero' ? 0 : pickValuation(path, id, overrides)
        const gross = (safeStake / 100) * valuation
        const value = cost === null ? gross : Math.max(0, gross - cost)
        return Object.freeze({
          id,
          label: LABELS[id],
          valuation,
          stake: safeStake,
          stakeMid: Number.isFinite(stakes.mid) ? stakes.mid : 0,
          basis,
          gross: Math.round(gross),
          exerciseCost: cost,
          subtracted: cost !== null,
          exerciseNote: cost === null ? EXERCISE_NOT_SUBTRACTED : null,
          value: Math.round(value),
          note: id === 'zero' ? ZERO_NOTE : null,
          baseRate: id === 'zero' ? ZERO_BASE_RATE : null,
          footer: CARD_FOOTER,
        })
      })
    )
  }
  return Object.freeze(out)
}
