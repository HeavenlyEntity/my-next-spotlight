'use client'

import { NumberField } from '@/components/founders/number-field'
import { ChipGroup } from '@/components/founders/chip-group'
import { SliderField } from '@/components/founders/slider-field'
import { fmtPct } from '@/components/founders/format'
import {
  ACCELERATION_COC,
  EXERCISE_WINDOWS,
  INSTRUMENTS,
  LABELS,
  LEAVER,
  PATHS,
  REPURCHASE_VESTED,
} from '@/lib/founders/equity/benchmarks'
import { BOUNDS, SLIDER_TRACKS } from '@/lib/founders/equity/bounds'

/* Step 3: the exposed moment. The privacy line sits under the headline;
   the offer comes first (percent, or option count over fully diluted
   shares), salary second, terms third, and the company's stated exit
   path last because it only changes the consequences. */

const MODE_OPTIONS = [
  { id: 'percent', label: 'Percent, fully diluted' },
  { id: 'shares', label: 'Option count / shares' },
]

const INSTRUMENT_LABELS = {
  options: 'Options',
  restricted_stock: 'Restricted stock',
  unsure: 'Not sure',
}

export function SalaryAndOffer({ inputs, read, onChange }) {
  const clamped = read.inputs.clamped ?? {}
  const norm = read.inputs
  const capNote = (field) =>
    clamped[field] ? `capped at ${BOUNDS[field].max}` : null
  const sharesPending =
    inputs.offerMode === 'shares' &&
    inputs.optionCount !== null &&
    inputs.fullyDilutedShares === null

  return (
    <>
      <p className="amw-kicker -mt-4">
        Nothing you type leaves this page. We count steps, never values.
      </p>

      <section aria-labelledby="offer-block" className="space-y-6">
        <h3 id="offer-block" className="amw-kicker">
          The offer
        </h3>
        <ChipGroup
          label="Offer expressed as"
          options={MODE_OPTIONS}
          value={inputs.offerMode}
          onChange={(offerMode) => onChange({ offerMode })}
          mode="single"
          variant="segmented"
        />
        {inputs.offerMode === 'percent' ? (
          <NumberField
            id="offer-pct"
            label="Offered equity (% fully diluted)"
            value={inputs.offeredEquityPct}
            onCommit={(offeredEquityPct) => onChange({ offeredEquityPct })}
            placeholder="e.g. 3"
            hint={
              capNote('offeredEquityPct') ??
              'Leave blank if there is no number yet; you still get the range.'
            }
          />
        ) : (
          <div className="grid gap-6 sm:grid-cols-3">
            <NumberField
              id="offer-count"
              label="Option count"
              value={inputs.optionCount}
              onCommit={(optionCount) => onChange({ optionCount })}
              placeholder="e.g. 300000"
            />
            <NumberField
              id="offer-fd"
              label="Fully diluted shares"
              value={inputs.fullyDilutedShares}
              onCommit={(fullyDilutedShares) =>
                onChange({ fullyDilutedShares })
              }
              placeholder="e.g. 10000000"
              hint={
                sharesPending
                  ? 'Needed to turn the count into a percent. Ask for it.'
                  : norm.offeredEquityPct !== null
                  ? `= ${fmtPct(norm.offeredEquityPct)} fully diluted`
                  : 'Option counts alone mean nothing; ask for this number.'
              }
            />
            <NumberField
              id="offer-strike"
              label="Strike price per share"
              value={inputs.strikePrice}
              onCommit={(strikePrice) => onChange({ strikePrice })}
              prefix="$"
              placeholder="optional"
              hint="Used to subtract exercise cost from exit scenarios."
            />
          </div>
        )}
      </section>

      <section aria-labelledby="salary-block" className="space-y-6">
        <h3 id="salary-block" className="amw-kicker">
          Salary
        </h3>
        <SliderField
          id="salary-market"
          label="Market salary for this seat"
          value={norm.marketSalary}
          onCommit={(marketSalary) => onChange({ marketSalary })}
          track={SLIDER_TRACKS.marketSalary}
          bounds={BOUNDS.marketSalary}
          step={SLIDER_TRACKS.marketSalary.step}
          ticks={SLIDER_TRACKS.marketSalary.ticks.map((t) => t.label)}
          format={(v) => `$${Math.round(v / 1000)}k`}
          clampedNote={capNote('marketSalary')}
          hint="Defaults to the benchmark for your role and stage; change it if you know better."
        />
        <NumberField
          id="salary-offered"
          label="Offered salary"
          value={inputs.offeredSalary}
          onCommit={(offeredSalary) => onChange({ offeredSalary })}
          prefix="$"
          placeholder="blank = not entered"
          hint={
            capNote('offeredSalary') ??
            'Blank skips the salary adjustment. Zero is a real number.'
          }
        />
      </section>

      <section aria-labelledby="terms-block" className="space-y-6">
        <h3 id="terms-block" className="amw-kicker">
          Terms
        </h3>
        <ChipGroup
          label="Instrument"
          options={INSTRUMENTS.map((id) => ({
            id,
            label: INSTRUMENT_LABELS[id],
          }))}
          value={inputs.instrument}
          onChange={(instrument) => onChange({ instrument })}
          mode="single"
        />
        <div className="grid gap-6 sm:grid-cols-2">
          <NumberField
            id="terms-vesting"
            label="Vesting (years)"
            value={norm.vestingYears}
            onCommit={(vestingYears) => onChange({ vestingYears })}
            hint={
              capNote('vestingYears') ??
              'Four is standard; longer is a negotiation point.'
            }
          />
          <NumberField
            id="terms-cliff"
            label="Cliff (months)"
            value={norm.cliffMonths}
            onCommit={(cliffMonths) => onChange({ cliffMonths })}
            hint={
              capNote('cliffMonths') ??
              'Twelve is standard; longer is a negotiation point.'
            }
          />
        </div>
      </section>

      <details className="border-[var(--amw-line)] group rounded-2xl border p-5">
        <summary className="[&::-webkit-details-marker]:hidden flex cursor-pointer list-none flex-wrap items-baseline justify-between gap-3">
          <span className="amw-kicker">If it ends · optional</span>
          <span className="text-xs text-zinc-500 dark:text-zinc-400">
            Defaults to the market standard. Open this if your term sheet says
            otherwise.
          </span>
        </summary>
        <div className="mt-6 space-y-6">
          {inputs.instrument !== 'restricted_stock' && (
            <ChipGroup
              label="Time to exercise vested options after leaving"
              options={EXERCISE_WINDOWS.map((id) => ({
                id,
                label: LEAVER.exerciseWindow.labels[id],
              }))}
              value={inputs.exerciseWindow}
              onChange={(exerciseWindow) => onChange({ exerciseWindow })}
              mode="single"
            />
          )}
          <ChipGroup
            label="Acceleration on a change of control"
            options={ACCELERATION_COC.map((id) => ({
              id,
              label: LEAVER.acceleration.labels[id],
            }))}
            value={inputs.accelerationCoC}
            onChange={(accelerationCoC) => onChange({ accelerationCoC })}
            mode="single"
          />
          <ChipGroup
            label="Company’s right to buy back vested shares"
            options={REPURCHASE_VESTED.map((id) => ({
              id,
              label: LEAVER.repurchase.labels[id],
            }))}
            value={inputs.repurchaseVested}
            onChange={(repurchaseVested) => onChange({ repurchaseVested })}
            mode="single"
          />
          <div className="grid gap-6 sm:grid-cols-2">
            <NumberField
              id="terms-accel-termination"
              label="Acceleration if terminated without cause (months)"
              value={norm.accelerationTerminationMonths}
              onCommit={(accelerationTerminationMonths) =>
                onChange({ accelerationTerminationMonths })
              }
              hint={
                capNote('accelerationTerminationMonths') ??
                'Zero is the default; 6–12 months is a common founder ask.'
              }
            />
            <NumberField
              id="terms-severance"
              label="Cash severance (months of salary)"
              value={norm.severanceMonths}
              onCommit={(severanceMonths) => onChange({ severanceMonths })}
              hint={capNote('severanceMonths') ?? LEAVER.severance.note}
            />
          </div>
        </div>
      </details>

      <ChipGroup
        label="Where does the company say it’s going?"
        options={PATHS.map((id) => ({ id, label: LABELS.path[id] }))}
        value={inputs.path}
        onChange={(path) => onChange({ path })}
        mode="single"
      />
    </>
  )
}
