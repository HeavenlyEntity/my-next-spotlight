'use server'

import crypto from 'crypto'
import { redirect } from 'next/navigation'
import { getPayloadClient } from '@/lib/getPayloadClient'
import { createCheckoutSession } from '@/lib/commerce/creem'
import { onboardingPath } from '@/lib/commerce/onboardingLink'

const COLLECTION = {
  product: 'products',
  course: 'courses',
  service: 'services',
} as const

/* Returns instead of throwing for the two failures a buyer can act on: a
 * missing GitHub username, and an item that is not purchasable yet. Throwing
 * sent both to the Next error boundary, which costs the buyer the page they
 * were on and offers no way back -- for a mistake they could have fixed in
 * two seconds.
 *
 * Everything else still throws. A missing NEXT_PUBLIC_SITE_URL or a Creem
 * failure is not the buyer's to fix, and swallowing it into a polite message
 * would hide a fault that needs to be seen.
 *
 * `field` names the input to attach the message to, so the caller does not
 * have to infer placement from the copy.
 */
/* A 'use server' module may only export async functions, so the initial state
 * lives with the component that owns it. Exporting a plain object here threw
 * at runtime while still building clean, which made it look like a working
 * change until a real submit returned 500. Types are erased, so the type
 * export is fine. */
export type CheckoutState = {
  /* No `field` any more: the only correctable failure left is an item that is
     not purchasable, which belongs to the form rather than to an input. The
     GitHub username, the one field this ever pointed at, is collected after
     payment now. */
  error: { message: string } | null
}

export async function createCheckout(
  _prevState: CheckoutState,
  formData: FormData
): Promise<CheckoutState> {
  const itemType = String(formData.get('itemType') || '') as
    | 'product'
    | 'course'
    | 'service'
  const slug = String(formData.get('slug') || '')

  const collection = Object.prototype.hasOwnProperty.call(COLLECTION, itemType)
    ? COLLECTION[itemType]
    : undefined
  // Only reachable if the hidden inputs were stripped or tampered with, so
  // this is a fault rather than a buyer mistake.
  if (!collection || !slug) throw new Error('Invalid checkout request')

  const payload = await getPayloadClient()
  const { docs } = await payload.find({
    collection,
    where: { slug: { equals: slug }, status: { equals: 'published' } },
    depth: 0,
    limit: 1,
  })
  const item = docs[0]
  if (!item || !item.creemProductId) {
    return {
      error: {
        message:
          'This item is not on sale yet. Nothing has been charged. Check back shortly or get in touch.',
      },
    }
  }

  const site = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, '')
  if (!site) throw new Error('NEXT_PUBLIC_SITE_URL is not configured')

  /* The GitHub username is no longer collected here. It is asked for after
     payment, on a page that can take its time over it, which keeps the
     checkout to the fields Creem actually needs.
   *
   * That moves a problem though: the onboarding page has to know the visitor
     paid. The request id is the thread -- Creem echoes it back on the webhook
     as object.request_id, so signing it into the return URL lets the page
     match a real, paid purchase. See onboardingLink.ts for why the signature
     alone is not enough. */
  const requestId = crypto.randomUUID()
  const onboarding = onboardingPath(requestId)
  if (!onboarding) {
    // No signing secret means no way to prove the redirect later. Fail loudly
    // rather than sending someone to a page that cannot recognise them.
    throw new Error('ACCESS_LINK_SECRET is required to sign the return URL')
  }

  const { checkoutUrl } = await createCheckoutSession({
    productId: item.creemProductId,
    requestId,
    successUrl: `${site}${onboarding}`,
    metadata: { itemType, itemId: String(item.id), slug },
  })

  redirect(checkoutUrl) // external redirect to Creem's hosted page
}
