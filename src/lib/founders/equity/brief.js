import { BENCHMARKS_UPDATED_AT, LABELS, LEAVER } from './benchmarks.js'
import { EXIT_PATHS } from './dilution.js'

/* The six verdict sentences (plus the pending fallback), one per position. */
export const HEADLINES = Object.freeze({
  below: "You're being sized as a hire while doing founder work.",
  within: 'The percent is fair. The terms are where you negotiate.',
  above: 'Above the band for this work. Hold the number.',
  noOffer: (cls, stage, lo, hi) =>
    `${cls} work at ${stage} sits at ${lo} to ${hi} percent. Enter the offer to see the gap.`,
  formation: 'You hold founder shares. The question is how many.',
  hire: 'This reads as an employee role. Here is what that is worth.',
  pending: (role, stage, lo, hi) =>
    `${role} work at ${stage} spans ${lo} to ${hi} percent. Pick what was yours to get a read.`,
})

export const NUMBER_SENTENCES = Object.freeze({
  within:
    'Your offer sits inside the band. Hold the percent; negotiate salary, vesting, or acceleration.',
  above: 'Above the band for this work. Hold.',
})

export const QUESTIONS_TO_ASK = Object.freeze([
  'What is the fully diluted share count, including the option pool?',
  'How large is the option pool, and will it be refreshed at the next round?',
  'What is the liquidation preference stack ahead of common?',
  'Is there acceleration on a change of control (single or double trigger)?',
  'What is the post-termination exercise window, and can it be extended?',
  'Is there a repurchase right on vested shares? At what price, and who defines cause?',
])

export const DISCLAIMER =
  'Not legal or financial advice. Benchmarks are medians with sources and dates; your offer is a contract.'

const GATE_FLAGS = Object.freeze({
  fullTime: 'Not full-time on signing caps the read at hired executive.',
  finalSay: 'No final technical say caps the read at hired executive.',
})

/**
 * Format a percent for copy: trims float noise, no unit.
 * @param {number|null} n
 * @returns {string}
 */
export function fmtPct(n) {
  if (n === null || n === undefined || !Number.isFinite(n)) return '—'
  return String(Number(n.toFixed(2)))
}

/**
 * Format dollars compactly: $25M, $1.5B, $52k, $850.
 * @param {number|null} n
 * @returns {string}
 */
export function fmtMoney(n) {
  if (n === null || n === undefined || !Number.isFinite(n)) return '—'
  const abs = Math.abs(n)
  const sign = n < 0 ? '-' : ''
  const trim = (v) => String(Number(v.toFixed(1)))
  if (abs >= 1e9) return `${sign}$${trim(abs / 1e9)}B`
  if (abs >= 1e6) return `${sign}$${trim(abs / 1e6)}M`
  if (abs >= 1e3) return `${sign}$${trim(abs / 1e3)}k`
  return `${sign}$${Math.round(abs)}`
}

/**
 * The verdict headline for a read.
 * Precedence: formation founder → hire class → offer position → pending → no offer.
 * @param {{ inputs: object, classification: object, offer: { position: string }, range: { lo: number, hi: number } }} read
 * @returns {string}
 */
export function headlineFor({ inputs, classification, offer, range }) {
  const stage = LABELS.stage[inputs.stageKey]
  if (inputs.joining === 'formation') return HEADLINES.formation
  if (classification.class === 'hire') return HEADLINES.hire
  if (offer.position === 'below') return HEADLINES.below
  if (offer.position === 'within') return HEADLINES.within
  if (offer.position === 'above') return HEADLINES.above
  if (classification.pending) {
    return HEADLINES.pending(
      LABELS.role[inputs.role],
      stage,
      fmtPct(range.lo),
      fmtPct(range.hi)
    )
  }
  return HEADLINES.noOffer(
    LABELS.class[classification.class],
    stage,
    fmtPct(range.lo),
    fmtPct(range.hi)
  )
}

/**
 * "The number to say": below → the range midpoint with the range in the
 * sentence; within/above → the offer; no offer → value null, no "I'm at" clause.
 * @param {{ inputs: object, classification: object, offer: { pct: number|null, position: string }, range: { lo: number, hi: number, mid: number } }} read
 * @returns {{ value: number|null, sentence: string }}
 */
export function numberToSayFor({ inputs, classification, offer, range }) {
  const cls = classification.pending
    ? LABELS.role[inputs.role]
    : `${LABELS.class[classification.class]} ${LABELS.role[inputs.role]}`
  const stage = LABELS.stage[inputs.stageKey]
  const base = `${cls} work at ${stage} sits at ${fmtPct(range.lo)} to ${fmtPct(
    range.hi
  )} percent fully diluted.`
  if (offer.position === 'below') {
    return Object.freeze({
      value: range.mid,
      sentence: `${base} I'm at ${fmtPct(offer.pct)} percent. Ask for ${fmtPct(
        range.mid
      )}.`,
    })
  }
  if (offer.position === 'within') {
    return Object.freeze({
      value: offer.pct,
      sentence: NUMBER_SENTENCES.within,
    })
  }
  if (offer.position === 'above') {
    return Object.freeze({ value: offer.pct, sentence: NUMBER_SENTENCES.above })
  }
  return Object.freeze({ value: null, sentence: base })
}

/**
 * Negotiation flags: long cliff, long vesting, unsure instrument, a failed
 * gate, an inferred band, and a share count without a fully diluted total.
 * @param {{ inputs: object, classification: object, band: object, offer: object }} read
 * @returns {Array<{ id: string, text: string, promoted: boolean }>}
 */
export function flagsFor({ inputs, classification, band, offer, leaver }) {
  const flags = []
  const add = (id, text, promoted = false) =>
    flags.push(Object.freeze({ id, text, promoted }))
  if (leaver) leaverFlags(inputs, leaver, add)
  if (offer.missingFullyDiluted) {
    add(
      'missing_fully_diluted',
      'Offer: needs the fully diluted share count. Option counts alone mean nothing.',
      true
    )
  }
  if (inputs.cliffMonths > 12) {
    add(
      'cliff',
      `Cliff of ${inputs.cliffMonths} months is longer than the 12-month standard.`
    )
  }
  if (inputs.vestingYears > 4) {
    add(
      'vesting',
      `Vesting over ${inputs.vestingYears} years is longer than the 4-year standard.`
    )
  }
  if (inputs.instrument === 'unsure') {
    add(
      'instrument',
      'Instrument unknown: ask whether this is options or restricted stock. Tax and exercise cost differ.'
    )
  }
  if (classification.gated)
    add(`gate_${classification.gated}`, GATE_FLAGS[classification.gated])
  if (band.confidence === 'inferred') {
    add(
      'inferred_band',
      'This band is inferred from adjacent rows, not directly sourced.'
    )
  }
  return Object.freeze(flags)
}

function leaverFlags(inputs, leaver, add) {
  const p = LEAVER.acceleration.prevalence
  if (leaver.exercise.applies && inputs.exerciseWindow === 'days_90') {
    add(
      'exercise_window',
      `Exercise window is 90 days, the ISO default (${LEAVER.exerciseWindow.prevalence}). Leaving means funding the exercise within three months; ask for an extended window.`
    )
  }
  if (leaver.exercise.applies && inputs.exerciseWindow === 'unsure') {
    add(
      'exercise_window_unknown',
      'Exercise window unknown: ask. The default is 90 days.',
      true
    )
  }
  if (inputs.accelerationCoC === 'none') {
    add(
      'acceleration_coc',
      `No acceleration on a change of control. Double trigger appears in ${p.double}% of founder agreements (${p.any}% carry some form); ask for it.`
    )
  }
  if (inputs.accelerationCoC === 'unsure') {
    add(
      'acceleration_unknown',
      'Acceleration terms unknown: ask for double trigger in writing.',
      true
    )
  }
  if (inputs.accelerationCoC === 'single') {
    add(
      'acceleration_single',
      'Single-trigger acceleration is investor-resisted and often renegotiated at the next round; expect pushback.'
    )
  }
  if (inputs.repurchaseVested !== 'none') {
    add(
      `repurchase_${inputs.repurchaseVested}`,
      LEAVER.repurchase.exposure[inputs.repurchaseVested],
      inputs.repurchaseVested !== 'unsure'
    )
  }
  if (inputs.severanceMonths === 0 && inputs.stageKey === 'series_b_plus') {
    add(
      'severance',
      'No severance at Series B+; 6–12 months of base is common for the C-suite from Series C.'
    )
  }
}

function leaverLines(inputs, leaver) {
  const lines = leaver.horizons.map(
    (h) =>
      `${h.months} mo: resign keeps ${fmtPct(
        h.resign
      )}% · terminated without cause keeps ${fmtPct(
        h.terminated
      )}% · change of control keeps ${fmtPct(h.changeOfControl)}%`
  )
  lines.push(
    `Exercise after leaving: ${leaver.exercise.label}${
      leaver.exercise.cost !== null
        ? ` (≈ ${fmtMoney(
            leaver.exercise.cost
          )} at your strike for a year's vesting)`
        : ''
    }`,
    `Repurchase of vested shares: ${leaver.repurchase.label}`,
    `Acceleration: ${leaver.acceleration.changeOfControlLabel}; ${inputs.accelerationTerminationMonths} months on termination without cause`,
    `Severance: ${inputs.severanceMonths} months (≈ ${fmtMoney(
      leaver.severance.dollars
    )})`
  )
  return lines
}

function seatLine(inputs) {
  return [
    LABELS.role[inputs.role],
    LABELS.joining[inputs.joining],
    LABELS.stage[inputs.stageKey],
    `${LABELS.path[inputs.path]} path`,
  ].join(' · ')
}

function adjustmentLines(adjustments) {
  const b = adjustments.banked
  const s = adjustments.salary
  const sign = (n) => (n >= 0 ? `+${fmtPct(n)}` : fmtPct(n))
  return [
    b.applied
      ? `Banked work: ${fmtMoney(b.dollars)} unbilled → ${sign(b.pts)} pts${
          b.capped ? ' (capped)' : ''
        }`
      : 'Banked work: n/a (salaried)',
    s.applied
      ? `Salary: ${fmtMoney(s.gap)} ${
          s.gap >= 0 ? 'below' : 'above'
        } market → ${sign(s.pts)} pts${s.capped ? ' (capped)' : ''}`
      : 'Salary: not entered',
    `Total adjustment: ${sign(adjustments.total)} pts (cap +${
      adjustments.caps.combined
    }, floor ${adjustments.caps.floor})`,
  ]
}

function roundLines(dilution, hasOffer) {
  return EXIT_PATHS.map((path) => {
    const s = dilution.series[path]
    if (s.length === 0) return `${LABELS.path[path]}: no priced rounds assumed`
    const steps = s
      .map((r) => {
        const stake = hasOffer ? r.stakeOffer : r.stakeMid
        return `${r.label} (${Math.round(r.d * 100)}%) → ${fmtPct(stake)}%`
      })
      .join(', ')
    return `${LABELS.path[path]}: ${steps}`
  })
}

function scenarioLines(scenarios) {
  return EXIT_PATHS.map((path) => {
    const cards = scenarios[path]
    const parts = cards.map((c) =>
      c.id === 'zero'
        ? `$0 (${c.note})`
        : `${c.label} ${fmtMoney(c.valuation)} → ${fmtMoney(c.value)}`
    )
    return `${LABELS.path[path]}: ${parts.join('; ')}`
  })
}

/**
 * Compose the negotiation brief: headline, number to say, flags, questions,
 * and the plain-text version used by the copy button and the print sheet.
 * @param {object} read partial read: inputs, classification, band, adjustments,
 *   range, offer, dilution, scenarios, sources
 * @returns {{ headline: string, numberToSay: { value: number|null, sentence: string },
 *   flags: Array, questionsToAsk: string[], text: string, disclaimer: string }}
 */
export function buildBrief(read) {
  const {
    inputs,
    classification,
    band,
    adjustments,
    range,
    offer,
    dilution,
    scenarios,
    leaver,
    sources,
  } = read
  const headline = headlineFor(read)
  const numberToSay = numberToSayFor(read)
  const flags = flagsFor(read)
  const hasOffer = offer.pct !== null
  const exercise = scenarios.acquisition[1]

  const offerLine = hasOffer
    ? `Offer: ${fmtPct(offer.pct)}% fully diluted — ${offer.position}${
        offer.gapPts
          ? ` (${fmtPct(offer.gapPts[0])}–${fmtPct(offer.gapPts[1])} pts below)`
          : ''
      }`
    : 'Offer: not entered'

  const lines = [
    "AMWARE // FOUNDERS' DESK · Offer read",
    '',
    headline,
    '',
    `Seat: ${seatLine(inputs)}`,
    `Read: ${band.label} — ${classification.gloss}`,
    `Range: ${fmtPct(range.lo)}–${fmtPct(
      range.hi
    )}% fully diluted (band ${fmtPct(band.lo)}–${fmtPct(
      band.hi
    )} before adjustments; ${band.confidence}: ${band.source}, ${band.asOf})`,
    offerLine,
    `The number to say: ${numberToSay.sentence}`,
    '',
    'Adjustments',
    ...adjustmentLines(adjustments),
    '',
    `Rounds (${hasOffer ? 'from the offer' : 'from the range midpoint'})`,
    ...roundLines(dilution, hasOffer),
    '',
    'Exit scenarios',
    ...scenarioLines(scenarios),
    `Exercise cost: ${
      exercise.subtracted
        ? `${fmtMoney(exercise.exerciseCost)} subtracted`
        : exercise.exerciseNote
    }`,
    exercise.footer,
  ]

  if (leaver) {
    lines.push(
      '',
      `If it ends (from the ${
        leaver.basis === 'offer' ? 'offer' : 'range midpoint'
      })`,
      ...leaverLines(inputs, leaver)
    )
  }

  if (flags.length > 0) {
    lines.push('', 'Flags', ...flags.map((f) => `- ${f.text}`))
  }
  lines.push('', 'Questions to ask', ...QUESTIONS_TO_ASK.map((q) => `- ${q}`))
  lines.push(
    '',
    `Sources: ${sources
      .map((s) => `${s.name} (${s.asOf})${s.url ? ` ${s.url}` : ''}`)
      .join('; ')}. Benchmarks updated ${BENCHMARKS_UPDATED_AT}.`,
    DISCLAIMER
  )

  return Object.freeze({
    headline,
    numberToSay,
    flags,
    questionsToAsk: QUESTIONS_TO_ASK,
    text: lines.join('\n'),
    disclaimer: DISCLAIMER,
  })
}
