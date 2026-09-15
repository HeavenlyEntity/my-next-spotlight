import { describe, expect, it } from 'vitest'
import fs from 'node:fs/promises'
import path from 'node:path'
import { getPayload } from 'payload'
import config from '@payload-config'
import { WHOP_ACCOUNT_ID, whopRequest } from '@/lib/commerce/whop'

/* Whop, set up for the engagements. Live account, real objects, nothing
   charged: one hidden product, one one-time deposit plan per published
   retainer, one webhook. Every step looks before it creates, so running
   this twice changes nothing, and each plan id is written onto its service
   so the card can offer the deposit.
 *
 * The webhook secret is shown ONCE by Whop, on creation. This prints it in
 * a banner; store it as WHOP_WEBHOOK_SECRET in .env.local and in Vercel
 * production, or the route answers 401 to everything. */

const PRODUCT_TITLE = 'Anti-Slop Alec engagements'
const WEBHOOK_URL =
  process.env.WHOP_WEBHOOK_URL || 'https://www.amware.dev/webhooks/whop'
const DEFAULT_DEPOSIT = 1500

const list = async (path) => (await whopRequest(path)).data ?? []

describe('Whop engagements', () => {
  let payload
  let product

  it('has the product', async () => {
    payload = await getPayload({ config })
    const products = await list(`/products?account_id=${WHOP_ACCOUNT_ID}`)
    product = products.find((p) => p.title === PRODUCT_TITLE)
    if (!product) {
      product = await whopRequest('/products', {
        method: 'POST',
        body: {
          account_id: WHOP_ACCOUNT_ID,
          title: PRODUCT_TITLE,
          description:
            'The deposit that starts a retainer with Alec Mingione. Credited in full against the first month.',
          visibility: 'hidden',
          metadata: { source: 'amware.dev', kind: 'engagement-deposit' },
        },
      })
      console.log(`created product ${product.id}`)
    } else {
      console.log(`product exists ${product.id}`)
    }
    expect(product.id).toMatch(/^prod_/)
  })

  it('has a deposit plan for every published retainer, written onto the service', async () => {
    const { docs } = await payload.find({
      collection: 'services',
      where: {
        and: [
          { status: { equals: 'published' } },
          { bookingUrl: { exists: true } },
        ],
      },
      limit: 20,
      overrideAccess: true,
    })
    expect(docs.length).toBeGreaterThan(0)

    const plans = await list(
      `/plans?account_id=${WHOP_ACCOUNT_ID}&product_id=${product.id}`
    )

    for (const service of docs) {
      const note = `deposit:${service.slug}`
      const deposit =
        typeof service.depositAmount === 'number'
          ? service.depositAmount
          : DEFAULT_DEPOSIT
      let plan = plans.find(
        (p) => p.internal_notes === note || p.metadata?.slug === service.slug
      )
      if (!plan) {
        plan = await whopRequest('/plans', {
          method: 'POST',
          body: {
            account_id: WHOP_ACCOUNT_ID,
            product_id: product.id,
            plan_type: 'one_time',
            initial_price: deposit,
            currency: 'usd',
            release_method: 'buy_now',
            visibility: 'quick_link',
            title: `${service.name} deposit`,
            description: `Reserves your start on the ${service.name} retainer. Credited in full against your first month.`,
            internal_notes: note,
            metadata: { slug: service.slug, kind: 'deposit' },
          },
        })
        console.log(`created plan ${plan.id} for ${service.slug} ($${deposit})`)
      } else {
        console.log(`plan exists ${plan.id} for ${service.slug}`)
      }
      expect(plan.id).toMatch(/^plan_/)

      if (service.whopPlanId !== plan.id || service.depositAmount !== deposit) {
        await payload.update({
          collection: 'services',
          id: service.id,
          overrideAccess: true,
          data: { whopPlanId: plan.id, depositAmount: deposit },
        })
      }
    }
  })

  it('has the webhook', async () => {
    const hooks = await list(`/webhooks?account_id=${WHOP_ACCOUNT_ID}`)
    let hook = hooks.find((h) => h.url === WEBHOOK_URL)
    if (!hook) {
      hook = await whopRequest('/webhooks', {
        method: 'POST',
        body: {
          url: WEBHOOK_URL,
          events: ['payment.succeeded', 'payment.failed'],
          /* New webhooks are always v1 envelopes; the dated pin fixes the
             payload shape (this date carries `account_id`, older ones
             `company_id`) so a Whop change cannot silently reshape events. */
          api_version_date: '2026-08-14',
          enabled: true,
          resource_id: WHOP_ACCOUNT_ID,
        },
      })
      /* Whop shows the secret exactly once, and vitest does not reliably
         print console output, so it goes to a file rather than the log.
         Store it as WHOP_WEBHOOK_SECRET in .env.local and in Vercel
         production, then delete the file. */
      const out =
        process.env.WHOP_WEBHOOK_SECRET_FILE ||
        path.join(process.cwd(), '.whop-webhook-secret')
      await fs.writeFile(out, `${hook.webhook_secret}\n`, { mode: 0o600 })
      console.log(`WHOP WEBHOOK CREATED ${hook.id}; secret written to ${out}`)
    } else {
      console.log(`webhook exists ${hook.id} -> ${hook.url}`)
    }
    expect(hook.id).toMatch(/^hook_|^wh_|^web_/)
  })
})
