'use client'

import { pendingAfter } from '@/lib/founders/steps'
import { AnimateDigits } from '@/components/founders/animate-digits'
import {
  CLASS_LABELS,
  PATH_LABELS,
  ROLE_LABELS,
  STAGE_LABELS,
  fmtPct,
} from '@/components/founders/format'

/* "Your read so far": one line of what is known, a muted possible range,
   the class badge once the work step has an answer, and the steps still
   needed. Deliberately quiet: the display-size number belongs to the
   results screen only. Used as the sticky desktop column, the tablet
   card above the step, and the body of the mobile sheet. */

export function ResultsRail({ read, step, className = '' }) {
  const { inputs, classification, band, offer } = read
  const known = [
    ROLE_LABELS[inputs.role] ?? '—',
    step >= 2 && inputs.stage ? STAGE_LABELS[inputs.stage] : '—',
    step >= 3 && inputs.path && inputs.path !== 'unknown'
      ? `${PATH_LABELS[inputs.path]} path`
      : '—',
  ].join(' · ')
  const classLabel = classification.pending
    ? '?'
    : CLASS_LABELS[classification.class] ?? '?'
  const hasClass = !classification.pending && step >= 2
  const showsOffer = step >= 3 && offer.pct !== null

  return (
    <aside
      aria-label="Your read so far"
      className={`bg-[var(--amw-card)] border-[var(--amw-line)] rounded-2xl border p-5 ${className}`}
    >
      <p className="amw-kicker">Your read so far</p>
      <p className="amw-mono mt-3 text-xs text-zinc-700 dark:text-zinc-300">
        {known}
      </p>
      {hasClass && (
        <p className="mt-3">
          <span className="amw-chip amw-chip--accent">{classLabel}</span>
        </p>
      )}
      <p className="amw-mono mt-3 text-2xl tabular-nums text-zinc-500 dark:text-zinc-400">
        {hasClass ? 'Range' : 'Possible range'}{' '}
        <AnimateDigits value={`${fmtPct(band.lo)}–${fmtPct(band.hi)}`} />
      </p>
      <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
        {hasClass
          ? showsOffer
            ? offer.position === 'unknown'
              ? `Offered ${fmtPct(offer.pct)}`
              : `Offered ${fmtPct(offer.pct)} · ${offer.position} the band`
            : 'Offer not entered yet.'
          : step >= 2
          ? 'Pick what was yours to narrow it.'
          : 'Narrows from the next step. No badge yet.'}
      </p>
      {classification.pending && step >= 2 && (
        <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
          Work: re-answer for {ROLE_LABELS[inputs.role]}.
        </p>
      )}
      <StillNeeded step={step} inputs={inputs} />
    </aside>
  )
}

function StillNeeded({ step, inputs }) {
  const pending = pendingAfter(step)
  const rows = [
    ...pending.map((s) => ({ label: s.pending, note: `step ${s.index}` })),
  ]
  if (step >= 2 && inputs.joining !== 'fractional_conversion') {
    rows.unshift({ label: 'Banked work', note: 'n/a (salaried)' })
  }
  if (rows.length === 0) return null
  return (
    <dl className="mt-4">
      <dt className="amw-kicker mb-1">Still needed</dt>
      {rows.map((row) => (
        <dd
          key={row.label}
          className="border-[var(--amw-line)] flex justify-between gap-3 border-t border-dashed py-1.5 text-xs text-zinc-600 dark:text-zinc-400"
        >
          <span>{row.label}</span>
          <span className="amw-mono">{row.note}</span>
        </dd>
      ))}
    </dl>
  )
}
