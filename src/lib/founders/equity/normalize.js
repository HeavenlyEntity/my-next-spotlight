import { BOUNDS, clampTo } from './bounds.js'
import {
  ACCELERATION_COC,
  CHIPS,
  EXERCISE_WINDOWS,
  INSTRUMENTS,
  JOINING,
  MARKET_SALARY,
  OFFER_MODES,
  PATHS,
  REPURCHASE_VESTED,
  ROLES,
  STAGES,
  STAGE_ALIASES,
} from './benchmarks.js'

const ENUM_DEFAULTS = Object.freeze({
  role: 'cto',
  joining: 'fractional_conversion',
  stage: 'preseed',
  path: 'ipo',
  instrument: 'options',
  offerMode: 'percent',
  exerciseWindow: 'days_90',
  accelerationCoC: 'none',
  repurchaseVested: 'none',
})

const REQUIRED_NUMERICS = [
  'months',
  'hoursPerWeek',
  'ratePerHour',
  'feesBilled',
  'vestingYears',
  'cliffMonths',
  'accelerationTerminationMonths',
  'severanceMonths',
]
const OPTIONAL_NUMERICS = [
  'offeredSalary',
  'offeredEquityPct',
  'optionCount',
  'fullyDilutedShares',
  'strikePrice',
]
const EXIT_PATHS = ['bootstrap', 'acquisition', 'ipo']

/**
 * Parse a user-typed value into a finite number or `null` for blank/invalid.
 * Accepts numbers and strings like "120,000", "$150", "3%", "1e9".
 * @param {unknown} v
 * @returns {number|null}
 */
export function parseNumber(v) {
  if (v === null || v === undefined || typeof v === 'boolean') return null
  if (typeof v === 'number') return Number.isFinite(v) ? v : null
  if (typeof v !== 'string') return null
  const stripped = v.replace(/[$,%\s_]/g, '')
  if (stripped === '') return null
  const n = Number(stripped)
  return Number.isFinite(n) ? n : null
}

function pickEnum(value, allowed, fallback) {
  return typeof value === 'string' && allowed.includes(value) ? value : fallback
}

/* A gate is "no" only when the user said so; missing means not gated. */
function parseGate(v) {
  if (v === false || v === 0) return false
  if (typeof v === 'string') {
    const s = v.trim().toLowerCase()
    return !(s === 'no' || s === 'false' || s === '0')
  }
  return true
}

function clampNumeric(name, raw, clamped) {
  const b = BOUNDS[name]
  const n = parseNumber(raw)
  if (n === null) return b.optional ? null : b.default
  const c = clampTo(n, b)
  if (c !== n) clamped[name] = true
  return c
}

/* The design doc nests work/comp fields; the wizard keeps them flat. Accept both. */
function flatten(raw) {
  const src = raw && typeof raw === 'object' ? raw : {}
  const work = src.work && typeof src.work === 'object' ? src.work : {}
  const comp = src.comp && typeof src.comp === 'object' ? src.comp : {}
  return { ...work, ...comp, ...src }
}

function normalizeResponsibilities(raw, role) {
  const list = Array.isArray(raw) ? raw : typeof raw === 'string' ? [raw] : []
  const ids = new Set(CHIPS[role].map((c) => c.id))
  const out = []
  for (const id of list) {
    if (typeof id === 'string' && ids.has(id) && !out.includes(id)) out.push(id)
  }
  return Object.freeze(out)
}

function normalizeRoundsBeforeExit(raw, clamped) {
  const src = raw && typeof raw === 'object' ? raw : {}
  const out = {}
  for (const path of EXIT_PATHS) {
    const n = parseNumber(src[path])
    if (n === null) {
      out[path] = null
      continue
    }
    const c = clampTo(Math.round(n), BOUNDS.roundsBeforeExit)
    if (c !== n) clamped[`roundsBeforeExit.${path}`] = true
    out[path] = c
  }
  return Object.freeze(out)
}

/**
 * Normalize raw wizard inputs into the frozen shape the engine computes from.
 * Required numerics clamp to BOUNDS (blank → default); optional numerics keep
 * `null` (blank) and treat `0` as a value. `idea` is preserved as `stage` and
 * mapped to `stageKey: 'preseed'`. `clamped` lists every field that was capped.
 * @param {object} raw
 * @returns {object} frozen normalized inputs, including `clamped`
 */
export function normalizeInputs(raw) {
  const src = flatten(raw)
  const clamped = {}

  const role = pickEnum(src.role, ROLES, ENUM_DEFAULTS.role)
  const joining = pickEnum(src.joining, JOINING, ENUM_DEFAULTS.joining)
  const stageRaw = typeof src.stage === 'string' ? src.stage : ''
  const stage =
    STAGES.includes(stageRaw) || STAGE_ALIASES[stageRaw]
      ? stageRaw
      : ENUM_DEFAULTS.stage
  const stageKey = STAGE_ALIASES[stage] || stage
  const path = pickEnum(src.path, PATHS, ENUM_DEFAULTS.path)
  const instrument = pickEnum(
    src.instrument,
    INSTRUMENTS,
    ENUM_DEFAULTS.instrument
  )
  const offerMode = pickEnum(
    src.offerMode,
    OFFER_MODES,
    ENUM_DEFAULTS.offerMode
  )

  const out = {
    role,
    joining,
    stage,
    stageKey,
    path,
    founders: Math.round(clampNumeric('founders', src.founders, clamped)),
    fullTimeOnSigning: parseGate(src.fullTimeOnSigning),
    finalTechnicalSay: parseGate(src.finalTechnicalSay),
    responsibilities: normalizeResponsibilities(src.responsibilities, role),
    instrument,
    offerMode,
    exerciseWindow: pickEnum(
      src.exerciseWindow,
      EXERCISE_WINDOWS,
      ENUM_DEFAULTS.exerciseWindow
    ),
    accelerationCoC: pickEnum(
      src.accelerationCoC,
      ACCELERATION_COC,
      ENUM_DEFAULTS.accelerationCoC
    ),
    repurchaseVested: pickEnum(
      src.repurchaseVested,
      REPURCHASE_VESTED,
      ENUM_DEFAULTS.repurchaseVested
    ),
  }

  for (const name of REQUIRED_NUMERICS) {
    out[name] = clampNumeric(name, src[name], clamped)
  }

  const marketDefault = MARKET_SALARY[role][stageKey]
  const market = parseNumber(src.marketSalary)
  if (market === null) {
    out.marketSalary = marketDefault
  } else {
    out.marketSalary = clampTo(market, BOUNDS.marketSalary)
    if (out.marketSalary !== market) clamped.marketSalary = true
  }

  for (const name of OPTIONAL_NUMERICS) {
    out[name] = clampNumeric(name, src[name], clamped)
  }

  out.roundsBeforeExit = normalizeRoundsBeforeExit(
    src.roundsBeforeExit,
    clamped
  )
  out.clamped = Object.freeze(clamped)
  return Object.freeze(out)
}
