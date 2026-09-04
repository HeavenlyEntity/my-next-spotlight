'use client'

import { ChipGroup } from '@/components/founders/chip-group'
import { SliderField } from '@/components/founders/slider-field'
import { fmtMoney } from '@/components/founders/format'
import { CHIPS, LABELS, STAGES } from '@/lib/founders/equity/benchmarks'
import { BOUNDS, SLIDER_TRACKS } from '@/lib/founders/equity/bounds'

/* Step 2: the company's stage, the two gates, the responsibility chips
   for the chosen seat, and (fractional conversions only) the banked-work
   sliders. Zero chips keeps the classification at "?"; the rail says
   "Pick what was yours". */

const YES_NO = [
  { id: 'yes', label: 'Yes' },
  { id: 'no', label: 'No' },
]

export function TheWork({ inputs, read, onChange }) {
  const stageOptions = STAGES.map((id) => ({ id, label: LABELS.stage[id] }))
  const chips = (CHIPS[inputs.role] ?? []).map((chip) => ({
    id: chip.id,
    label: chip.label,
  }))
  const fractional = inputs.joining === 'fractional_conversion'
  const clamped = read.inputs.clamped ?? {}
  const norm = read.inputs

  const capNote = (field) =>
    clamped[field] ? `capped at ${BOUNDS[field].max}` : null

  return (
    <>
      <div>
        <ChipGroup
          label="Company stage today (last closed priced round)"
          options={stageOptions}
          value={inputs.stage}
          onChange={(stage) => onChange({ stage })}
          mode="single"
        />
        <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-400">
          Currently raising your seed? Pick pre-seed.
        </p>
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        <ChipGroup
          label="Full-time on signing?"
          options={YES_NO}
          value={inputs.fullTimeOnSigning ? 'yes' : 'no'}
          onChange={(v) => onChange({ fullTimeOnSigning: v === 'yes' })}
          mode="single"
          variant="segmented"
        />
        <ChipGroup
          label="Final say on technical decisions?"
          options={YES_NO}
          value={inputs.finalTechnicalSay ? 'yes' : 'no'}
          onChange={(v) => onChange({ finalTechnicalSay: v === 'yes' })}
          mode="single"
          variant="segmented"
        />
      </div>

      <div>
        <ChipGroup
          label={`Which of these were yours as ${
            LABELS.role[inputs.role]
          }? (select all)`}
          options={chips}
          value={inputs.responsibilities}
          onChange={(responsibilities) => onChange({ responsibilities })}
          mode="multi"
        />
        {read.classification.pending && (
          <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-400">
            Pick what was yours. The read stays “?” until you do.
          </p>
        )}
      </div>

      {fractional && (
        <div className="bg-[var(--amw-muted)] space-y-6 rounded-2xl p-6">
          <p className="amw-kicker">
            The fractional period · sizes the work already banked
          </p>
          <SliderField
            id="work-months"
            label="Months in the role"
            value={norm.months}
            onCommit={(months) => onChange({ months })}
            track={SLIDER_TRACKS.months}
            bounds={BOUNDS.months}
            step={SLIDER_TRACKS.months.step}
            ticks={SLIDER_TRACKS.months.ticks.map((t) => t.label)}
            unit=" mo"
            clampedNote={capNote('months')}
          />
          <SliderField
            id="work-hours"
            label="Average hours per week"
            value={norm.hoursPerWeek}
            onCommit={(hoursPerWeek) => onChange({ hoursPerWeek })}
            track={SLIDER_TRACKS.hoursPerWeek}
            bounds={BOUNDS.hoursPerWeek}
            step={SLIDER_TRACKS.hoursPerWeek.step}
            ticks={SLIDER_TRACKS.hoursPerWeek.ticks.map((t) => t.label)}
            unit=" h"
            clampedNote={capNote('hoursPerWeek')}
          />
          <SliderField
            id="work-rate"
            label="Your market consulting rate"
            value={norm.ratePerHour}
            onCommit={(ratePerHour) => onChange({ ratePerHour })}
            track={SLIDER_TRACKS.ratePerHour}
            bounds={BOUNDS.ratePerHour}
            step={SLIDER_TRACKS.ratePerHour.step}
            ticks={SLIDER_TRACKS.ratePerHour.ticks.map((t) => t.label)}
            format={(v) => `$${v}`}
            unit=" / hr"
            clampedNote={capNote('ratePerHour')}
          />
          <div>
            <label
              htmlFor="work-fees"
              className="text-sm font-medium text-zinc-800 dark:text-zinc-200"
            >
              Fees you actually billed (exact)
            </label>
            <div className="mt-3 flex items-center gap-3">
              <span className="amw-mono text-sm text-zinc-500">$</span>
              <input
                id="work-fees"
                type="number"
                inputMode="decimal"
                min={0}
                defaultValue={norm.feesBilled}
                onBlur={(event) =>
                  onChange({
                    feesBilled:
                      event.target.value === ''
                        ? null
                        : Number(event.target.value),
                  })
                }
                aria-describedby="work-fees-hint"
                className="border-[var(--amw-line-strong)] bg-[var(--amw-card)] focus:border-[var(--amw-accent)] focus:ring-[var(--amw-accent)]/20 amw-mono w-40 rounded-md border px-3 py-2 text-sm tabular-nums focus:outline-none focus:ring-4"
              />
              <span className="text-xs text-zinc-500 dark:text-zinc-400">
                deferred or unpaid counts as 0
              </span>
            </div>
            <p
              id="work-fees-hint"
              className="mt-2 text-xs text-zinc-500 dark:text-zinc-400"
            >
              {capNote('feesBilled') ??
                `Banked work ≈ ${fmtMoney(
                  read.adjustments.banked.dollars
                )} in foregone fees.`}
            </p>
          </div>
        </div>
      )}
    </>
  )
}
