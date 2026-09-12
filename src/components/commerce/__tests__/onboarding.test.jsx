import { describe, expect, it, vi, beforeEach } from 'vitest'

vi.mock('@/lib/getPayloadClient', () => ({ getPayloadClient: vi.fn() }))
vi.mock('@/lib/commerce/githubInvite', () => ({ inviteToRepo: vi.fn() }))
vi.mock('@/lib/commerce/fulfillment', () => ({
  sendBoilerplateConfirmationEmail: vi.fn(),
}))

import { getPayloadClient } from '@/lib/getPayloadClient'
import { inviteToRepo } from '@/lib/commerce/githubInvite'
import { sendBoilerplateConfirmationEmail } from '@/lib/commerce/fulfillment'
import { onboardingSignature } from '@/lib/commerce/onboardingLink'
import { completeOnboarding } from '@/lib/commerce/onboarding'

const REQ = 'req-abc-123'
const REPO = 'amwaredotdev/warekit-next-netsuite'
const update = vi.fn()

const withPurchase = (over) => {
  const docs =
    over === null
      ? []
      : [
          {
            id: 42,
            email: 'buyer@example.com',
            status: 'paid',
            item: {
              relationTo: 'products',
              value: { name: 'Team kit', githubRepo: REPO },
            },
            ...over,
          },
        ]
  update.mockResolvedValue({})
  getPayloadClient.mockResolvedValue({
    find: vi.fn().mockResolvedValue({ docs }),
    update,
  })
}

const run = (fields = {}) => {
  const fd = new FormData()
  fd.set('r', REQ)
  fd.set('s', onboardingSignature(REQ))
  fd.set('githubUsername', 'octocat')
  for (const [k, v] of Object.entries(fields)) fd.set(k, v)
  return completeOnboarding({ error: null, ok: null }, fd)
}

beforeEach(() => {
  vi.clearAllMocks()
  process.env.ACCESS_LINK_SECRET = 'onboarding-secret'
  global.fetch = vi.fn().mockResolvedValue({ status: 200, ok: true })
  inviteToRepo.mockResolvedValue({
    ok: true,
    state: 'invited',
    url: `https://github.com/${REPO}/invitations`,
  })
})

describe('completeOnboarding — proving the visitor paid', () => {
  it('refuses a forged request id', async () => {
    withPurchase({})
    /* Without the signature, /checkout/onboarding?r=<guess> would hand a
       stranger a $999 kit. This is the gate that stops it. */
    const state = await run({ r: 'some-other-id' })
    expect(state.error?.message).toMatch(/not valid/i)
    expect(inviteToRepo).not.toHaveBeenCalled()
  })

  it('refuses a signature made with a different secret', async () => {
    withPurchase({})
    const fd = new FormData()
    fd.set('r', REQ)
    fd.set('s', onboardingSignature(REQ))
    fd.set('githubUsername', 'octocat')
    process.env.ACCESS_LINK_SECRET = 'not-the-same-secret'
    const state = await completeOnboarding({ error: null, ok: null }, fd)
    expect(state.error?.message).toMatch(/not valid/i)
    expect(inviteToRepo).not.toHaveBeenCalled()
  })

  it('refuses a signed link with no payment behind it', async () => {
    /* The link is minted at checkout, before payment, so someone can hold a
       perfectly valid one and never pay. Only the webhook creates the row. */
    withPurchase(null)
    const state = await run()
    expect(state.error?.message).toMatch(/has not reached me yet/i)
    expect(inviteToRepo).not.toHaveBeenCalled()
  })

  it('refuses a purchase that is not paid', async () => {
    withPurchase({ status: 'refunded' })
    const state = await run()
    expect(state.error).toBeTruthy()
    expect(inviteToRepo).not.toHaveBeenCalled()
  })

  it('looks the purchase up by request id, never by anything guessable', async () => {
    withPurchase({})
    await run()
    const client = await getPayloadClient.mock.results[0].value
    expect(client.find).toHaveBeenCalledWith(
      expect.objectContaining({
        collection: 'purchases',
        where: { creemRequestId: { equals: REQ } },
      })
    )
  })
})

describe('completeOnboarding — delivery', () => {
  it('invites the account and records it as seat one', async () => {
    withPurchase({})
    const state = await run()
    expect(state.error).toBeNull()
    expect(inviteToRepo).toHaveBeenCalledWith({
      repo: REPO,
      username: 'octocat',
    })
    const data = update.mock.calls[0][0].data
    expect(data.githubUsername).toBe('octocat')
    expect(data.fulfillmentStatus).toBe('sent')
    expect(data.seatMembers[0].githubUsername).toBe('octocat')
  })

  it('records the username even when the invitation could not be sent', async () => {
    withPurchase({})
    inviteToRepo.mockResolvedValue({ ok: false, reason: 'not-configured' })
    const state = await run()
    expect(state.ok?.manual).toBe(true)
    /* Losing the answer because GitHub was down would mean asking a paying
       customer the same question twice. */
    expect(update.mock.calls[0][0].data.githubUsername).toBe('octocat')
    expect(update.mock.calls[0][0].data.fulfillmentStatus).toBe(
      'pending_invite'
    )
  })

  it('rejects a malformed username before touching GitHub', async () => {
    withPurchase({})
    const state = await run({ githubUsername: 'not a username' })
    expect(state.error?.field).toBe('githubUsername')
    expect(global.fetch).not.toHaveBeenCalled()
  })

  it('rejects an account GitHub says does not exist', async () => {
    withPurchase({})
    global.fetch = vi.fn().mockResolvedValue({ status: 404, ok: false })
    const state = await run({ githubUsername: 'ghost' })
    expect(state.error?.field).toBe('githubUsername')
    expect(inviteToRepo).not.toHaveBeenCalled()
  })

  it('proceeds when GitHub cannot be reached, because they already paid', async () => {
    withPurchase({})
    global.fetch = vi.fn().mockRejectedValue(new Error('ETIMEDOUT'))
    const state = await run()
    expect(state.error).toBeNull()
    expect(inviteToRepo).toHaveBeenCalled()
  })

  it('still succeeds when the confirmation email fails', async () => {
    withPurchase({})
    sendBoilerplateConfirmationEmail.mockRejectedValue(new Error('down'))
    const state = await run()
    expect(state.ok).toBeTruthy()
  })

  it('refuses a kit with no repository rather than recording a dead end', async () => {
    withPurchase({
      item: {
        relationTo: 'products',
        value: { name: 'Kit', githubRepo: null },
      },
      githubRepo: null,
    })
    const state = await run()
    expect(state.error?.message).toMatch(/no repository/i)
    expect(inviteToRepo).not.toHaveBeenCalled()
  })
})
