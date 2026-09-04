'use client'

import { useEffect, useMemo, useReducer } from 'react'

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
import { computeRead } from '@/lib/founders/equity/engine'
import { STEPS } from '@/lib/founders/steps'

/* One reducer holds the inputs, the step, and the "show the math"
   overrides; `computeRead` derives everything else on every change and
   feeds the rail, the announcer, the steps' hints, and the results. No
   persistence, no URL state: reload resets, by design. */

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

export default function EquityCalculator() {
  const [state, dispatch] = useReducer(reducer, INITIAL_STATE)
  const { step, inputs, overrides, touched } = state

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

          {isResults ? (
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
        </div>
      </section>

      {!isResults && (
        <div className="md:hidden">
          <RailSummaryBar read={read} step={step} />
        </div>
      )}

      <LiveAnnouncer message={announcement} armed={touched} />
    </div>
  )
}
