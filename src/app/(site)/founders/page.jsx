import Link from 'next/link'
import { ChevronRight } from 'lucide-react'

import { SectionEyebrow } from '@/components/landing/section-eyebrow'
import { DeskHero } from '@/components/founders/desk-hero'
import { EXAMPLE_READ } from '@/lib/founders/equity/engine'
import { computeAsk } from '@/lib/founders/equity/negotiation'
import {
  ASK_HREF,
  EQUITY_HREF,
  liveTools,
  soonTools,
} from '@/lib/founders/tools'

export const metadata = {
  title: 'Founders’ Desk',
  description:
    'Tools for the person who builds the thing. Find out whether you are being sized as a hire while doing founder work, then what to ask for instead, in cash and equity, with the market data behind each number.',
}

/* The desk landing is one composition: eyebrow, the hook, one sentence, one
   action, and the anchor. Never a card grid, never a sidebar.

   TWO LIVE TOOLS, STILL ONE CTA. The obvious way to add the job offer
   calculator is a second button, and two buttons side by side is a tool menu:
   the reader has to choose before they know what either does. Both outside
   voices hard-rejected the menu version of this page. So the second tool is not
   a second choice, it is the second half of one path, and the anchor shows it
   rather than a paragraph claiming it.

   THE ANCHOR IS COMPUTED HERE, ON THE SERVER. `computeAsk` runs the engine
   three more times, once per rung. Doing that in the client component would
   ship `negotiation.js` and the whole salary band table to every visitor for
   three numbers. Computing it here keeps the landing static and keeps the
   figures generated rather than typed, so they cannot drift from the tools. */

/** What this example actually shows, read off the engine rather than typed. */
function ladderNoteFor(read, ask) {
  const cash =
    ask.offer?.position === 'above_ceiling'
      ? 'the salary already clears the top of the band for this seat'
      : ask.offer?.position === 'below_floor'
      ? 'the salary sits below the band for this seat'
      : 'the salary sits inside the band for this seat'
  const gap = read.offer.gapPts
  const equity =
    gap && gap[0] > 0
      ? `the equity is ${gap[0]} to ${gap[1]} points short`
      : 'the equity holds up'
  return `Each rung prices the equity at its own cash, so the three read as one band sampled three times. Here ${cash} and ${equity}. Reading them together is the point: this offer does not need more salary.`
}

export default function FoundersDeskPage() {
  const read = EXAMPLE_READ
  const ask = computeAsk(read)
  /* Plain data across the server/client boundary: the frozen Ladder carries a
     whole `computeRead` result per rung and none of it belongs in the bundle. */
  const rungs = ask.order.map((id) => ({
    id,
    label: ask[id].label,
    cash: ask[id].cash,
    equityPct: ask[id].equityPct,
  }))

  /* The panel now shows cash figures as well as equity ones, so the citation
     under it has to name where the cash came from too. A benchmarks line that
     covers half the figures above it is worse than none. */
  const cashSource = `${ask.bands.cash.source.replace(
    /, derived.*$/,
    ', derived'
  )} ${ask.bands.cash.asOf}`

  const live = liveTools()
  const soon = soonTools()

  return (
    <div className="amw">
      <section className="px-6 py-16 md:py-24">
        <div className="mx-auto max-w-6xl">
          <DeskHero
            ladder={rungs}
            ladderNote={ladderNoteFor(read, ask)}
            cashSource={cashSource}
          >
            <SectionEyebrow index="00" label="AMWARE // Founders’ Desk" />
            <h1
              style={{ fontFamily: 'Layer, sans-serif' }}
              className="max-w-4xl text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 md:text-4xl lg:text-5xl"
            >
              Are you being sized as a hire while doing founder work?
            </h1>
            <p className="mt-4 max-w-xl text-base text-zinc-600 dark:text-zinc-400 md:text-lg">
              Find the range to say out loud, then the number to ask for. No
              account, numbers with sources, and nothing leaves your browser.
            </p>
            <div className="mt-8">
              <Link
                href={EQUITY_HREF}
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
              {/* Not an alternative to the button: the stop after it, for
                  someone who already knows where they stand. */}
              <p className="mt-4 text-sm text-zinc-600 dark:text-zinc-400">
                Already know where you stand?{' '}
                <Link
                  href={ASK_HREF}
                  className="hover:text-[var(--amw-accent-ink)] text-zinc-800 underline underline-offset-4 transition-colors dark:text-zinc-200"
                >
                  Turn it into an ask
                </Link>
                .
              </p>
            </div>
          </DeskHero>

          {/* The inventory, under the fold. Both live tools are named here
              because a reader scanning for what exists should not have to
              infer it from two links in the hero. Still one dimmed line, not
              a grid. */}
          <p className="amw-kicker mt-16 text-zinc-500 dark:text-zinc-400">
            At the desk:{' '}
            {live.map((tool, index) => (
              <span key={tool.id}>
                {index > 0 && ' · '}
                <Link
                  href={tool.href}
                  className="hover:text-[var(--amw-accent-ink)] underline decoration-dotted underline-offset-4"
                >
                  {tool.label}
                </Link>
              </span>
            ))}
            {soon.length > 0 && (
              <>
                {' · Coming: '}
                {soon.map((tool, index) => (
                  <span key={tool.id}>
                    {index > 0 && ' · '}
                    {tool.label}
                  </span>
                ))}
              </>
            )}
          </p>
        </div>
      </section>
    </div>
  )
}
