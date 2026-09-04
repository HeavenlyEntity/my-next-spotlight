'use client'

import { useEffect, useMemo, useState } from 'react'

import { DeskEyebrow } from '@/components/founders/desk-eyebrow'
import { WizardShell } from '@/components/founders/wizard-shell'
import { AskLadder } from '@/components/founders/ladder/ask-ladder'
import {
  CompanyStep,
  OfferStep,
  SeatStep,
} from '@/components/founders/ladder/wizard-steps'
import { computeRead } from '@/lib/founders/equity/engine'
import { computeAsk } from '@/lib/founders/equity/negotiation'
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
  const [hydrated, setHydrated] = useState(() => hasHydrated())
  /* True only for the paint immediately after hydration: those values arrived,
     they did not change, so nothing should animate up to them. */
  const [justHydrated, setJustHydrated] = useState(false)

  const store = useOfferStore()
  const inputs = useOfferStore((s) => s.inputs)
  const setInputs = useOfferStore((s) => s.set)
  const clear = useOfferStore((s) => s.clear)

  useEffect(() => {
    if (hasHydrated()) {
      setHydrated(true)
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

            <div className="mt-10 flex flex-wrap items-center gap-4">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="border-[var(--amw-line-strong)] bg-[var(--amw-card)] min-h-11 hover:border-[var(--amw-accent-ink)] inline-flex items-center rounded-md border px-4 text-sm font-medium text-zinc-800 transition-colors dark:text-zinc-200"
              >
                Edit answers
              </button>
              <button
                type="button"
                onClick={() => {
                  clear()
                  setStep(1)
                }}
                className="hover:text-[var(--amw-accent-ink)] text-sm text-zinc-600 underline underline-offset-4 transition-colors dark:text-zinc-400"
              >
                Clear my answers
              </button>
            </div>
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
