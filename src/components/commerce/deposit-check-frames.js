/* The deposit sheet's success choreography, authored as data: frames for
   the PaceUI DotLoader (arrays of lit dot indices on a 9x9 grid).

   The sequence reads as an LED display booting up -- a few frames of
   scattered flicker -- then the checkmark resolves along its stroke, left
   arm down and long arm up, while the noise burns off. The last frame is
   the clean checkmark; the loader holds whatever it applied last, so the
   check stays lit after the animation stops.

   Everything is precomputed at module scope with a seeded generator, so
   the flicker is identical on every payment and in every test -- random
   enough to read as static, deterministic enough to never flake. */

const COLUMNS = 9

/* Same string-art convention as ship-figures.jsx: '#' lights a dot. */
function glyph(rows) {
  return rows.flatMap((row, y) =>
    Array.from(row)
      .map((ch, x) => (ch === '#' ? y * COLUMNS + x : -1))
      .filter((i) => i >= 0)
  )
}

/* The landed frame: a two-dot-thick check, vertex low-left of centre. */
export const CHECK_FRAME = glyph([
  '.........',
  '........#',
  '.......##',
  '......##.',
  '.#...##..',
  '.##.##...',
  '..####...',
  '...##....',
  '.........',
])

/* Park-Miller LCG: the flicker's dice, seeded once so every run agrees. */
function lcg(seed) {
  let s = seed
  return () => (s = (s * 48271) % 2147483647) / 2147483647
}

function noise(rand, count) {
  const lit = new Set()
  while (lit.size < count) {
    lit.add(Math.floor(rand() * COLUMNS * COLUMNS))
  }
  return [...lit]
}

const rand = lcg(20260915)

/* Boot-up: density swells like a display powering on, then dips just
   before the resolve so the checkmark's arrival reads as the signal
   emerging from the static. */
const boot = [6, 12, 18, 24, 14].map((count) => noise(rand, count))

/* Sweep resolve: the check revealed column by column -- which is stroke
   order, since the left arm occupies the low columns and the long arm
   climbs through the high ones -- with the leftover noise thinning to
   nothing as the stroke completes. */
const STEPS = 8
const resolve = Array.from({ length: STEPS }, (_, step) => {
  const shown = CHECK_FRAME.filter((i) => i % COLUMNS <= step + 1)
  const residue = noise(rand, Math.round(12 * (1 - (step + 1) / STEPS)))
  return [...new Set([...shown, ...residue])]
})

export const DEPOSIT_CHECK_FRAMES = [...boot, ...resolve, CHECK_FRAME]

/* Reduced motion plays this instead: the landed frame alone. A stable
   module-scope reference, because DotLoader restarts its interval whenever
   the frames array changes identity. */
export const DEPOSIT_CHECK_STILL = [CHECK_FRAME]

export const DEPOSIT_FRAME_MS = 80

/* When the matrix lands, in seconds: the staged reveal below the check and
   the glow pulse behind it are both keyed off this moment. */
export const DEPOSIT_MATRIX_S =
  (DEPOSIT_CHECK_FRAMES.length * DEPOSIT_FRAME_MS) / 1000
