import type { FieldHook } from 'payload'

/** Turn an arbitrary string into a URL-safe slug. */
export const formatSlug = (val: string): string =>
  val
    .replace(/ /g, '-')
    .replace(/[^\w-]+/g, '')
    .toLowerCase()

/**
 * Server-side safety net that runs on every write (admin, API, import, seed),
 * independent of the admin lock UI. It ALWAYS normalises a provided slug
 * through `formatSlug` — so even a manually-typed custom slug is lower-cased
 * and stripped to URL-safe characters on save. When the slug is left empty it
 * derives one from the `fallback` field (e.g. `title` or `name`).
 */
export const formatSlugHook =
  (fallback: string): FieldHook =>
  ({ data, operation, value }) => {
    if (typeof value === 'string' && value.length > 0) {
      return formatSlug(value)
    }

    if (operation === 'create' || !value) {
      const fallbackData = data?.[fallback]

      if (fallbackData && typeof fallbackData === 'string') {
        return formatSlug(fallbackData)
      }
    }

    return value
  }
