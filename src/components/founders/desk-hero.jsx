'use client'

import { motion, useReducedMotion } from 'motion/react'

import { GapFigure } from '@/components/founders/gap-figure'
import { EXAMPLE_READ } from '@/lib/founders/equity/engine'
import { SOURCES } from '@/lib/founders/equity/benchmarks'

const LANDING_SOURCES = ['carta', 'index', 'yc']

/* The landing's composition: the heading block (server-rendered children)
   fades up on mount, and under it the example gap figure with its marker
   springing into the band. The figure reads the canonical example from
   the engine so the hero can never disagree with the results screen. */

const easeOut = [0.16, 1, 0.3, 1]

export function DeskHero({ children }) {
  const reduce = useReducedMotion()
  const read = EXAMPLE_READ
  const lo = read.offer.range.lo
  const hi = read.offer.range.hi
  const offer = read.offer.pct
  const gap = read.offer.gapPts
  const callout =
    gap && gap[0] > 0
      ? `${gap[0]}–${gap[1]} points below the band for this work`
      : null

  return (
    <div>
      <motion.div
        initial={reduce ? false : { opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: easeOut }}
      >
        {children}
      </motion.div>
      <div className="bg-[var(--amw-muted)] mt-12 rounded-2xl p-6 md:p-8">
        <GapFigure
          lo={lo}
          hi={hi}
          offer={offer}
          caption={`Example · fractional CTO converting at pre-seed · offered ${offer}% · founder-level band ${lo}–${hi}%`}
          callout={callout}
          animate
        />
        <p className="amw-kicker mt-6 text-zinc-500 dark:text-zinc-400">
          Benchmarks:{' '}
          {LANDING_SOURCES.map((id, i) => {
            const s = SOURCES.find((x) => x.id === id)
            if (!s) return null
            return (
              <span key={id}>
                {i > 0 && ' · '}
                <a
                  href={s.url}
                  target="_blank"
                  rel="noreferrer"
                  className="hover:text-[var(--amw-accent-ink)] underline decoration-dotted underline-offset-4"
                >
                  {s.name}
                </a>{' '}
                {s.asOf}
              </span>
            )
          })}
        </p>
      </div>
    </div>
  )
}
