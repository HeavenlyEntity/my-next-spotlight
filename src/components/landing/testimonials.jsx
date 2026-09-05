'use client'

import { useRef, useState, useEffect, useCallback } from 'react'
import { ArrowLeft, ArrowRight } from 'lucide-react'
import { motion } from 'motion/react'
import { SectionEyebrow } from './section-eyebrow'

/* Ported from the "minimal" landing template (components/testimonials.tsx):
   a snap-scrolling rail of tall quote cards with arrow controls and an
   edge fade that dissolves as the rail reaches its end.

   TODO(alec): every quote below is placeholder copy written in the brand
   voice. Swap in real testimonials, names, and roles before publishing;
   attributions are intentionally generic until then. */

const easeOut = [0.16, 1, 0.3, 1]

const testimonials = [
  {
    title: 'Architecture We Could Grow Into',
    description:
      'Alec came in as our fractional CTO and replaced a pile of guesswork with a roadmap the whole team could follow. Six months later we are still building on the same foundations.',
    name: 'Placeholder Name',
    role: 'Founder, consumer startup',
  },
  {
    title: 'Shipped in Weeks, Not Quarters',
    description:
      'The boilerplate had auth, payments, and the CMS wired on day one. We spent our time on the product instead of the plumbing.',
    name: 'Placeholder Name',
    role: 'Technical co-founder',
  },
  {
    title: 'Business Sense Meets Engineering',
    description:
      'Most engineers cannot talk unit economics. Alec walked our investors through the numbers and then went back and shipped the feature himself.',
    name: 'Placeholder Name',
    role: 'CEO, B2B services company',
  },
  {
    title: 'A Mentor Who Actually Ships',
    description:
      'I learned more about production systems in three months of pairing than in two years on my own. He teaches the way he builds: clearly and without shortcuts.',
    name: 'Placeholder Name',
    role: 'Software engineer, mentee',
  },
  {
    title: 'Calm Under Real Traffic',
    description:
      'Our launch went sideways and he was in the incident channel before we were. The fix landed, the write-up followed, and it never happened again.',
    name: 'Placeholder Name',
    role: 'Operations lead, enterprise client',
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
          <div>
            <SectionEyebrow index="04" label="TRANSMISSIONS" />
            <h2
              style={{ fontFamily: 'Layer, sans-serif' }}
              className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 md:text-4xl lg:text-5xl"
            >
              What People Are Saying
            </h2>
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
                  <blockquote className="mb-6 text-lg leading-relaxed text-zinc-600 dark:text-zinc-400">
                    {item.description}
                  </blockquote>
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
