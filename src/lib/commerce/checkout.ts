'use server'

import crypto from 'crypto'
import { redirect } from 'next/navigation'
import { getPayloadClient } from '@/lib/getPayloadClient'
import { createCheckoutSession } from '@/lib/commerce/creem'
import {
  checkGithubUsername,
  usernameMessage,
} from '@/lib/commerce/githubUsername'

/* Returns true if the account exists, false if GitHub says it does not, and
 * null when we could not find out. Only an explicit 404 is treated as absent.
 *
 * A token is optional but wanted: unauthenticated GitHub allows 60 requests an
 * hour per IP, and every checkout here shares the server's single IP, so
 * without one this degrades to null under load rather than failing loudly.
 */
async function githubAccountExists(login: string): Promise<boolean | null> {
  const token = process.env.GITHUB_TOKEN
  try {
    const res = await fetch(
      `https://api.github.com/users/${encodeURIComponent(login)}`,
      {
        headers: {
          Accept: 'application/vnd.github+json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        signal: AbortSignal.timeout(4000),
      }
    )
    if (res.status === 404) return false
    if (!res.ok) return null
    return true
  } catch {
    return null
  }
}

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
  error: { field: 'githubUsername' | null; message: string } | null
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
  const githubUsername = String(formData.get('githubUsername') || '').trim()

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
        field: null,
        message:
          'This item is not on sale yet. Nothing has been charged — check back shortly or get in touch.',
      },
    }
  }

  if (itemType === 'product' && item.type === 'boilerplate') {
    const problem = checkGithubUsername(githubUsername)
    if (problem) {
      return {
        error: { field: 'githubUsername', message: usernameMessage(problem)! },
      }
    }

    /* The browser already checked this account exists, but a client check is
       advice, not a guarantee -- the form can be submitted without ever
       running it. Re-checking here is what actually stops a repository
       invitation being addressed to nobody.

       It fails open on purpose. A 404 is GitHub telling us the account is not
       there, which is worth blocking a sale for. A timeout, a rate limit or an
       outage tells us nothing about the username, and refusing someone's money
       over our own dependency being down would be the worse error. */
    const exists = await githubAccountExists(githubUsername)
    if (exists === false) {
      return {
        error: {
          field: 'githubUsername',
          message: `GitHub has no account called "${githubUsername}". Check the spelling — this is where repository access will be sent.`,
        },
      }
    }
  }

  const site = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, '')
  if (!site) throw new Error('NEXT_PUBLIC_SITE_URL is not configured')
  const { checkoutUrl } = await createCheckoutSession({
    productId: item.creemProductId,
    requestId: crypto.randomUUID(),
    successUrl: `${site}/checkout/success`,
    metadata: {
      itemType,
      itemId: String(item.id),
      slug,
      ...(githubUsername ? { githubUsername } : {}),
    },
  })

  redirect(checkoutUrl) // external redirect to Creem's hosted page
}
