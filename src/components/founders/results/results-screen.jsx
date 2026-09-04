'use client'

import { useEffect, useState } from 'react'

import { ChipGroup } from '@/components/founders/chip-group'
import { Verdict } from '@/components/founders/results/verdict'
import { Evidence } from '@/components/founders/results/evidence'
import { RoundsTimeline } from '@/components/founders/results/rounds-timeline'
import { ScenarioTable } from '@/components/founders/results/scenario-table'
import { ShowTheMath } from '@/components/founders/results/show-the-math'
import { BriefActions } from '@/components/founders/results/brief-actions'
import { IfItEnds } from '@/components/founders/results/if-it-ends'
import { PATH_LABELS } from '@/components/founders/format'
import { useOfferStore } from '@/lib/founders/offer-store'
import { trackCta } from '@/components/founders/analytics'
import { REVIEW_HREF } from '@/lib/founders/tools'
import Link from 'next/link'
import { ChevronRight } from 'lucide-react'

/* Step 4 in three layers: Verdict, Evidence, Consequences; then quiet
   utilities, a repeated CTA, and sources in a disclosure. Wrapped in
   .amw-brief so the print sheet can force it visible. */

const PATH_OPTIONS = ['bootstrap', 'acquisition', 'ipo'].map((id) => ({
  id,
  label: PATH_LABELS[id],
}))

export function ResultsScreen({ read, overrides, onOverride }) {
  const markAsked = useOfferStore((s) => s.markAsked)
  const declared = read.preselectedPath
  const [path, setPath] = useState(declared)
  const [mathOpen, setMathOpen] = useState(false)
  const [href, setHref] = useState('')

  useEffect(() => setPath(declared), [declared])
  useEffect(() => {
    setHref(window.location.host + window.location.pathname)
  }, [])

  const hasOffer = read.offer.pct !== null
  const today = new Date().toISOString().slice(0, 10)

  return (
    <div className="amw-brief">
      <p className="amw-print-only amw-kicker mb-6">
        AMWARE // Founders’ Desk · Offer read · {today} · {href} · not legal or
        financial advice
      </p>

      <Verdict read={read} />

      <div className="border-[var(--amw-line)] mt-12 border-t pt-10">
        <Evidence read={read} />
      </div>

      <section
        aria-labelledby="results-consequences"
        className="border-[var(--amw-line)] mt-12 border-t pt-10"
      >
        <div className="flex flex-wrap items-center justify-between gap-4">
          <h2 id="results-consequences" className="amw-kicker">
            Consequences
          </h2>
          <ChipGroup
            label="Exit path"
            labelId="exit-path-label"
            options={PATH_OPTIONS}
            value={path}
            onChange={setPath}
            mode="single"
            variant="segmented"
            className="[&>p]:sr-only"
          />
        </div>
        <div className="mt-8 grid gap-10 md:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] md:items-start">
          <RoundsTimeline
            rounds={read.rounds[path] ?? []}
            hasOffer={hasOffer}
            pathLabel={PATH_LABELS[path]}
          />
          <ScenarioTable read={read} path={path} />
        </div>
        {read.brief.flags?.length > 0 && (
          <ul className="mt-8 list-none space-y-1 p-0 text-sm text-zinc-700 dark:text-zinc-300">
            {read.brief.flags.map((flag) => (
              <li key={flag.text ?? flag} className="flex gap-2">
                <span
                  className="text-[var(--amw-accent-ink)]"
                  aria-hidden="true"
                >
                  ▸
                </span>
                {flag.text ?? flag}
              </li>
            ))}
          </ul>
        )}
      </section>

      <section
        aria-labelledby="results-if-it-ends"
        className="border-[var(--amw-line)] mt-12 border-t pt-10"
      >
        <IfItEnds read={read} />
      </section>

      <div className="border-[var(--amw-line)] mt-10 border-t pt-6">
        <BriefActions
          text={read.brief.text}
          mathOpen={mathOpen}
          onToggleMath={() => setMathOpen((open) => !open)}
        />
        <ShowTheMath
          read={read}
          path={path}
          open={mathOpen}
          overrides={overrides}
          onOverride={onOverride}
        />
      </div>

      <div className="mt-10" data-print="hide">
        <Link
          href={REVIEW_HREF}
          onClick={() => {
            markAsked()
            trackCta()
          }}
          className="bg-[var(--amw-accent)] text-zinc-950 group inline-flex w-full items-center justify-center gap-3 rounded-md py-3 pl-5 pr-3 font-medium no-underline transition-all duration-500 ease-out hover:rounded-[50px] sm:w-auto"
        >
          <span>Have AMWARE review this offer</span>
          <span className="text-zinc-950 flex h-10 w-10 items-center justify-center rounded-full bg-white transition-all duration-300 group-hover:scale-110 motion-reduce:group-hover:scale-100 dark:bg-zinc-900 dark:text-zinc-50">
            <ChevronRight
              className="relative left-px h-4 w-4"
              aria-hidden="true"
            />
          </span>
        </Link>
        <p className="mt-3 text-xs text-zinc-500 dark:text-zinc-400">
          Your read is carried into the form on this device only; nothing goes
          into the link or leaves your browser.
        </p>
      </div>

      {read.brief.questionsToAsk?.length > 0 && (
        <section className="border-[var(--amw-line)] mt-10 border-t pt-6">
          <h2 className="amw-kicker">Questions to ask</h2>
          <ol className="mt-3 list-decimal space-y-1 pl-5 text-sm text-zinc-700 dark:text-zinc-300">
            {read.brief.questionsToAsk.map((q) => (
              <li key={q}>{q}</li>
            ))}
          </ol>
        </section>
      )}

      <details className="border-[var(--amw-line)] print:[&>summary]:hidden [&[open]>summary]:mb-2 mt-10 border-t pt-4 text-xs text-zinc-500 dark:text-zinc-400">
        <summary className="cursor-pointer select-none">
          Sources and disclaimer
        </summary>
        <p>
          {read.sources.map((s, i) => (
            <span key={s.id ?? s.name}>
              {i > 0 && ' · '}
              {s.url ? (
                <a
                  href={s.url}
                  target="_blank"
                  rel="noreferrer"
                  className="hover:text-[var(--amw-accent-ink)] underline decoration-dotted underline-offset-4"
                >
                  {s.name}
                </a>
              ) : (
                s.name
              )}{' '}
              ({s.asOf})
            </span>
          ))}
          .{' '}
          {read.band.confidence === 'inferred'
            ? 'The band for this seat is inferred from adjacent data, not a published table. '
            : ''}
          This is not legal or financial advice.
        </p>
      </details>
    </div>
  )
}
