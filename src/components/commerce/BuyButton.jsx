'use client'

import { useActionState, useEffect, useRef } from 'react'
import { createCheckout } from '@/lib/commerce/checkout'
import { WHOP_EVENT, whopTrack } from '@/lib/analytics/whop'

/* The checkout form is now only the hidden item fields and the button. The
   GitHub username moved to the onboarding page the buyer lands on after
   paying -- a checkout that asks for a username before it asks for a card is
   a field between someone and a purchase they have already decided on.

   A form-level error still renders here. createCheckout returns instead of
   throwing for the one failure a buyer can act on -- an item that is not
   purchasable yet -- because throwing sent them to the Next error boundary
   and cost them the page they were on. */

export function BuyButton({ itemType, slug, label = 'Buy now', price, name }) {
  // Defined here, not imported: a 'use server' module cannot export a value.
  const [state, formAction, isPending] = useActionState(createCheckout, {
    error: null,
  })

  const formError = state.error?.message ?? null
  const errorRef = useRef(null)

  /* Focus the message rather than leaving it announced but unreached: it is
     the only thing that changed on the page, and it is below the button the
     buyer just pressed. */
  useEffect(() => {
    if (formError) errorRef.current?.focus()
  }, [formError])

  /* The last thing that happens on this site before Creem's page. onSubmit
     runs before the server action, and the pixel sends with keepalive, so
     the event survives the redirect. No event id: each press is an attempt,
     and Whop should see how many attempts a sale takes. */
  const reportCheckout = () =>
    whopTrack(WHOP_EVENT.beginCheckout, {
      value: typeof price === 'number' ? price : undefined,
      currency: 'USD',
      content_type: itemType,
      content_id: slug,
      content_name: name,
    })

  return (
    <form action={formAction} onSubmit={reportCheckout} className="mt-8">
      <input type="hidden" name="itemType" value={itemType} />
      <input type="hidden" name="slug" value={slug} />

      {formError && (
        <p
          ref={errorRef}
          tabIndex={-1}
          role="alert"
          className="mb-3 text-sm text-red-700 outline-hidden dark:text-red-400"
        >
          {formError}
        </p>
      )}

      <button type="submit" className="amw-cta" disabled={isPending}>
        {isPending ? 'Redirecting…' : label}
      </button>
    </form>
  )
}
