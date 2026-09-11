'use client'

import { useActionState, useEffect, useId, useRef } from 'react'
import { createCheckout } from '@/lib/commerce/checkout'
import { Button } from '@/components/Button'

/* The action used to throw on a missing GitHub username, which sent the buyer
   to the Next error boundary: a generic page, their input gone, no way back,
   for a mistake they could have fixed in two seconds. It now returns the
   message and this renders it where it belongs.

   Two error positions, because they are different problems. A field error sits
   under its input and is wired to it with aria-describedby, so a screen reader
   reaches the message while on the field. A form error has no field to attach
   to, so it sits above the button. Both announce through role="alert", and
   focus moves to the offending field, which is what lets a keyboard user
   correct it without hunting. */

export function BuyButton({
  itemType,
  slug,
  isBoilerplate = false,
  label = 'Buy now',
}) {
  // Defined here, not imported: a 'use server' module cannot export a value.
  const [state, formAction, isPending] = useActionState(createCheckout, {
    error: null,
  })
  const usernameRef = useRef(null)
  const fieldId = useId()
  const errorId = `${fieldId}-error`

  const fieldError =
    state.error?.field === 'githubUsername' ? state.error.message : null
  const formError =
    state.error && !state.error.field ? state.error.message : null

  useEffect(() => {
    if (fieldError) usernameRef.current?.focus()
  }, [fieldError])

  return (
    <form action={formAction} className="mt-8">
      <input type="hidden" name="itemType" value={itemType} />
      <input type="hidden" name="slug" value={slug} />

      {isBoilerplate && (
        <div className="mb-3">
          <label
            htmlFor={fieldId}
            className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300"
          >
            GitHub username (for repo access)
          </label>
          <input
            ref={usernameRef}
            id={fieldId}
            type="text"
            name="githubUsername"
            required
            autoComplete="username"
            placeholder="your-github-username"
            aria-invalid={fieldError ? 'true' : undefined}
            aria-describedby={fieldError ? errorId : undefined}
            className={`w-full rounded-md border bg-white px-3 py-2 text-sm text-zinc-800 shadow-sm focus:outline-hidden focus:ring-4 dark:bg-zinc-700/[0.15] dark:text-zinc-200 ${
              fieldError
                ? 'border-red-600 focus:border-red-600 focus:ring-red-600/10 dark:border-red-500'
                : 'border-zinc-900/10 focus:border-teal-500 focus:ring-teal-500/10 dark:border-zinc-700'
            }`}
          />
          {fieldError && (
            /* Text, not just the red border: colour alone carries nothing to
               anyone who cannot see it. */
            <p
              id={errorId}
              role="alert"
              className="mt-2 text-sm text-red-700 dark:text-red-400"
            >
              {fieldError}
            </p>
          )}
        </div>
      )}

      {formError && (
        <p role="alert" className="mb-3 text-sm text-red-700 dark:text-red-400">
          {formError}
        </p>
      )}

      <Button
        type="submit"
        disabled={isPending}
        className="disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isPending ? 'Redirecting…' : label}
      </Button>
    </form>
  )
}
