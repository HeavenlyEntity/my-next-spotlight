import React from 'react'
import {
  IconApi,
  IconBrandNextjs,
  IconBrandReact,
  IconBrandTailwind,
  IconBrandTypescript,
  IconBrandVercel,
  IconCode,
  IconComponents,
  IconDatabase,
  IconPackageExport,
  IconShieldLock,
  IconTestPipe,
} from '@tabler/icons-react'

/*
 * The tech stack, with marks.
 *
 * Tabler because the project already depends on it, so this adds no bundle
 * and no second icon family. It is also the rare library that carries both
 * real brand marks and neutral glyphs, which matters here: Next.js and
 * Postgres have logos, SuiteScript and SDF have none and never will. A
 * brand-logo-only approach leaves holes in the middle of a row.
 *
 * Matched on keywords, not exact strings. These values are typed into a CMS
 * field: "Next.js" becomes "Next.js 16" the first time someone updates a
 * kit, and an equality map would quietly fall back to a generic glyph with
 * nobody the wiser. Longest pattern wins so "react" cannot claim
 * "react-native" or "TanStack React Query".
 */

const MARKS = [
  ['next.js', IconBrandNextjs],
  ['nextjs', IconBrandNextjs],
  ['react', IconBrandReact],
  ['typescript', IconBrandTypescript],
  ['tailwind', IconBrandTailwind],
  ['vercel', IconBrandVercel],
  ['postgres', IconDatabase],
  ['shadcn', IconComponents],
  ['tanstack', IconApi],
  ['playwright', IconTestPipe],
  ['vitest', IconTestPipe],
  ['better auth', IconShieldLock],
  ['auth', IconShieldLock],
  ['suitescript', IconCode],
  ['sdf', IconPackageExport],
]

/** Neutral rather than wrong: an unknown technology is still code. */
const FALLBACK = IconCode

export function stackIcon(tech) {
  const name = String(tech || '').toLowerCase()
  let best = null
  for (const [pattern, Icon] of MARKS) {
    if (!name.includes(pattern)) continue
    if (!best || pattern.length > best[0].length) best = [pattern, Icon]
  }
  return best ? best[1] : FALLBACK
}

/*
 * Chips wrap rather than truncate. The datasheet row used to print the first
 * three of eight with no ellipsis and no count, so a kit looked like it had a
 * three-item stack -- the buyer had no way to know five were missing.
 */
/**
 * Typed through JSDoc because this is a .jsx file consumed by a .tsx page:
 * without it TypeScript infers the `[]` default as `never[]` and rejects
 * every real array passed in.
 *
 * @param {{
 *   stack?: (string | { tech?: string | null } | null)[],
 *   className?: string,
 * }} props
 */
export function StackChips({ stack = [], className = '' }) {
  const items = stack
    .map((s) => (typeof s === 'string' ? s : s?.tech))
    .filter(Boolean)
  if (items.length === 0) return null

  return (
    <ul className={`flex flex-wrap gap-2 ${className}`}>
      {items.map((tech) => {
        const Icon = stackIcon(tech)
        return (
          <li key={tech} className="amw-chip">
            {/* Decorative: the name is right there in the chip, so the mark
                must not be read out a second time. */}
            <Icon
              size={14}
              stroke={1.6}
              aria-hidden="true"
              className="text-[var(--amw-accent-ink)] shrink-0"
            />
            {tech}
          </li>
        )
      })}
    </ul>
  )
}
