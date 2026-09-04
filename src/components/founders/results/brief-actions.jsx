'use client'

import { trackPrinted } from '@/components/founders/analytics'
import { useClipboard } from '@/components/founders/use-clipboard'

/* Quiet utilities under the consequences: Print, Copy brief, Show the
   math. Copy shows "Copied" for two seconds; when the clipboard is
   unavailable (denied or insecure context) a visible textarea with the
   brief selected appears instead of a dead button. */

export function BriefActions({ text, mathOpen, onToggleMath }) {
  const { state, areaRef, copy } = useClipboard()

  function print() {
    trackPrinted()
    window.print()
  }

  const link =
    'text-sm text-zinc-700 underline-offset-4 hover:text-[var(--amw-accent-ink)] hover:underline dark:text-zinc-300'

  return (
    <div data-print="hide">
      <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
        <button type="button" onClick={print} className={link}>
          Print
        </button>
        <button
          type="button"
          onClick={() => copy(text)}
          className={link}
          aria-live="polite"
        >
          {state === 'copied' ? 'Copied' : 'Copy brief'}
        </button>
        <button
          type="button"
          onClick={onToggleMath}
          aria-expanded={mathOpen}
          aria-controls="show-the-math"
          className={link}
        >
          {mathOpen ? 'Hide the math' : 'Show the math'}
        </button>
      </div>
      {state === 'fallback' && (
        <div className="mt-4">
          <label
            htmlFor="brief-fallback"
            className="text-xs text-zinc-500 dark:text-zinc-400"
          >
            Your browser blocked the clipboard. Select all and copy:
          </label>
          <textarea
            id="brief-fallback"
            ref={areaRef}
            readOnly
            value={text}
            rows={8}
            className="border-[var(--amw-line-strong)] bg-[var(--amw-card)] amw-mono mt-2 w-full rounded-md border p-3 text-xs"
          />
        </div>
      )}
    </div>
  )
}
