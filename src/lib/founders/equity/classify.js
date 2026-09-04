import { CHIPS, STAGE_ORDER } from './benchmarks.js'

const FOUNDING_EXECUTIVE_MIN = 3.5
const HIRED_EXECUTIVE_MIN = 2
const DE_FACTO_MIN_SCORE = 6
const DE_FACTO_MIN_MONTHS = 6
const LIGHT_LOAD_MAX = 3

const CLASS_RANK = Object.freeze({
  hire: 0,
  hired_executive: 1,
  founding_executive: 2,
  founder: 3,
})

const GATE_COPY = Object.freeze({
  fullTime: 'not full-time on signing',
  finalSay: 'no final technical say',
})

function classFromScore(score) {
  if (score >= FOUNDING_EXECUTIVE_MIN) return 'founding_executive'
  if (score >= HIRED_EXECUTIVE_MIN) return 'hired_executive'
  return 'hire'
}

/**
 * Sum the weights of the selected responsibility chips for a role.
 * @param {string} role
 * @param {readonly string[]} responsibilities chip ids
 * @returns {{ score: number, total: number, selected: number, chips: string[] }}
 */
export function scoreResponsibilities(role, responsibilities) {
  const chips = CHIPS[role] || CHIPS.cto
  const ids = new Set(responsibilities || [])
  let score = 0
  const picked = []
  for (const c of chips) {
    if (ids.has(c.id)) {
      score += c.weight
      picked.push(c.id)
    }
  }
  return {
    score: Number(score.toFixed(2)),
    total: chips.length,
    selected: picked.length,
    chips: picked,
  }
}

/**
 * Classify the seat from normalized inputs.
 * Formation is always `founder` (score < 3 → `light`). A fractional conversion
 * with score ≥ 6, months ≥ 6 and stage ≤ pre-seed is a de facto founder.
 * Otherwise the score maps to founding_executive / hired_executive / hire, and
 * a "no" on either gate caps non-formation seats at hired_executive. Zero chips
 * on a non-formation path yields `unknown` with `pending: true`.
 * @param {object} inputs normalized inputs
 * @returns {{ class: string, score: number, total: number, selected: number,
 *   chips: string[], gloss: string, gates: { fullTime: boolean, finalSay: boolean },
 *   light: boolean, deFacto: boolean, pending: boolean, gated: string|null }}
 */
export function classify(inputs) {
  const { score, total, selected, chips } = scoreResponsibilities(
    inputs.role,
    inputs.responsibilities
  )
  const gates = Object.freeze({
    fullTime: inputs.fullTimeOnSigning !== false,
    finalSay: inputs.finalTechnicalSay !== false,
  })
  const base = {
    score,
    total,
    selected,
    chips: Object.freeze(chips),
    gates,
    light: false,
    deFacto: false,
    pending: false,
    gated: null,
  }
  const load = `${selected} of ${total} founder-level responsibilities`

  if (inputs.joining === 'formation') {
    const light = score < LIGHT_LOAD_MAX
    return Object.freeze({
      ...base,
      class: 'founder',
      light,
      gloss: light
        ? `Co-founder with a light contribution load so far (${load}).`
        : `Co-founder holding founder shares (${load}).`,
    })
  }

  const gated = !gates.fullTime
    ? 'fullTime'
    : !gates.finalSay
    ? 'finalSay'
    : null

  if (selected === 0) {
    return Object.freeze({
      ...base,
      class: 'unknown',
      pending: true,
      gated,
      gloss: 'Pick what was yours.',
    })
  }

  let cls = classFromScore(score)
  let deFacto = false
  if (
    inputs.joining === 'fractional_conversion' &&
    score >= DE_FACTO_MIN_SCORE &&
    inputs.months >= DE_FACTO_MIN_MONTHS &&
    STAGE_ORDER[inputs.stageKey] <= STAGE_ORDER.preseed
  ) {
    cls = 'founder'
    deFacto = true
  }

  let gloss
  if (gated && CLASS_RANK[cls] > CLASS_RANK.hired_executive) {
    cls = 'hired_executive'
    deFacto = false
    gloss = `Capped at hired executive: ${GATE_COPY[gated]} (${load}).`
  } else if (deFacto) {
    gloss = `De facto co-founder: ${load} over ${inputs.months} months before a priced round.`
  } else if (cls === 'founding_executive') {
    gloss = `Founder-level work without founder shares (${load}).`
  } else if (cls === 'hired_executive') {
    gloss = `Executive scope, hired-in terms (${load}).`
  } else {
    gloss = `This reads as an employee role (${load}).`
  }

  return Object.freeze({ ...base, class: cls, deFacto, gated, gloss })
}
