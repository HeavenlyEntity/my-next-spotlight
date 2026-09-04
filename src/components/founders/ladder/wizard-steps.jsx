'use client'

import { useId } from 'react'

import { ChipGroup } from '@/components/founders/chip-group'
import { NumberField } from '@/components/founders/number-field'
import { CHIPS } from '@/lib/founders/equity/benchmarks'
import {
  GEO_OPTIONS,
  INDUSTRY_OPTIONS,
  JOINING_OPTIONS,
  NONE_OF_THESE,
  SEAT_OPTIONS,
  STAGE_OPTIONS,
  YES_NO,
} from '@/lib/founders/offer-steps'

/* Three steps, one question each. See offer-steps.js for why this is three and
   not the two the plan started with. */

/* A native select rather than a chip row. Industry and location are two
   low-stakes multipliers that default to no adjustment; as chips they were
   nine 44px targets competing with the answers that actually move the read.
   Native means one tap on a phone and no portal to keep inside the amw scope. */
function SelectField({ id, label, hint, value, options, onChange }) {
  return (
    <div>
      <label
        htmlFor={id}
        className="text-sm font-medium text-zinc-800 dark:text-zinc-200"
      >
        {label}
      </label>
      <select
        id={id}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        aria-describedby={hint ? `${id}-hint` : undefined}
        className="border-[var(--amw-line-strong)] bg-[var(--amw-card)] focus:border-[var(--amw-accent)] focus:ring-[var(--amw-accent)]/20 min-h-11 mt-2 w-full rounded-md border px-3 py-2.5 text-sm text-zinc-900 focus:outline-none focus:ring-4 dark:text-zinc-100"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {hint && (
        <p
          id={`${id}-hint`}
          className="mt-2 text-xs text-zinc-500 dark:text-zinc-400"
        >
          {hint}
        </p>
      )}
    </div>
  )
}

const yesNo = (value) => (value === null ? null : value ? 'yes' : 'no')

/* STEP 1 — the classification cluster. These answers decide whether the cash
   band is the founder one or the market one, which is a 30-40% swing, so they
   belong together and they belong first. */
export function SeatStep({ inputs, onChange }) {
  const chips = CHIPS[inputs.role] ?? []
  const selected =
    inputs.workAnswered && inputs.responsibilities.length === 0
      ? [NONE_OF_THESE]
      : inputs.responsibilities

  return (
    <>
      <ChipGroup
        label="Which seat?"
        variant="segmented"
        options={SEAT_OPTIONS}
        value={inputs.role}
        onChange={(role) =>
          onChange({ role, responsibilities: [], workAnswered: false })
        }
      />
      <ChipGroup
        label="How are you joining?"
        options={JOINING_OPTIONS}
        value={inputs.joining}
        onChange={(joining) => onChange({ joining })}
      />
      <ChipGroup
        label="Full time on signing?"
        variant="segmented"
        options={YES_NO}
        value={yesNo(inputs.fullTimeOnSigning)}
        onChange={(v) => onChange({ fullTimeOnSigning: v === 'yes' })}
      />
      <ChipGroup
        label="Final say on technical decisions?"
        variant="segmented"
        options={YES_NO}
        value={yesNo(inputs.finalTechnicalSay)}
        onChange={(v) => onChange({ finalTechnicalSay: v === 'yes' })}
      />
      <ChipGroup
        label="What is yours to own?"
        mode="multi"
        options={[
          ...chips.map((c) => ({ id: c.id, label: c.label })),
          { id: NONE_OF_THESE, label: 'None of these' },
        ]}
        value={selected}
        onChange={(next) => {
          /* An empty array cannot mean both "not answered" and "none of
             these", so the none option is explicit and sets workAnswered. */
          if (next.includes(NONE_OF_THESE)) {
            onChange({ responsibilities: [], workAnswered: true })
            return
          }
          onChange({ responsibilities: next, workAnswered: next.length > 0 })
        }}
      />
    </>
  )
}

/* STEP 2 — everything about the company. */
export function CompanyStep({ inputs, onChange }) {
  const id = useId()
  return (
    <>
      <ChipGroup
        label="Last closed round"
        variant="segmented"
        options={STAGE_OPTIONS}
        value={inputs.stage}
        onChange={(stage) => onChange({ stage })}
      />
      <SelectField
        id={`${id}-industry`}
        label="Industry"
        hint="A smaller correction than stage. SaaS and “something else” apply no adjustment at all."
        value={inputs.industry}
        options={INDUSTRY_OPTIONS}
        onChange={(industry) => onChange({ industry })}
      />
      <SelectField
        id={`${id}-geo`}
        label="Where the role is paid"
        hint="Location moves cash more than industry does. Another US hub is the baseline."
        value={inputs.geo}
        options={GEO_OPTIONS}
        onChange={(geo) => onChange({ geo })}
      />
    </>
  )
}

/* STEP 3 — what they actually offered. Everything here is optional: the ask
   still computes without it, it just cannot compare. */
export function OfferStep({ inputs, onChange }) {
  const id = useId()
  const isShares = inputs.offerMode === 'shares'
  return (
    <>
      <ChipGroup
        label="How was the equity described?"
        variant="segmented"
        options={[
          { id: 'percent', label: 'Percent, fully diluted' },
          { id: 'shares', label: 'Option count / shares' },
        ]}
        value={inputs.offerMode}
        onChange={(offerMode) => onChange({ offerMode })}
      />

      {isShares ? (
        <div className="grid gap-5 sm:grid-cols-3">
          <NumberField
            id={`${id}-count`}
            label="Options offered"
            value={inputs.optionCount}
            onCommit={(optionCount) => onChange({ optionCount })}
          />
          <NumberField
            id={`${id}-fd`}
            label="Fully diluted shares"
            hint="Without this, an option count means nothing."
            value={inputs.fullyDilutedShares}
            onCommit={(fullyDilutedShares) => onChange({ fullyDilutedShares })}
          />
          <NumberField
            id={`${id}-strike`}
            label="Strike price"
            prefix="$"
            value={inputs.strikePrice}
            onCommit={(strikePrice) => onChange({ strikePrice })}
          />
        </div>
      ) : (
        <NumberField
          id={`${id}-pct`}
          label="Equity offered"
          hint="Fully diluted percent. Leave blank if they have not said."
          value={inputs.offeredEquityPct}
          onCommit={(offeredEquityPct) => onChange({ offeredEquityPct })}
        />
      )}

      <NumberField
        id={`${id}-salary`}
        label="Salary offered"
        prefix="$"
        hint="Base cash per year."
        value={inputs.offeredSalary}
        onCommit={(offeredSalary) => onChange({ offeredSalary })}
      />
      <NumberField
        id={`${id}-vesting`}
        label="Vesting, in years"
        value={inputs.vestingYears}
        onCommit={(vestingYears) => onChange({ vestingYears })}
      />
    </>
  )
}
