import { LEAVER } from './benchmarks.js'

/*
 * "If it ends": what the holder keeps when they resign, are terminated
 * without cause, or the company changes control, at fixed horizons.
 *
 * Market structure this models (sources in benchmarks.LEAVER):
 * - Unvested equity is forfeited on any departure; vesting is time-based
 *   with a cliff (nothing vests before the cliff month, then monthly).
 * - Vested options must be exercised inside a post-termination window
 *   (90 days for ~82% of companies, driven by the ISO rule) or they lapse.
 *   Vested restricted stock has no window: it is owned.
 * - Acceleration: single-trigger vests everything on a change of control;
 *   double-trigger vests everything only if terminated after one.
 *   Termination without cause may carry N months of acceleration.
 * - Repurchase (call) rights on vested shares are the "bad leaver" clause:
 *   none (you keep them), FMV on any departure, or cost/nominal for cause.
 * - Cash severance is rare and small before Series C.
 */

export const HORIZONS = Object.freeze([12, 24, 36, 48])

const round2 = (n) => Number(n.toFixed(2))

/**
 * Fraction of the grant vested after `months` of service: zero before the
 * cliff, then linear monthly over `vestingYears`, capped at 1.
 * @param {number} months
 * @param {number} cliffMonths
 * @param {number} vestingYears
 * @returns {number} 0..1
 */
export function vestedFraction(months, cliffMonths, vestingYears) {
  const total = Math.max(1, vestingYears * 12)
  if (months < cliffMonths) return 0
  return Math.min(1, Math.max(0, months) / total)
}

/**
 * Fraction kept in each departure case at a horizon.
 * @param {number} months service months at departure
 * @param {object} inputs normalized inputs
 * @returns {{ resign: number, terminated: number, changeOfControl: number }}
 */
export function keptFractions(months, inputs) {
  const base = vestedFraction(months, inputs.cliffMonths, inputs.vestingYears)
  const accel = inputs.accelerationTerminationMonths
  const terminated =
    accel > 0
      ? vestedFraction(
          Math.max(months, inputs.cliffMonths) + accel,
          inputs.cliffMonths,
          inputs.vestingYears
        )
      : base
  let changeOfControl = base
  if (inputs.accelerationCoC === 'single') changeOfControl = 1
  else if (inputs.accelerationCoC === 'double') changeOfControl = 1
  return Object.freeze({
    resign: round2(base),
    terminated: round2(Math.max(base, terminated)),
    changeOfControl: round2(changeOfControl),
  })
}

/**
 * Exercise deadline and cost for vested options after leaving.
 * @param {object} inputs normalized inputs
 * @param {number} vestedPct percent of the company vested (null-safe)
 * @returns {{ applies: boolean, window: string, days: number|null, cost: number|null, label: string }}
 */
export function exerciseAfterLeaving(inputs, vestedShareCount) {
  const stock = inputs.instrument === 'restricted_stock'
  if (stock) {
    return Object.freeze({
      applies: false,
      window: 'na',
      days: null,
      cost: null,
      label: LEAVER.exerciseWindow.labels.na,
    })
  }
  const window = inputs.exerciseWindow
  const days = LEAVER.exerciseWindow.days[window] ?? null
  const cost =
    inputs.offerMode === 'shares' &&
    inputs.strikePrice !== null &&
    vestedShareCount !== null
      ? Math.round(vestedShareCount * inputs.strikePrice)
      : null
  return Object.freeze({
    applies: true,
    window,
    days,
    cost,
    label: LEAVER.exerciseWindow.labels[window],
  })
}

/**
 * Compute the "if it ends" read.
 * @param {object} inputs normalized inputs
 * @param {{ offerPct: number|null, midPct: number }} basis stake basis
 * @returns {object} frozen leaver read
 */
export function computeLeaver(inputs, { offerPct, midPct }) {
  const hasOffer = offerPct !== null
  const stake = hasOffer ? offerPct : midPct
  const grantShares =
    inputs.offerMode === 'shares' && inputs.optionCount !== null
      ? inputs.optionCount
      : null

  const horizons = HORIZONS.map((months) => {
    const kept = keptFractions(months, inputs)
    const toPct = (f) => round2(stake * f)
    return Object.freeze({
      months,
      vested: kept.resign,
      resign: toPct(kept.resign),
      terminated: toPct(kept.terminated),
      changeOfControl: toPct(kept.changeOfControl),
      terminatedAccelerated: kept.terminated > kept.resign,
      cocAccelerated: kept.changeOfControl > kept.resign,
    })
  })

  const atCliff = keptFractions(inputs.cliffMonths, inputs)
  const vestedAtYear = vestedFraction(
    12,
    inputs.cliffMonths,
    inputs.vestingYears
  )
  const exercise = exerciseAfterLeaving(
    inputs,
    grantShares !== null ? Math.round(grantShares * vestedAtYear) : null
  )

  const repurchase = Object.freeze({
    kind: inputs.repurchaseVested,
    label: LEAVER.repurchase.labels[inputs.repurchaseVested],
    exposure: LEAVER.repurchase.exposure[inputs.repurchaseVested],
  })

  const salaryBasis =
    inputs.offeredSalary !== null ? inputs.offeredSalary : inputs.marketSalary
  const severance = Object.freeze({
    months: inputs.severanceMonths,
    dollars: Math.round((salaryBasis / 12) * inputs.severanceMonths),
    basis: inputs.offeredSalary !== null ? 'offered' : 'market',
    standard: LEAVER.severance.standard[inputs.stageKey],
  })

  const acceleration = Object.freeze({
    changeOfControl: inputs.accelerationCoC,
    changeOfControlLabel: LEAVER.acceleration.labels[inputs.accelerationCoC],
    terminationMonths: inputs.accelerationTerminationMonths,
    prevalence: LEAVER.acceleration.prevalence,
  })

  /* One-line reads the UI and brief print verbatim. */
  const notes = []
  if (inputs.cliffMonths > 0) {
    notes.push(
      `Leave before month ${inputs.cliffMonths} and you keep nothing; unvested equity is forfeited on any departure.`
    )
  }
  if (exercise.applies && exercise.days !== null && exercise.days <= 92) {
    notes.push(
      `Vested options must be exercised within ${
        exercise.days
      } days of leaving or they lapse${
        exercise.cost !== null
          ? ` (≈ ${exercise.cost.toLocaleString('en-US')} at your strike)`
          : ''
      }.`
    )
  }
  if (inputs.accelerationCoC === 'none') {
    notes.push(
      'No acceleration on a change of control: an acquirer can let unvested equity lapse.'
    )
  }
  if (
    inputs.repurchaseVested === 'fmv_any' ||
    inputs.repurchaseVested === 'cost_for_cause'
  ) {
    notes.push(repurchase.exposure)
  }

  return Object.freeze({
    basis: hasOffer ? 'offer' : 'mid',
    stake,
    horizons: Object.freeze(horizons),
    atCliff,
    exercise,
    repurchase,
    severance,
    acceleration,
    notes: Object.freeze(notes),
    standard: LEAVER.standard,
  })
}
