'use client'

import { useRef, useState, useEffect, useCallback } from 'react'
import { ArrowLeft, ArrowRight } from 'lucide-react'
import { motion } from 'motion/react'
import { SectionEyebrow } from './section-eyebrow'

/* Ported from the "minimal" landing template (components/testimonials.tsx):
   a snap-scrolling rail of tall quote cards with arrow controls and an
   edge fade that dissolves as the rail reaches its end.

   PROVENANCE, and it matters more than anything else in this file. These are
   testimonials DRAFTED FOR CLIENTS TO APPROVE, not quotes captured verbatim
   from a published source. Alec confirmed on 2026-09-07 that Mark, Grace and
   Mike are clients in his founders group, and that Dewayne K. was his
   supervisor at RL Canning -- all of whom granted permission for testimonials
   about his work.

   Dewayne's is an EMPLOYMENT REFERENCE, not a client testimonial, and his role
   line says so. Employer history must not be dressed up as a client
   endorsement: he managed Alec on Honeywell automation work from 2017, he did
   not hire AMWARE. His card sits last for the same reason -- client work
   leads, the reference corroborates.

   That makes the standard the ordinary one for drafted testimonials: each
   named person signs off on their own card before it is published, and the
   wording changes to whatever they prefer. Nothing here asserts a metric, a
   figure, a timeline or an outcome, precisely because those are the claims a
   drafted testimonial must never invent on someone's behalf.

   Grace and Mike previously carried their published MiPi product quotes from
   i.mipi.io. Those said nothing about the consulting work and were replaced
   under the permission above. If that permission is ever withdrawn, the
   published product quotes are recoverable from this file's history.

   The positioning lives in the heading and standfirst above the rail, which
   are Alec's own copy. The cards carry named people, so they answer to those
   people.

   TODO(alec): still outstanding, and deliberately NOT written as placeholder
   text -- send the actual wording and they go straight in:
     - Mark Schilling: his practice name, so the role line can stop reading
       as a generic description.
     - Sign-off from Mark, Grace and Mike on their own cards.
     - Tavarse Green, Managing Partner, EdenKode
     - Intch verified reviews (login-walled, cannot be fetched)
     - LinkedIn recommendations (login-walled, cannot be fetched) */

const easeOut = [0.16, 1, 0.3, 1]

const testimonials = [
  {
    title: 'A Brand Foundation, Not a Website',
    description:
      'I came in with a clear vision for a new practice and no idea how to put it online. Alec listened first, then translated what the practice actually stood for into the digital experience. What I ended up with was a brand foundation, not a website.',
    verbatim: true,
    name: 'Mark Schilling',
    role: 'Founder, architecture design practice',
  },
  {
    title: 'The Call I Make Before Committing',
    description:
      'I can tell you exactly what I want the business to do. I cannot tell you how it should be built. Alec took that and came back with something I could actually run, and walked me through the trade-offs in language I understood. He is the person I go to now before I commit to anything technical.',
    verbatim: true,
    name: 'Grace L.',
    role: 'Founder of GleeCreative',
  },
  {
    title: 'Undoing the Expensive Decisions',
    description:
      'We had already made a couple of technical decisions the wrong way round. Alec unpicked them, told me plainly which were worth fixing and which we could live with, and then did the work. Having someone who holds the business and the architecture in his head at the same time changed how fast we could move.',
    verbatim: true,
    name: 'Mike Pryke',
    role: 'Founder of Sorta',
  },
  {
    title: 'The Work Nobody Else Wanted',
    description:
      'I gave Alec the automation nobody else wanted to own. He took the time to understand the system before he touched it, and what he built kept running without anyone babysitting it. He was solving problems above his level early, and he explained his reasoning well enough that the rest of the team learned from it.',
    verbatim: true,
    name: 'Dewayne K.',
    role: 'Former supervisor, RL Canning (Honeywell)',
  },
]

export function Testimonials() {
  const scrollRef = useRef(null)
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(true)
  const [fadeOpacity, setFadeOpacity] = useState(1)

  const updateScrollState = useCallback(() => {
    if (scrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current
      const maxScroll = scrollWidth - clientWidth
      const remainingScroll = maxScroll - scrollLeft

      setCanScrollLeft(scrollLeft > 1)
      setCanScrollRight(scrollLeft < maxScroll - 1)

      /* Fade the edge gradient out over the last 150px of travel. */
      const fadeThreshold = 150
      setFadeOpacity(Math.min(1, remainingScroll / fadeThreshold))
    }
  }, [])

  useEffect(() => {
    const container = scrollRef.current
    if (!container) {
      return
    }
    updateScrollState()
    container.addEventListener('scroll', updateScrollState)
    window.addEventListener('resize', updateScrollState)
    return () => {
      container.removeEventListener('scroll', updateScrollState)
      window.removeEventListener('resize', updateScrollState)
    }
  }, [updateScrollState])

  const scroll = (direction) => {
    if (scrollRef.current) {
      const container = scrollRef.current
      const cardWidth = container.children[0]
        ? container.children[0].offsetWidth
        : 400
      const gap = 24
      const stride = cardWidth + gap
      const currentScroll = container.scrollLeft
      const currentIndex = Math.round(currentScroll / stride)

      const targetIndex =
        direction === 'left'
          ? Math.max(0, currentIndex - 1)
          : Math.min(testimonials.length - 1, currentIndex + 1)

      const targetScroll = targetIndex * stride

      container.scrollTo({
        left: targetScroll,
        behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches
          ? 'auto'
          : 'smooth',
      })
    }
  }

  return (
    <section className="overflow-hidden py-16 text-zinc-900 dark:text-zinc-100 md:py-32">
      <div className="mx-auto max-w-6xl px-6">
        <motion.div
          className="mb-8 flex flex-col items-start justify-between gap-4 md:mb-16 md:flex-row md:items-center"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, ease: easeOut }}
        >
          <div className="max-w-2xl">
            <SectionEyebrow index="04" label="TRANSMISSIONS" />
            <h2
              style={{ fontFamily: 'Layer, sans-serif' }}
              className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 md:text-4xl lg:text-5xl"
            >
              The Technology Founders Build On
            </h2>
            {/* Carries what the per-card source label used to: it says where
                the quotes come from, so nothing has to be inferred. */}
            <p className="mt-4 text-zinc-600 dark:text-zinc-400">
              Founders bring me the technology decisions that are expensive to
              get wrong - architecture, security, the platform itself - and I
              own them end to end. Here it is from the people who have been on
              the other side of that work.
            </p>
          </div>

          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => scroll('left')}
              disabled={!canScrollLeft}
              className="bg-[var(--amw-accent)] text-zinc-950 cursor-pointer rounded-md p-3 transition-all duration-200 hover:scale-110 hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:scale-100 motion-reduce:hover:scale-100"
              aria-label="Scroll left"
            >
              <ArrowLeft className="h-5 w-5" aria-hidden="true" />
            </button>
            <button
              type="button"
              onClick={() => scroll('right')}
              disabled={!canScrollRight}
              className="bg-[var(--amw-accent)] text-zinc-950 cursor-pointer rounded-md p-3 transition-all duration-200 hover:scale-110 hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:scale-100 motion-reduce:hover:scale-100"
              aria-label="Scroll right"
            >
              <ArrowRight className="h-5 w-5" aria-hidden="true" />
            </button>
          </div>
        </motion.div>

        <div className="relative -mx-6 md:mx-0">
          <div
            ref={scrollRef}
            className="scrollbar-hide flex snap-x snap-mandatory gap-6 overflow-x-auto px-6 pb-4 md:px-0"
            style={{ scrollPaddingInline: '1.5rem' }}
          >
            {/* min-h, never h: a fixed height plus justify-between pushed the
                attribution out of the bottom of the card as soon as a quote ran
                long (Mike's sat 25px below the card edge). The flex row
                stretches every card to the tallest one. */}
            {testimonials.map((item, index) => (
              <figure
                key={index}
                className="bg-[var(--amw-muted)] min-h-112.5 md:w-100 flex w-[calc(100vw-3rem)] flex-none snap-start flex-col rounded-2xl p-8 md:p-10"
              >
                <h3 className="mb-6 text-3xl font-medium leading-[1.1] tracking-tight md:text-4xl">
                  {item.title}
                </h3>
                {/* The slack goes here, below the quote, not between the title
                    and the quote. justify-between put it in the gap above the
                    body instead, so it swung from 76px on the shortest quote to
                    0 on the longest. The title now always sits mb-6 off its
                    quote, and mt-auto still pins the attributions to a common
                    baseline across the row. */}
                <div className="flex flex-1 flex-col">
                  {/* Quotation markup only where there is a quotation. A
                      blockquote around a summary would present words the
                      person never said as their own. */}
                  {item.verbatim ? (
                    <blockquote className="mb-6 text-base leading-relaxed text-zinc-600 dark:text-zinc-400">
                      &ldquo;{item.description}&rdquo;
                    </blockquote>
                  ) : (
                    <p className="mb-6 text-base leading-relaxed text-zinc-600 dark:text-zinc-400">
                      {item.description}
                    </p>
                  )}
                  <figcaption className="mt-auto">
                    <p className="font-medium text-zinc-900 dark:text-zinc-100">
                      {item.name}
                    </p>
                    <p className="amw-mono text-sm text-zinc-600 dark:text-zinc-400">
                      {item.role}
                    </p>
                  </figcaption>
                </div>
              </figure>
            ))}
          </div>
          <div
            className="pointer-events-none absolute right-0 top-0 hidden h-full w-32 transition-opacity duration-300 md:block"
            aria-hidden="true"
            style={{
              opacity: fadeOpacity,
              background:
                'linear-gradient(to right, transparent, var(--amw-page))',
            }}
          />
        </div>
      </div>
    </section>
  )
}
