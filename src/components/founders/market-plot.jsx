'use client'

import { useId, useState } from 'react'
import { AlertTriangle, ChevronDown } from 'lucide-react'

import { ChipGroup } from '@/components/founders/chip-group'
import { fmtMoney } from '@/components/founders/format'
import { SOURCE_URL } from '@/lib/founders/equity/company-comp'

/*
 * Where the offer sits against named companies.
 *
 * ONE COMPONENT, FULLY DATA-DRIVEN. The IC and leadership ladders differ in
 * domain, row count and exclusions. A seat prop would grow a branch per row, so
 * the ladder is chosen inside company-comp.js and everything here reads what
 * buildPlot() returned (design review DD12).
 *
 * TAP, NEVER HOVER. Every row is a button that expands its own breakdown. Hover
 * does not exist on a phone, and detail behind hover is detail a phone user
 * cannot reach at all. Making it a disclosure fixes touch, keyboard and print in
 * one move (DD10).
 *
 * NO NEW COLOUR. DESIGN.md gives the desk one accent and lists where it may
 * appear. The staleness warning gets a mono kicker and a glyph rather than an
 * amber that would exist for one banner and then spread.
 */

const SEGMENT_CLASS = {
  cash: 'bg-zinc-700 dark:bg-zinc-300',
  liquid: 'bg-zinc-400 dark:bg-zinc-500',
  /* Hatched, because it has not happened yet. */
  modeled:
    'bg-[repeating-linear-gradient(135deg,var(--amw-line-strong)_0_4px,transparent_4px_8px)]',
}

function Badge({ liquidity }) {
  return (
    <span
      className="amw-kicker border-[var(--amw-line-strong)] shrink-0 rounded border px-1.5 py-0.5"
      title={liquidity.detail}
    >
      {liquidity.label}
    </span>
  )
}

function Row({ row, domain, isUser, open, onToggle, panelId }) {
  const pct = (n) => `${Math.min(100, (n / domain) * 100)}%`
  const overflows = row.total > domain

  return (
    <li
      className={`amw-plot-row border-[var(--amw-line)] border-b last:border-b-0 ${
        isUser ? 'bg-[var(--amw-accent-soft)]' : ''
      }`}
    >
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        aria-controls={panelId}
        className="min-h-11 hover:bg-[var(--amw-card-2)] grid w-full grid-cols-1 items-center gap-x-4 gap-y-2 px-4 py-3 text-left transition-colors md:grid-cols-[13rem_1fr_7rem_auto]"
      >
        <span className="flex items-center gap-2">
          <span
            className={`text-sm ${
              isUser
                ? 'text-[var(--amw-accent-ink)] font-semibold'
                : 'text-zinc-900 dark:text-zinc-100'
            }`}
          >
            {row.label}
          </span>
          {row.level && <span className="amw-kicker">{row.level}</span>}
        </span>

        {/* The bar. Full width under the label on a phone, its own column on a
            larger screen. Never squeezed into 200px with a $1.4M domain. */}
        <span className="bg-[var(--amw-card-2)] flex h-5 w-full items-center overflow-hidden rounded-sm">
          <span
            className={`h-full ${SEGMENT_CLASS.cash}`}
            style={{ width: pct(row.cash) }}
          />
          <span
            className={`h-full ${
              isUser ? SEGMENT_CLASS.modeled : SEGMENT_CLASS.liquid
            }`}
            style={{ width: pct(row.equity) }}
          />
          {overflows && (
            <span className="amw-kicker text-[var(--amw-accent-ink)] pl-1">
              ▸
            </span>
          )}
        </span>

        <span className="amw-price flex items-center gap-2 text-sm tabular-nums text-zinc-800 dark:text-zinc-200">
          {fmtMoney(row.total)}
          {row.confidence && row.confidence !== 'sourced' && (
            <span
              className="amw-kicker"
              title={`This row is ${row.confidence}`}
            >
              est.
            </span>
          )}
        </span>

        <span className="flex items-center gap-2">
          <Badge liquidity={row.liquidity} />
          <ChevronDown
            aria-hidden="true"
            className={`size-4 text-zinc-500 transition-transform ${
              open ? 'rotate-180' : ''
            }`}
          />
        </span>
      </button>

      {/* In the DOM but display:none when collapsed, so it is hidden from
          assistive tech and still prints. Hover is never the only path. */}
      <div
        id={panelId}
        className={`px-4 pb-4 ${open ? 'block' : 'hidden print:block'}`}
      >
        <dl className="m-0 grid grid-cols-2 gap-x-6 gap-y-1 sm:grid-cols-3">
          {row.breakdown.map((b) => (
            <div
              key={b.label}
              className="flex items-baseline justify-between gap-3"
            >
              <dt className="amw-kicker">{b.label}</dt>
              <dd className="amw-price m-0 text-sm tabular-nums text-zinc-800 dark:text-zinc-200">
                {fmtMoney(b.value)}
              </dd>
            </div>
          ))}
        </dl>
        {/* Only when the row has no note of its own; Netflix already explains
            itself and saying it twice reads as a bug. */}
        {row.allCash && !isUser && !row.note && (
          <p className="mt-3 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
            No stock line: this package is all cash.
          </p>
        )}
        {row.note && (
          <p className="mt-3 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
            {row.note}
          </p>
        )}
        <p className="mt-3 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
          {row.liquidity.detail}
        </p>
      </div>
    </li>
  )
}

export function MarketPlot({ plot, onScenarioChange }) {
  const baseId = useId()
  const [openId, setOpenId] = useState(null)

  if (!plot) return null

  if (plot.withheld) {
    return (
      <section className="border-[var(--amw-line)] mt-12 rounded-2xl border p-6">
        <h3 className="amw-kicker">Against the market</h3>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-zinc-700 dark:text-zinc-300">
          {plot.reason}
        </p>
      </section>
    )
  }

  const rows = [...plot.rows, plot.user]
  const toggle = (id) => setOpenId((current) => (current === id ? null : id))

  return (
    <section className="mt-12" aria-labelledby={`${baseId}-title`}>
      <h3
        id={`${baseId}-title`}
        className="text-xl font-medium tracking-tight text-zinc-900 dark:text-zinc-100 md:text-2xl"
      >
        Against the market
      </h3>

      {/* The thesis, before the bars. Without it the honest reading of this
          chart is "you are underpaid", which is true and useless. */}
      <p className="mt-3 max-w-3xl text-base leading-relaxed text-zinc-700 dark:text-zinc-300">
        {plot.thesis}
      </p>
      <p className="amw-kicker mt-3">{plot.axisLabel}</p>

      {/* The control sits above the thing it drives. The $0 outcome is the most
          useful thing here and cannot live below the fold of its own chart. */}
      {plot.scenarios.length > 0 && (
        <div className="mt-6">
          <ChipGroup
            label="If the company ends up worth"
            variant="segmented"
            options={plot.scenarios.map((s) => ({ id: s.id, label: s.label }))}
            value={plot.scenarioId}
            onChange={(id) => onScenarioChange?.(id)}
          />
        </div>
      )}

      {plot.stale && (
        <p className="amw-kicker mt-6 flex items-center gap-2 text-zinc-500">
          <AlertTriangle aria-hidden="true" className="size-3.5" />
          These figures were retrieved {plot.asOf} and are due a refresh.
        </p>
      )}

      <ul className="border-[var(--amw-line)] mt-6 list-none overflow-hidden rounded-2xl border p-0">
        {rows.map((row) => (
          <Row
            key={row.id + row.kind}
            row={row}
            domain={plot.domain}
            isUser={row.kind === 'user'}
            open={openId === row.id + row.kind}
            onToggle={() => toggle(row.id + row.kind)}
            panelId={`${baseId}-${row.kind}-${row.id}`}
          />
        ))}
      </ul>

      <p className="amw-kicker mt-4">
        Market reference · {plot.marketReference.label} ·{' '}
        {fmtMoney(plot.marketReference.total)}
      </p>

      <div className="mt-6 flex flex-wrap gap-x-6 gap-y-2">
        {Object.values(plot.segments).map((s) => (
          <span key={s.id} className="amw-kicker flex items-center gap-2">
            <span className={`h-2.5 w-5 rounded-sm ${SEGMENT_CLASS[s.id]}`} />
            {s.label}
          </span>
        ))}
      </div>

      <p className="amw-kicker mt-6 leading-relaxed">
        {plot.caveats.join(' ')} Figures from{' '}
        <a
          href={SOURCE_URL}
          target="_blank"
          rel="noreferrer"
          className="underline decoration-dotted underline-offset-2"
        >
          {plot.source}
        </a>
        , rolling window, retrieved {plot.asOf}.
      </p>
    </section>
  )
}
