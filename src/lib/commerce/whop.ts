import { unwrapWebhook } from '@whop/sdk/helpers'
import { whopEnvironment } from './whopEnv'

/*
 * Whop, for the engagements.
 *
 * Whop takes the deposit that starts a retainer; Creem keeps the kits and
 * downloads. The two never meet: a service carries a `whopPlanId`, the
 * checkout embed mounts from that plan id alone, and Whop tells us about
 * the sale on its webhook. There is no server call before checkout and no
 * session to create -- the plan is the product, and the plan id in the
 * payment payload is how a sale finds its service again.
 *
 * `whopRequest` is only used by the setup simulation (creating the product,
 * the plans and the webhook) and by nothing at request time, so a missing
 * WHOP_API_KEY cannot break a page. The webhook needs only
 * WHOP_WEBHOOK_SECRET. Which Whop -- live or sandbox -- is decided by
 * whopEnv.ts; the key and the secret must belong to the same one.
 */

/* The live account. The sandbox account has its own id; the setup resolves
   it from the key rather than hardcoding a second one here. */
export const WHOP_ACCOUNT_ID = 'biz_PGSOCOwANQSket'

export function whopApiUrl(): string {
  return whopEnvironment() === 'sandbox'
    ? 'https://sandbox-api.whop.com/api/v1'
    : 'https://api.whop.com/api/v1'
}

export class WhopError extends Error {
  status: number
  constructor(message: string, status: number) {
    super(message)
    this.name = 'WhopError'
    this.status = status
  }
}

export async function whopRequest<T = unknown>(
  path: string,
  init: { method?: 'GET' | 'POST' | 'PATCH' | 'DELETE'; body?: unknown } = {}
): Promise<T> {
  const key = process.env.WHOP_API_KEY
  if (!key) throw new WhopError('WHOP_API_KEY is not configured', 0)
  const res = await fetch(`${whopApiUrl()}${path}`, {
    method: init.method || 'GET',
    headers: {
      Authorization: `Bearer ${key}`,
      'Content-Type': 'application/json',
    },
    body: init.body === undefined ? undefined : JSON.stringify(init.body),
  })
  if (!res.ok) {
    const detail = await res.text().catch(() => '')
    throw new WhopError(
      `Whop ${init.method || 'GET'} ${path} failed (${res.status})${
        detail ? ': ' + detail.slice(0, 300) : ''
      }`,
      res.status
    )
  }
  return (await res.json()) as T
}

/* The fields of a Payment this code reads. The full object is much larger;
   see Whop's Payment schema. `total` is what the customer paid, in major
   units, before Whop's fees. */
export type WhopPayment = {
  id: string
  status?: string | null
  total?: number | null
  usd_total?: number | null
  currency?: string | null
  paid_at?: string | null
  plan?: {
    id?: string | null
    metadata?: Record<string, unknown> | null
  } | null
  product?: { id?: string | null; title?: string | null } | null
  user?: {
    id?: string | null
    email?: string | null
    name?: string | null
    username?: string | null
  } | null
  membership?: { id?: string | null } | null
  metadata?: Record<string, unknown> | null
  checkout_configuration_id?: string | null
}

export type WhopEvent = {
  id: string
  type: string
  api_version?: string
  timestamp?: string
  account_id?: string
  company_id?: string
  data: WhopPayment | Record<string, unknown>
}

/* Standard Webhooks: HMAC-SHA256 over `{id}.{timestamp}.{body}` with the
   `ws_…` secret, base64 in the `webhook-signature` header, and a five-minute
   tolerance on the timestamp. Whop's own helper does the check; this only
   turns its throw into a null so the route can answer 401 without a try
   block of its own. Never throws, never parses the body before verifying. */
export function verifyWhopWebhook(
  raw: string,
  headers: Record<string, string>
): WhopEvent | null {
  const key = process.env.WHOP_WEBHOOK_SECRET
  if (!key) return null
  try {
    return unwrapWebhook(raw, { headers, key }) as WhopEvent
  } catch {
    return null
  }
}
