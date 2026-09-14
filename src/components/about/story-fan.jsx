'use client'

import { useCallback, useMemo, useRef, useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import {
  AnimatePresence,
  motion,
  useReducedMotion,
  useTransform,
} from 'motion/react'
import { CarouselStacked } from '@/components/ui/carousel-stacked'

/* The story as a hand of cards fanned along an arc, the current chapter
   raised in the middle, the rest falling away to either side. Drag the
   fan, press the arrows, or use the keys; the chapter under the raised
   card reads below it at full size.

   WHY THE COPY IS NOT ON THE CARD. The reference this is built on is a
   photo carousel: its cards are 256x384 and say one line. A chapter here
   runs to 390 characters, which no card that size can carry at a readable
   size on a phone. So the card is the flash card -- number and title,
   enough to recognise the chapter in the fan -- and the paragraph lives
   under the fan where the eye lands next, crossfading as the fan moves.
   That keeps the text at 16px+ everywhere and the arc intact.

   The cards are solid, with the page's holographic coating as overlays.
   A fan is the one arrangement where a translucent card would be worst:
   four others are always behind it.

   A11Y. The fan is a group with a keyboard; two 44px buttons do the same
   for pointers; cards behind the front one are hidden from assistive tech,
   and a live region announces the chapter that arrived. Reduced motion
   snaps the fan and cuts the paragraph. */

const iconButton =
  'border-[var(--amw-line)] bg-[var(--amw-card)] hover:border-[var(--amw-accent)] hover:text-[var(--amw-accent-ink)] flex h-11 w-11 items-center justify-center rounded-full border text-zinc-800 transition-[border-color,color,transform] duration-200 active:scale-95 motion-reduce:active:scale-100 dark:text-zinc-200'

function Face({ chapter, offset, active }) {
  /* The page's own surface, laid over cards as they fall away, so the
     raised card is the bright one without any card going grey. */
  const dim = useTransform(
    offset,
    [-2, -0.5, 0, 0.5, 2],
    [0.55, 0.22, 0, 0.22, 0.55]
  )

  return (
    <div
      aria-hidden={active ? undefined : true}
      className={`bg-[var(--amw-card)] relative flex h-full flex-col overflow-hidden rounded-2xl border p-5 transition-[border-color,box-shadow] duration-300 ${
        active
          ? 'border-[var(--amw-accent)] shadow-[0_18px_40px_-20px_rgba(9,9,11,0.35)]'
          : 'border-[var(--amw-line-strong)] shadow-[0_10px_24px_-18px_rgba(9,9,11,0.3)]'
      }`}
    >
      <span aria-hidden="true" className="amw-holo-tint" />
      <span aria-hidden="true" className="amw-holo-shift" />
      <span aria-hidden="true" className="amw-holo-specular" />
      <span aria-hidden="true" className="amw-holo-grain" />

      <span className="amw-mono text-[var(--amw-accent-ink)] bg-[var(--amw-accent-soft)] ring-[var(--amw-accent)]/30 relative self-start rounded-md px-2 py-1 text-sm font-medium ring-1">
        {chapter.number}
      </span>

      <h2
        style={{ fontFamily: 'Layer, sans-serif' }}
        className="relative mt-auto text-xl font-bold leading-tight tracking-tight text-zinc-900 dark:text-zinc-50 sm:text-2xl"
      >
        {chapter.title}
      </h2>

      <motion.span
        aria-hidden="true"
        style={{ opacity: dim }}
        className="bg-[var(--amw-bg)] pointer-events-none absolute inset-0"
      />
    </div>
  )
}

export function StoryFan({ chapters }) {
  const reduce = useReducedMotion()
  const fan = useRef(null)
  const [active, setActive] = useState(0)
  const total = chapters.length
  const current = chapters[active]

  /* The longest paragraph sets the reading area's height, invisibly, so
     a shorter chapter does not pull the controls up and a longer one does
     not push them down. */
  const longest = useMemo(
    () => chapters.reduce((a, b) => (b.copy.length > a.copy.length ? b : a)),
    [chapters]
  )

  const next = useCallback(() => fan.current?.next(), [])
  const prev = useCallback(() => fan.current?.prev(), [])

  const onKeyDown = (event) => {
    if (
      event.key === 'ArrowRight' ||
      event.key === 'Enter' ||
      event.key === ' '
    ) {
      event.preventDefault()
      next()
    } else if (event.key === 'ArrowLeft') {
      event.preventDefault()
      prev()
    }
  }

  const renderCard = useCallback(
    (chapter, _index, { offset, active: isActive }) => (
      <Face chapter={chapter} offset={offset} active={isActive} />
    ),
    []
  )

  return (
    <div>
      <div
        role="group"
        aria-roledescription="carousel"
        aria-label="The story, one chapter per card"
        tabIndex={0}
        onKeyDown={onKeyDown}
        className="focus-visible:ring-[var(--amw-accent)] focus-visible:ring-offset-[var(--amw-bg)] -mx-6 rounded-2xl outline-none focus-visible:ring-2 focus-visible:ring-offset-4 md:mx-0"
      >
        <CarouselStacked
          ref={fan}
          items={chapters}
          renderCard={renderCard}
          onChange={setActive}
          reduce={Boolean(reduce)}
        />
      </div>

      <div className="mt-2 grid">
        <p
          aria-hidden="true"
          className="invisible col-start-1 row-start-1 max-w-prose text-base leading-relaxed md:text-lg"
        >
          {longest.copy}
        </p>
        <AnimatePresence mode="wait" initial={false}>
          <motion.p
            key={current.number}
            initial={reduce ? false : { opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={reduce ? { opacity: 1 } : { opacity: 0, y: -6 }}
            transition={{ duration: reduce ? 0 : 0.22, ease: 'easeOut' }}
            className="col-start-1 row-start-1 max-w-prose text-base leading-relaxed text-zinc-600 dark:text-zinc-400 md:text-lg"
          >
            {current.copy}
          </motion.p>
        </AnimatePresence>
      </div>

      <div className="mt-6 flex items-center justify-between gap-4">
        <div className="flex items-center gap-1.5" aria-hidden="true">
          {chapters.map((chapter, i) => (
            <span
              key={chapter.number}
              className={`h-1 rounded-full transition-[width,background-color] duration-300 ${
                i === active
                  ? 'bg-[var(--amw-accent)] w-6'
                  : 'bg-[var(--amw-line-strong)] w-3'
              }`}
            />
          ))}
          <span className="amw-mono ml-3 text-xs tabular-nums text-zinc-500 dark:text-zinc-500">
            {current.number} / {String(total).padStart(2, '0')}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={prev}
            aria-label="Previous chapter"
            className={iconButton}
          >
            <ChevronLeft className="h-4 w-4" aria-hidden="true" />
          </button>
          <button
            type="button"
            onClick={next}
            aria-label="Next chapter"
            className={iconButton}
          >
            <ChevronRight className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
      </div>

      <p className="sr-only" aria-live="polite">
        Chapter {active + 1} of {total}: {current.title}
      </p>
    </div>
  )
}
