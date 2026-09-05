import Link from 'next/link'
import {
  ArrowLeftRight,
  BookOpen,
  CalendarClock,
  Percent,
  TrendingDown,
} from 'lucide-react'

import { DESK_HREF, TOOLS } from '@/lib/founders/tools'

/* The desk's identity line on every tool page: the mono eyebrow linking
   back to /founders, then the tool marks inline (live filled, soon
   dimmed). One line of chrome instead of a sidebar column. */

const ICONS = { Percent, TrendingDown, ArrowLeftRight, BookOpen, CalendarClock }

export function DeskEyebrow({ current, className = '' }) {
  return (
    <div className={`flex flex-wrap items-center gap-4 ${className}`}>
      <Link
        href={DESK_HREF}
        className="amw-eyebrow min-h-11 mb-0 inline-flex items-center no-underline"
      >
        AMWARE // Founders&rsquo; Desk
      </Link>
      <ul
        className="m-0 flex list-none items-center gap-1.5 p-0"
        aria-label="Desk tools"
      >
        {TOOLS.map((tool) => {
          const Icon = ICONS[tool.icon] ?? Percent
          const live = tool.status === 'live'
          const isCurrent = tool.id === current
          const mark = (
            <Icon className="size-4" strokeWidth={1.75} aria-hidden="true" />
          )
          /* Hit area 44, visible box 28. Growing the drawn square to 44 would
             turn a quiet identity row into a button bar; padding the anchor
             gets the touch target without the visual weight. */
          const hit = 'inline-flex h-11 w-11 items-center justify-center'
          const base =
            'inline-flex h-7 w-7 items-center justify-center rounded-md border transition-colors'
          return (
            <li key={tool.id}>
              {live && tool.href ? (
                <Link
                  href={tool.href}
                  title={tool.label}
                  aria-current={isCurrent ? 'page' : undefined}
                  className={`${hit} group no-underline`}
                >
                  <span
                    className={`${base} ${
                      isCurrent
                        ? 'border-[var(--amw-accent-ink)] bg-[var(--amw-accent-soft)] text-[var(--amw-accent-ink)]'
                        : 'border-[var(--amw-line)] group-hover:border-[var(--amw-accent-ink)] text-zinc-700 dark:text-zinc-300'
                    }`}
                  >
                    {mark}
                  </span>
                  <span className="sr-only">{tool.label}</span>
                </Link>
              ) : (
                <span
                  title={`${tool.label} (soon)`}
                  aria-disabled="true"
                  className={`${base} border-[var(--amw-line)] text-zinc-400 opacity-60 dark:text-zinc-500`}
                >
                  {mark}
                  <span className="sr-only">{tool.label}, coming soon</span>
                </span>
              )}
            </li>
          )
        })}
      </ul>
    </div>
  )
}
