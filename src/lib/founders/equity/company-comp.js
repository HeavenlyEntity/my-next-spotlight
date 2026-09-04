/*
 * Founders' Desk — named-company compensation, for the market comparison plot.
 *
 * GENERATED-ISH. The figures come from Levels.fyi and are refreshed by
 * `scripts/refresh-company-comp.mjs`. Edit that script's output rather than
 * hand-patching numbers, or the next refresh will silently overwrite you.
 *
 * FOUR THINGS THAT ARE EASY TO GET WRONG HERE
 *
 * 1. AS_OF IS THE RETRIEVAL DATE, NEVER THE PAGE'S OWN "Last updated" STRING.
 *    Every Levels.fyi page prints today's date in that field, because it is the
 *    page-generation timestamp rather than a data vintage. A refresh that
 *    trusted it would stamp today forever and the staleness banner would never
 *    fire, which is exactly the silent decay the banner exists to prevent.
 *    Levels.fyi publishes neither the submission window nor the sample size, so
 *    the honest label is "rolling, retrieved <date>".
 *
 * 2. THESE ARE PER YEAR. `stock` is a four-year grant divided by four, valued
 *    at grant-date price. The user's own equity is a percentage of a company
 *    with no price, so the plot must annualise it before drawing the two in one
 *    bar, or it compares one year against four (design review DD11).
 *
 * 3. TWO LADDERS, NOT ONE. Senior-engineer rows are not a comparison for a CTO.
 *    Levels.fyi does publish a manager and director ladder, on a separate URL
 *    path from the engineer pages. There is no CTO row anywhere: no CTO track,
 *    and CTOs are not named executive officers in proxies (checked Microsoft
 *    FY2025 and Netflix 2026). So the leadership axis is labelled "engineering
 *    leadership", never "CTO".
 *
 * 4. LEVELS.FYI REQUIRES ATTRIBUTION. Every surface showing these figures must
 *    name the source.
 */

import { FIGURES } from './company-comp-figures.js'

/* Rolling window, retrieved on this date. Not a data vintage.
   Comes from the generated figures file so a refresh updates it in one place. */
export const AS_OF = FIGURES.asOf

export const SOURCE_NAME = 'Levels.fyi'
export const SOURCE_URL = 'https://www.levels.fyi/'

/* How long before the plot starts warning about itself. Levels.fyi updates
   continuously while the equity bands beside it refresh yearly, so this is the
   fastest-decaying data on the desk. */
export const STALE_AFTER_MONTHS = 6

/* How the equity actually converts to money, which is the lesson the plot
   exists to teach. */
export const LIQUIDITY = Object.freeze({
  public: Object.freeze({
    id: 'public',
    label: 'Public',
    detail: 'Listed stock. Sells the morning it vests.',
  }),
  tender: Object.freeze({
    id: 'tender',
    label: 'Tender',
    detail:
      'Private stock. Turning it into money needs a tender offer the company chooses to run.',
  }),
  options: Object.freeze({
    id: 'options',
    label: 'Options',
    detail:
      'Options with a strike price you pay in cash. No market, and a bill before you own anything.',
  }),
})

const row = ({
  ladder,
  id,
  company,
  level,
  levelName = null,
  liquidity,
  confidence = 'sourced',
  note = null,
}) => {
  /* Numbers come from the generated file; everything else is curated here and
     survives a refresh. A missing figure is a hard error rather than a zero,
     because a row silently rendering as $0 would look like a real datapoint. */
  const f = FIGURES[ladder]?.[id]
  if (!f) throw new Error(`company-comp: no figures for ${ladder}.${id}`)
  const total = f.base + f.stock + f.bonus
  return Object.freeze({
    id,
    company,
    level,
    levelName,
    base: f.base,
    stock: f.stock,
    bonus: f.bonus,
    total,
    /* Share of the package that is stock. Microsoft at 14% is far steadier
       than Databricks at 65%, and a totals-only chart hides that entirely. */
    stockShare: Number(((f.stock / total) * 100).toFixed(1)),
    liquidity,
    confidence,
    note,
  })
}

/* THE IC LADDER — senior software engineer. Used for the engineer seat. */
const IC = [
  row({
    ladder: 'ic',
    id: 'netflix',
    company: 'Netflix',
    level: 'L5',
    levelName: 'Senior',
    liquidity: 'public',
    note: 'Netflix pays one cash number by design and lets people elect stock out of it. The zero is policy, not missing data, and this is the most liquid figure on the board.',
  }),
  row({
    ladder: 'ic',
    id: 'openai',
    company: 'OpenAI',
    level: 'L4',
    liquidity: 'tender',
    confidence: 'interpolated',
    note: 'Levels.fyi publishes no level names for OpenAI; L4 is mapped to senior from the comp shape and years of experience, not from a published label.',
  }),
  row({
    ladder: 'ic',
    id: 'anthropic',
    company: 'Anthropic',
    level: 'Senior',
    liquidity: 'tender',
  }),
  row({
    ladder: 'ic',
    id: 'databricks',
    company: 'Databricks',
    level: 'L5',
    levelName: 'Senior',
    liquidity: 'tender',
  }),
  row({
    ladder: 'ic',
    id: 'stripe',
    company: 'Stripe',
    level: 'L3',
    levelName: 'Senior-equivalent',
    liquidity: 'tender',
  }),
  row({
    ladder: 'ic',
    id: 'google',
    company: 'Google',
    level: 'L5',
    levelName: 'Senior',
    liquidity: 'public',
  }),
  row({
    ladder: 'ic',
    id: 'meta',
    company: 'Meta',
    level: 'E5',
    levelName: 'Senior',
    liquidity: 'public',
  }),
  row({
    ladder: 'ic',
    id: 'amazon',
    company: 'Amazon',
    level: 'SDE III',
    liquidity: 'public',
    note: 'Amazon back-loads vesting at 5/15/40/40, so a stated first-year package is front-loaded with sign-on cash rather than stock.',
  }),
  row({
    ladder: 'ic',
    id: 'apple',
    company: 'Apple',
    level: 'ICT4',
    levelName: 'Senior',
    liquidity: 'public',
  }),
  row({
    ladder: 'ic',
    id: 'slack',
    company: 'Slack (Salesforce)',
    level: 'Senior',
    liquidity: 'public',
    note: 'Acquired by Salesforce; the stock is Salesforce stock on a legacy band. This sits above Salesforce’s own senior track, so do not read the two as equivalent.',
  }),
  row({
    ladder: 'ic',
    id: 'microsoft',
    company: 'Microsoft',
    level: '63',
    levelName: 'Senior',
    liquidity: 'public',
    note: 'Only 14% of this package is stock, which makes the total far steadier than it looks next to companies where stock is most of the number.',
  }),
]

/* THE LEADERSHIP LADDER — the director rung. Used for the CTO seat.
 *
 * Someone running 30 to 100 engineers is applying into a D1 or L8 seat, not a
 * VP seat and not an IC-staff seat. Level codes are not equivalent across
 * companies, so the comparison is anchored on scope rather than on the code.
 *
 * Every row here is thin-n: Meta's M2 exceeds its own D1 in the same dataset,
 * which is a level inversion and near-certain small-sample noise. Marked
 * accordingly so the plot can say so. */
const LEADERSHIP = [
  row({
    ladder: 'leadership',
    id: 'apple',
    company: 'Apple',
    level: 'D1',
    levelName: 'Director',
    liquidity: 'public',
    confidence: 'interpolated',
    note: 'Director-rung rows across every company are thin-n.',
  }),
  row({
    ladder: 'leadership',
    id: 'meta',
    company: 'Meta',
    level: 'D1',
    levelName: 'Director',
    liquidity: 'public',
    confidence: 'interpolated',
    note: 'Meta’s M2 rung exceeds this one in the same dataset, which is a level inversion and near-certain small-sample noise.',
  }),
  row({
    ladder: 'leadership',
    id: 'google',
    company: 'Google',
    level: 'L8',
    levelName: 'Director',
    liquidity: 'public',
    confidence: 'interpolated',
    note: 'Director-rung rows across every company are thin-n.',
  }),
  row({
    ladder: 'leadership',
    id: 'amazon',
    company: 'Amazon',
    level: 'L8',
    levelName: 'Director',
    liquidity: 'public',
    confidence: 'interpolated',
    note: 'Director-rung rows across every company are thin-n. Amazon also back-loads vesting at 5/15/40/40.',
  }),
  row({
    ladder: 'leadership',
    id: 'netflix',
    company: 'Netflix',
    level: 'Director',
    liquidity: 'public',
    confidence: 'interpolated',
    note: 'One cash number by design, as at every Netflix level. Thin-n.',
  }),
  row({
    ladder: 'leadership',
    id: 'databricks',
    company: 'Databricks',
    level: 'M5',
    levelName: 'Director',
    liquidity: 'tender',
    confidence: 'interpolated',
    note: 'Director-rung rows across every company are thin-n.',
  }),
  row({
    ladder: 'leadership',
    id: 'salesforce',
    company: 'Salesforce',
    level: 'Sr Director',
    liquidity: 'public',
    confidence: 'interpolated',
    note: 'Salesforce and Microsoft grant far less stock at this rung than the others. That gap is real, not an error.',
  }),
  row({
    ladder: 'leadership',
    id: 'microsoft',
    company: 'Microsoft',
    level: '67',
    levelName: 'Sr Director',
    liquidity: 'public',
    confidence: 'interpolated',
    note: 'Salesforce and Microsoft grant far less stock at this rung than the others. That gap is real, not an error.',
  }),
]

export const LADDERS = Object.freeze({
  ic: Object.freeze({
    id: 'ic',
    label: 'Senior software engineer',
    axisLabel: 'Senior software engineer, total compensation per year',
    rows: Object.freeze(IC),
    /* Levels.fyi 2025 pay report, all US companies. */
    marketReference: Object.freeze({
      label: 'Market, senior engineer',
      total: 312_000,
      source: 'Levels.fyi 2025 pay report',
    }),
  }),
  leadership: Object.freeze({
    id: 'leadership',
    label: 'Engineering leadership',
    /* Never "CTO compensation": no such row exists anywhere. */
    axisLabel:
      'Engineering leadership, director rung, total compensation per year',
    rows: Object.freeze(LEADERSHIP),
    marketReference: Object.freeze({
      label: 'Market, staff engineer',
      total: 457_000,
      source: 'Levels.fyi 2025 pay report',
    }),
  }),
})

/* Which ladder a seat compares against, and whether it compares at all.
   `ceo_builder` has no equivalent ladder, so the plot is withheld rather than
   shown against the wrong people. */
export const LADDER_FOR_ROLE = Object.freeze({
  engineer: 'ic',
  cto: 'leadership',
  ceo_builder: null,
})

/**
 * The ladder a seat should be plotted against.
 * @returns {object|null} null when this seat has no honest comparator
 */
export function ladderForRole(role) {
  const key = LADDER_FOR_ROLE[role]
  return key ? LADDERS[key] : null
}

/**
 * Whether the figures are old enough that the plot should say so.
 * @param {Date|string} [now]
 */
export function isStale(now = new Date()) {
  const then = new Date(`${AS_OF}T00:00:00Z`)
  const at = now instanceof Date ? now : new Date(now)
  if (Number.isNaN(at.getTime()) || Number.isNaN(then.getTime())) return false
  const months =
    (at.getFullYear() - then.getFullYear()) * 12 +
    (at.getMonth() - then.getMonth())
  return months >= STALE_AFTER_MONTHS
}

/* Excluded on purpose, so nobody re-adds them without reading why. */
export const EXCLUSIONS = Object.freeze([
  Object.freeze({
    company: 'Cursor (Anysphere)',
    reason:
      'Levels.fyi carries roughly one reported package. A sample of one is not a market.',
  }),
  Object.freeze({
    company: 'OpenAI and Anthropic, leadership ladder',
    reason:
      'OpenAI’s manager page renders a single row mislabelled with an IC title, and Anthropic publishes no levelled manager rows at all. Both stay on the IC ladder only.',
  }),
])

/* Read on every surface that shows these numbers. */
export const CAVEATS = Object.freeze([
  'US medians. Outside a hub these run roughly 7% lower; in the Bay Area or New York, roughly 14% higher.',
  'Stock is a four-year grant divided by four, valued at the grant-date price.',
  'Level codes are not equivalent across companies. The comparison is anchored on scope.',
])
