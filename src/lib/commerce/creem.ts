import crypto from 'crypto'

const API_KEY = process.env.CREEM_API_KEY || ''
const WEBHOOK_SECRET = process.env.CREEM_WEBHOOK_SECRET || ''

// Creem routes by host: a `creem_test_…` key only works against
// test-api.creem.io, and a live key only against api.creem.io. Derive the base
// URL from the key prefix so switching environments is just swapping the key —
// no separate URL to keep in sync. An explicit CREEM_API_URL still overrides.
const DEFAULT_API_URL = API_KEY.startsWith('creem_test_')
  ? 'https://test-api.creem.io'
  : 'https://api.creem.io'
const API_URL = (() => {
  const u = new URL(process.env.CREEM_API_URL || DEFAULT_API_URL)
  if (u.protocol !== 'https:' && u.protocol !== 'http:') {
    throw new Error('CREEM_API_URL must be http(s)')
  }
  return u.origin
})()

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

export type CreemProduct = {
  id: string
  /** Price in minor units (cents). 1000 = $10.00. */
  price: number
  currency: string
  billingType: 'onetime' | 'recurring' | string
  billingPeriod?: string
  name?: string
  status?: string
}

// GET /v1/products?product_id=… — retrieve a single product for price sync.
export async function retrieveProduct(
  productId: string
): Promise<CreemProduct> {
  if (!API_KEY) throw new Error('CREEM_API_KEY is not configured')
  const url = new URL(`${API_URL}/v1/products`)
  url.searchParams.set('product_id', productId)

  const res = await fetch(url, {
    method: 'GET',
    headers: { 'x-api-key': API_KEY },
  })
  if (!res.ok) {
    const detail = await res.text().catch(() => '')
    const safe =
      process.env.NODE_ENV === 'production' ? '' : detail.slice(0, 200)
    throw new Error(
      `Creem product lookup failed (${res.status})${safe ? ': ' + safe : ''}`
    )
  }
  const data = await res.json()
  if (typeof data?.price !== 'number') {
    throw new Error('Creem product response missing a numeric price')
  }
  return {
    id: data.id,
    price: data.price,
    currency: data.currency,
    billingType: data.billing_type,
    billingPeriod: data.billing_period,
    name: data.name,
    status: data.status,
  }
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
