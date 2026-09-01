# Phase B2 — Commerce + Entitlements (Creem.io) — Design Spec

**Date:** 2026-06-08
**Status:** Draft for review
**Author:** Alec M (with Claude)
**Builds on:** B1 (`2026-06-07-payload-content-rendering-b1-design.md`) — content collections + App Router rendering already shipped.

## Goal

Let visitors **buy** the content modeled in B1 — Products (incl. boilerplates), Courses, and fixed-price Service packages — through **Creem.io hosted checkout** (a merchant-of-record that handles global tax/VAT), with **no customer accounts**. On successful payment, record a **Purchase/entitlement** and fulfill via an **emailed signed access link** (Resend). Boilerplate purchases additionally collect the buyer's GitHub username and mark the order **pending a repo invite** — the actual GitHub automation is **Phase B3**.

## Phase boundary

- **B2 (this spec):** checkout creation, webhook ingestion, Purchase records, and fulfillment for downloadable products / course access / service packages via emailed capability links. Boilerplate orders are recorded with the GitHub username and left in `pending_invite`.
- **B3 (next):** consume `pending_invite` boilerplate Purchases → GitHub App auto-invites the buyer to the repo; update fulfillment status.

## Locked Decisions

| Decision | Choice | Rationale |
|---|---|---|
| Payment provider | Creem.io, **hosted checkout redirect** | Merchant-of-record (tax/VAT handled); least PCI surface |
| Accounts | **None** — email-only | Per product direction; access via capability URLs |
| What's purchasable | Products, Courses, fixed-price Services | User choice (everything monetized) |
| Quote-based Services | "Request a quote" → existing contact flow (no checkout) | Services without a fixed price/`creemProductId` aren't checkout items |
| Pricing | **One-time only** | Simplest entitlement model; subscriptions deferred |
| GitHub username capture | Collected pre-checkout on our side, passed as Creem `metadata` | Creem has no native custom checkout fields |
| Fulfillment | Webhook → Purchase record → emailed **signed, expiring access link** (Resend) | No login needed; capability-URL access |
| Catalog source of truth | Creem holds `prod_…` + charges; Payload holds display + a `creemProductId` map | Price shown from Payload, charged by Creem |
| Idempotency | Creem `request_id` on create + dedupe on Creem order id in the webhook | Prevent double-charge / double-fulfill |

## Architecture

```
(site) product/course/service page
  └─ "Buy" → Server Action createCheckout(itemType, slug, githubUsername?)
        ├─ loads the Payload item, reads creemProductId, builds metadata
        ├─ POST https://api.creem.io/v1/checkouts  (x-api-key)
        │     { product_id, success_url, request_id, customer.email?, metadata }
        └─ redirect(checkout_url)               → Creem hosted payment page
                                                      │ buyer pays
   Creem ──webhook(checkout.completed)──► POST /webhooks/creem  (route handler, raw body)
        ├─ verify `creem-signature` (HMAC-SHA256, raw body, CREEM_WEBHOOK_SECRET)
        ├─ dedupe on Creem order id (skip if Purchase already exists)
        ├─ create Purchases record (email, item, amount, githubUsername?, status=paid)
        └─ fulfill by item type:
             • boilerplate  → fulfillmentStatus = 'pending_invite'  (B3 picks up)
             • download     → email signed link → /access/<token>  (serves file)
             • course       → email signed link → /access/<token>  (renders course)
             • service pkg  → email confirmation + signed link to details
   buyer ──► /checkout/success (thank-you)  or  /checkout/cancel
   buyer ──► /access/<token>  → verify token → grant download / course view
```

- **Commerce endpoints live OUTSIDE `/api`** because the `(payload)` route group already owns the `/api/[...slug]` REST catch-all, which would shadow them. Webhook = `src/app/(commerce)/webhooks/creem/route.ts` → URL `/webhooks/creem`. (`(commerce)` is a route-group folder holding only route handlers — no layout needed.)
- **Checkout initiation is a Server Action**, not a route — invoked from a client "Buy" control on the B1 detail pages. No new public API surface.
- **Access pages** (`/checkout/success`, `/checkout/cancel`, `/access/[token]`) live under the **`(site)`** group so they inherit the B1 chrome.
- All Creem secrets and the access-token signing secret are **server-only**.

## New / Changed Collections

### Products / Courses / Services (extend)
Add to each:
| Field | Type | Notes |
|---|---|---|
| `creemProductId` | text | maps to Creem `prod_…`; absence ⇒ not purchasable (Services fall back to "Request a quote") |

Add to **Products** only:
| Field | Type | Notes |
|---|---|---|
| `downloadFile` | upload → media | the deliverable for `type: digital` downloads |
| `downloadUrl` | text | alternative external deliverable |

> `price`/`currency` stay display-only (B1). Creem is the source of truth for the actual charge.

### Purchases (new — `slug: 'purchases'`)
| Field | Type | Notes |
|---|---|---|
| `email` | email (required) | buyer (from Creem `customer.email`) |
| `item` | relationship → `['products','courses','services']` (polymorphic) | what was bought |
| `itemType` | select: product / course / service | denormalized for fulfillment routing |
| `creemProductId` | text | echo of the purchased Creem product |
| `creemOrderId` | text (unique, index) | **idempotency key** — webhook dedupe |
| `amount` | number | cents, from webhook |
| `currency` | text | |
| `githubUsername` | text | present for boilerplate orders (from metadata) — **B3 consumes this** |
| `accessTokenJti` | text | id of the signed access token (for revoke/lookup) |
| `status` | select: paid / refunded | from webhook |
| `fulfillmentStatus` | select: pending_invite / sent / failed / not_required | drives B3 + retries |
| `createdAt` | auto | |

Access: `create`/`read`/`update`/`delete` all **admin-only** (no public access). Records are written by the webhook via the Local API with `overrideAccess`.

## Access Tokens (capability URLs)

- On fulfillment, sign a compact token: `{ purchaseId, itemType, itemId, jti, exp }` with HMAC (`ACCESS_TOKEN_SECRET`), default `exp` = 30 days.
- Emailed link: `${NEXT_PUBLIC_SITE_URL}/access/<token>`.
- `/access/[token]` (server component) verifies signature + expiry → loads the Purchase + item → renders: a download button (signed/streamed file) for downloads, or the full course (reusing B1's `RichText`/lesson rendering) for courses.
- **Re-issue flow:** `/access/resend` — buyer enters their email → if a paid Purchase exists, email a fresh link. (Purchases are permanent; only the link expires.)
- This is capability-URL access (anyone with the link can view) — an accepted B2 tradeoff; real accounts are a later phase.

## Checkout Flow Detail

1. **Buy control** (client) on a B1 detail page. For `type: boilerplate`, a small inline field collects the **GitHub username** before submit; otherwise just the buy button.
2. **Server Action `createCheckout`**: loads the published item by `(itemType, slug)`, requires a `creemProductId` (else error), builds `metadata = { itemType, itemId, slug, githubUsername? }`, generates a `request_id` (idempotency), calls `POST /v1/checkouts`, and `redirect()`s to `checkout_url`.
3. **Creem** collects payment + email on its hosted page; redirects to `success_url = /checkout/success`.
4. **Webhook** `/webhooks/creem` (`checkout.completed`): verify signature → dedupe on order id → create Purchase (mapping `metadata.itemType/itemId`, `customer.email`, `amount`, `githubUsername`) → fulfill.

## Environment & Dependencies

New env (documented in `.env.example`, real values in `.env.local`):
| Var | Purpose |
|---|---|
| `CREEM_API_KEY` | Creem REST auth (`x-api-key`) |
| `CREEM_API_URL` | `https://api.creem.io` (or test/sandbox base) |
| `CREEM_WEBHOOK_SECRET` | HMAC verification of `creem-signature` |
| `ACCESS_TOKEN_SECRET` | signs capability tokens (separate from `PAYLOAD_SECRET`) |

Existing `RESEND_*` (from the foundation) are reused for fulfillment emails. `NEXT_PUBLIC_SITE_URL` builds success/cancel/access URLs.

Dependency: the official `creem` Node SDK **or** plain `fetch` to `/v1/checkouts` (decide at plan time; `fetch` keeps the dependency surface minimal and the calls are trivial). No client-side Creem code.

## Error Handling

- **Webhook signature failure** → 401, no side effects.
- **Duplicate webhook** (same Creem order id) → 200, no-op (idempotent).
- **Unknown/невmatched product** in webhook → record Purchase with `fulfillmentStatus: failed` + log; never 500 back to Creem (avoid infinite retries) unless we want a retry.
- **Resend failure during fulfillment** → caught/logged; Purchase saved with `fulfillmentStatus: failed`; re-issue flow can recover.
- **`createCheckout` with no `creemProductId`** → user-facing "not available for purchase yet".
- **Expired access token** → friendly page with a "resend my link" action.

## Verification

1. `pnpm lint`, `npx prettier --write`, `npx tsc --noEmit`, `pnpm build` succeed.
2. Creem **test mode**: buy each item type → `checkout.completed` received, signature verified, one Purchase row created (re-delivered webhook does not duplicate it).
3. Download product → email arrives with a working `/access/<token>` that serves the file; link rejects after tampering/expiry.
4. Course purchase → access link renders the course content.
5. Boilerplate purchase → Purchase saved with `githubUsername` and `fulfillmentStatus: pending_invite` (no invite yet — that's B3).
6. Quote-based Service (no `creemProductId`) shows "Request a quote" → contact flow, no checkout.
7. Code quality + security review (webhook signature, capability-token signing, no secret leakage to client).

## Non-Goals (this phase)

- GitHub repo invitations (B3).
- Customer accounts / login / a "my purchases" portal.
- Subscriptions / recurring billing.
- Refund automation beyond recording `status: refunded` from a webhook.
- Discount-code UI, cart/multi-item checkout (one item per checkout in B2).

## Future Phases

- **B3:** GitHub App auto-invite for `pending_invite` boilerplate Purchases.
- **Later:** passwordless accounts + purchases portal (upgrade capability URLs to real gated access); subscriptions/memberships; cart.
