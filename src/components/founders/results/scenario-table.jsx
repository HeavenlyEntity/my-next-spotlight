'use client'

import { fmtMoney, fmtPct } from '@/components/founders/format'
import CountUp from '@/components/react-bits/count-up'

/* Exit scenarios as a four-row table for the selected path; the $0 row
   comes first with kicker emphasis. Below it the "Ask sanity" line
   compares the same offered percent under acquisition and IPO. */

export function ScenarioTable({ read, path }) {
  const cards = read.scenarios[path] ?? []
  const hasOffer = read.offer.pct !== null
  const stakeAtExit = (p) => {
    const rounds = read.rounds[p] ?? []
    const last = rounds[rounds.length - 1]
    if (!last)
      return hasOffer
        ? read.offer.pct
        : (read.offer.range.lo + read.offer.range.hi) / 2
    return hasOffer && last.stakeOffer !== null
      ? last.stakeOffer
      : last.stakeMid
  }

  return (
    <div>
      <table className="w-full text-sm">
        <thead>
          <tr className="amw-kicker text-left">
            <th
              scope="col"
              className="border-[var(--amw-line)] border-b pb-2 pr-3 font-medium"
            >
              Outcome
            </th>
            <th
              scope="col"
              className="border-[var(--amw-line)] border-b pb-2 pr-3 font-medium"
            >
              Exit value
            </th>
            <th
              scope="col"
              className="border-[var(--amw-line)] border-b pb-2 text-right font-medium"
            >
              Your stake
            </th>
          </tr>
        </thead>
        <tbody>
          {cards.map((card) => {
            const zero = card.id === 'zero'
            return (
              <tr
                key={card.id}
                className={
                  zero
                    ? 'bg-[var(--amw-muted)]'
                    : 'border-[var(--amw-line)] border-b'
                }
              >
                <td
                  className={`py-2.5 pr-3 ${
                    zero ? 'amw-kicker' : 'text-zinc-800 dark:text-zinc-200'
                  }`}
                >
                  {card.label}
                </td>
                <td className="amw-mono py-2.5 pr-3 tabular-nums text-zinc-700 dark:text-zinc-300">
                  {zero ? '—' : fmtMoney(card.valuation)}
                </td>
                <td className="amw-mono py-2.5 text-right tabular-nums text-zinc-900 dark:text-zinc-100">
                  {zero ? (
                    fmtMoney(card.value)
                  ) : (
                    <CountUp
                      key={`${path}-${card.id}-${card.value}`}
                      to={card.value}
                      duration={0.9}
                      format={fmtMoney}
                    />
                  )}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
      <p className="mt-3 text-xs text-zinc-500 dark:text-zinc-400">
        Stake at exit {fmtPct(stakeAtExit(path))}.
        {hasOffer && read.askSanity && (
          <>
            {' '}
            Ask sanity: {fmtPct(read.offer.pct)} under acquisition ≈{' '}
            {fmtMoney(read.askSanity.acquisition)} base · under IPO ≈{' '}
            {fmtMoney(read.askSanity.ipo)} base.
          </>
        )}{' '}
        Assumes fully vested, no liquidation preferences, no tax.
      </p>
    </div>
  )
}
