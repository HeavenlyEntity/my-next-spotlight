import crypto from 'crypto'

/*
 * The link Creem redirects a buyer to after payment.
 *
 * The hard part of moving the GitHub username after the sale is proving, on
 * the page that collects it, that the visitor actually bought something. Get
 * that wrong and /checkout/onboarding?order=123 hands a stranger a $999 kit.
 *
 * Creem does not document what it appends to a success_url, or any signature
 * over it, so none of that can be trusted or even relied upon to exist. What
 * we do control is the success_url itself, and the `request_id` we mint when
 * creating the checkout -- which Creem echoes back on the webhook as
 * `object.request_id`. So the URL carries that id and an HMAC of it, and the
 * webhook stores the id on the purchase. The page then needs all three to
 * agree.
 *
 * Two properties matter:
 *
 * The signature proves WE minted the link. A random id alone would be
 * unguessable but forgeable by anyone who learns the format; the HMAC means a
 * made-up id is rejected without a database lookup.
 *
 * The signature alone is not enough, because this link is minted BEFORE
 * payment -- someone could start a checkout, keep the URL and abandon the
 * payment. So the page also requires a paid purchase carrying that request id,
 * which only the webhook creates. Signed but unpaid gets told the payment has
 * not arrived, never the kit.
 *
 * It is still a bearer link, like the access links this codebase already
 * emails. That is the accepted trade here: no account to create, and the
 * holder of the link is the person who just paid for it.
 */

/* Same secret as the access links and for the same reason: it signs a
 * capability of ours, not a credential from anyone else. Read at call time so
 * a serverless runtime that populates the environment late still works. */
const secret = () =>
  process.env.ACCESS_LINK_SECRET || process.env.ACCESS_TOKEN_SECRET || ''

const b64url = (input: Buffer) =>
  input
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '')

function sign(requestId: string): string {
  return b64url(
    crypto.createHmac('sha256', secret()).update(requestId).digest()
  )
}

/** Returns null when nothing can be signed, so the caller can fall back. */
export function onboardingSignature(requestId: string): string | null {
  if (!secret() || !requestId) return null
  return sign(requestId)
}

/**
 * The path a buyer lands on after paying. Relative, so the caller decides the
 * origin -- the webhook and the checkout action build it from different
 * places and must not disagree about the host.
 */
export function onboardingPath(requestId: string): string | null {
  const s = onboardingSignature(requestId)
  if (!s) return null
  return `/checkout/onboarding?r=${encodeURIComponent(requestId)}&s=${s}`
}

/** Constant-time, and false rather than throwing on anything malformed. */
export function verifyOnboardingLink(
  requestId: string | null | undefined,
  signature: string | null | undefined
): boolean {
  if (!requestId || !signature || !secret()) return false
  const expected = sign(requestId)
  const a = Buffer.from(signature)
  const b = Buffer.from(expected)
  return a.length === b.length && crypto.timingSafeEqual(a, b)
}
