'use client'

import { useRef, useState, useEffect, useCallback } from 'react'
import { ArrowLeft, ArrowRight } from 'lucide-react'
import { motion } from 'motion/react'
import { SectionEyebrow } from './section-eyebrow'

/* Ported from the "minimal" landing template (components/testimonials.tsx):
   a snap-scrolling rail of tall quote cards with arrow controls and an
   edge fade that dissolves as the rail reaches its end.

   Quotes are verbatim from the published testimonials on i.mipi.io, pulled
   2026-09-07. They are reproduced exactly, emoji included -- editing what
   someone said to fit a layout is not an option. The one edit is the role
   label "Soloprenuer", corrected to its spelling; that is a caption, not
   speech. Titles are editorial summaries of each quote, not claims.

   IMPORTANT, and the reason every card carries a `source`: these are MiPi
   users talking about the MiPi product. They are NOT clients talking about
   fractional-CTO or engineering work. Dropping them under "What People Are
   Saying" unlabelled would read as an endorsement of the consulting practice,
   which none of these people gave. The source line is what keeps the section
   honest -- do not remove it, and do not mix service testimonials into this
   array without giving them their own source.

   TODO(alec): still outstanding, and deliberately NOT written as placeholder
   text this time -- send the actual wording and they go straight in:
     - Tavarse Green, Managing Partner, EdenKode
     - Intch verified reviews (login-walled, cannot be fetched)
     - LinkedIn recommendations (login-walled, cannot be fetched) */

const easeOut = [0.16, 1, 0.3, 1]

const testimonials = [
  {
    title: 'All My Work in One Place',
    description:
      'Before MiPi, I had to manage multiple Instagram and Facebook accounts for different mediums across multiple platforms. Now, I can showcase all my work in one place while saving time to focus on creating. The Talent Layering has helped me catalog all my art forms, and I love how secure it also is at the same time.',
    name: 'Brent Turner',
    role: 'Founder of Thistle Dew Arts',
    source: 'On MiPi',
  },
  {
    title: 'Watching Out for My Work',
    description:
      'It\u2019s a huge relief to know that MiPi is constantly looking out for me and my artwork online, behind-the-scenes. I\u2019ve never had a gallery offer that kind of service before. \u2764\uFE0F',
    name: 'Grace L.',
    role: 'Founder of GleeCreative',
    source: 'On MiPi',
  },
  {
    title: 'Artist-First From the Start',
    description:
      'I love how MiPi is so focused on helping me as an artist. I cannot wait to see until they launch the MVP. I am excited to see how it evolves \uD83D\uDC4F',
    name: 'Bill K.',
    role: 'Solopreneur',
    source: 'On MiPi',
  },
  {
    title: 'A Website Without the Time',
    description:
      'There is finally a place where I can get the power of a website without spending the time. But plus I get social media built in? Sign me up!! Let me get a piece of that! \uD83D\uDE4C',
    name: 'Chris K.',
    role: 'Founder of Art Of Chris',
    source: 'On MiPi',
  },
  {
    title: 'Shown on My Own Terms',
    description:
      'Love the ability to create a portfolio in MiPi knowing that my work will be shown uniquely. So tired of other social media platforms forcing me as a creator to copy other creations. Now I can post my artwork without worrying about \u2018will the algorithm like me?\u2019 \uD83D\uDE4C',
    name: 'Alex Kennedy',
    role: 'Founder of Kennedy Films',
    source: 'On MiPi',
  },
  {
    title: 'Protection and Fair Pay',
    description:
      'After trying multiple platforms, MiPi stands out for its artist-first approach. The combination of strong IP protection and fair compensation made switching a no-brainer. Their analytics tools help me understand my audience better, and the low platform fees mean I keep more of what I earn.',
    name: 'Mike Pryke',
    role: 'Founder of Sorta',
    source: 'On MiPi',
  },
  {
    title: 'Confidence to Share',
    description:
      'MiPi empowers me to share my art with confidence, thanks to its groundbreaking security. I can join global contests without fear of theft. I wholeheartedly recommend this platform\u2014it\u2019s a masterpiece! \uD83D\uDE0A',
    name: 'Sadie P.',
    role: 'Solopreneur',
    source: 'On MiPi',
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
                    {/* What the quote is actually about. Without this the
                        card implies these people are endorsing the
                        consulting work, which they are not. */}
                    <p className="amw-mono text-[var(--amw-accent-ink)] mt-2 text-[11px] uppercase tracking-[0.14em]">
                      {item.source}
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
