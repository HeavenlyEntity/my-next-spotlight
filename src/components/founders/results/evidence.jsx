'use client'

import { GapFigure } from '@/components/founders/gap-figure'
import { fmtMoney, fmtPts } from '@/components/founders/format'

/* Layer two: the gap figure at full width with the adjustments beside it
   as a two-row mono list. This is the proof for the sentence above it. */

export function Evidence({ read }) {
  const { offer, adjustments, inputs } = read
  const hasOffer = offer.pct !== null
  const gap = offer.gapPts
  const callout =
    hasOffer && offer.position === 'below' && gap
      ? `Gap: ${gap[0]}–${gap[1]} pts below`
      : hasOffer && offer.position === 'within'
      ? 'Inside the band.'
      : hasOffer && offer.position === 'above'
      ? 'Above the band.'
      : 'Enter the offer to see the gap.'

  const sharesPending = Boolean(offer.missingFullyDiluted)

  return (
    <section aria-labelledby="results-evidence">
      <h2 id="results-evidence" className="amw-kicker">
        Evidence
      </h2>
      <div className="mt-6 grid gap-8 md:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)] md:items-start">
        <GapFigure
          lo={offer.range.lo}
          hi={offer.range.hi}
          offer={hasOffer ? offer.pct : null}
          callout={sharesPending ? 'Offer: needs fully diluted count' : callout}
        />
        <dl className="amw-mono space-y-2 text-sm text-zinc-800 dark:text-zinc-200">
          <Row
            label="banked work"
            value={
              adjustments.banked.applied
                ? `≈ ${fmtMoney(adjustments.banked.dollars)} → ${fmtPts(
                    adjustments.banked.pts
                  )}`
                : 'n/a (salaried)'
            }
          />
          <Row
            label="salary"
            value={
              adjustments.salary.applied
                ? `${fmtMoney(Math.abs(adjustments.salary.gap))} ${
                    adjustments.salary.gap >= 0 ? 'below' : 'above'
                  } market → ${fmtPts(adjustments.salary.pts)}`
                : 'not entered'
            }
          />
          <Row
            label="terms"
            value={`${inputs.vestingYears}-yr vest · ${
              inputs.cliffMonths
            }-mo cliff · ${inputs.instrument ?? 'unsure'}`}
          />
        </dl>
      </div>
    </section>
  )
}

function Row({ label, value }) {
  return (
    <div className="border-[var(--amw-line)] flex flex-wrap justify-between gap-x-4 gap-y-1 border-b border-dashed pb-2">
      <dt className="text-zinc-500 dark:text-zinc-400">{label}</dt>
      <dd className="m-0 text-right tabular-nums">{value}</dd>
    </div>
  )
}
