'use client'

import { useEffect, useMemo, useReducer, useRef, useState } from 'react'

import { DeskEyebrow } from '@/components/founders/desk-eyebrow'
import { WizardShell } from '@/components/founders/wizard-shell'
import { ResultsRail } from '@/components/founders/results-rail'
import {
  RailSummaryBar,
  SUMMARY_BAR_HEIGHT,
} from '@/components/founders/rail-summary-bar'
import { LiveAnnouncer } from '@/components/founders/live-announcer'
import { WhoYouAre } from '@/components/founders/steps/who-you-are'
import { TheWork } from '@/components/founders/steps/the-work'
import { SalaryAndOffer } from '@/components/founders/steps/salary-and-offer'
import { ResultsScreen } from '@/components/founders/results/results-screen'
import { CLASS_LABELS } from '@/components/founders/format'
import { trackCompleted, trackStep } from '@/components/founders/analytics'
import {
  ENGINE_KEYS,
  hasHydrated,
  onHydrated,
  useOfferStore,
} from '@/lib/founders/offer-store'
import { computeRead } from '@/lib/founders/equity/engine'
import { STEPS } from '@/lib/founders/steps'

/* One reducer holds the inputs, the step, and the "show the math"
   overrides; `computeRead` derives everything else on every change and
   feeds the rail, the announcer, the steps' hints, and the results.

   THE REDUCER IS LOCAL, THE SHARED FIELDS ARE NOT. This page used to reset on
   reload by design. Decision D3 changed that: the shared store persists to
   sessionStorage, so answers survive a reload and cross to the job offer
   calculator. The traffic runs both ways now. Out: the effect below, once the
   user has touched something. In: `seed`, once, on hydration, so the "See how
   the equity band was sized" hand-off lands on the user's own answers instead
   of an empty wizard. Only ENGINE_KEYS cross; the step, the overrides and the
   fractional sliders stay here. */

const INITIAL_INPUTS = {
  role: 'cto',
  joining: 'fractional_conversion',
  founders: 2,
  stage: 'preseed',
  path: 'ipo',
  fullTimeOnSigning: true,
  finalTechnicalSay: true,
  responsibilities: [],
  months: 6,
  hoursPerWeek: 10,
  ratePerHour: 150,
  feesBilled: 0,
  marketSalary: null,
  offeredSalary: null,
  offerMode: 'percent',
  offeredEquityPct: null,
  optionCount: null,
  fullyDilutedShares: null,
  strikePrice: null,
  instrument: 'unsure',
  vestingYears: 4,
  cliffMonths: 12,
  roundsBeforeExit: {},
  exerciseWindow: 'days_90',
  accelerationCoC: 'none',
  accelerationTerminationMonths: 0,
  repurchaseVested: 'none',
  severanceMonths: 0,
}

const INITIAL_STATE = {
  step: 1,
  inputs: INITIAL_INPUTS,
  touched: false,
  overrides: { valuations: {} },
}

function reducer(state, action) {
  switch (action.type) {
    /* Answers arriving from the shared store on hydration. Deliberately does
       NOT set `touched`: these values arrived, the user did not type them, and
       marking them touched would arm the live announcer and start the
       write-back effect against a store that already holds them. */
    case 'seed':
      return { ...state, inputs: { ...state.inputs, ...action.patch } }
    /* Back to a blank wizard. The caller empties the shared store first; this
       drops the local half, which the store never held. */
    case 'reset':
      return { ...INITIAL_STATE }
    case 'change': {
      const patch = { ...action.patch }
      /* A role switch invalidates the role-specific chips. */
      if (patch.role && patch.role !== state.inputs.role) {
        patch.responsibilities = []
      }
      return {
        ...state,
        touched: true,
        inputs: { ...state.inputs, ...patch },
      }
    }
    case 'next':
      return { ...state, step: Math.min(STEPS.length, state.step + 1) }
    case 'back':
      return { ...state, step: Math.max(1, state.step - 1) }
    case 'override': {
      if (action.key === 'valuation') {
        const { path, id, value } = action.value
        return {
          ...state,
          overrides: {
            ...state.overrides,
            valuations: {
              ...state.overrides.valuations,
              [path]: {
                ...(state.overrides.valuations[path] ?? {}),
                [id]: value,
              },
            },
          },
        }
      }
      if (action.key === 'roundsBeforeExit') {
        const { path, value } = action.value
        return {
          ...state,
          inputs: {
            ...state.inputs,
            roundsBeforeExit: {
              ...(state.inputs.roundsBeforeExit ?? {}),
              [path]: value,
            },
          },
        }
      }
      return state
    }
    default:
      return state
  }
}

/* The wizard card's geometry, held while persisted answers land, so a chip row
   never flips under someone a beat after it renders. */
function WizardSkeleton() {
  return (
    <div
      aria-hidden="true"
      className="lg:grid lg:grid-cols-[minmax(0,1fr)_20rem] lg:gap-8"
    >
      <div className="bg-[var(--amw-muted)] animate-pulse rounded-2xl p-6 md:p-8">
        <div className="bg-[var(--amw-card)] h-3 w-28 rounded" />
        <div className="bg-[var(--amw-card)] mt-5 h-8 w-3/4 rounded-md" />
        <div className="bg-[var(--amw-card)] mt-4 h-4 w-full max-w-lg rounded" />
        <div className="mt-10 space-y-6">
          {[0, 1, 2].map((i) => (
            <div key={i}>
              <div className="bg-[var(--amw-card)] h-3 w-32 rounded" />
              <div className="bg-[var(--amw-card)] mt-3 h-11 w-full rounded-md" />
            </div>
          ))}
        </div>
      </div>
      <div className="hidden lg:block" />
    </div>
  )
}

export default function EquityCalculator() {
  const [state, dispatch] = useReducer(reducer, INITIAL_STATE)
  const { step, inputs, overrides, touched } = state
  /* `persist` hydrates after mount, so the first paint is always this
     wizard's own defaults. Gate on this rather than letting a chip row flip
     under the user a beat after it renders (design review DD5). */
  const [hydrated, setHydrated] = useState(() => hasHydrated())
  /* Read inside a one-shot effect, so it must be a ref rather than a dep. */
  const touchedRef = useRef(touched)
  touchedRef.current = touched

  /* Pull the shared fields in, once, when persisted state lands. Guarded on
     `isPristine()` so an untouched store never overwrites this wizard's own
     defaults with the same values under a different name, and on `touched` so
     it can never land on top of something the user is part-way through
     typing. */
  useEffect(() => {
    const take = () => {
      const store = useOfferStore.getState()
      if (store.isPristine()) return
      const patch = {}
      for (const key of ENGINE_KEYS) {
        if (key in INITIAL_INPUTS) patch[key] = store[key]
      }
      dispatch({ type: 'seed', patch })
    }
    if (hasHydrated()) {
      if (!touchedRef.current) take()
      setHydrated(true)
      return undefined
    }
    return onHydrated(() => {
      if (!touchedRef.current) take()
      setHydrated(true)
    })
    /* Once, on hydration. Re-running on every input change would fight the
       user's own edits with the store's copy of them. */
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  /* Push the shared fields into the store so the job offer calculator and the
     contact form see the same answers. Only the keys both tools own; the step,
     the overrides and the fractional sliders stay local. Nothing is written
     until the user has actually touched something, so landing on the wizard
     and leaving cannot resurrect defaults over a store the user just cleared
     (design review D6, D15 #9). */
  useEffect(() => {
    if (!touched) return
    const patch = {}
    for (const key of ENGINE_KEYS) {
      if (key in inputs) patch[key] = inputs[key]
    }
    useOfferStore.getState().set(patch)
  }, [inputs, touched])

  const read = useMemo(
    () => computeRead(inputs, { valuations: overrides.valuations }),
    [inputs, overrides]
  )

  useEffect(() => {
    trackStep(step)
    if (step === STEPS.length) trackCompleted()
    if (step !== 1) window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [step])

  const onChange = (patch) => dispatch({ type: 'change', patch })
  const onOverride = (key, value) => dispatch({ type: 'override', key, value })

  const announcement = read.classification.pending
    ? null
    : `${CLASS_LABELS[read.classification.class]}.${
        read.offer.pct !== null ? ` Offer ${read.offer.position} the band.` : ''
      }`

  const isResults = step === STEPS.length
  const stepProps = { inputs, read, onChange }

  return (
    <div className="amw">
      <section
        className="px-6 py-12 md:py-16"
        style={
          isResults
            ? undefined
            : {
                paddingBottom: `calc(${SUMMARY_BAR_HEIGHT}px + env(safe-area-inset-bottom) + 3rem)`,
              }
        }
      >
        <div className="mx-auto max-w-6xl">
          <div data-print="hide">
            <DeskEyebrow current="equity" className="mb-8" />
          </div>

          {!hydrated ? (
            <WizardSkeleton />
          ) : isResults ? (
            <div>
              <div data-print="hide" className="mb-8">
                <button
                  type="button"
                  onClick={() => dispatch({ type: 'back' })}
                  className="text-sm text-zinc-600 underline-offset-4 hover:underline dark:text-zinc-400"
                >
                  ← Change an answer
                </button>
              </div>
              <ResultsScreen
                read={read}
                overrides={overrides}
                onOverride={onOverride}
              />
            </div>
          ) : (
            <div className="lg:grid lg:grid-cols-[minmax(0,1fr)_20rem] lg:gap-8">
              {/* Tablet: the rail as a card above the step. */}
              <div className="mb-8 hidden md:block lg:hidden">
                <ResultsRail read={read} step={step} />
              </div>
              <div className="bg-[var(--amw-muted)] rounded-2xl p-6 md:p-8">
                <WizardShell
                  step={step}
                  onBack={() => dispatch({ type: 'back' })}
                  onNext={() => dispatch({ type: 'next' })}
                >
                  {step === 1 && <WhoYouAre {...stepProps} />}
                  {step === 2 && <TheWork {...stepProps} />}
                  {step === 3 && <SalaryAndOffer {...stepProps} />}
                </WizardShell>
              </div>
              <div className="hidden lg:block">
                <ResultsRail
                  read={read}
                  step={step}
                  className="sticky top-24"
                />
              </div>
            </div>
          )}

          {/* Decision D3: the shared answers now persist to sessionStorage, so
              "nothing stored" would be false. Say the true thing instead, in
              the same words the job offer calculator uses, and put the control
              that makes the claim keepable beside it. */}
          <p className="amw-kicker mt-12" data-print="hide">
            No account. Nothing leaves your browser.{' '}
            <button
              type="button"
              onClick={() => {
                useOfferStore.getState().clear()
                dispatch({ type: 'reset' })
              }}
              className="amw-kicker hover:text-[var(--amw-accent-ink)] underline underline-offset-4 transition-colors"
            >
              Clear my answers
            </button>
          </p>
        </div>
      </section>

      {hydrated && !isResults && (
        <div className="md:hidden">
          <RailSummaryBar read={read} step={step} />
        </div>
      )}

      <LiveAnnouncer message={announcement} armed={touched} />
    </div>
  )
}
