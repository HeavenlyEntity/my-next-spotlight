'use client'

import { Check, ChevronRight } from 'lucide-react'
import { motion } from 'motion/react'
import Link from 'next/link'
import { SectionEyebrow } from './section-eyebrow'

/* Ported from the "minimal" landing template (components/pricing.tsx):
   plan cards on a soft band, the recommended plan framed in the accent.

   Prices are the real ones as of 2026-09-09, confirmed by Alec: $249 for the
   boilerplate and three monthly retainer tiers. They replace placeholders
   ($149 and a single $3,500 tier) that had sat here behind a TODO. Anything
   quoted here is also what Creem is told during merchant verification, so
   these two must not drift apart -- update both together.

   The template's two-card offset layout could not carry four plans, so the
   grid is a plain four-up that steps down to two and then one. The offset
   went with it: it only ever read as deliberate with exactly two cards. */

const easeOut = [0.16, 1, 0.3, 1]

const plans = [
  {
    name: 'Boilerplate',
    tagline: 'Mode B: you build on mine',
    price: '$249',
    period: 'one time',
    features: [
      'Next.js 16 + Payload CMS foundation',
      'Auth and payments wired (Creem)',
      'Postgres schema and deploy scripts',
      'Private repository access',
      'Lifetime updates',
    ],
  },
  {
    name: 'Advisor',
    tagline: 'Best for pre-seed',
    price: '$3,000',
    period: 'month',
    note: 'about 10 hrs',
    features: [
      'Two strategy calls a month',
      'Async Slack and email support',
      'Architecture reviews',
      'Technology roadmap input',
    ],
  },
  {
    name: 'Fractional CTO',
    tagline: 'Best for seed to Series A',
    price: '$7,500',
    period: 'month',
    note: 'about 20-25 hrs',
    highlighted: true,
    features: [
      'Weekly strategy calls',
      'Team mentoring and code review',
      'Hiring support and interviews',
      'Vendor negotiations',
      'AI integration planning',
    ],
  },
  {
    name: 'Embedded CTO',
    tagline: 'Best for Series A+ or M&A prep',
    price: '$12,000',
    period: 'month',
    note: 'about 35-40 hrs',
    features: [
      'Near full-time commitment',
      'Direct engineering leadership',
      'Board and investor reporting',
      'Technical due diligence',
      'Fundraising support',
    ],
  },
]

function PlanCard({ plan }) {
  return (
    <motion.div
      className={`rounded-2xl p-6 md:p-8 ${
        plan.highlighted
          ? 'border-[var(--amw-accent)] bg-[var(--amw-card)] border-2 transition-[border-color,box-shadow] duration-300 hover:shadow-lg'
          : 'bg-[var(--amw-card)] border-[var(--amw-line)] border transition-colors duration-300'
      }`}
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4 }}
      viewport={{ once: true, amount: 0.3 }}
      transition={{
        opacity: { duration: 0.6, ease: easeOut },
        y: { duration: 0.3, ease: easeOut },
      }}
    >
      <div className="mb-6">
        <h3 className="text-lg font-medium text-zinc-900 dark:text-zinc-100">
          {plan.name}
        </h3>
        <p className="amw-kicker mt-1">{plan.tagline}</p>
      </div>

      {/* Price on its own line, terms under it. Baseline-inline only worked
          while every price was four characters: at the four-up width "/ month"
          wrapped under $3,000, $7,500 and $12,000 but not under $249, so the
          cards disagreed with each other. $12,000 at text-5xl is also about
          230px inside a 222px content box, hence the step down at xl -- the
          card width drives this, not the viewport. */}
      <div className="mb-8">
        <span className="amw-price block text-4xl font-medium tracking-tight text-zinc-900 dark:text-zinc-100 md:text-5xl xl:text-4xl">
          {plan.price}
        </span>
        <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
          / {plan.period}
          {plan.note ? ` \u00b7 ${plan.note}` : ''}
        </p>
      </div>

      <ul className="space-y-3">
        {plan.features.map((feature) => (
          <li
            key={feature}
            className="flex items-start gap-3 text-sm text-zinc-700 dark:text-zinc-300"
          >
            <Check
              className="text-[var(--amw-accent-ink)] mt-0.5 h-4 w-4 shrink-0"
              aria-hidden="true"
            />
            <span>{feature}</span>
          </li>
        ))}
      </ul>
    </motion.div>
  )
}

export function Pricing() {
  return (
    <section className="bg-[var(--amw-muted)] px-6 py-16 md:py-32">
      <div className="mx-auto max-w-6xl">
        <motion.div
          className="mb-12 text-center md:mb-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, ease: easeOut }}
        >
          <SectionEyebrow index="05" label="THE CATALOG" />
          <h2
            style={{ fontFamily: 'Layer, sans-serif' }}
            className="mb-4 text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 md:text-4xl lg:text-5xl"
          >
            Two Ways In
          </h2>
          <p className="text-lg text-zinc-600 dark:text-zinc-400">
            Start from my foundations, or bring me onto the team at the depth
            you need.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 items-stretch gap-6 sm:grid-cols-2 xl:grid-cols-4">
          {plans.map((plan) => (
            <PlanCard key={plan.name} plan={plan} />
          ))}
        </div>

        <motion.div
          className="mt-12 flex flex-col items-center gap-4 md:mt-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.2, ease: easeOut }}
        >
          <Link
            href="/services"
            className="bg-[var(--amw-accent)] text-zinc-950 group inline-flex w-full items-center justify-center gap-3 rounded-md py-3 pl-5 pr-3 font-medium no-underline transition-all duration-500 ease-out hover:rounded-[50px] hover:shadow-lg sm:w-auto"
          >
            <span>Start an Engagement</span>
            <span className="text-zinc-950 flex h-10 w-10 items-center justify-center rounded-full bg-white transition-all duration-300 group-hover:scale-110">
              <ChevronRight
                className="relative left-px h-4 w-4"
                aria-hidden="true"
              />
            </span>
          </Link>
          <Link
            href="/products"
            className="hover:text-[var(--amw-accent-ink)] min-h-11 inline-flex items-center text-sm text-zinc-600 no-underline transition-colors dark:text-zinc-400"
          >
            Browse the boilerplate catalog
          </Link>
        </motion.div>
      </div>
    </section>
  )
}
