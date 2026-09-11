'use client'

import { useActionState, useCallback, useEffect, useRef, useState } from 'react'
import { createCheckout } from '@/lib/commerce/checkout'
import { Button } from '@/components/Button'
import { GithubAccountField } from '@/components/commerce/GithubAccountField'

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
  /* Set by the field once it has shown a real account the buyer has not yet
     confirmed. Only that state gates the button -- an unreachable GitHub must
     not stop someone paying. */
  const [gated, setGatedState] = useState(false)
  const setGated = useCallback((next) => setGatedState(next), [])

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
        <GithubAccountField
          serverError={fieldError}
          inputRef={usernameRef}
          onGateChange={setGated}
        />
      )}

      {formError && (
        <p role="alert" className="mb-3 text-sm text-red-700 dark:text-red-400">
          {formError}
        </p>
      )}

      <Button
        type="submit"
        disabled={isPending || gated}
        className="disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isPending ? 'Redirecting…' : gated ? 'Confirm your account' : label}
      </Button>
    </form>
  )
}
