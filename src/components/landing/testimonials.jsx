'use client'

import { useRef, useState, useEffect, useCallback } from 'react'
import { ArrowLeft, ArrowRight } from 'lucide-react'
import { motion } from 'motion/react'
import { SectionEyebrow } from './section-eyebrow'

/* Ported from the "minimal" landing template (components/testimonials.tsx):
   a snap-scrolling rail of tall quote cards with arrow controls and an
   edge fade that dissolves as the rail reaches its end.

   These are PARAPHRASES, not quotations, and the markup reflects that: no
   blockquote, no quotation marks. The verbatim wording lives on i.mipi.io
   (pulled 2026-09-07); these cards report what each person said about a
   product Alec architected and shipped. Rewriting words and leaving them in
   quotes under a real person's name would be presenting speech they never
   gave -- if Grace and Mike have approved reworded first-person quotes, this
   can go back to blockquotes in one edit.

   Both still name MiPi in the summary, and the standfirst under the heading
   says where these come from. A card whose subject is not identifiable needs
   that context restored, or it reads as an endorsement of the consulting
   practice that nobody gave.

   TODO(alec): still outstanding, and deliberately NOT written as placeholder
   text -- send the actual wording and they go straight in:
     - Mark Schilling (no wording, role or company supplied; nothing
       public found on the web either, so it cannot be sourced here)
     - Tavarse Green, Managing Partner, EdenKode
     - Intch verified reviews (login-walled, cannot be fetched)
     - LinkedIn recommendations (login-walled, cannot be fetched) */

const easeOut = [0.16, 1, 0.3, 1]

const testimonials = [
  {
    title: 'Protection That Runs Itself',
    description:
      'Her catalogue is monitored across the web continuously, without her having to go looking for misuse herself. She reports no gallery she had worked with previously offered anything comparable.',
    name: 'Grace L.',
    role: 'Founder of GleeCreative',
  },
  {
    title: 'Why They Left the Alternatives',
    description:
      'Moved across after trying several competing platforms. IP protection and the fee structure settled the decision; the analytics changed how he reads his own audience, and lower platform fees left more of the revenue with him.',
    name: 'Mike Pryke',
    role: 'Founder of Sorta',
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
              Systems People Run Their Business On
            </h2>
            {/* Carries what the per-card source label used to: it says where
                the quotes come from, so nothing has to be inferred. */}
            <p className="mt-4 text-zinc-600 dark:text-zinc-400">
              Architecture, security, and platform decisions I own end to end,
              in the words of the people whose work depends on them.
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
            {testimonials.map((item, index) => (
              <figure
                key={index}
                className="bg-[var(--amw-muted)] h-112.5 md:w-100 flex w-[calc(100vw-3rem)] flex-none snap-start flex-col justify-between rounded-2xl p-8 md:p-10"
              >
                <h3 className="text-3xl font-medium leading-[1.1] tracking-tight md:text-4xl">
                  {item.title}
                </h3>
                <div>
                  {/* Deliberately not a blockquote. These are paraphrases,
                      and quotation markup around words someone did not say
                      presents invented speech as theirs. */}
                  <p className="mb-6 text-lg leading-relaxed text-zinc-600 dark:text-zinc-400">
                    {item.description}
                  </p>
                  <figcaption>
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
