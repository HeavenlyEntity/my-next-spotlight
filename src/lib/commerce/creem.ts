import crypto from 'crypto'

const API_URL = (() => {
  const u = new URL(process.env.CREEM_API_URL || 'https://api.creem.io')
  if (u.protocol !== 'https:' && u.protocol !== 'http:') {
    throw new Error('CREEM_API_URL must be http(s)')
  }
  return u.origin
})()
const API_KEY = process.env.CREEM_API_KEY || ''
const WEBHOOK_SECRET = process.env.CREEM_WEBHOOK_SECRET || ''

export type CreateCheckoutArgs = {
  productId: string
  requestId: string
  successUrl: string
  email?: string
  metadata?: Record<string, string | number>
}

export async function createCheckoutSession(
  args: CreateCheckoutArgs
): Promise<{ checkoutUrl: string }> {
  const res = await fetch(`${API_URL}/v1/checkouts`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': API_KEY,
    },
    body: JSON.stringify({
      product_id: args.productId,
      request_id: args.requestId,
      success_url: args.successUrl,
      ...(args.email ? { customer: { email: args.email } } : {}),
      ...(args.metadata ? { metadata: args.metadata } : {}),
    }),
  })
  if (!res.ok) {
    const detail = await res.text().catch(() => '')
    const safe =
      process.env.NODE_ENV === 'production' ? '' : detail.slice(0, 200)
    throw new Error(
      `Creem checkout failed (${res.status})${safe ? ': ' + safe : ''}`
    )
  }
  const data = await res.json()
  const checkoutUrl = data.checkout_url || data.checkoutUrl
  if (!checkoutUrl) throw new Error('Creem response missing checkout_url')
  return { checkoutUrl }
}

// HMAC-SHA256 of the raw request body, compared to the `creem-signature` header.
export function verifyCreemSignature(
  rawBody: string,
  signature: string | null
): boolean {
  if (!signature || !WEBHOOK_SECRET) return false
  const expected = crypto
    .createHmac('sha256', WEBHOOK_SECRET)
    .update(rawBody)
    .digest('hex')
  const a = Buffer.from(signature)
  const b = Buffer.from(expected)
  return a.length === b.length && crypto.timingSafeEqual(a, b)
}
