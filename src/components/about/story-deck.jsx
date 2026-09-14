'use client'

import { useCallback, useMemo, useRef, useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useReducedMotion } from 'motion/react'
import ClickStack from '@/components/react-bits/click-stack'

/* The story as a deck of flash cards: one chapter per card, the rest of
   the pile peeking out behind it, tap or press to deal the next.

   This replaces a scroll-pinned stack whose cards carried a 45% black cast
   shadow. On the dark theme that shadow vanished; on white it was painted
   in full and then cut off by the next card's translucent pane, which is
   what a hard grey band under every card looked like. A deck has one card
   on top and a contact shadow under the pile, so the problem does not
   exist to fix.

   SOLID, NOT GLASS. The coating from storefront.css stays (the fixed
   specular corner, the tint, the grain), but on an opaque card. The old
   pane was 68% translucent with a backdrop blur, which worked when the
   thing beneath it was page background; in a deck the next four chapters
   sit directly beneath, and their text bled through the front card. A
   flash card is card stock. You read the one on top.

   HEIGHT. The stack positions every card absolutely, so the deck has no
   height of its own. A hidden copy of the longest chapter sits in flow and
   sets it; every card is then 100% of that, and a card can never clip its
   own copy on a narrow screen. That is the difference between "cards are
   fixed size" and "text is cut off".

   A11Y. The pile is a group with a keyboard: arrows and Enter/Space deal
   cards, two 44px buttons do the same for pointers, and a live region
   announces the chapter that just arrived. Cards behind the front one are
   hidden from assistive tech, so a reader hears one chapter at a time, in
   order, with a way back. Reduced motion makes each deal an instant cut. */

const iconButton =
  'border-[var(--amw-line)] bg-[var(--amw-card)] hover:border-[var(--amw-accent)] hover:text-[var(--amw-accent-ink)] flex h-11 w-11 items-center justify-center rounded-full border text-zinc-800 transition-[border-color,color,transform] duration-200 active:scale-95 motion-reduce:active:scale-100 dark:text-zinc-200'

function Face({ chapter, front }) {
  return (
    <div
      aria-hidden={front ? undefined : true}
      className="bg-[var(--amw-card)] border-[var(--amw-line-strong)] relative flex h-full flex-col overflow-hidden rounded-2xl border p-6 md:p-8"
    >
      <span aria-hidden="true" className="amw-holo-tint" />
      <span aria-hidden="true" className="amw-holo-shift" />
      <span aria-hidden="true" className="amw-holo-specular" />
      <span aria-hidden="true" className="amw-holo-grain" />

      {/* Index-card header: the chapter number, ruled off with an accent
          line that fades out to the edge. */}
      <div className="relative pb-4">
        <span className="amw-mono text-[var(--amw-accent-ink)] bg-[var(--amw-accent-soft)] ring-[var(--amw-accent)]/30 inline-block rounded-md px-2 py-1 text-sm font-medium ring-1">
          {chapter.number}
        </span>
        <span
          aria-hidden="true"
          className="absolute inset-x-0 bottom-0 h-px"
          style={{
            background:
              'linear-gradient(90deg, var(--amw-accent) 0%, color-mix(in srgb, var(--amw-accent) 35%, transparent) 55%, transparent 100%)',
          }}
        />
      </div>

      {/* h2: each chapter is a top-level section of the page's narrative and
          nothing headings the deck above it. */}
      <h2
        style={{ fontFamily: 'Layer, sans-serif' }}
        className="relative mt-6 text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 md:text-3xl"
      >
        {chapter.title}
      </h2>
      <p className="relative mt-4 max-w-prose text-base leading-relaxed text-zinc-600 dark:text-zinc-400 md:text-lg">
        {chapter.copy}
      </p>
    </div>
  )
}

/* How far the pile shows behind the front card, and the room reserved for
   it above. Cards behind peek out at the top, shrinking a little each
   rank, the way a dealt hand fans. */
const PEEK = 12
const VISIBLE = 4
const DEPTH = 0.035

export function StoryDeck({ chapters }) {
  const reduce = useReducedMotion()
  const deck = useRef(null)
  const [front, setFront] = useState(0)
  const total = chapters.length

  /* The tallest face sets the deck's height; title and copy both take
     lines, so both count. */
  const tallest = useMemo(
    () =>
      chapters.reduce((a, b) =>
        b.copy.length + b.title.length * 2 > a.copy.length + a.title.length * 2
          ? b
          : a
      ),
    [chapters]
  )

  const items = useMemo(
    () =>
      chapters.map((chapter, index) => (
        <Face key={chapter.number} chapter={chapter} front={index === front} />
      )),
    [chapters, front]
  )

  const next = useCallback(() => deck.current?.next(), [])
  const prev = useCallback(() => deck.current?.prev(), [])

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

  const current = chapters[front]

  return (
    <div>
      <div
        role="group"
        aria-roledescription="card deck"
        aria-label="The story, one chapter per card"
        tabIndex={0}
        onKeyDown={onKeyDown}
        className="focus-visible:ring-[var(--amw-accent)] focus-visible:ring-offset-[var(--amw-bg)] relative rounded-2xl outline-none focus-visible:ring-2 focus-visible:ring-offset-4"
        style={{ paddingTop: PEEK * (VISIBLE - 1) }}
      >
        {/* In flow and invisible: this is the deck's height. */}
        <div aria-hidden="true" className="invisible">
          <Face chapter={tallest} front />
        </div>
        <div
          className="absolute inset-x-0 bottom-0"
          style={{ top: PEEK * (VISIBLE - 1) }}
        >
          <ClickStack
            ref={deck}
            items={items}
            cardWidth="100%"
            cardHeight="100%"
            spreadX={0}
            spreadY={-PEEK}
            depthScale={DEPTH}
            visibleCount={VISIBLE}
            duration={reduce ? 0 : 0.4}
            borderRadius={16}
            cardColor="var(--amw-card)"
            /* Soft and tinted to the page, never a black slab: the pile
               sits on the page, it does not float above it. */
            shadowBlur={28}
            shadowOpacity={0.09}
            className="overflow-visible"
            onChange={setFront}
          />
        </div>
      </div>

      <div className="mt-6 flex items-center justify-between gap-4">
        <div className="flex items-center gap-1.5" aria-hidden="true">
          {chapters.map((chapter, i) => (
            <span
              key={chapter.number}
              className={`h-1 rounded-full transition-[width,background-color] duration-300 ${
                i === front
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
        Chapter {front + 1} of {total}: {current.title}
      </p>
    </div>
  )
}
