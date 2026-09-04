/*
 * Parser and sanity gate for the company compensation refresh.
 *
 * Pure and dependency-free on purpose: the refresh script fetches, this decides
 * whether what came back is usable, and a fixture test exercises it without
 * touching the network.
 *
 * THE FAILURE THIS GUARDS AGAINST is not the loud one. If Levels.fyi redesigns
 * and the parser crashes, someone notices immediately. The expensive failure is
 * a regex that still matches, pulls the wrong number, and writes it into the
 * data file with a fresh date on it. Everything below exists to make that
 * loud instead of silent (design review D8).
 */

/* The block a Levels.fyi level page renders its figures in. Captured verbatim
   from a real page; see __tests__/fixtures/levels-google-l5.txt. */
const BLOCK =
  /Average Annual Total Compensation\s*\$([\d,]+)\s*Base Salary\s*\$([\d,]+)\s*Stock Grant \(\/yr\)\s*\$([\d,]+)\s*Bonus\s*\$([\d,]+)/

const money = (s) => Number(String(s).replace(/,/g, ''))

/**
 * Pull the four figures out of a Levels.fyi level page's text.
 * @param {string} text page innerText
 * @returns {{ ok: true, base: number, stock: number, bonus: number, total: number }
 *          | { ok: false, reason: string }}
 */
export function parseLevelsPage(text) {
  if (typeof text !== 'string' || text.length === 0) {
    return { ok: false, reason: 'empty page text' }
  }
  const m = BLOCK.exec(text)
  if (!m) {
    return {
      ok: false,
      reason:
        'compensation block not found. Levels.fyi has probably changed its markup; re-capture the fixture and update BLOCK.',
    }
  }
  const [, total, base, stock, bonus] = m.map(money)
  return { ok: true, total, base, stock, bonus }
}

/*
 * Bounds. Deliberately wide: these reject nonsense, not surprises. A real
 * change in the market should pass; a parser that grabbed a phone number or a
 * page-view count should not.
 */
export const BOUNDS = Object.freeze({
  base: [60_000, 1_500_000],
  stock: [0, 3_000_000],
  bonus: [0, 500_000],
  total: [80_000, 4_000_000],
})

/* How far a figure may move between refreshes before it needs a human. The
   window is rolling, so drift is normal; a doubling is not. */
export const MAX_DRIFT = 0.6

/**
 * Decide whether a parsed row is safe to write.
 * @param {object} parsed a successful parseLevelsPage result
 * @param {object} [previous] the row currently in company-comp.js, if any
 * @returns {{ ok: boolean, problems: string[] }}
 */
export function checkRow(parsed, previous = null) {
  const problems = []
  if (!parsed || parsed.ok === false) {
    return { ok: false, problems: [parsed?.reason ?? 'no parse result'] }
  }

  for (const [field, [lo, hi]] of Object.entries(BOUNDS)) {
    const value = parsed[field]
    if (!Number.isFinite(value)) {
      problems.push(`${field} is not a number`)
      continue
    }
    if (value < lo || value > hi) {
      problems.push(`${field} of ${value} is outside ${lo}-${hi}`)
    }
  }

  /* The parts must actually make the whole. A mismatch means the regex picked
     up figures from different blocks, which is the dangerous case: every
     individual number looks plausible. */
  if (
    Number.isFinite(parsed.total) &&
    Number.isFinite(parsed.base) &&
    Number.isFinite(parsed.stock) &&
    Number.isFinite(parsed.bonus)
  ) {
    const sum = parsed.base + parsed.stock + parsed.bonus
    const off = Math.abs(sum - parsed.total) / Math.max(parsed.total, 1)
    /* Levels.fyi rounds its own components, so allow a little slack. */
    if (off > 0.02) {
      problems.push(
        `base + stock + bonus is ${sum} but the page totals ${
          parsed.total
        }, off by ${(off * 100).toFixed(1)}%`
      )
    }
  }

  /* Accept a previous row in either shape. The stored rows carry only the three
     components, and requiring callers to remember to add a total is how the
     drift check silently stops firing. */
  const prevTotal = previous
    ? Number.isFinite(previous.total)
      ? previous.total
      : previous.base + previous.stock + previous.bonus
    : null
  if (Number.isFinite(prevTotal) && prevTotal > 0) {
    const drift = Math.abs(parsed.total - prevTotal) / prevTotal
    if (drift > MAX_DRIFT) {
      problems.push(
        `total moved ${(drift * 100).toFixed(0)}% from ${prevTotal} to ${
          parsed.total
        }, which is past the ${MAX_DRIFT * 100}% review threshold`
      )
    }
  }

  return { ok: problems.length === 0, problems }
}

/**
 * The as-of stamp for a refresh.
 *
 * ALWAYS the retrieval date, NEVER anything parsed from the page. Every
 * Levels.fyi page prints today's date in its "Last updated" field, because that
 * is when the page was generated rather than when the data was collected. A
 * refresh that trusted it would stamp today forever and the staleness banner
 * would never fire, which is the silent decay it exists to prevent.
 *
 * @param {Date} [now]
 * @returns {string} YYYY-MM-DD
 */
export function asOfStamp(now = new Date()) {
  return now.toISOString().slice(0, 10)
}

/**
 * Gate a whole refresh. Refuses the write unless every row passes, because a
 * partial write leaves the file internally inconsistent with a fresh date on
 * it, which is worse than not refreshing at all.
 *
 * @param {Array<{ id: string, parsed: object, previous?: object }>} rows
 * @returns {{ ok: boolean, failures: Array<{ id: string, problems: string[] }> }}
 */
export function gate(rows) {
  const failures = []
  for (const { id, parsed, previous } of rows) {
    const result = checkRow(parsed, previous)
    if (!result.ok) failures.push({ id, problems: result.problems })
  }
  return { ok: failures.length === 0, failures }
}
