import { describe, expect, it, beforeAll } from 'vitest'
import { getPayload } from 'payload'
import config from '@payload-config'
import { claimFreeKit } from '@/lib/commerce/claim'

/* The free Lite path, end to end against the real database, the real GitHub
   and real mail.
 *
 * The username is the org owner, who already has access, so GitHub answers
 * 204 and nobody is invited to anything. Point this at a stranger and the
 * simulation starts handing out repositories.
 */

const BUYER = 'delivered@resend.dev' // Resend's sink: nobody receives it
const GITHUB = 'HeavenlyEntity'
const HAS_TOKEN = Boolean(process.env.GITHUB_TOKEN)

const payload = await getPayload({ config })

const { docs: free } = await payload.find({
  collection: 'products',
  where: {
    and: [
      { type: { equals: 'boilerplate' } },
      { status: { equals: 'published' } },
      { price: { equals: 0 } },
    ],
  },
  sort: 'order',
  limit: 1,
  overrideAccess: true,
})
const KIT = free[0] ?? null
if (!KIT) console.log('SKIPPED: no published kit is priced at 0.')

const form = (fields) => {
  const fd = new FormData()
  for (const [k, v] of Object.entries(fields)) fd.set(k, v)
  return fd
}
const claim = (over = {}) =>
  claimFreeKit(
    { error: null, ok: null },
    form({
      slug: KIT.slug,
      email: BUYER,
      githubUsername: GITHUB,
      ...over,
    })
  )

describe.skipIf(!KIT)('claiming a free Lite kit', () => {
  let claimId

  beforeAll(() => {
    claimId = `free:${KIT.slug}:${GITHUB.toLowerCase()}`
    console.log(`kit: ${KIT.slug} $${KIT.price} repo=${KIT.githubRepo}`)
  })

  it('refuses to give away a kit that costs money', async () => {
    const { docs } = await payload.find({
      collection: 'products',
      where: {
        and: [
          { type: { equals: 'boilerplate' } },
          { status: { equals: 'published' } },
          { price: { greater_than: 0 } },
        ],
      },
      limit: 1,
      overrideAccess: true,
    })
    if (!docs.length) return
    const state = await claimFreeKit(
      { error: null, ok: null },
      form({ slug: docs[0].slug, email: BUYER, githubUsername: GITHUB })
    )
    console.log(`paid kit ${docs[0].slug} →`, state.error?.message)
    expect(state.error?.message).toMatch(/not available for free/i)
  })

  it('records the claim and delivers the kit', async () => {
    const state = await claim()
    console.log('claim →', JSON.stringify(state.error ?? state.ok))
    expect(state.error).toBeNull()
    expect(state.ok.repo).toBe(KIT.githubRepo)
    // With a token the invite really fires; without one it says so.
    expect(state.ok.manual).toBe(!HAS_TOKEN)

    const { docs } = await payload.find({
      collection: 'purchases',
      where: { creemOrderId: { equals: claimId } },
      limit: 1,
      overrideAccess: true,
    })
    expect(docs.length).toBe(1)
    const p = docs[0]
    console.log(
      `purchase id=${p.id} amount=${p.amount} fulfillment=${p.fulfillmentStatus} repo=${p.githubRepo}`
    )
    expect(p.amount).toBe(0)
    expect(p.githubRepo).toBe(KIT.githubRepo)
    expect(p.fulfillmentStatus).toBe(HAS_TOKEN ? 'sent' : 'pending_invite')
  })

  it('claiming twice re-sends rather than banking a second claim', async () => {
    await claim()
    const { totalDocs } = await payload.find({
      collection: 'purchases',
      where: { creemOrderId: { equals: claimId } },
      limit: 0,
      overrideAccess: true,
    })
    console.log('rows after second claim:', totalDocs)
    expect(totalDocs).toBe(1)
  })
})
