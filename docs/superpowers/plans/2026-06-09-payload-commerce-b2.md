# Phase B2 — Commerce + Entitlements (Creem.io) — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Sell B1's Products/Courses/Services through Creem.io hosted checkout (no accounts), record Purchases on a verified webhook, and fulfill via emailed signed capability links — leaving boilerplate orders in `pending_invite` for Phase B3.

**Architecture:** A client `BuyButton` invokes a `createCheckout` **Server Action** that creates a Creem checkout (`POST /v1/checkouts`) and `redirect()`s to the hosted page. Creem calls a `/webhooks/creem` **route handler** (under a new `(commerce)` group, outside `/api` so the Payload REST catch-all doesn't shadow it) which verifies `creem-signature`, dedupes on the Creem order id, writes a `Purchases` record via the Local API, and fulfills by item type. Access is granted via HMAC-signed capability URLs (`/access/<token>`), no login.

**Tech Stack:** Next.js 15 App Router, Payload 3.85 (Local API), Node `crypto` (HMAC, no JWT dep), `resend`, `fetch` (no Creem SDK), Creem.io REST.

**Reference spec:** `docs/superpowers/specs/2026-06-08-payload-commerce-b2-design.md`

> **Decisions locked at plan time:** (1) Use plain `fetch` for Creem (no SDK dependency). (2) Capability tokens are HMAC-SHA256 via Node `crypto` (no JWT library). (3) New server-logic modules are `.ts` (matching `collections/*.ts` and `lib/resend.ts`); pages + `BuyButton` are `.jsx` (matching the migrated site); the webhook is `route.ts`.
>
> **Creem API (verified against docs):** Create = `POST {CREEM_API_URL}/v1/checkouts` header `x-api-key`, body `{ product_id, request_id, success_url, customer: { email? }, metadata }` → `{ checkout_url }`. Webhook envelope `{ id, eventType, created_at, object }`; `checkout.completed` paths: `object.order.id`, `object.customer.email`, `object.product.id`, `object.order.amount`, `object.order.currency`, `object.order.status`, `object.metadata`. Signature header `creem-signature` = HMAC-SHA256 of the **raw body** with `CREEM_WEBHOOK_SECRET`.
>
> **Testing note:** No unit-test framework. Verify with `npx tsc --noEmit`, `npx prettier --write`, and (user env) `pnpm build` + a Creem **test-mode** E2E. Do NOT run `pnpm lint` here (pre-existing crash). DB-dependent steps (`generate:types`, build, real webhooks) run in the user's environment.

---

## File Structure

| File | Responsibility |
|---|---|
| `.env.example` (modify) | Document `CREEM_*` + `ACCESS_TOKEN_SECRET` |
| `src/collections/Products.ts` (modify) | Add `creemProductId`, `downloadFile`, `downloadUrl` |
| `src/collections/Courses.ts` (modify) | Add `creemProductId` |
| `src/collections/Services.ts` (modify) | Add `creemProductId` |
| `src/collections/Purchases.ts` (create) | Order/entitlement records (admin-only) |
| `src/payload.config.ts` (modify) | Register `Purchases` |
| `src/lib/commerce/accessToken.ts` (create) | Sign/verify HMAC capability tokens |
| `src/lib/commerce/creem.ts` (create) | `createCheckoutSession`, `verifyCreemSignature` |
| `src/lib/commerce/fulfillment.ts` (create) | Resend emails: access link, boilerplate confirmation |
| `src/lib/commerce/checkout.ts` (create) | `'use server'` `createCheckout` action |
| `src/components/commerce/BuyButton.jsx` (create) | Client buy control (+ GitHub username for boilerplates) |
| `src/components/site/CourseBody.jsx` (create) | Shared course header+lessons render (reused by course page + access page) |
| `src/app/(commerce)/webhooks/creem/route.ts` (create) | Verified webhook → Purchase + fulfillment |
| `src/app/(site)/access/[token]/page.jsx` (create) | Capability-URL access (download / course) |
| `src/app/(site)/access/resend/page.jsx` (create) | Re-issue access link by email |
| `src/app/(site)/checkout/success/page.jsx` + `cancel/page.jsx` (create) | Post-checkout pages |
| `src/app/(site)/products/[slug]/page.tsx`, `courses/[slug]/page.tsx`, `services/page.tsx` (modify) | Mount `BuyButton` / "Request a quote" |

---

## Task 1: Env vars, collection extensions, and the Purchases collection

**Files:** `.env.example`, `src/collections/Products.ts`, `Courses.ts`, `Services.ts`, `Purchases.ts`, `src/payload.config.ts`

- [ ] **Step 1: Document env in `.env.example`** — append:

```bash
# Creem.io commerce (B2)
CREEM_API_URL=https://api.creem.io
CREEM_API_KEY=
CREEM_WEBHOOK_SECRET=
# Capability access-token signing secret (independent of PAYLOAD_SECRET)
ACCESS_TOKEN_SECRET=
```

- [ ] **Step 2: Extend `src/collections/Products.ts`** — insert these three fields immediately AFTER the existing `{ name: 'demoUrl', type: 'text' },` field:

```ts
    {
      name: 'creemProductId',
      type: 'text',
      admin: {
        description: 'Creem prod_… id. Absence ⇒ not purchasable.',
      },
    },
    {
      name: 'downloadFile',
      type: 'upload',
      relationTo: 'media',
      admin: { description: 'Deliverable for digital downloads.' },
    },
    {
      name: 'downloadUrl',
      type: 'text',
      admin: { description: 'Alternative external deliverable URL.' },
    },
```

- [ ] **Step 3: Extend `src/collections/Courses.ts`** — insert AFTER the `price` field:

```ts
    {
      name: 'creemProductId',
      type: 'text',
      admin: { description: 'Creem prod_… id. Absence ⇒ not purchasable.' },
    },
```

- [ ] **Step 4: Extend `src/collections/Services.ts`** — insert AFTER the `startingPrice` field:

```ts
    {
      name: 'creemProductId',
      type: 'text',
      admin: {
        description:
          'Creem prod_… id for a fixed-price package. Absence ⇒ "Request a quote".',
      },
    },
```

- [ ] **Step 5: Create `src/collections/Purchases.ts`**

```ts
import type { CollectionConfig } from 'payload'

export const Purchases: CollectionConfig = {
  slug: 'purchases',
  admin: {
    useAsTitle: 'email',
    defaultColumns: [
      'email',
      'itemType',
      'status',
      'fulfillmentStatus',
      'createdAt',
    ],
  },
  // Admin-only; the webhook writes via Local API with overrideAccess: true.
  access: {
    create: ({ req: { user } }) => Boolean(user),
    read: ({ req: { user } }) => Boolean(user),
    update: ({ req: { user } }) => Boolean(user),
    delete: ({ req: { user } }) => Boolean(user),
  },
  fields: [
    { name: 'email', type: 'email', required: true },
    {
      name: 'item',
      type: 'relationship',
      relationTo: ['products', 'courses', 'services'],
    },
    {
      name: 'itemType',
      type: 'select',
      options: [
        { label: 'Product', value: 'product' },
        { label: 'Course', value: 'course' },
        { label: 'Service', value: 'service' },
      ],
    },
    { name: 'creemProductId', type: 'text' },
    {
      name: 'creemOrderId',
      type: 'text',
      unique: true,
      index: true,
      admin: { description: 'Idempotency key (Creem order id).' },
    },
    { name: 'amount', type: 'number', admin: { description: 'Cents.' } },
    { name: 'currency', type: 'text' },
    {
      name: 'githubUsername',
      type: 'text',
      admin: { description: 'Boilerplate orders — consumed by Phase B3.' },
    },
    { name: 'accessTokenJti', type: 'text' },
    {
      name: 'status',
      type: 'select',
      options: [
        { label: 'Paid', value: 'paid' },
        { label: 'Refunded', value: 'refunded' },
      ],
      defaultValue: 'paid',
      admin: { position: 'sidebar' },
    },
    {
      name: 'fulfillmentStatus',
      type: 'select',
      options: [
        { label: 'Pending invite', value: 'pending_invite' },
        { label: 'Sent', value: 'sent' },
        { label: 'Failed', value: 'failed' },
        { label: 'Not required', value: 'not_required' },
      ],
      defaultValue: 'sent',
      admin: { position: 'sidebar' },
    },
  ],
}
```

- [ ] **Step 6: Register in `src/payload.config.ts`** — add the import beside the others and append `Purchases` to the `collections` array:

```ts
import { Purchases } from './collections/Purchases'
```
```ts
  collections: [
    Users,
    Media,
    Articles,
    Projects,
    Products,
    Courses,
    Lessons,
    Services,
    ContactSubmissions,
    Purchases,
  ],
```

- [ ] **Step 7: Verify**

Run: `npx tsc --noEmit`
Expected: clean. (Run `pnpm generate:types` in your env later to add the `Purchase` type.)

- [ ] **Step 8: Commit**

```bash
git add .env.example src/collections/Products.ts src/collections/Courses.ts src/collections/Services.ts src/collections/Purchases.ts src/payload.config.ts
git commit -m "feat: add Purchases collection and Creem product mapping fields"
```

---

## Task 2: Access-token module (HMAC capability tokens)

**Files:** Create `src/lib/commerce/accessToken.ts`

- [ ] **Step 1: Create `src/lib/commerce/accessToken.ts`**

```ts
import crypto from 'crypto'

export type AccessTokenPayload = {
  purchaseId: string | number
  itemType: 'product' | 'course' | 'service'
  itemId: string | number
  jti: string
  exp: number // epoch ms
}

const SECRET = process.env.ACCESS_TOKEN_SECRET || ''
const DEFAULT_TTL_MS = 30 * 24 * 60 * 60 * 1000 // 30 days

function b64url(input: Buffer | string): string {
  return Buffer.from(input)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '')
}

function sign(data: string): string {
  return b64url(crypto.createHmac('sha256', SECRET).update(data).digest())
}

export function createAccessToken(
  input: Omit<AccessTokenPayload, 'jti' | 'exp'> & { ttlMs?: number }
): { token: string; jti: string; exp: number } {
  const jti = crypto.randomUUID()
  const exp = Date.now() + (input.ttlMs ?? DEFAULT_TTL_MS)
  const payload: AccessTokenPayload = {
    purchaseId: input.purchaseId,
    itemType: input.itemType,
    itemId: input.itemId,
    jti,
    exp,
  }
  const body = b64url(JSON.stringify(payload))
  const token = `${body}.${sign(body)}`
  return { token, jti, exp }
}

export function verifyAccessToken(token: string): AccessTokenPayload | null {
  if (!token || !SECRET) return null
  const [body, sig] = token.split('.')
  if (!body || !sig) return null
  const expected = sign(body)
  const a = Buffer.from(sig)
  const b = Buffer.from(expected)
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null
  let payload: AccessTokenPayload
  try {
    payload = JSON.parse(Buffer.from(body, 'base64').toString('utf8'))
  } catch {
    return null
  }
  if (typeof payload.exp !== 'number' || Date.now() > payload.exp) return null
  return payload
}
```

- [ ] **Step 2: Verify**

Run: `npx tsc --noEmit`
Expected: clean.

- [ ] **Step 3: Commit**

```bash
git add src/lib/commerce/accessToken.ts
git commit -m "feat: add HMAC capability access-token sign/verify"
```

---

## Task 3: Creem client (checkout create + signature verify)

**Files:** Create `src/lib/commerce/creem.ts`

- [ ] **Step 1: Create `src/lib/commerce/creem.ts`**

```ts
import crypto from 'crypto'

const API_URL = process.env.CREEM_API_URL || 'https://api.creem.io'
const API_KEY = process.env.CREEM_API_KEY || ''
const WEBHOOK_SECRET = process.env.CREEM_WEBHOOK_SECRET || ''

export type CreateCheckoutArgs = {
  productId: string
  requestId: string
  successUrl: string
  email?: string
  metadata?: Record<string, string | number | undefined>
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
    throw new Error(`Creem checkout failed (${res.status}): ${detail}`)
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
```

- [ ] **Step 2: Verify**

Run: `npx tsc --noEmit`
Expected: clean.

- [ ] **Step 3: Commit**

```bash
git add src/lib/commerce/creem.ts
git commit -m "feat: add Creem checkout-create + webhook signature verify"
```

---

## Task 4: Fulfillment emails (Resend)

**Files:** Create `src/lib/commerce/fulfillment.ts`

- [ ] **Step 1: Create `src/lib/commerce/fulfillment.ts`**

```ts
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY || '')
const FROM = process.env.RESEND_FROM || 'Amware <hello@amware.dev>'
const SITE = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, '') || ''

export async function sendAccessLinkEmail(args: {
  to: string
  itemName: string
  token: string
}): Promise<void> {
  const url = `${SITE}/access/${args.token}`
  await resend.emails.send({
    from: FROM,
    to: args.to,
    subject: `Your access to ${args.itemName}`,
    text: `Thanks for your purchase of ${args.itemName}.\n\nAccess it here:\n${url}\n\nThis link is personal to you and expires in 30 days. You can request a fresh link any time at ${SITE}/access/resend.\n\n— Alec`,
  })
}

export async function sendBoilerplateConfirmationEmail(args: {
  to: string
  itemName: string
}): Promise<void> {
  await resend.emails.send({
    from: FROM,
    to: args.to,
    subject: `Your purchase of ${args.itemName}`,
    text: `Thanks for buying ${args.itemName}.\n\nWe'll send a GitHub repository invitation to the username you provided shortly. If you don't receive it, reply to this email.\n\n— Alec`,
  })
}
```

- [ ] **Step 2: Verify**

Run: `npx tsc --noEmit`
Expected: clean.

- [ ] **Step 3: Commit**

```bash
git add src/lib/commerce/fulfillment.ts
git commit -m "feat: add Resend fulfillment emails (access link, boilerplate notice)"
```

---

## Task 5: `createCheckout` Server Action

**Files:** Create `src/lib/commerce/checkout.ts`

- [ ] **Step 1: Create `src/lib/commerce/checkout.ts`**

```ts
'use server'

import crypto from 'crypto'
import { redirect } from 'next/navigation'
import { getPayloadClient } from '@/lib/getPayloadClient'
import { createCheckoutSession } from '@/lib/commerce/creem'

const COLLECTION = {
  product: 'products',
  course: 'courses',
  service: 'services',
} as const

export async function createCheckout(formData: FormData): Promise<void> {
  const itemType = String(formData.get('itemType') || '') as
    | 'product'
    | 'course'
    | 'service'
  const slug = String(formData.get('slug') || '')
  const githubUsername = String(formData.get('githubUsername') || '').trim()

  const collection = COLLECTION[itemType]
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
    throw new Error('This item is not available for purchase yet')
  }

  const site = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, '') || ''
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
```

> `redirect()` is called outside any try/catch (it throws the internal `NEXT_REDIRECT` signal). Note that `item.creemProductId`/`item.id` are loosely typed until `pnpm generate:types` runs — fine.

- [ ] **Step 2: Verify**

Run: `npx tsc --noEmit`
Expected: clean.

- [ ] **Step 3: Commit**

```bash
git add src/lib/commerce/checkout.ts
git commit -m "feat: add createCheckout server action (Creem hosted checkout)"
```

---

## Task 6: BuyButton + wire into B1 detail pages

**Files:** Create `src/components/commerce/BuyButton.jsx`; modify `src/app/(site)/products/[slug]/page.tsx`, `courses/[slug]/page.tsx`, `services/page.tsx`

- [ ] **Step 1: Create `src/components/commerce/BuyButton.jsx`**

```jsx
'use client'

import { useState } from 'react'
import { createCheckout } from '@/lib/commerce/checkout'
import { Button } from '@/components/Button'

export function BuyButton({
  itemType,
  slug,
  isBoilerplate = false,
  label = 'Buy now',
}) {
  const [submitting, setSubmitting] = useState(false)
  return (
    <form action={createCheckout} onSubmit={() => setSubmitting(true)} className="mt-8">
      <input type="hidden" name="itemType" value={itemType} />
      <input type="hidden" name="slug" value={slug} />
      {isBoilerplate && (
        <label className="mb-3 block">
          <span className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
            GitHub username (for repo access)
          </span>
          <input
            type="text"
            name="githubUsername"
            required
            placeholder="your-github-username"
            className="w-full rounded-md border border-zinc-900/10 bg-white px-3 py-2 text-sm text-zinc-800 shadow-sm focus:border-teal-500 focus:outline-hidden focus:ring-4 focus:ring-teal-500/10 dark:border-zinc-700 dark:bg-zinc-700/[0.15] dark:text-zinc-200"
          />
        </label>
      )}
      <Button
        type="submit"
        disabled={submitting}
        className="disabled:cursor-not-allowed disabled:opacity-60"
      >
        {submitting ? 'Redirecting…' : label}
      </Button>
    </form>
  )
}
```

- [ ] **Step 2: Mount in `src/app/(site)/products/[slug]/page.tsx`** — add the import and render the button (replace the existing demo-link block's sibling area). Add near the top:
```tsx
import { BuyButton } from '@/components/commerce/BuyButton'
```
Then, inside the returned JSX (after the features list / before/after the demo link), add:
```tsx
        {product.creemProductId ? (
          <BuyButton
            itemType="product"
            slug={product.slug}
            isBoilerplate={product.type === 'boilerplate'}
            label={
              typeof product.price === 'number'
                ? `Buy — ${product.currency ?? 'USD'} ${product.price.toFixed(2)}`
                : 'Buy now'
            }
          />
        ) : null}
```

- [ ] **Step 3: Mount in `src/app/(site)/courses/[slug]/page.tsx`** — add the import and, in the header area (after `course.summary`), add:
```tsx
import { BuyButton } from '@/components/commerce/BuyButton'
```
```tsx
          {course.creemProductId ? (
            <BuyButton
              itemType="course"
              slug={course.slug}
              label={
                typeof course.price === 'number'
                  ? `Enroll — USD ${course.price.toFixed(2)}`
                  : 'Enroll now'
              }
            />
          ) : null}
```

- [ ] **Step 4: Mount in `src/app/(site)/services/page.tsx`** — in each service card, add a buy button for fixed-price packages, else a "Request a quote" link. Add the import and, inside the `service` card JSX (after `startingPrice`), add:
```tsx
import { BuyButton } from '@/components/commerce/BuyButton'
import Link from 'next/link'
```
```tsx
              {service.creemProductId ? (
                <BuyButton itemType="service" slug={service.slug} label="Purchase" />
              ) : (
                <Link
                  href="/contact"
                  className="mt-4 inline-flex text-sm font-medium text-teal-500"
                >
                  Request a quote →
                </Link>
              )}
```

- [ ] **Step 5: Verify**

Run: `npx tsc --noEmit`
Expected: clean.

- [ ] **Step 6: Commit**

```bash
git add src/components/commerce/BuyButton.jsx "src/app/(site)/products/[slug]/page.tsx" "src/app/(site)/courses/[slug]/page.tsx" "src/app/(site)/services/page.tsx"
git commit -m "feat: add BuyButton and wire checkout into product/course/service pages"
```

---

## Task 7: Creem webhook route handler

**Files:** Create `src/app/(commerce)/webhooks/creem/route.ts`

- [ ] **Step 1: Create `src/app/(commerce)/webhooks/creem/route.ts`**

```ts
import { getPayloadClient } from '@/lib/getPayloadClient'
import { verifyCreemSignature } from '@/lib/commerce/creem'
import { createAccessToken } from '@/lib/commerce/accessToken'
import {
  sendAccessLinkEmail,
  sendBoilerplateConfirmationEmail,
} from '@/lib/commerce/fulfillment'

export const dynamic = 'force-dynamic'

const COLLECTION = {
  product: 'products',
  course: 'courses',
  service: 'services',
}

export async function POST(req) {
  const raw = await req.text()
  if (!verifyCreemSignature(raw, req.headers.get('creem-signature'))) {
    return new Response('Invalid signature', { status: 401 })
  }

  let event
  try {
    event = JSON.parse(raw)
  } catch {
    return new Response('Bad JSON', { status: 400 })
  }
  if (event?.eventType !== 'checkout.completed') {
    return new Response('ignored', { status: 200 })
  }

  const obj = event.object || {}
  const orderId = obj.order?.id || obj.id
  const email = obj.customer?.email
  const amount = obj.order?.amount
  const currency = obj.order?.currency
  const creemProductId = obj.product?.id
  const meta = obj.metadata || {}
  const itemType = meta.itemType
  const itemId = meta.itemId
  const githubUsername = meta.githubUsername

  if (!orderId || !email || !itemType || !itemId) {
    return new Response('ignored (missing fields)', { status: 200 })
  }

  const payload = await getPayloadClient()

  // Idempotency: skip if we already recorded this order.
  const existing = await payload.find({
    collection: 'purchases',
    where: { creemOrderId: { equals: orderId } },
    limit: 1,
    overrideAccess: true,
  })
  if (existing.docs.length) {
    return new Response('ok (duplicate)', { status: 200 })
  }

  // Load the purchased item to determine fulfillment route.
  const collection = COLLECTION[itemType]
  let item = null
  if (collection) {
    item = await payload
      .findByID({ collection, id: itemId, depth: 1, overrideAccess: true })
      .catch(() => null)
  }

  const isBoilerplate = itemType === 'product' && item?.type === 'boilerplate'
  const itemName = item?.name || item?.title || 'your purchase'

  // Create the Purchase record first (we need its id to sign the token).
  const purchase = await payload.create({
    collection: 'purchases',
    overrideAccess: true,
    data: {
      email,
      item: item ? { relationTo: collection, value: item.id } : undefined,
      itemType,
      creemProductId,
      creemOrderId: orderId,
      amount,
      currency,
      githubUsername: githubUsername || undefined,
      status: 'paid',
      fulfillmentStatus: isBoilerplate ? 'pending_invite' : 'sent',
    },
  })

  try {
    if (isBoilerplate) {
      await sendBoilerplateConfirmationEmail({ to: email, itemName })
      // GitHub invite itself is Phase B3; record stays 'pending_invite'.
    } else if (item) {
      const { token, jti } = createAccessToken({
        purchaseId: purchase.id,
        itemType,
        itemId: item.id,
      })
      await payload.update({
        collection: 'purchases',
        id: purchase.id,
        overrideAccess: true,
        data: { accessTokenJti: jti },
      })
      await sendAccessLinkEmail({ to: email, itemName, token })
    }
  } catch (err) {
    console.error('Fulfillment failed:', err)
    await payload
      .update({
        collection: 'purchases',
        id: purchase.id,
        overrideAccess: true,
        data: { fulfillmentStatus: 'failed' },
      })
      .catch(() => {})
  }

  // Always 200 so Creem doesn't retry a recorded order.
  return new Response('ok', { status: 200 })
}
```

> Route is OUTSIDE `/api` → URL `/webhooks/creem`, so the `(payload)` `/api/[...slug]` catch-all never shadows it. `force-dynamic` ensures the raw body is read per-request (no caching).

- [ ] **Step 2: Verify**

Run: `npx tsc --noEmit`
Expected: clean.

- [ ] **Step 3: Commit**

```bash
git add "src/app/(commerce)/webhooks/creem/route.ts"
git commit -m "feat: add verified Creem webhook → Purchase + fulfillment"
```

---

## Task 8: Access + checkout pages

**Files:** Create `src/components/site/CourseBody.jsx`; `src/app/(site)/access/[token]/page.jsx`; `src/app/(site)/access/resend/page.jsx`; `src/app/(site)/checkout/success/page.jsx`; `src/app/(site)/checkout/cancel/page.jsx`

- [ ] **Step 1: Create `src/components/site/CourseBody.jsx`** (shared course render — header + description + lessons grouped by module)

```jsx
import { RichText } from '@/components/site/RichText'

export function CourseBody({ course, lessons }) {
  const groups = []
  for (const lesson of lessons) {
    const label = lesson.module || 'Lessons'
    let group = groups.find((g) => g.module === label)
    if (!group) {
      group = { module: label, lessons: [] }
      groups.push(group)
    }
    group.lessons.push(lesson)
  }
  return (
    <article className="mx-auto max-w-2xl">
      <header>
        <h1 className="text-4xl font-bold tracking-tight text-zinc-800 dark:text-zinc-100 sm:text-5xl">
          {course.title}
        </h1>
        {course.summary && (
          <p className="mt-6 text-base text-zinc-600 dark:text-zinc-400">
            {course.summary}
          </p>
        )}
      </header>
      <RichText data={course.description} className="mt-10" />
      {groups.map((group) => (
        <section key={group.module} className="mt-12">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
            {group.module}
          </h2>
          <div className="mt-4 space-y-8">
            {group.lessons.map((lesson) => (
              <div key={lesson.id} id={lesson.slug ?? undefined}>
                <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
                  {lesson.title}
                </h3>
                <RichText data={lesson.content} className="mt-3" />
              </div>
            ))}
          </div>
        </section>
      ))}
    </article>
  )
}
```

- [ ] **Step 2: Create `src/app/(site)/access/[token]/page.jsx`**

```jsx
import Link from 'next/link'
import { Container } from '@/components/Container'
import { CourseBody } from '@/components/site/CourseBody'
import { getPayloadClient } from '@/lib/getPayloadClient'
import { verifyAccessToken } from '@/lib/commerce/accessToken'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Your access', robots: { index: false } }

function InvalidLink() {
  return (
    <Container className="mt-16 sm:mt-32">
      <h1 className="text-2xl font-bold text-zinc-800 dark:text-zinc-100">
        This link is invalid or expired
      </h1>
      <p className="mt-4 text-zinc-600 dark:text-zinc-400">
        Request a fresh link:{' '}
        <Link href="/access/resend" className="text-teal-500">
          resend my access link
        </Link>
        .
      </p>
    </Container>
  )
}

export default async function AccessPage({ params }) {
  const { token } = await params
  const claims = verifyAccessToken(token)
  if (!claims) return <InvalidLink />

  const payload = await getPayloadClient()
  const purchase = await payload
    .findByID({ collection: 'purchases', id: claims.purchaseId, overrideAccess: true })
    .catch(() => null)
  if (!purchase || purchase.status !== 'paid') return <InvalidLink />

  const collection =
    claims.itemType === 'product'
      ? 'products'
      : claims.itemType === 'course'
        ? 'courses'
        : 'services'
  const item = await payload
    .findByID({ collection, id: claims.itemId, depth: 1, overrideAccess: true })
    .catch(() => null)
  if (!item) return <InvalidLink />

  if (claims.itemType === 'course') {
    const { docs: lessons } = await payload.find({
      collection: 'lessons',
      where: { course: { equals: item.id }, status: { equals: 'published' } },
      sort: 'order',
      depth: 0,
      limit: 1000,
      overrideAccess: true,
    })
    return (
      <Container className="mt-16 sm:mt-32">
        <CourseBody course={item} lessons={lessons} />
      </Container>
    )
  }

  // product download or service package
  const fileUrl =
    item.downloadFile && typeof item.downloadFile === 'object'
      ? item.downloadFile.url
      : item.downloadUrl || null
  return (
    <Container className="mt-16 sm:mt-32">
      <div className="mx-auto max-w-2xl">
        <h1 className="text-4xl font-bold tracking-tight text-zinc-800 dark:text-zinc-100 sm:text-5xl">
          {item.name || item.title}
        </h1>
        <p className="mt-6 text-base text-zinc-600 dark:text-zinc-400">
          Thanks for your purchase. Your access is below.
        </p>
        {fileUrl ? (
          <a
            href={fileUrl}
            className="mt-8 inline-flex rounded-md bg-zinc-800 px-3 py-2 text-sm font-semibold text-zinc-100 transition hover:bg-zinc-700 dark:bg-zinc-700 dark:hover:bg-zinc-600"
          >
            Download
          </a>
        ) : (
          <p className="mt-8 text-sm text-zinc-500 dark:text-zinc-400">
            Your purchase is confirmed. We’ll follow up by email with next steps.
          </p>
        )}
      </div>
    </Container>
  )
}
```

- [ ] **Step 3: Create `src/app/(site)/access/resend/page.jsx`** (form + inline server action)

```jsx
import { Container } from '@/components/Container'
import { Button } from '@/components/Button'
import { getPayloadClient } from '@/lib/getPayloadClient'
import { createAccessToken } from '@/lib/commerce/accessToken'
import { sendAccessLinkEmail } from '@/lib/commerce/fulfillment'

export const metadata = { title: 'Resend access link', robots: { index: false } }

async function resendLink(formData) {
  'use server'
  const email = String(formData.get('email') || '').trim()
  if (!email) return
  const payload = await getPayloadClient()
  const { docs } = await payload.find({
    collection: 'purchases',
    where: { email: { equals: email }, status: { equals: 'paid' } },
    sort: '-createdAt',
    limit: 1,
    overrideAccess: true,
  })
  const purchase = docs[0]
  if (purchase) {
    const { token, jti } = createAccessToken({
      purchaseId: purchase.id,
      itemType: purchase.itemType,
      itemId:
        typeof purchase.item === 'object' && purchase.item
          ? purchase.item.value
          : purchase.item,
    })
    await payload.update({
      collection: 'purchases',
      id: purchase.id,
      overrideAccess: true,
      data: { accessTokenJti: jti },
    })
    await sendAccessLinkEmail({
      to: email,
      itemName: 'your purchase',
      token,
    })
  }
  // Always behaves identically (no account enumeration).
}

export default function ResendPage() {
  return (
    <Container className="mt-16 sm:mt-32">
      <div className="mx-auto max-w-md">
        <h1 className="text-3xl font-bold tracking-tight text-zinc-800 dark:text-zinc-100">
          Resend your access link
        </h1>
        <p className="mt-4 text-sm text-zinc-600 dark:text-zinc-400">
          Enter the email you purchased with. If we find a purchase, we’ll email
          a fresh link.
        </p>
        <form action={resendLink} className="mt-6 flex gap-3">
          <input
            type="email"
            name="email"
            required
            placeholder="you@example.com"
            className="min-w-0 flex-auto rounded-md border border-zinc-900/10 bg-white px-3 py-2 text-sm text-zinc-800 shadow-sm focus:border-teal-500 focus:outline-hidden focus:ring-4 focus:ring-teal-500/10 dark:border-zinc-700 dark:bg-zinc-700/[0.15] dark:text-zinc-200"
          />
          <Button type="submit">Send link</Button>
        </form>
      </div>
    </Container>
  )
}
```

> The form posts and re-renders; the action never reveals whether an email matched (no enumeration). A confirmation message can be added later via `useFormState` if desired — out of scope for B2.

- [ ] **Step 4: Create `src/app/(site)/checkout/success/page.jsx`**

```jsx
import Link from 'next/link'
import { Container } from '@/components/Container'

export const metadata = { title: 'Payment received' }

export default function CheckoutSuccess() {
  return (
    <Container className="mt-16 sm:mt-32">
      <div className="mx-auto max-w-2xl">
        <h1 className="text-4xl font-bold tracking-tight text-zinc-800 dark:text-zinc-100 sm:text-5xl">
          Thank you — payment received
        </h1>
        <p className="mt-6 text-base text-zinc-600 dark:text-zinc-400">
          Check your email for your access link (or your repository invitation
          for boilerplates). Didn’t get it?{' '}
          <Link href="/access/resend" className="text-teal-500">
            Resend my access link
          </Link>
          .
        </p>
      </div>
    </Container>
  )
}
```

- [ ] **Step 5: Create `src/app/(site)/checkout/cancel/page.jsx`**

```jsx
import Link from 'next/link'
import { Container } from '@/components/Container'

export const metadata = { title: 'Checkout canceled' }

export default function CheckoutCancel() {
  return (
    <Container className="mt-16 sm:mt-32">
      <div className="mx-auto max-w-2xl">
        <h1 className="text-4xl font-bold tracking-tight text-zinc-800 dark:text-zinc-100 sm:text-5xl">
          Checkout canceled
        </h1>
        <p className="mt-6 text-base text-zinc-600 dark:text-zinc-400">
          No charge was made. <Link href="/products" className="text-teal-500">Browse products</Link>.
        </p>
      </div>
    </Container>
  )
}
```

- [ ] **Step 6: (Optional DRY) refactor `courses/[slug]/page.tsx` to use `CourseBody`** — replace its inline header+description+lesson-grouping JSX with `<CourseBody course={course} lessons={lessons} />`. Skip if it risks churn; the shared component is the source of truth going forward.

- [ ] **Step 7: Verify**

Run: `npx tsc --noEmit`
Expected: clean.

- [ ] **Step 8: Commit**

```bash
git add src/components/site/CourseBody.jsx "src/app/(site)/access" "src/app/(site)/checkout"
git commit -m "feat: add access (capability URL) and checkout success/cancel pages"
```

---

## Task 9: Verification

- [ ] **Step 1: Format**

Run:
```bash
npx prettier --write "src/collections/*.ts" "src/lib/commerce/*.ts" "src/components/commerce/*.jsx" "src/components/site/CourseBody.jsx" "src/app/(commerce)/**/*.ts" "src/app/(site)/access/**/*.jsx" "src/app/(site)/checkout/**/*.jsx"
```

- [ ] **Step 2: Type-check**

Run: `npx tsc --noEmit`
Expected: exit 0.

- [ ] **Step 3: Generate types + build (user env)**

Run: `pnpm generate:types && pnpm build`
Expected: `Purchase` type generated; build lists `/webhooks/creem`, `/access/[token]`, `/access/resend`, `/checkout/success`, `/checkout/cancel`.

- [ ] **Step 4: Creem test-mode E2E (user env)**

Configure Creem **test mode** + a webhook pointing at `${SITE}/webhooks/creem`. Create test Creem products and set their `prod_…` ids on a Product (one `digital` with a `downloadFile`, one `boilerplate`), a Course, and a fixed-price Service. Then: buy each → confirm (a) one `purchases` row per order (re-send the webhook → no duplicate), (b) digital/course/service → access-link email arrives and `/access/<token>` serves the file / renders the course, (c) boilerplate → row is `pending_invite` with `githubUsername`, confirmation email sent, (d) tamper a token → rejected; (e) a Service with no `creemProductId` shows "Request a quote".

- [ ] **Step 5: Code quality + security review** — focus: webhook signature (timing-safe, raw body), token signing (timing-safe, exp), no secret leakage to client, idempotency, no draft/unpaid access. Commit any fixes.

---

## Self-Review Notes (spec coverage)

- Creem hosted checkout via Server Action + `redirect` → Task 5, 6 ✓
- Webhook outside `/api`, signature-verified, idempotent, fulfillment routing → Task 7 ✓
- Purchases collection (admin-only, polymorphic item, idempotency key, fulfillment status) → Task 1 ✓
- `creemProductId` on Products/Courses/Services; `downloadFile`/`downloadUrl` on Products → Task 1 ✓
- Boilerplate → `pending_invite` + GitHub username captured pre-checkout via metadata → Tasks 6, 7 ✓
- Emailed signed capability links (HMAC, 30-day exp), `/access/[token]`, `/access/resend` → Tasks 2, 4, 8 ✓
- Quote-based Services → "Request a quote" → contact → Task 6 ✓
- One-time only; no accounts; price display-only → Tasks 1, 6 ✓
- Env (`CREEM_*`, `ACCESS_TOKEN_SECRET`), `fetch` (no SDK), Node crypto (no JWT) → Tasks 1, 2, 3 ✓
- Error handling (401 bad sig, 200 duplicate, fulfillment-failure capture) → Tasks 3, 7 ✓
- Verification incl. Creem test-mode E2E + security review → Task 9 ✓
- B3 boundary: GitHub invite NOT implemented; `pending_invite` + `githubUsername` recorded for B3 → Tasks 1, 7 ✓
