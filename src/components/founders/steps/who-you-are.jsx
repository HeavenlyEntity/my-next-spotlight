'use client'

import { ChipGroup } from '@/components/founders/chip-group'
import { JOINING, LABELS, ROLES } from '@/lib/founders/equity/benchmarks'

/* Step 1: which seat, how you're joining, and (only when it matters)
   how many founders. One question family; the role switch is a
   segmented control with the selected seat's description under it. */

const ROLE_DESCRIPTIONS = {
  cto: 'You own the technology and the team, now or on signing.',
  engineer: 'You build the product; the title may be “founding engineer”.',
  ceo_builder: 'You run the company and write the code.',
}

export function WhoYouAre({ inputs, read, onChange }) {
  const roleOptions = ROLES.map((id) => ({
    id,
    label: LABELS.role[id],
    description: ROLE_DESCRIPTIONS[id],
  }))
  const joiningOptions = JOINING.map((id) => ({
    id,
    label: LABELS.joining[id],
  }))
  const showFounders =
    inputs.joining === 'formation' || read.classification.deFacto

  return (
    <>
      <ChipGroup
        label="Which seat?"
        options={roleOptions}
        value={inputs.role}
        onChange={(role) => onChange({ role })}
        mode="single"
        variant="segmented"
        describeSelected
      />
      <ChipGroup
        label="How are you joining?"
        options={joiningOptions}
        value={inputs.joining}
        onChange={(joining) => onChange({ joining })}
        mode="single"
      />
      {showFounders && (
        <div>
          <label
            htmlFor="founders-count"
            className="text-sm font-medium text-zinc-800 dark:text-zinc-200"
          >
            How many founders, including you?
          </label>
          <div className="mt-3 inline-flex items-center gap-2">
            <button
              type="button"
              aria-label="Fewer founders"
              onClick={() =>
                onChange({ founders: Math.max(1, (inputs.founders ?? 2) - 1) })
              }
              className="border-[var(--amw-line-strong)] bg-[var(--amw-card)] h-11 w-11 rounded-md border text-lg"
            >
              −
            </button>
            <input
              id="founders-count"
              type="number"
              min={1}
              max={6}
              value={inputs.founders ?? 2}
              onChange={(event) =>
                onChange({ founders: Number(event.target.value) || 1 })
              }
              className="border-[var(--amw-line-strong)] bg-[var(--amw-card)] amw-mono h-11 w-16 rounded-md border text-center text-sm tabular-nums"
            />
            <button
              type="button"
              aria-label="More founders"
              onClick={() =>
                onChange({ founders: Math.min(6, (inputs.founders ?? 2) + 1) })
              }
              className="border-[var(--amw-line-strong)] bg-[var(--amw-card)] h-11 w-11 rounded-md border text-lg"
            >
              +
            </button>
          </div>
          {read.classification.deFacto && (
            <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-400">
              Your work reads as a de facto co-founder, so the founder pool
              applies.
            </p>
          )}
        </div>
      )}
    </>
  )
}
