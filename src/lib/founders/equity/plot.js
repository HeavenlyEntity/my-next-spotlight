import {
  AS_OF,
  CAVEATS,
  LIQUIDITY,
  SOURCE_NAME,
  isStale,
  ladderForRole,
} from './company-comp.js'

/*
 * Founders' Desk — data for the market comparison plot.
 *
 * Pure. The component renders what this returns and computes nothing itself,
 * so the arithmetic that decides whether someone takes a job is testable
 * without a DOM.
 *
 * THE UNIT PROBLEM, WHICH IS THE WHOLE REASON THIS FILE EXISTS.
 *
 * Every company figure is per year: a four-year grant divided by four, valued
 * at the grant-date price. The user's equity is a percentage of a company with
 * no share price, and the exit scenarios value the WHOLE grant at once. Stacking
 * those two in one bar compares one year against four and overstates the
 * reader's package by roughly four times, on the one page where they are
 * deciding whether to take a job.
 *
 * So the user's equity is annualised: the scenario value, already net of what
 * they must pay to exercise, divided by the vesting years. It is labelled
 * "modeled equity per vesting year" and never folded into anything called
 * "total compensation" without its time basis (design review DD11).
 *
 * THE OTHER HALF is that the comparison is demoralising unless it is framed.
 * Eleven rows of $400k packages tells a startup engineer they are underpaid by
 * 60%, which is true and useless. The thesis says the useful thing instead: big
 * tech is flat because those shares vest regardless, and the reader's bar moves
 * because their outcome has not happened yet (DD7).
 */

const round = (n) => Math.round(n)
const safe = (n) => (Number.isFinite(n) ? n : 0)

export const SEGMENTS = Object.freeze({
  cash: Object.freeze({
    id: 'cash',
    label: 'Guaranteed cash',
    detail: 'Base salary plus expected bonus. Contractual.',
  }),
  liquid: Object.freeze({
    id: 'liquid',
    label: 'Reported annual equity',
    detail:
      'A four-year grant divided by four, valued at the grant-date price. What it is worth when it vests depends on the share price then.',
  }),
  modeled: Object.freeze({
    id: 'modeled',
    label: 'Modeled equity per vesting year',
    detail:
      'Your stake at the outcome you picked, net of what you pay to exercise, divided across the vesting years.',
  }),
})

/**
 * One company row, split into the two segments that mean different things.
 * Bonus rides with cash because it is contractual; it is never folded in
 * silently, and the expanded row shows it on its own line.
 */
function companyRow(row) {
  const cash = row.base + row.bonus
  return Object.freeze({
    kind: 'company',
    id: row.id,
    label: row.company,
    level: row.levelName ? `${row.level} · ${row.levelName}` : row.level,
    cash,
    equity: row.stock,
    total: row.total,
    liquidity: LIQUIDITY[row.liquidity],
    /* Netflix pays one cash number by design. It is not a missing value, and a
       chart that renders it as a gap is lying about the most liquid package on
       the board. */
    allCash: row.stock === 0,
    stockShare: row.stockShare,
    confidence: row.confidence,
    note: row.note,
    breakdown: Object.freeze([
      { label: 'Base', value: row.base },
      { label: 'Bonus', value: row.bonus },
      { label: 'Stock per year', value: row.stock },
    ]),
  })
}

/**
 * The reader's own row, in the same units as everything beside it.
 * @param {object} read a computeRead() result
 * @param {object} ask a computeAsk() ladder, for the fallback cash figure
 * @param {string} scenarioId one of the exit scenario ids
 */
function userRow(read, ask, scenarioId) {
  const path = read.preselectedPath
  const cards = read.scenarios?.[path] ?? []
  const card = cards.find((c) => c.id === scenarioId) ?? cards[0] ?? null
  const years = Math.max(1, safe(read.inputs.vestingYears) || 4)

  /* Already net of the exercise cost; scenarios.js subtracts it and floors at
     zero when the offer is in shares with a strike. */
  const modeled = card ? safe(card.value) / years : 0

  /* Their salary if they have one, otherwise the target ask, so the bar means
     something before an offer exists. */
  const usingTarget = !Number.isFinite(read.inputs.offeredSalary)
  const cash = usingTarget ? ask.target.cash : read.inputs.offeredSalary

  return Object.freeze({
    kind: 'user',
    id: 'you',
    label: usingTarget ? 'Your target ask' : 'Your offer',
    level: null,
    cash: round(cash),
    equity: round(modeled),
    total: round(cash + modeled),
    liquidity: LIQUIDITY.options,
    allCash: modeled === 0,
    usingTarget,
    scenario: card
      ? {
          id: card.id,
          label: card.label,
          valuation: card.valuation,
          gross: card.value,
        }
      : null,
    vestingYears: years,
    exerciseCost: card?.exerciseCost ?? null,
    breakdown: Object.freeze(
      [
        { label: usingTarget ? 'Target cash' : 'Base', value: round(cash) },
        {
          label: `Equity at ${card?.label ?? 'this outcome'}, per year`,
          value: round(modeled),
        },
        card?.exerciseCost
          ? { label: 'Already net of exercise cost', value: card.exerciseCost }
          : null,
      ].filter(Boolean)
    ),
  })
}

/**
 * The sentence above the bars. Generated from the real ratio so it stays true
 * when the figures refresh, rather than becoming a stale claim.
 */
function thesisFor(rows, user, ladderId) {
  const totals = rows.map((r) => r.total).sort((a, b) => a - b)
  const median = totals[Math.floor(totals.length / 2)] ?? 0
  const ratio = user.total > 0 ? median / user.total : 0
  const leadership = ladderId === 'leadership'

  const gap =
    ratio >= 1.15
      ? `A ${
          leadership ? 'big-tech director' : 'big-tech senior engineer'
        } package is roughly ${
          ratio >= 10 ? Math.round(ratio) : ratio.toFixed(1)
        } times this one. `
      : ''

  return `${gap}Those bars are flat because listed shares vest whatever happens to the company. Yours moves because your outcome has not happened yet, and that difference is what you are being paid in risk.`
}

/**
 * Everything the plot needs, or an explanation of why there is no plot.
 *
 * @param {object} read a computeRead() result
 * @param {object} ask a computeAsk() ladder
 * @param {{ scenarioId?: string, now?: Date }} [options]
 * @returns {object} frozen
 */
export function buildPlot(read, ask, options = {}) {
  const role = read?.inputs?.role
  const ladder = ladderForRole(role)

  if (!ladder) {
    /* The CEO seat has no equivalent published ladder. Withholding it with a
       reason is a finished design; showing them engineers is not. */
    return Object.freeze({
      withheld: true,
      reason:
        'There is no published pay ladder for a founder-CEO at a named company to compare against. Engineering rows would be the wrong people, so this section is left out rather than shown wrong.',
      asOf: AS_OF,
      source: SOURCE_NAME,
    })
  }

  const scenarioId = options.scenarioId ?? 'conservative'
  const path = read.preselectedPath
  /* Sorted by what is displayed. Data order makes the reader scan for the
     comparison instead of seeing it. */
  const rows = ladder.rows.map(companyRow).sort((a, b) => b.total - a.total)
  const user = userRow(read, ask, scenarioId)

  /* The domain is the widest COMPANY bar, not the widest thing the reader's own
     bar can reach. Scaling to their upside would shrink every company to a
     twelfth of the axis and make the comparison unreadable at the outcome most
     people look at. When their bar runs past the end, that is the finding, and
     an overflow marker says it better than shrinking everything else. */
  const domain = Math.max(...rows.map((r) => r.total), 1)
  const overflow = user.total > domain

  return Object.freeze({
    withheld: false,
    ladderId: ladder.id,
    axisLabel: ladder.axisLabel,
    rows: Object.freeze(rows),
    user,
    marketReference: ladder.marketReference,
    domain,
    overflow,
    thesis: thesisFor(rows, user, ladder.id),
    scenarioId,
    /* Available outcomes, in the order the engine produced them. */
    scenarios: Object.freeze(
      (read.scenarios?.[path] ?? []).map((c) => ({ id: c.id, label: c.label }))
    ),
    stale: isStale(options.now),
    asOf: AS_OF,
    source: SOURCE_NAME,
    caveats: CAVEATS,
    segments: SEGMENTS,
  })
}
