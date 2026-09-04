import { EXCHANGE_RATES } from './benchmarks.js'

export const WEEKS_PER_MONTH = 4.33
export const BANKED_CAP = 5
export const SALARY_CAP = 4
export const SALARY_FLOOR = -2
export const COMBINED_CAP = 7
export const COMBINED_FLOOR = -2
const SALARY_YEARS_MAX = 2

const round2 = (n) => Number(n.toFixed(2))

/**
 * Convert dollars to equity points at the stage's exchange rate (linear).
 * @param {number} dollars
 * @param {string} stageKey
 * @returns {number}
 */
export function dollarsToPts(dollars, stageKey) {
  const rate = EXCHANGE_RATES[stageKey] || EXCHANGE_RATES.preseed
  return (dollars / rate.unitDollars) * rate.unitPts
}

/**
 * Banked-work and salary adjustments in percentage points.
 * Banked work applies only to fractional conversions; the salary adjustment
 * only when an offered salary was entered. Caps: banked +5, salary [−2, +4],
 * combined [−2, +7].
 * @param {object} inputs normalized inputs
 * @returns {{ banked: { dollars: number, pts: number, applied: boolean, capped: boolean },
 *   salary: { gap: number|null, pts: number, applied: boolean, capped: boolean },
 *   total: number, rate: { unitDollars: number, unitPts: number },
 *   caps: { banked: number, salary: number, salaryFloor: number, combined: number, floor: number } }}
 */
export function computeAdjustments(inputs) {
  const stageKey = inputs.stageKey
  const rate = EXCHANGE_RATES[stageKey] || EXCHANGE_RATES.preseed

  const bankedApplied = inputs.joining === 'fractional_conversion'
  let bankedDollars = 0
  let bankedPts = 0
  let bankedCapped = false
  if (bankedApplied) {
    const earned =
      inputs.months * WEEKS_PER_MONTH * inputs.hoursPerWeek * inputs.ratePerHour
    bankedDollars = Math.max(0, earned - inputs.feesBilled)
    const rawPts = dollarsToPts(bankedDollars, stageKey)
    bankedCapped = rawPts > BANKED_CAP
    bankedPts = Math.min(BANKED_CAP, rawPts)
  }

  const salaryApplied =
    inputs.offeredSalary !== null && inputs.offeredSalary !== undefined
  let gap = null
  let salaryPts = 0
  let salaryCapped = false
  if (salaryApplied) {
    gap = inputs.marketSalary - inputs.offeredSalary
    const years = Math.min(inputs.vestingYears, SALARY_YEARS_MAX)
    const rawPts = dollarsToPts(gap * years, stageKey)
    salaryCapped = rawPts > SALARY_CAP || rawPts < SALARY_FLOOR
    salaryPts = Math.min(SALARY_CAP, Math.max(SALARY_FLOOR, rawPts))
  }

  const total = Math.max(
    COMBINED_FLOOR,
    Math.min(COMBINED_CAP, bankedPts + salaryPts)
  )

  return Object.freeze({
    banked: Object.freeze({
      dollars: Math.round(bankedDollars),
      pts: round2(bankedPts),
      applied: bankedApplied,
      capped: bankedCapped,
    }),
    salary: Object.freeze({
      gap: gap === null ? null : Math.round(gap),
      pts: round2(salaryPts),
      applied: salaryApplied,
      capped: salaryCapped,
    }),
    total: round2(total),
    rate,
    caps: Object.freeze({
      banked: BANKED_CAP,
      salary: SALARY_CAP,
      salaryFloor: SALARY_FLOOR,
      combined: COMBINED_CAP,
      floor: COMBINED_FLOOR,
    }),
  })
}
