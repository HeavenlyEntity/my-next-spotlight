import { CHIPS } from '../benchmarks.js'

/* Deterministic PRNG (mulberry32) so fuzz failures reproduce. */
export function seededRandom(seed) {
  let a = seed >>> 0
  return function next() {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/* Chip ids that land a role in a target class (scores stay under the de facto threshold). */
export function chipsForClass(role, cls) {
  const chips = CHIPS[role]
  if (cls === 'founder') return chips.map((c) => c.id)
  if (cls === 'hire') {
    const smallest = [...chips].sort((a, b) => a.weight - b.weight)[0]
    return [smallest.id]
  }
  const target = cls === 'founding_executive' ? 3.5 : 2
  const out = []
  let score = 0
  for (const c of chips) {
    if (score >= target) break
    out.push(c.id)
    score += c.weight
  }
  return out
}

/* Walk any value and collect paths holding NaN or a non-finite number. */
export function findBadNumbers(value, path = 'read', out = []) {
  if (typeof value === 'number') {
    if (!Number.isFinite(value)) out.push(`${path}=${value}`)
    return out
  }
  if (Array.isArray(value)) {
    value.forEach((v, i) => findBadNumbers(v, `${path}[${i}]`, out))
    return out
  }
  if (value && typeof value === 'object') {
    for (const k of Object.keys(value))
      findBadNumbers(value[k], `${path}.${k}`, out)
  }
  return out
}
