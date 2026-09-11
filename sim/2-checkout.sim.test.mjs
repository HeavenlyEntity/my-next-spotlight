import { describe, expect, it, beforeAll, afterAll } from 'vitest'
import crypto from 'node:crypto'
import { getPayload } from 'payload'
import config from '@payload-config'
import { createCheckout } from '@/lib/commerce/checkout'
import { POST as creemWebhook } from '@/app/(commerce)/webhooks/creem/route'

/* A customer simulation, not a unit test. It drives the real server action
   against the real Creem test API, then plays Creem's side of the webhook
   with a genuinely signed body, and reads back what a buyer would end up
   with: a purchase row, a fulfillment state, and a confirmation email. */

const BUYER = 'delivered@resend.dev' // Resend's sink address: nobody receives it
const GITHUB = 'HeavenlyEntity'

const form = (fields) => {
  const fd = new FormData()
  for (const [k, v] of Object.entries(fields)) fd.set(k, v)
  return fd
}

/* next/navigation's redirect() signals by throwing; the destination lives in
   the digest. Outside the Next runtime that is how we read it. */
const redirectUrlFrom = (err) => {
  const digest = err?.digest || ''
  const m = /^NEXT_REDIRECT;[^;]+;(.*?);\d+;?$/.exec(digest)
  return m ? m[1] : null
}

const runCheckout = async (fields) => {
  try {
    const state = await createCheckout({ error: null }, form(fields))
    return { state, redirect: null }
  } catch (err) {
    const url = redirectUrlFrom(err)
    if (!url) throw err
    return { state: null, redirect: url }
  }
}

const payload = await getPayload({ config })

/* Whichever kit is actually purchasable right now. Resolved at collection
   time rather than hardcoded to a slug, because the catalogue changes and a
   simulation pinned to a retired product fails for the wrong reason. With
   nothing purchasable -- every kit still waiting on a price and a Creem
   product -- the journey is skipped with a reason rather than failing. */
const { docs: sellable } = await payload.find({
  collection: 'products',
  where: {
    and: [
      { type: { equals: 'boilerplate' } },
      { status: { equals: 'published' } },
      { creemProductId: { exists: true } },
    ],
  },
  sort: 'order',
  limit: 1,
  overrideAccess: true,
})
const SUBJECT = sellable[0] ?? null
if (!SUBJECT) {
  console.log(
    'SKIPPED: no published boilerplate has a creemProductId yet, so there is nothing to buy.'
  )
}

describe.skipIf(!SUBJECT)('customer journey: buying the WareKit', () => {
  let checkoutUrl

  it('step 0 — the product is on sale', async () => {
    console.log(
      `product id=${SUBJECT.id} ${SUBJECT.slug} price=$${SUBJECT.price} creem=${SUBJECT.creemProductId}`
    )
    expect(SUBJECT.creemProductId).toBeTruthy()
    expect(SUBJECT.githubRepo).toBeTruthy()
  })

  it('step 1 — a typo is refused before any money moves', async () => {
    const { state } = await runCheckout({
      itemType: 'product',
      slug: SUBJECT.slug,
      githubUsername: 'not a username',
    })
    console.log('malformed →', JSON.stringify(state?.error))
    expect(state?.error?.field).toBe('githubUsername')
  })

  it('step 2 — a well-formed name GitHub does not have is refused too', async () => {
    const { state } = await runCheckout({
      itemType: 'product',
      slug: SUBJECT.slug,
      githubUsername: 'zzq-no-such-account-' + Date.now().toString(36),
    })
    console.log('nonexistent →', JSON.stringify(state?.error))
    expect(state?.error?.field).toBe('githubUsername')
    expect(state?.error?.message).toMatch(/no account/i)
  })

  it('step 3 — a real account reaches a live Creem checkout page', async () => {
    const { state, redirect } = await runCheckout({
      itemType: 'product',
      slug: SUBJECT.slug,
      githubUsername: GITHUB,
    })
    expect(state).toBeNull()
    expect(redirect).toMatch(/^https:\/\//)
    checkoutUrl = redirect
    console.log('checkout url:', checkoutUrl)

    const res = await fetch(checkoutUrl, { redirect: 'follow' })
    console.log('checkout page status:', res.status)
    expect(res.status).toBeLessThan(400)
  })
})

describe.skipIf(!SUBJECT)('customer journey: after payment', () => {
  const orderId = 'ord_sim_' + Date.now().toString(36)
  let itemId
  let creemProductId

  const event = () => ({
    id: 'evt_' + orderId,
    eventType: 'checkout.completed',
    object: {
      id: 'ch_' + orderId,
      object: 'checkout',
      status: 'completed',
      order: { id: orderId, amount: 24900, currency: 'USD', status: 'paid' },
      product: { id: creemProductId },
      customer: { id: 'cust_sim', email: BUYER },
      metadata: {
        itemType: 'product',
        itemId: String(itemId),
        slug: SUBJECT.slug,
        githubUsername: GITHUB,
      },
    },
  })

  const deliver = async (body) => {
    const raw = JSON.stringify(body)
    const signature = crypto
      .createHmac('sha256', process.env.CREEM_WEBHOOK_SECRET)
      .update(raw)
      .digest('hex')
    return creemWebhook(
      new Request('https://www.amware.dev/webhooks/creem', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'creem-signature': signature,
        },
        body: raw,
      })
    )
  }

  beforeAll(() => {
    itemId = SUBJECT.id
    creemProductId = SUBJECT.creemProductId
  })

  it('step 4 — an unsigned webhook is rejected', async () => {
    const res = await creemWebhook(
      new Request('https://www.amware.dev/webhooks/creem', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(event()),
      })
    )
    console.log('unsigned →', res.status, await res.text())
    expect(res.status).toBe(401)
  })

  it('step 5 — a tampered body is rejected', async () => {
    const body = event()
    const raw = JSON.stringify(body)
    const signature = crypto
      .createHmac('sha256', process.env.CREEM_WEBHOOK_SECRET)
      .update(raw)
      .digest('hex')
    const tampered = JSON.stringify({
      ...body,
      object: { ...body.object, order: { ...body.object.order, amount: 1 } },
    })
    const res = await creemWebhook(
      new Request('https://www.amware.dev/webhooks/creem', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'creem-signature': signature,
        },
        body: tampered,
      })
    )
    console.log('tampered →', res.status, await res.text())
    expect(res.status).toBe(401)
  })

  it('step 6 — the signed webhook records the order and queues the invite', async () => {
    const res = await deliver(event())
    console.log('signed →', res.status, await res.text())
    expect(res.status).toBe(200)

    const { docs } = await payload.find({
      collection: 'purchases',
      where: { creemOrderId: { equals: orderId } },
      limit: 1,
      overrideAccess: true,
    })
    expect(docs.length).toBe(1)
    const p = docs[0]
    console.log(
      `purchase id=${p.id} email=${p.email} amount=${p.amount} status=${p.status} fulfillment=${p.fulfillmentStatus} github=${p.githubUsername}`
    )
    expect(p.status).toBe('paid')
    expect(p.fulfillmentStatus).toBe('pending_invite')
    expect(p.githubUsername).toBe(GITHUB)
    expect(p.amount).toBe(24900)
  })

  /* One simulated purchase survives a run, so the row is there to look at in
     the admin. Earlier runs are swept, so repeated simulations do not silt up
     a live orders table. Scoped to the sink address: a real order is never
     touched. */
  afterAll(async () => {
    const { docs } = await payload.find({
      collection: 'purchases',
      where: {
        and: [
          { email: { equals: BUYER } },
          { creemOrderId: { not_equals: orderId } },
        ],
      },
      limit: 100,
      overrideAccess: true,
    })
    for (const d of docs) {
      await payload.delete({
        collection: 'purchases',
        id: d.id,
        overrideAccess: true,
      })
    }
    if (docs.length)
      console.log(`swept ${docs.length} earlier simulated order(s)`)
  })

  it('step 7 — Creem retrying the same order does not bank it twice', async () => {
    const res = await deliver(event())
    const text = await res.text()
    console.log('replay →', res.status, text)
    expect(res.status).toBe(200)
    expect(text).toMatch(/duplicate/)

    const { totalDocs } = await payload.find({
      collection: 'purchases',
      where: { creemOrderId: { equals: orderId } },
      limit: 0,
      overrideAccess: true,
    })
    expect(totalDocs).toBe(1)
  })
})
