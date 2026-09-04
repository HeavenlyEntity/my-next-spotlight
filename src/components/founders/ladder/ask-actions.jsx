'use client'

import { Check, Copy } from 'lucide-react'

import { trackPrinted } from '@/components/founders/analytics'
import { useClipboard } from '@/components/founders/use-clipboard'
import { askForClipboard } from '@/lib/founders/handoff'
import { GEO_OPTIONS, INDUSTRY_OPTIONS } from '@/lib/founders/offer-steps'

/*
 * What the reader does next.
 *
 * THE HARD REJECTION THIS ANSWERS (design pass 3). Everything above this is
 * evidence: a headline at display scale, three rungs, a trade, a floor note.
 * Without a way to act on it the page ends as a report about someone's own
 * offer, which they then have to translate into their own words while anxious.
 * "Copy the ask" is the primary action for that reason, and it is the only
 * accent-filled control on the results screen (DESIGN.md budgets teal for the
 * primary CTA; the ladder's target rung earns its weight from scale instead).
 *
 * IT COPIES SENTENCES, NOT A TABLE. See `askForClipboard`. Numbers alone are a
 * demand; the reasons and their sources are what make it an ask.
 *
 * PRINT IS THE LONG FORM. The screen's collapsed plot rows are `print:block`,
 * so the printed sheet carries the ladder, the whole company list and the
 * citations. Copy is for a reply, print is for a meeting.
 */

export function AskActions({ ask, onEdit, onClear }) {
  const { state, areaRef, copy } = useClipboard()

  const text = askForClipboard(ask, {
    industryOptions: INDUSTRY_OPTIONS,
    geoOptions: GEO_OPTIONS,
  })

  const secondary =
    'border-[var(--amw-line-strong)] bg-[var(--amw-card)] min-h-11 hover:border-[var(--amw-accent-ink)] inline-flex items-center rounded-md border px-4 text-sm font-medium text-zinc-800 transition-colors dark:text-zinc-200'
  const quiet =
    'hover:text-[var(--amw-accent-ink)] text-sm text-zinc-600 underline underline-offset-4 transition-colors dark:text-zinc-400'

  return (
    <div className="mt-10" data-print="hide">
      <div className="flex flex-wrap items-center gap-4">
        {text && (
          <button
            type="button"
            onClick={() => copy(text)}
            className="bg-[var(--amw-accent)] text-zinc-950 min-h-11 group inline-flex w-full items-center justify-center gap-3 rounded-md px-5 font-medium transition-all duration-500 ease-out hover:rounded-[50px] sm:w-auto"
          >
            {/* aria-live on the label, so a screen reader hears the
                confirmation instead of only seeing it. */}
            <span aria-live="polite">
              {state === 'copied' ? 'Copied' : 'Copy the ask'}
            </span>
            {state === 'copied' ? (
              <Check aria-hidden="true" className="size-4" />
            ) : (
              <Copy aria-hidden="true" className="size-4" />
            )}
          </button>
        )}

        <button type="button" onClick={onEdit} className={secondary}>
          Edit answers
        </button>

        <button
          type="button"
          onClick={() => {
            trackPrinted()
            window.print()
          }}
          className={quiet}
        >
          Print
        </button>

        <button type="button" onClick={onClear} className={quiet}>
          Clear my answers
        </button>
      </div>

      {state === 'fallback' && (
        <div className="mt-4">
          <label
            htmlFor="ask-fallback"
            className="text-xs text-zinc-500 dark:text-zinc-400"
          >
            Your browser blocked the clipboard. Select all and copy:
          </label>
          <textarea
            id="ask-fallback"
            ref={areaRef}
            readOnly
            value={text}
            rows={10}
            className="border-[var(--amw-line-strong)] bg-[var(--amw-card)] amw-mono mt-2 w-full rounded-md border p-3 text-xs"
          />
        </div>
      )}
    </div>
  )
}
