'use client'

import { fmtMoney, fmtPct, fmtPts } from '@/components/founders/format'

/* Always mounted (toggled with hidden/print:block) so the print sheet
   carries it expanded. Shows the band source, the adjustment math with
   caps, the dilution medians applied on the selected path, and the two
   editable assumptions: rounds before exit and the three exit valuations
   for that path. Edits flow back through onOverride; the engine clamps. */

const SCENARIO_IDS = ['conservative', 'base', 'upside']

const inputClass =
  'border-[var(--amw-line-strong)] bg-[var(--amw-card)] focus:border-[var(--amw-accent)] focus:ring-[var(--amw-accent)]/20 amw-mono rounded-md border px-2 py-1 text-sm tabular-nums focus:outline-none focus:ring-4'

export function ShowTheMath({ read, path, open, overrides, onOverride }) {
  const { band, adjustments, rounds, dilution, inputs } = read
  const applied = rounds[path] ?? []
  const roundsValue = inputs.roundsBeforeExit?.[path]
  const defaultRounds = dilution?.defaults?.[path]

  return (
    <section
      id="show-the-math"
      aria-labelledby="show-the-math-title"
      className={`border-[var(--amw-line)] mt-6 border-t pt-6 ${
        open ? '' : 'hidden'
      } print:block`}
    >
      <h3 id="show-the-math-title" className="amw-kicker">
        The math
      </h3>
      <dl className="amw-mono mt-4 grid gap-x-8 gap-y-2 text-sm text-zinc-800 dark:text-zinc-200 md:grid-cols-2">
        <Row
          label="band"
          value={`${fmtPct(band.lo)}–${fmtPct(band.hi)} · ${band.source} (${
            band.asOf
          }, ${band.confidence})`}
        />
        <Row
          label="adjustments"
          value={`banked ${fmtPts(
            adjustments.banked.pts
          )} (cap +5) · salary ${fmtPts(
            adjustments.salary.pts
          )} (−2 to +4) · total ${fmtPts(adjustments.total)} (cap +7)`}
        />
        <Row
          label={`dilution applied (${path})`}
          value={
            applied.length
              ? applied
                  .map(
                    (r) => `${r.label ?? r.round} −${Math.round(r.d * 100)}%`
                  )
                  .join(' · ')
              : 'none on this path'
          }
        />
        <Row
          label={`rounds before exit (${path})`}
          value={
            <input
              type="number"
              min={0}
              max={6}
              value={roundsValue ?? ''}
              placeholder={
                defaultRounds !== undefined ? String(defaultRounds) : 'default'
              }
              onChange={(event) =>
                onOverride('roundsBeforeExit', {
                  path,
                  value:
                    event.target.value === ''
                      ? null
                      : Number(event.target.value),
                })
              }
              aria-label={`Rounds before exit on the ${path} path`}
              className={`${inputClass} w-20`}
            />
          }
          hint={inputs.clamped?.[`roundsBeforeExit.${path}`] ? 'capped' : null}
        />
        {SCENARIO_IDS.map((id) => {
          const card = read.scenarios[path]?.find((c) => c.id === id)
          const override = overrides.valuations?.[path]?.[id]
          return (
            <Row
              key={id}
              label={`${id} exit (${path})`}
              value={
                <input
                  type="number"
                  min={0}
                  step={1000000}
                  value={override ?? card?.valuation ?? ''}
                  onChange={(event) =>
                    onOverride('valuation', {
                      path,
                      id,
                      value:
                        event.target.value === ''
                          ? null
                          : Number(event.target.value),
                    })
                  }
                  aria-label={`${id} exit valuation on the ${path} path`}
                  className={`${inputClass} w-36`}
                />
              }
              hint={card ? fmtMoney(card.valuation) : null}
            />
          )
        })}
      </dl>
    </section>
  )
}

function Row({ label, value, hint }) {
  return (
    <div className="border-[var(--amw-line)] flex flex-wrap items-center justify-between gap-x-4 gap-y-1 border-b border-dashed pb-2">
      <dt className="text-zinc-500 dark:text-zinc-400">{label}</dt>
      <dd className="m-0 flex items-center gap-2 text-right">
        {value}
        {hint && (
          <span className="text-zinc-500 dark:text-zinc-400">{hint}</span>
        )}
      </dd>
    </div>
  )
}
