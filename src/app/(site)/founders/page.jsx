import Link from 'next/link'
import { ChevronRight } from 'lucide-react'

import { SectionEyebrow } from '@/components/landing/section-eyebrow'
import { DeskHero } from '@/components/founders/desk-hero'
import { soonTools } from '@/lib/founders/tools'

export const metadata = {
  title: 'Founders’ Desk',
  description:
    'Tools for the person who builds the thing. Start with the founder equity calculator: find out whether you are being sized as a hire while doing founder work.',
}

/* The desk landing is one composition: eyebrow, the hook, one sentence,
   one action, and the gap figure as the anchor. Future tools are a single
   dimmed line under the fold, never a card grid. */

export default function FoundersDeskPage() {
  const soon = soonTools()
  return (
    <div className="amw">
      <section className="px-6 py-16 md:py-24">
        <div className="mx-auto max-w-6xl">
          <DeskHero>
            <SectionEyebrow index="00" label="AMWARE // Founders’ Desk" />
            <h1
              style={{ fontFamily: 'Layer, sans-serif' }}
              className="max-w-4xl text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 md:text-4xl lg:text-5xl"
            >
              Are you being sized as a hire while doing founder work?
            </h1>
            <p className="mt-4 max-w-xl text-base text-zinc-600 dark:text-zinc-400 md:text-lg">
              Find the range to say out loud. No account, nothing stored,
              numbers with sources.
            </p>
            <div className="mt-8">
              <Link
                href="/founders/equity"
                className="group inline-flex w-full items-center justify-center gap-3 rounded-md bg-zinc-900 py-3 pl-5 pr-3 font-medium text-white no-underline transition-all duration-500 ease-out hover:rounded-[50px] dark:bg-zinc-100 dark:text-zinc-900 sm:w-auto"
              >
                <span>Read my offer</span>
                <span className="text-zinc-950 flex h-10 w-10 items-center justify-center rounded-full bg-white transition-all duration-300 group-hover:scale-110 motion-reduce:group-hover:scale-100 dark:bg-zinc-900 dark:text-zinc-50">
                  <ChevronRight
                    className="relative left-px h-4 w-4"
                    aria-hidden="true"
                  />
                </span>
              </Link>
            </div>
          </DeskHero>

          <p className="amw-kicker mt-16 text-zinc-500 dark:text-zinc-400">
            Coming to the desk:{' '}
            {soon.map((tool, index) => (
              <span key={tool.id}>
                {index > 0 && ' · '}
                {tool.label}
              </span>
            ))}
          </p>
        </div>
      </section>
    </div>
  )
}
