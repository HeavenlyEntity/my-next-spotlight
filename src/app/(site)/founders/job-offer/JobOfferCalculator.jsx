'use client'

import { useEffect, useMemo, useState, useSyncExternalStore } from 'react'

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

/* Stable identity: `useSyncExternalStore` compares snapshots, so this must not
   be a fresh closure on every render. */
const serverNotHydrated = () => false

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
  /* null means "wherever the answers say"; a number means the reader moved. */
  const [stepOverride, setStepOverride] = useState(null)
  /* `useSyncExternalStore` is the API for exactly this shape of problem: a
     value that differs between the server and the client, where the hydrating
     render MUST use the server's answer. React renders `getServerSnapshot`
     first, matches the server HTML, then re-renders with the client value.
     Doing it by hand with `useState` + an effect is what caused the hydration
     mismatch this replaced, and setting state from an effect to track an
     external store is what `react-hooks/set-state-in-effect` warns about. */
  const hydrated = useSyncExternalStore(
    onHydrated,
    hasHydrated,
    serverNotHydrated
  )
  /* The outcome the plot models. Conservative by default: the reader should
     meet the modest case first, not the one that flatters the offer. */
  const [scenarioId, setScenarioId] = useState('conservative')

  const store = useOfferStore()
  const inputs = useOfferStore((s) => s.inputs)
  const setInputs = useOfferStore((s) => s.set)
  const clear = useOfferStore((s) => s.clear)

  /* Someone arriving from the equity read lands straight on the ask, and
     their numbers do not count up: those values arrived, they did not change
     (DD5).

     THIS HAS TO BE LATCHED, NOT DERIVED. `!isPristine()` is true the moment the
     reader answers the first question too, so deriving it during render would
     teleport a first-time user to the results as soon as they tapped a chip.
     What matters is whether answers were ALREADY there when hydration finished,
     which is a one-shot observation of an external event.

     `set-state-in-effect` is disabled for exactly that reason: the rule's
     alternatives are "derive during render" (wrong, see above) and
     `useSyncExternalStore` (wrong too, because the snapshot would keep changing
     as the reader types). Latching an external one-shot in a mount effect is
     the correct pattern here, and it runs once. */
  const [arrivedPrefilled, setArrivedPrefilled] = useState(false)
  useEffect(() => {
    if (!hydrated) return
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setArrivedPrefilled(!useOfferStore.getState().isPristine())
  }, [hydrated])

  const step = stepOverride ?? (arrivedPrefilled ? OFFER_STEPS.length : 1)

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

            <AskLadder ask={ask} suppressCount={arrivedPrefilled} />

            {/* Actions before the plot, not after it. The plot is evidence the
                reader may or may not scroll to; the action on the ask cannot
                sit below it (design review DD3, screen order). */}
            <AskActions
              ask={ask}
              onEdit={() => setStepOverride(1)}
              onClear={() => {
                clear()
                setStepOverride(1)
              }}
            />

            <MarketPlot plot={plot} onScenarioChange={setScenarioId} />
          </>
        ) : (
          <WizardShell
            step={step}
            steps={OFFER_STEPS}
            lead={OFFER_STEPS[step - 1]?.lead}
            onBack={() => setStepOverride(Math.max(1, step - 1))}
            onNext={() =>
              setStepOverride(Math.min(OFFER_STEPS.length, step + 1))
            }
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
