'use client'

import { Check, ChevronRight } from 'lucide-react'
import { motion } from 'motion/react'
import Link from 'next/link'
import { SectionEyebrow } from './section-eyebrow'

/* Ported from the "minimal" landing template (components/pricing.tsx):
   two offset plan cards on a soft band, the highlighted plan framed in
   the accent. Mapped to the two AMWARE modes: build on mine, or I build
   it with you.

   TODO(alec): prices and feature lists are placeholders. Sync with the
   live Creem products and the /services rate card before publishing. */

const easeOut = [0.16, 1, 0.3, 1]

const plans = [
  {
    name: 'Boilerplate',
    tagline: 'Mode B: you build on mine',
    price: '$149',
    period: 'one time',
    features: [
      'Next.js 15 + Payload CMS foundation',
      'Auth and payments wired (Creem)',
      'Postgres schema and deploy scripts',
      'Lifetime updates',
      'Community support',
    ],
  },
  {
    name: 'Fractional CTO',
    tagline: 'Mode A: I build it with you',
    price: '$3,500',
    period: 'month',
    highlighted: true,
    features: [
      'Architecture and roadmap ownership',
      'Hands-on shipping every week',
      'Hiring and mentorship for your team',
      'Vendor, infra, and cost decisions',
      'Direct async access',
      'Monthly strategy review',
      'Cancel any time',
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

      <div className="mb-8 flex items-baseline gap-1">
        <span className="amw-price text-4xl font-medium tracking-tight text-zinc-900 dark:text-zinc-100 md:text-5xl">
          {plan.price}
        </span>
        <span className="text-sm text-zinc-600 dark:text-zinc-400">
          / {plan.period}
        </span>
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
  const [starterPlan, ctoPlan] = plans

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
            Start from my foundations, or bring me onto the team.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 items-start gap-6 md:grid-cols-2 md:gap-8">
          <div className="md:mt-16">
            <PlanCard plan={starterPlan} />
          </div>

          <div>
            <PlanCard plan={ctoPlan} />
          </div>
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
            className="hover:text-[var(--amw-accent-ink)] text-sm text-zinc-600 no-underline transition-colors dark:text-zinc-400"
          >
            Browse the boilerplate catalog
          </Link>
        </motion.div>
      </div>
    </section>
  )
}
