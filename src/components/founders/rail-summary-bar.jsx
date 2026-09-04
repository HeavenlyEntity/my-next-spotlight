'use client'

import { useState } from 'react'
import { ChevronUp } from 'lucide-react'

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import { ResultsRail } from '@/components/founders/results-rail'
import { AnimateDigits } from '@/components/founders/animate-digits'
import { CLASS_LABELS, fmtPct } from '@/components/founders/format'

/* Below lg: a 56px bar pinned to the bottom (badge + range) that opens a
   non-modal bottom sheet with the full rail. No scrim, no focus trap,
   Escape closes; the form stays usable behind it. The wizard reserves
   bottom padding equal to the bar plus the safe-area inset. */

export const SUMMARY_BAR_HEIGHT = 56

export function RailSummaryBar({ read, step }) {
  const [open, setOpen] = useState(false)
  const { classification, band } = read
  const classLabel = classification.pending
    ? '?'
    : CLASS_LABELS[classification.class] ?? '?'

  return (
    <Sheet open={open} onOpenChange={setOpen} modal={false}>
      <SheetTrigger asChild>
        <button
          type="button"
          data-print="hide"
          className="amw border-[var(--amw-line)] bg-[var(--amw-card)] fixed inset-x-0 bottom-0 z-40 flex items-center justify-between gap-3 border-t px-5 text-left lg:hidden"
          style={{
            height: `calc(${SUMMARY_BAR_HEIGHT}px + env(safe-area-inset-bottom))`,
            paddingBottom: 'env(safe-area-inset-bottom)',
          }}
          aria-expanded={open}
        >
          <span className="flex items-center gap-3">
            <span className="amw-chip amw-chip--accent">{classLabel}</span>
            <span className="amw-mono text-sm tabular-nums text-zinc-700 dark:text-zinc-300">
              <AnimateDigits value={`${fmtPct(band.lo)}–${fmtPct(band.hi)}`} />
            </span>
          </span>
          <span className="amw-kicker flex items-center gap-1">
            Your read
            <ChevronUp
              className={`size-4 transition-transform ${
                open ? 'rotate-180' : ''
              }`}
              aria-hidden="true"
            />
          </span>
        </button>
      </SheetTrigger>
      <SheetContent
        side="bottom"
        overlay={false}
        showClose
        className="lg:hidden"
        style={{
          paddingBottom: `calc(${SUMMARY_BAR_HEIGHT}px + env(safe-area-inset-bottom))`,
        }}
        onInteractOutside={(event) => event.preventDefault()}
      >
        <SheetTitle className="sr-only">Your read so far</SheetTitle>
        <SheetDescription className="sr-only">
          What the calculator knows from your answers so far.
        </SheetDescription>
        <div className="p-2">
          <ResultsRail read={read} step={step} className="border-0 p-3" />
        </div>
      </SheetContent>
    </Sheet>
  )
}
