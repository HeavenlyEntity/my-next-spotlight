import { EXCHANGE_RATES, LABELS } from './benchmarks.js'
import { fmtMoney, fmtPct } from './brief.js'
import { computeRead as defaultComputeRead } from './engine.js'
import { bandFor, bucketFor, multipliersFor } from './salary-bands.js'

/*
 * Founders' Desk — the ask ladder.
 *
 * THE ONE THING TO UNDERSTAND HERE (plan decision D10)
 *
 * The equity band is not independent of salary. `adjustments.js` computes
 * `gap = marketSalary - offeredSalary`, converts it to points, and adds it to
 * the band. So `range.hi` already assumes whatever pay cut is in the inputs.
 *
 * A naive ladder would pair `range.hi` with a recommended p75 salary. Those two
 * numbers would have been computed from different assumptions about the same
 * person, and the floor would collapse into the target. Instead every rung runs
 * the engine again at its own cash:
 *
 *   rung      cash                      equity
 *   ------------------------------------------------------------------
 *   ceiling   p75 x industry x geo      range.hi at that cash
 *   target    p50 x industry x geo      range.mid at that cash
 *   floor     p25 x industry x geo      range.lo at that cash
 *
 * Three engine passes per read. The engine is pure and cheap.
 *
 * WHAT THIS DOES AND DOES NOT MEAN. The rungs ascend together: "open with" is
 * the biggest ask on BOTH axes, because that is what the label has to mean. The
 * cash-for-equity trade is real but it lives one level down, in the band each
 * rung is drawn from. At the floor's cash the defensible band sits higher than
 * at the ceiling's cash, because a bigger pay cut is a stronger argument. See
 * `bandShiftFor`, which the copy quotes rather than asserting an inversion the
 * rung values do not show.
 *
 * `computeRead` is injectable so tests can drive the rungs without the whole
 * engine, and so a future caller can memoise it.
 */

const ORDER = Object.freeze(['ceiling', 'target', 'floor'])

const RUNGS = Object.freeze({
  ceiling: Object.freeze({
    id: 'ceiling',
    percentile: 'p75',
    edge: 'hi',
    /* Display labels are for humans; ceiling/target/floor stay internal.
       "Floor" reads as advice to walk away, which the runway note spends a
       sentence denying. Design review DD12. */
    label: 'Open with',
  }),
  target: Object.freeze({
    id: 'target',
    percentile: 'p50',
    edge: 'mid',
    label: 'Aim for',
  }),
  floor: Object.freeze({
    id: 'floor',
    percentile: 'p25',
    edge: 'lo',
    label: 'Minimum the market supports',
  }),
})

const TEN_K = 10_000
const round2 = (n) => Number(n.toFixed(2))
const roundCash = (n) => Math.round(n / 1000) * 1000

/**
 * Points bought per $10k of salary given up, at this stage. Generated from
 * EXCHANGE_RATES so the sentence can never drift from the engine's own maths.
 */
function tradeFor(stageKey) {
  const rate = EXCHANGE_RATES[stageKey] || EXCHANGE_RATES.preseed
  const perTenK = round2((TEN_K / rate.unitDollars) * rate.unitPts)
  return Object.freeze({
    unitDollars: rate.unitDollars,
    unitPts: rate.unitPts,
    perTenK,
    sentence: `Every ${fmtMoney(
      TEN_K
    )} of salary you give up is worth about ${fmtPct(perTenK)} points at ${
      LABELS.stage[stageKey] || stageKey
    }.`,
  })
}

/* The rate falls sharply by stage: trading cash for equity is a good deal early
   and a bad one late. Worth saying out loud once it stops being worth it. */
function tradeWarningFor(stageKey, perTenK) {
  if (stageKey !== 'series_b_plus') return null
  return `At this stage ${fmtMoney(TEN_K)} of salary buys only about ${fmtPct(
    perTenK
  )} points. Taking cash below market here is rarely worth what you get back.`
}

/**
 * Where the offer already on the table sits against the ladder, so the tool
 * does the subtraction rather than making an anxious person do it from memory.
 * Design review DD12.
 */
function offerVersus(read, rungs) {
  const cash = read.inputs.offeredSalary
  const equityPct = read.offer.pct
  const hasCash = typeof cash === 'number' && Number.isFinite(cash)
  const hasEquity = typeof equityPct === 'number' && Number.isFinite(equityPct)
  if (!hasCash && !hasEquity) return null

  let position = null
  if (hasCash) {
    if (cash < rungs.floor.cash) position = 'below_floor'
    else if (cash > rungs.ceiling.cash) position = 'above_ceiling'
    else position = 'within'
  }
  return Object.freeze({
    cash: hasCash ? cash : null,
    equityPct: hasEquity ? equityPct : null,
    position,
    /* Positive means the target asks for more than they were offered. */
    vsTarget: Object.freeze({
      cash: hasCash ? rungs.target.cash - cash : null,
      equityPts: hasEquity ? round2(rungs.target.equityPct - equityPct) : null,
    }),
  })
}

/**
 * The defensible band at the floor's cash against the band at the ceiling's
 * cash. This is where the cash-for-equity trade actually shows up: the rungs
 * themselves ascend together, but the band underneath them moves.
 */
function bandShiftFor(rungs) {
  return Object.freeze({
    floor: rungs.floor.read.offer.range,
    ceiling: rungs.ceiling.read.offer.range,
  })
}

function sentencesFor({ rungs, offer, trade, stageKey }) {
  const target = `Ask for ${fmtMoney(rungs.target.cash)} and ${fmtPct(
    rungs.target.equityPct
  )}%.`

  /* Asking p75 cash AND top-of-band equity at once is aggressive, because the
     top of the band already assumes a pay cut. Say so rather than letting the
     screen imply both are available together. */
  const ceiling =
    'Both numbers have data behind them. Asking for both at once is aggressive: the top of the equity band already assumes you are taking cash below market.'

  const floor =
    'If this equity turns out to be worth nothing, you took home the cash alone. Only you know your runway. This is where the math stops defending the offer, not where your life does.'

  /* The rungs ascend together, because "open with" must be the biggest ask on
     both axes. The trade lives in the BAND underneath them: take less cash and
     the whole defensible band moves up. Say that with the two real bands rather
     than asserting a rung-level inversion that does not happen. */
  const shift = bandShiftFor(rungs)
  const trade_ = `Each rung's equity was computed at that rung's own cash. Take less cash and the band you can defend moves up: at ${fmtMoney(
    rungs.floor.cash
  )} it runs ${fmtPct(shift.floor.lo)}-${fmtPct(
    shift.floor.hi
  )}%, at ${fmtMoney(rungs.ceiling.cash)} it runs ${fmtPct(
    shift.ceiling.lo
  )}-${fmtPct(shift.ceiling.hi)}%. ${trade.sentence}`

  return Object.freeze({
    target,
    ceiling,
    floor,
    trade: trade_,
    tradeWarning: tradeWarningFor(stageKey, trade.perTenK),
    offer: offer
      ? offerSentence(offer, rungs)
      : 'Enter what they offered and this becomes a comparison.',
  })
}

function offerSentence(offer, rungs) {
  if (offer.position === 'below_floor') {
    return `Their offer sits below the minimum the market supports for this seat, by ${fmtMoney(
      rungs.floor.cash - offer.cash
    )}.`
  }
  if (offer.position === 'above_ceiling') {
    return 'Their offer already sits above the top of the researched band for this seat.'
  }
  if (offer.vsTarget.cash !== null && offer.vsTarget.cash > 0) {
    return `Their offer is ${fmtMoney(
      offer.vsTarget.cash
    )} below the target for this seat.`
  }
  return 'Their offer is at or above the target for this seat.'
}

function flagsFor({ cashBand, mult, inputs, offer, trade, rungs }) {
  const flags = []
  const add = (id, text, promoted = false) =>
    flags.push(Object.freeze({ id, text, promoted }))

  if (cashBand.confidence !== 'sourced') {
    add(
      'cash_median_derived',
      `The median for this seat and stage is ${
        cashBand.confidence
      }, not sourced. ${cashBand.note || ''}`.trim()
    )
  }
  /* True on every path: no free source publishes quartiles for these seats, so
     the open-with and minimum rungs are always derived from a documented
     spread. The UI marks them; this is the sentence behind the mark. */
  add(
    'spread_derived',
    'The open-with and minimum figures come from a documented spread around the median, not from published quartiles.'
  )

  if (offer && offer.position === 'below_floor') {
    add(
      'offer_below_floor',
      'The offer on the table is below what the market supports for this seat.',
      true
    )
  }
  if (inputs.offeredSalary === null || inputs.offeredSalary === undefined) {
    add(
      'no_salary_entered',
      'No salary entered, so the ladder shows the market band without comparing it to anything.'
    )
  }
  if (inputs.industry === 'ai') {
    add(
      'ai_premium_volatile',
      'The AI premium is real but volatile and concentrated: about 1.1x across the market, with the headline multiples belonging to a handful of frontier labs.'
    )
  }
  if (mult.industry.multiplier !== 1) {
    add(
      'equity_not_industry_adjusted',
      'Industry moves the cash band only. No source publishes equity grant size by industry at a fixed stage, so the equity band is left alone and the direction is noted instead.'
    )
  }
  /* Usually the rungs ascend together. When the band is narrow relative to the
     cash spread they do not, and that is real information rather than an error:
     at this seat, reaching for the top of the cash band costs more equity than
     the band is wide. The UI needs to say so instead of showing an "open with"
     rung that quietly asks for less. */
  if (rungs && rungs.ceiling.equityPct < rungs.target.equityPct) {
    add(
      'equity_inverts',
      'At this seat the cash band is wide relative to the equity band, so opening at the top of the cash range costs you more equity than aiming for the middle. Pick one axis to push.',
      true
    )
  }
  if (trade.perTenK <= 0.05) {
    add('trade_rate_poor', tradeWarningFor(inputs.stageKey, trade.perTenK))
  }
  return Object.freeze(flags)
}

function buildAsk(read, options) {
  const run =
    typeof options.computeRead === 'function'
      ? options.computeRead
      : defaultComputeRead
  const inputs = read.inputs
  const role = inputs.role
  const stageKey = inputs.stageKey
  const bucket = bucketFor(read.classification.class)
  const cashBand = bandFor(role, bucket, stageKey)
  const industry = options.industry || inputs.industry || 'saas'
  const geoKey = options.geo || inputs.geo || 'us_hub'
  const mult = multipliersFor(role, industry, geoKey)
  const trade = tradeFor(stageKey)

  const rungs = {}
  for (const id of ORDER) {
    const spec = RUNGS[id]
    const cash = roundCash(cashBand[spec.percentile] * mult.combined)
    /* The whole point of D10: the engine runs again at THIS rung's cash, so the
       equity number beside it was computed from the same assumption. */
    const rungRead = run({ ...inputs, offeredSalary: cash })
    rungs[id] = Object.freeze({
      id,
      label: spec.label,
      cash,
      equityPct: rungRead.offer.range[spec.edge],
      cashConfidence:
        spec.percentile === 'p50' ? cashBand.confidence : 'interpolated',
      equityConfidence: rungRead.band.confidence,
      cites: Object.freeze(
        [
          cashBand.source,
          mult.industry.multiplier !== 1 ? mult.industry.source : null,
          mult.geo.multiplier !== 1 ? mult.geo.source : null,
          rungRead.band.source,
        ].filter(Boolean)
      ),
      read: rungRead,
    })
  }

  const offer = offerVersus(read, rungs)

  return Object.freeze({
    ceiling: rungs.ceiling,
    target: rungs.target,
    floor: rungs.floor,
    order: ORDER,
    bucket,
    trade,
    bandShift: bandShiftFor(rungs),
    offer,
    bands: Object.freeze({
      cash: cashBand,
      /* The keys travel with the multipliers so a consumer can name the
         adjustment in words instead of printing a bare 1.1. */
      industryKey: industry,
      geoKey,
      industry: mult.industry,
      geo: mult.geo,
      combined: mult.combined,
    }),
    flags: flagsFor({ cashBand, mult, inputs, offer, trade, rungs }),
    sentences: sentencesFor({ rungs, offer, trade, stageKey }),
    labels: Object.freeze({
      role: LABELS.role[role],
      stage: LABELS.stage[stageKey],
      class: LABELS.class[read.classification.class] || LABELS.class.unknown,
      bucket: bucket === 'founding' ? 'founder rate' : 'market rate',
    }),
  })
}

/**
 * Turn an equity read into an ask ladder: what to open with, what to aim for,
 * and the minimum the market supports, in cash and equity together.
 *
 * Same discipline as `computeRead`: pure, frozen, never throws and never yields
 * NaN. On any internal failure it falls back to a ladder built from the read it
 * was given with default preferences, and if that fails too, to a default read.
 *
 * @param {object} read a computeRead() result
 * @param {{ industry?: string, geo?: string, computeRead?: Function }} [options]
 * @returns {object} frozen Ladder
 */
export function computeAsk(read, options = {}) {
  const opts = options && typeof options === 'object' ? options : {}
  try {
    return buildAsk(read, opts)
  } catch {
    try {
      return buildAsk(defaultComputeRead({}), {})
    } catch {
      return null
    }
  }
}
