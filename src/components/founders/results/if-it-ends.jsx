'use client'

import { fmtMoney, fmtPct } from '@/components/founders/format'
import { LEAVER, SOURCES } from '@/lib/founders/equity/benchmarks'

const src = (id) => SOURCES.find((s) => s.id === id)

function Cite({ id, children }) {
  const s = src(id)
  if (!s?.url) return children
  return (
    <a
      href={s.url}
      target="_blank"
      rel="noreferrer"
      title={`${s.name} (${s.asOf})`}
      className="hover:text-[var(--amw-accent-ink)] underline decoration-dotted underline-offset-4"
    >
      {children}
    </a>
  )
}

/* Layer four of the results: what the holder keeps if it ends, at fixed
   horizons, under three departures. A table, not cards; the cliff row is
   the one most people have never seen written down. Below it, the three
   terms that decide whether "vested" means "kept": the exercise window,
   the repurchase right, and severance. */

const STANDARD_LABELS = {
  exerciseWindow: (v) => LEAVER.exerciseWindow.labels[v],
  accelerationCoC: (v) => LEAVER.acceleration.labels[v],
  repurchaseVested: (v) => LEAVER.repurchase.labels[v],
  accelerationTerminationMonths: (v) =>
    `${v} months of acceleration if terminated`,
  severanceMonths: (v) => `${v} months of severance`,
}

export function IfItEnds({ read }) {
  const { leaver, inputs } = read
  if (!leaver) return null
  const hasOffer = leaver.basis === 'offer'
  const departures = [
    { key: 'resign', label: 'You resign' },
    { key: 'terminated', label: 'Terminated without cause' },
    { key: 'changeOfControl', label: 'Change of control' },
  ]

  const deviations = Object.entries(LEAVER.standard)
    .filter(([key, std]) => inputs[key] !== std)
    .map(([key]) => key)

  return (
    <div>
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <h2 id="results-if-it-ends" className="amw-kicker">
          If it ends
        </h2>
        <p className="text-xs text-zinc-500 dark:text-zinc-400">
          Percent of the company you keep, from the{' '}
          {hasOffer
            ? `offer of ${fmtPct(leaver.stake)}`
            : `range midpoint of ${fmtPct(leaver.stake)}`}
          {inputs.cliffMonths > 0 &&
            ` · ${inputs.cliffMonths}-month cliff, ${inputs.vestingYears}-year vest`}
        </p>
      </div>

      <div className="mt-6 overflow-x-auto">
        <table className="w-full min-w-[32rem] text-sm">
          <thead>
            <tr className="amw-kicker text-left">
              <th
                scope="col"
                className="border-[var(--amw-line)] border-b pb-2 pr-3 font-medium"
              >
                Leaving at
              </th>
              {departures.map((d) => (
                <th
                  key={d.key}
                  scope="col"
                  className="border-[var(--amw-line)] border-b pb-2 pr-3 text-right font-medium"
                >
                  {d.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            <tr className="bg-[var(--amw-muted)]">
              <td className="amw-kicker py-2.5 pr-3">
                Before month {inputs.cliffMonths}
              </td>
              {departures.map((d) => (
                <td
                  key={d.key}
                  className="amw-mono py-2.5 pr-3 text-right tabular-nums text-zinc-700 dark:text-zinc-300"
                >
                  {d.key === 'changeOfControl' &&
                  leaver.atCliff.changeOfControl === 1
                    ? fmtPct(leaver.stake)
                    : '0%'}
                </td>
              ))}
            </tr>
            {leaver.horizons.map((h) => (
              <tr key={h.months} className="border-[var(--amw-line)] border-b">
                <td className="py-2.5 pr-3 text-zinc-800 dark:text-zinc-200">
                  {h.months} months{' '}
                  <span className="text-xs text-zinc-500 dark:text-zinc-400">
                    ({Math.round(h.vested * 100)}% vested)
                  </span>
                </td>
                {departures.map((d) => {
                  const accelerated =
                    (d.key === 'terminated' && h.terminatedAccelerated) ||
                    (d.key === 'changeOfControl' && h.cocAccelerated)
                  return (
                    <td
                      key={d.key}
                      className="amw-mono py-2.5 pr-3 text-right tabular-nums text-zinc-900 dark:text-zinc-100"
                    >
                      {fmtPct(h[d.key])}
                      {accelerated && (
                        <span
                          className="text-[var(--amw-accent-ink)]"
                          title="Acceleration applied"
                        >
                          {' '}
                          ↑
                        </span>
                      )}
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <dl className="amw-mono mt-6 space-y-2 text-sm text-zinc-800 dark:text-zinc-200">
        <Row
          label="exercise after leaving"
          value={
            leaver.exercise.applies
              ? `${leaver.exercise.label}${
                  leaver.exercise.cost !== null
                    ? ` · ≈ ${fmtMoney(
                        leaver.exercise.cost
                      )} to exercise a year’s vesting`
                    : ''
                }`
              : leaver.exercise.label
          }
        />
        <Row
          label="repurchase of vested shares"
          value={leaver.repurchase.label}
        />
        <Row
          label="acceleration"
          value={`${leaver.acceleration.changeOfControlLabel} · ${inputs.accelerationTerminationMonths} mo if terminated without cause`}
        />
        <Row
          label="severance"
          value={
            inputs.severanceMonths > 0
              ? `${inputs.severanceMonths} months ≈ ${fmtMoney(
                  leaver.severance.dollars
                )} (${leaver.severance.basis} salary)`
              : 'none'
          }
        />
      </dl>

      {leaver.notes.length > 0 && (
        <ul className="mt-6 list-none space-y-1 p-0 text-sm text-zinc-700 dark:text-zinc-300">
          {leaver.notes.map((note) => (
            <li key={note} className="flex gap-2">
              <span className="text-[var(--amw-accent-ink)]" aria-hidden="true">
                ▸
              </span>
              {note}
            </li>
          ))}
        </ul>
      )}

      <p className="mt-6 text-xs text-zinc-500 dark:text-zinc-400">
        Market standard:{' '}
        <Cite id="carta_ptep">
          90-day exercise window ({LEAVER.exerciseWindow.prevalence})
        </Cite>
        , <Cite id="carta_accel">no acceleration</Cite> (
        {LEAVER.acceleration.prevalence.any}% of founder agreements at Series A+
        carry some; {LEAVER.acceleration.prevalence.double}% double trigger),{' '}
        <Cite id="cooley_leaver">no repurchase of vested shares</Cite>,{' '}
        <Cite id="sequoia_severance">no cash severance before Series C</Cite>.
        {deviations.length > 0 && (
          <>
            {' '}
            Your terms differ on:{' '}
            {deviations
              .map((key) =>
                STANDARD_LABELS[key] ? STANDARD_LABELS[key](inputs[key]) : key
              )
              .join(', ')}
            .
          </>
        )}
      </p>
    </div>
  )
}

function Row({ label, value }) {
  return (
    <div className="border-[var(--amw-line)] flex flex-wrap justify-between gap-x-4 gap-y-1 border-b border-dashed pb-2">
      <dt className="text-zinc-500 dark:text-zinc-400">{label}</dt>
      <dd className="m-0 text-right">{value}</dd>
    </div>
  )
}
