'use client'

import { createRef, useMemo } from 'react'
import { motion, useReducedMotion, useScroll, useTransform } from 'motion/react'

/* Scroll-stacking story cards, built to read as real card stock dealt
   onto a pile. Geometry ported from React Bits "ScrollStack"
   (reactbits.dev, MIT): each card pins a little lower than the one before
   so the pile fans, and a covered card eases back toward a base scale.
   The original drives everything through Lenis and manual transforms;
   this port pins with CSS sticky and reads scroll with Motion's
   useScroll, so it needs no smooth-scroll library.

   GLASS, NOT PAPER. The deck reads as stacked holographic panes:
   - surface: a translucent pane over whatever sits behind it, blurred and
     saturated so the card underneath diffuses instead of showing through
     as readable text;
   - light: a fixed specular sheen off the top-left corner and a fixed
     iridescent wash. FIXED is the point. This used to sweep a teal
     gradient across each card as it was dealt, and a highlight that
     travels independently of the light source reads as a smear rather
     than as reflection;
   - edge: a bright hairline along the top where a real pane catches the
     light, and a hairline ring for the pane's thickness;
   - 3D: unchanged. The deck sits in a perspective; a card arrives tipped
     12deg away (rotateX) with a slight rotateZ tilt, lays flat as it
     lands on its pin line, then leans back a couple of degrees once the
     next pane covers it. A large cast shadow while it is in the air
     collapses to a tight contact shadow on landing.
   Reduced motion keeps the stacking (positional) and renders every pane
   in its resting state. */

const PIN_TOP = 96
const STACK_GAP = 14
const BASE_SCALE = 0.92
const SCALE_STEP = 0.015
const DEAL_TILT = 1.6
const SETTLE_TILT = 0.9
const DEAL_PITCH = 12
const SETTLE_PITCH = -2.5

const GRAIN =
  "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='160' height='160'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 0.5  0 0 0 0 0.5  0 0 0 0 0.5  0 0 0 1 0'/></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>\")"

/* The pane's own edges are constant; the two outer shadows are what change
   between "in the air" and "resting on the pile". White at low alpha reads as
   a lit glass edge in both themes, so this needs no light/dark branch. */
const EDGE =
  'inset 0 1px 0 rgba(255,255,255,0.5), inset 0 0 0 1px rgba(255,255,255,0.06), inset 0 -1px 0 rgba(255,255,255,0.12)'
/* Same layer count as the resting shadow so Motion can tween between them. */
const SHADOW_LIFTED = `${EDGE}, 0 2px 4px rgba(0,0,0,0.05), 0 -12px 30px -22px rgba(0,0,0,0), 0 48px 72px -28px rgba(0,0,0,0.45)`
const SHADOW_RESTING = `${EDGE}, 0 1px 2px rgba(0,0,0,0.07), 0 -12px 30px -22px rgba(0,0,0,0.4), 0 14px 28px -20px rgba(0,0,0,0.3)`

function StoryCard({ chapter, index, total, cardRef, nextRef, reduce }) {
  const pinTop = PIN_TOP + index * STACK_GAP
  const isLast = index === total - 1
  const side = index % 2 === 0 ? 1 : -1

  /* This card arriving: from the bottom of the viewport to its pin line. */
  const { scrollYProgress: arrive } = useScroll({
    target: cardRef,
    offset: ['start end', `start ${pinTop}px`],
  })
  /* The next card arriving: the span during which this card is covered. */
  const { scrollYProgress: covered } = useScroll({
    target: nextRef ?? cardRef,
    offset: ['start end', `start ${pinTop + STACK_GAP}px`],
  })

  const dealRotate = useTransform(arrive, [0, 1], [DEAL_TILT * side, 0])
  const settleRotate = useTransform(covered, [0, 1], [0, -SETTLE_TILT * side])
  const rotate = useTransform(
    [dealRotate, settleRotate],
    ([deal, settle]) => deal + (isLast ? 0 : settle)
  )
  const dealPitch = useTransform(arrive, [0, 1], [DEAL_PITCH, 0])
  const settlePitch = useTransform(covered, [0, 1], [0, SETTLE_PITCH])
  const rotateX = useTransform(
    [dealPitch, settlePitch],
    ([deal, settle]) => deal + (isLast ? 0 : settle)
  )
  const scale = useTransform(
    covered,
    [0, 1],
    [1, BASE_SCALE + index * SCALE_STEP]
  )
  const boxShadow = useTransform(
    arrive,
    [0, 0.85, 1],
    [SHADOW_LIFTED, SHADOW_LIFTED, SHADOW_RESTING]
  )

  const style = reduce
    ? { top: pinTop, boxShadow: SHADOW_RESTING }
    : {
        top: pinTop,
        rotate,
        rotateX,
        scale: isLast ? 1 : scale,
        boxShadow,
        transformOrigin: 'top center',
      }

  return (
    <motion.article
      ref={cardRef}
      style={style}
      className="amw-holo-pane border-[var(--amw-line-strong)] sticky overflow-hidden rounded-2xl border p-6 will-change-transform md:p-8"
    >
      {/* The coating, in storefront.css because the blend modes have to differ
          by theme: `screen` reads on a charcoal pane and does nothing on a
          white one. All four layers are fixed to the pane. */}
      <span aria-hidden="true" className="amw-holo-tint" />
      <span aria-hidden="true" className="amw-holo-shift" />
      <span aria-hidden="true" className="amw-holo-specular" />
      <span
        aria-hidden="true"
        className="amw-holo-grain"
        style={{ backgroundImage: GRAIN }}
      />

      {/* Index-card header: number on the left, deck position on the
          right, ruled off with an accent line that fades out to the edge. */}
      <div className="relative flex items-center justify-between gap-4 pb-4">
        <span className="amw-mono text-[var(--amw-accent-ink)] bg-[var(--amw-accent-soft)] ring-[var(--amw-accent)]/30 rounded-md px-2 py-1 text-sm font-medium ring-1">
          {chapter.number}
        </span>
        <div className="flex items-center gap-1.5" aria-hidden="true">
          {Array.from({ length: total }).map((_, i) => (
            <span
              key={i}
              className={`h-1 rounded-full ${
                i === index
                  ? 'bg-[var(--amw-accent)] w-6'
                  : 'bg-[var(--amw-line-strong)] w-3'
              }`}
            />
          ))}
        </div>
        <span
          aria-hidden="true"
          className="absolute inset-x-0 bottom-0 h-px"
          style={{
            background:
              'linear-gradient(90deg, var(--amw-accent) 0%, color-mix(in srgb, var(--amw-accent) 35%, transparent) 55%, transparent 100%)',
          }}
        />
      </div>

      {/* h2, not h3. Each chapter is a top-level section of the page's
          narrative and nothing headings the deck above them, so h3 skipped a
          level straight from the page h1. */}
      <h2
        style={{ fontFamily: 'Layer, sans-serif' }}
        className="relative mt-6 text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 md:text-3xl"
      >
        {chapter.title}
      </h2>
      <p className="relative mt-4 max-w-prose text-base leading-relaxed text-zinc-600 dark:text-zinc-400 md:text-lg">
        {chapter.copy}
      </p>
    </motion.article>
  )
}

export function StoryStack({ chapters }) {
  const reduce = useReducedMotion()
  const refs = useMemo(() => chapters.map(() => createRef()), [chapters])

  return (
    <div
      className="flex flex-col gap-6 pb-24"
      style={{
        perspective: 1400,
        perspectiveOrigin: '50% 0%',
        /* The deal tilt and the perspective both widen a card's painted box
           past the column. On a phone that becomes real horizontal scroll, so
           the deck clips its own overflow. `clip`, never `hidden`: hidden makes
           an ancestor a scroll container and `position: sticky` stops working,
           which is the entire stacking effect. `clip` does not, and leaving the
           y axis visible keeps the lifted cast shadow. */
        overflowX: 'clip',
        overflowY: 'visible',
      }}
    >
      {chapters.map((chapter, index) => (
        <StoryCard
          key={chapter.number}
          chapter={chapter}
          index={index}
          total={chapters.length}
          cardRef={refs[index]}
          nextRef={refs[index + 1]}
          reduce={reduce}
        />
      ))}
    </div>
  )
}
