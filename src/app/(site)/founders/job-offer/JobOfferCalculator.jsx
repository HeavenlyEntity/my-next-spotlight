'use client'

import { useEffect, useMemo, useState } from 'react'

import { DeskEyebrow } from '@/components/founders/desk-eyebrow'
import { WizardShell } from '@/components/founders/wizard-shell'
import { AskActions } from '@/components/founders/ladder/ask-actions'
import { AskLadder } from '@/components/founders/ladder/ask-ladder'
import { MarketPlot } from '@/components/founders/market-plot'
import {
  CompanyStep,
  OfferStep,
  SeatStep,
} from '@/components/founders/ladder/wizard-steps'
import { computeRead } from '@/lib/founders/equity/engine'
import { computeAsk } from '@/lib/founders/equity/negotiation'
import { buildPlot } from '@/lib/founders/equity/plot'
import { OFFER_STEPS } from '@/lib/founders/offer-steps'
import {
  hasHydrated,
  onHydrated,
  useOfferStore,
} from '@/lib/founders/offer-store'

/*
 * The job offer calculator.
 *
 * WHY THE HYDRATION GATE EXISTS. The store persists to sessionStorage, and
 * `persist` hydrates AFTER mount. Without a gate the server paints the store's
 * defaults, which are CTO at pre-seed, and a moment later the real answers
 * arrive and the numbers change. Because arriving numbers count up in this
 * design system, an engineer at Series A would watch a CTO's pre-seed figures
 * animate on screen and then jump. On a page about someone's salary, the first
 * frame would be a confident wrong answer. So: gate the render, show a
 * fixed-geometry skeleton, and suppress the count-up on the first real paint,
 * because those values arrived rather than changed (design review DD5).
 *
 * The store is the state. There is no local reducer for inputs, because the
 * equity calculator writes the same fields and the two must never disagree.
 * Step index is local, since it is nobody else's business.
 */

/* Fixed geometry so nothing shifts when the real values land. */
function LadderSkeleton() {
  return (
    <div aria-hidden="true" className="animate-pulse">
      <div className="bg-[var(--amw-muted)] h-12 w-3/4 rounded-md sm:h-14 md:h-16" />
      <div className="bg-[var(--amw-muted)] mt-4 h-5 w-full max-w-2xl rounded-md" />
      <div className="border-[var(--amw-line)] mt-10 overflow-hidden rounded-2xl border">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="border-[var(--amw-line)] grid grid-cols-1 gap-x-6 gap-y-3 border-b px-5 py-5 last:border-b-0 sm:grid-cols-[minmax(9rem,1fr)_1fr_1fr] sm:px-6"
          >
            <div className="bg-[var(--amw-muted)] h-3 w-24 rounded" />
            <div className="bg-[var(--amw-muted)] h-8 w-32 rounded" />
            <div className="bg-[var(--amw-muted)] h-8 w-24 rounded" />
          </div>
        ))}
      </div>
    </div>
  )
}

export default function JobOfferCalculator() {
  const [step, setStep] = useState(1)
  /* MUST start false on BOTH sides, never `useState(() => hasHydrated())`.
     That reads client-only state during render and answers differently in the
     two places: on the server there is no sessionStorage, so `persist` never
     hydrates and it returns false; in the browser sessionStorage is
     synchronous, so the store is already hydrated by the time React renders
     and it returns true. The server then paints the skeleton, the client's
     first render paints the wizard, and React throws away the whole server
     tree as a hydration mismatch. Starting false everywhere and flipping in an
     effect keeps the two first renders identical, because effects never run on
     the server. */
  const [hydrated, setHydrated] = useState(false)
  /* True only for the paint immediately after hydration: those values arrived,
     they did not change, so nothing should animate up to them. */
  const [justHydrated, setJustHydrated] = useState(false)
  /* The outcome the plot models. Conservative by default: the reader should
     meet the modest case first, not the one that flatters the offer. */
  const [scenarioId, setScenarioId] = useState('conservative')

  const store = useOfferStore()
  const inputs = useOfferStore((s) => s.inputs)
  const setInputs = useOfferStore((s) => s.set)
  const clear = useOfferStore((s) => s.clear)

  useEffect(() => {
    /* The synchronous branch is the normal one in a browser: sessionStorage
       had the answers before the first paint. That is still an arrival, so it
       suppresses the count-up exactly like the async branch does (DD5). */
    if (hasHydrated()) {
      setHydrated(true)
      setJustHydrated(true)
      return undefined
    }
    return onHydrated(() => {
      setHydrated(true)
      setJustHydrated(true)
    })
  }, [])

  /* Drop the suppression after one paint so later changes animate normally. */
  useEffect(() => {
    if (!justHydrated) return undefined
    const id = requestAnimationFrame(() => setJustHydrated(false))
    return () => cancelAnimationFrame(id)
  }, [justHydrated])

  /* Someone arriving from the equity read lands straight on the ask. */
  useEffect(() => {
    if (!hydrated) return
    if (!useOfferStore.getState().isPristine()) setStep(OFFER_STEPS.length)
  }, [hydrated])

  const read = useMemo(() => computeRead(inputs()), [inputs, store])
  const ask = useMemo(
    () => computeAsk(read, { industry: store.industry, geo: store.geo }),
    [read, store.industry, store.geo]
  )

  const plot = useMemo(
    () => buildPlot(read, ask, { scenarioId }),
    [read, ask, scenarioId]
  )

  const isAsk = step === OFFER_STEPS.length

  /* Until the store has hydrated we do not know whether this person arrived
     with answers, so we cannot know whether to show the wizard or the ask.
     Rendering either one would flash the wrong screen. Hold the skeleton. */
  if (!hydrated) {
    return (
      <div className="amw mx-auto w-full max-w-4xl px-6 py-10 sm:py-16">
        <DeskEyebrow current="job-offer" />
        <div className="mt-8">
          <LadderSkeleton />
        </div>
      </div>
    )
  }

  return (
    <div className="amw mx-auto w-full max-w-4xl px-6 py-10 sm:py-16">
      <DeskEyebrow current="job-offer" />

      <div className="mt-8">
        {isAsk ? (
          <>
            <p className="amw-kicker mb-3">
              {[
                read.labels.role,
                read.labels.stage,
                store.industry === 'saas' || store.industry === 'other'
                  ? null
                  : store.industry,
                read.labels.joining,
              ]
                .filter(Boolean)
                .join(' · ')}
            </p>

            <AskLadder ask={ask} suppressCount={justHydrated} />

            {/* Actions before the plot, not after it. The plot is evidence the
                reader may or may not scroll to; the action on the ask cannot
                sit below it (design review DD3, screen order). */}
            <AskActions
              ask={ask}
              onEdit={() => setStep(1)}
              onClear={() => {
                clear()
                setStep(1)
              }}
            />

            <MarketPlot plot={plot} onScenarioChange={setScenarioId} />
          </>
        ) : (
          <WizardShell
            step={step}
            steps={OFFER_STEPS}
            lead={OFFER_STEPS[step - 1]?.lead}
            onBack={() => setStep((s) => Math.max(1, s - 1))}
            onNext={() => setStep((s) => Math.min(OFFER_STEPS.length, s + 1))}
          >
            {step === 1 && <SeatStep inputs={store} onChange={setInputs} />}
            {step === 2 && <CompanyStep inputs={store} onChange={setInputs} />}
            {step === 3 && <OfferStep inputs={store} onChange={setInputs} />}
          </WizardShell>
        )}
      </div>

      <p className="amw-kicker mt-12">
        No account. Nothing leaves your browser. Clear it any time.
      </p>
    </div>
  )
}
