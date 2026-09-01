import type { CheckboxField, TextField } from 'payload'

import { formatSlugHook } from './formatSlug'

type Overrides = {
  slugOverrides?: Partial<TextField>
  checkboxOverrides?: Partial<CheckboxField>
}

type Slug = (
  fieldToUse?: string,
  overrides?: Overrides
) => [TextField, CheckboxField]

/**
 * Returns a `slug` text field paired with a hidden `slugLock` checkbox.
 *
 * The slug auto-fills (live, in the admin) from `fieldToUse` — `title` by
 * default — while it stays "locked". Click "Unlock" in the admin to stop the
 * auto-sync and type a custom slug. A `beforeValidate` hook keeps slugs
 * correct for non-UI writes (API, seeds, imports).
 *
 * @example
 * fields: [
 *   { name: 'title', type: 'text', required: true },
 *   ...slugField('title', { slugOverrides: { required: true, unique: true } }),
 * ]
 */
export const slugField: Slug = (fieldToUse = 'title', overrides = {}) => {
  const { slugOverrides, checkboxOverrides } = overrides

  const checkBoxField: CheckboxField = {
    name: 'slugLock',
    type: 'checkbox',
    defaultValue: true,
    admin: {
      hidden: true,
      position: 'sidebar',
    },
    ...checkboxOverrides,
  }

  // @ts-expect-error - Partial<TextField> admin merge widens the type
  const slug: TextField = {
    // Caller overrides first; the keys below are authoritative and cannot be
    // clobbered (the slug must keep its name/type/index, hook, and Field).
    ...(slugOverrides || {}),
    name: 'slug',
    type: 'text',
    index: true,
    label: slugOverrides?.label ?? 'Slug',
    hooks: {
      beforeValidate: [formatSlugHook(fieldToUse)],
    },
    admin: {
      ...(slugOverrides?.admin || {}),
      components: {
        Field: {
          path: '@/fields/slug/SlugComponent#SlugComponent',
          clientProps: {
            fieldToUse,
            checkboxFieldPath: checkBoxField.name,
          },
        },
      },
    },
  }

  return [slug, checkBoxField]
}
