export const FINE_GRAIN = 0.05
export const COARSE_GRAIN = 0.5
export const RANGE_FLOOR = 0.05
const FINE_BELOW = 2

/**
 * Pick the display grain from the raw low end: 0.05 below 2 pts, else 0.5.
 * @param {number} rawLo
 * @returns {number}
 */
export function grainFor(rawLo) {
  return rawLo < FINE_BELOW ? FINE_GRAIN : COARSE_GRAIN
}

/**
 * Round a value to a grain, cleaned of float noise.
 * @param {number} value
 * @param {number} grain
 * @returns {number}
 */
export function roundToGrain(value, grain) {
  const units = Number((value / grain).toFixed(6))
  return Number((Math.round(units) * grain).toFixed(2))
}

/**
 * Round an adjusted range for display. Both ends round to the grain; a
 * collapsed range widens by one grain; the low end floors at 0.05 AFTER
 * rounding (and the high end follows so `lo < hi` always holds).
 * @param {number} rawLo
 * @param {number} rawHi
 * @returns {{ lo: number, hi: number, grain: number, mid: number }}
 */
export function roundRange(rawLo, rawHi) {
  const safeLo = Number.isFinite(rawLo) ? rawLo : 0
  const safeHi = Number.isFinite(rawHi) ? rawHi : safeLo
  const grain = grainFor(safeLo)
  let lo = roundToGrain(safeLo, grain)
  let hi = roundToGrain(Math.max(safeLo, safeHi), grain)
  if (hi - lo < grain - 1e-9) hi = Number((lo + grain).toFixed(2))
  if (lo < RANGE_FLOOR) {
    lo = RANGE_FLOOR
    if (hi - lo < grain - 1e-9) hi = Number((lo + grain).toFixed(2))
  }
  const mid = roundToGrain((lo + hi) / 2, grain)
  return Object.freeze({ lo, hi, grain, mid })
}
