/* Display formatting for the equity calculator. Numbers stay tabular and
   short: $1.4M, $400M, $5B; percents keep the engine's grain. */

export const CLASS_LABELS = {
  founder: 'Founder',
  founding_executive: 'Founding executive',
  hired_executive: 'Hired executive',
  hire: 'Hire',
  unknown: '?',
}

export const STAGE_LABELS = {
  idea: 'idea',
  preseed: 'pre-seed',
  seed: 'seed',
  series_a: 'Series A',
  series_b_plus: 'Series B+',
}

export const PATH_LABELS = {
  bootstrap: 'Bootstrap / hold',
  acquisition: 'Acquisition',
  ipo: 'IPO',
  unknown: 'Unknown',
}

export const ROLE_LABELS = {
  cto: 'CTO',
  engineer: 'Software engineer',
  ceo_builder: 'CEO who builds',
}

export function fmtMoney(value) {
  if (value === null || value === undefined || !Number.isFinite(value))
    return '—'
  const abs = Math.abs(value)
  if (abs >= 1e9) return `$${trim(value / 1e9)}B`
  if (abs >= 1e6) return `$${trim(value / 1e6)}M`
  if (abs >= 1e3) return `$${trim(value / 1e3)}k`
  return `$${Math.round(value)}`
}

export function fmtPct(value) {
  if (value === null || value === undefined || !Number.isFinite(value))
    return '—'
  return `${trim(value)}%`
}

export function fmtPts(value) {
  if (value === null || value === undefined || !Number.isFinite(value))
    return '—'
  const sign = value > 0 ? '+' : ''
  return `${sign}${trim(value)} pts`
}

function trim(n) {
  const rounded = Math.round(n * 100) / 100
  return String(rounded)
}
