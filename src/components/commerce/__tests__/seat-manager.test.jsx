import { describe, expect, it, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'

/* From the components project: addSeat imports through the `@/` alias, which
   the engine project does not define. */
vi.mock('@/lib/getPayloadClient', () => ({ getPayloadClient: vi.fn() }))
vi.mock('@/lib/commerce/githubInvite', () => ({ inviteToRepo: vi.fn() }))

import { getPayloadClient } from '@/lib/getPayloadClient'
import { inviteToRepo } from '@/lib/commerce/githubInvite'
import { createAccessToken } from '@/lib/commerce/accessToken'
import { addSeat } from '@/lib/commerce/addSeat'
import { SeatManager } from '@/components/commerce/SeatManager'

const REPO = 'amwaredotdev/warekit-next-netsuite'

const teamProduct = { id: 7, name: 'Team kit', seats: 5, githubRepo: REPO }

const update = vi.fn()

const withPurchase = (over = {}) => {
  const purchase = {
    id: 42,
    status: 'paid',
    githubUsername: 'owner',
    item: { relationTo: 'products', value: teamProduct },
    seatMembers: [{ githubUsername: 'owner' }],
    ...over,
  }
  update.mockResolvedValue({})
  getPayloadClient.mockResolvedValue({
    findByID: vi.fn().mockResolvedValue(purchase),
    update,
  })
  return purchase
}

const token = () =>
  createAccessToken({ purchaseId: 42, itemType: 'product', itemId: 7 }).token

const add = (username, tok) => {
  const fd = new FormData()
  fd.set('token', tok ?? token())
  fd.set('githubUsername', username)
  return addSeat({ error: null, ok: null, seats: null }, fd)
}

beforeEach(() => {
  vi.clearAllMocks()
  process.env.ACCESS_LINK_SECRET = 'seat-test-secret'
  global.fetch = vi.fn().mockResolvedValue({ status: 200, ok: true })
  inviteToRepo.mockResolvedValue({
    ok: true,
    state: 'invited',
    url: `https://github.com/${REPO}/invitations`,
    id: 1,
  })
})

describe('addSeat — the link is the authentication', () => {
  it('refuses a token that was not signed by us', async () => {
    withPurchase()
    const state = await add('octocat', 'not.a.real.token')
    expect(state.error?.message).toMatch(/no longer valid/i)
    expect(inviteToRepo).not.toHaveBeenCalled()
  })

  it('refuses a token signed with a different secret', async () => {
    withPurchase()
    const tok = token()
    process.env.ACCESS_LINK_SECRET = 'a-different-secret'
    const state = await add('octocat', tok)
    expect(state.error?.message).toMatch(/no longer valid/i)
    expect(inviteToRepo).not.toHaveBeenCalled()
  })

  it('refuses a purchase that is not paid', async () => {
    withPurchase({ status: 'refunded' })
    const state = await add('octocat')
    expect(state.error).toBeTruthy()
    expect(inviteToRepo).not.toHaveBeenCalled()
  })
})

describe('addSeat — the licence limit', () => {
  it('adds a new account while there is room', async () => {
    withPurchase()
    const state = await add('octocat')
    expect(state.error).toBeNull()
    expect(state.seats).toEqual({ used: ['owner', 'octocat'], limit: 5 })
    expect(inviteToRepo).toHaveBeenCalledWith({
      repo: REPO,
      username: 'octocat',
    })
  })

  it('refuses the sixth account on a five-seat licence', async () => {
    withPurchase({
      seatMembers: ['a', 'b', 'c', 'd', 'e'].map((githubUsername) => ({
        githubUsername,
      })),
    })
    const state = await add('octocat')
    expect(state.error?.field).toBe('githubUsername')
    expect(state.error?.message).toMatch(/5 accounts/)
    // The limit is the product, so nothing is invited and nothing is written.
    expect(inviteToRepo).not.toHaveBeenCalled()
    expect(update).not.toHaveBeenCalled()
  })

  it('treats a product with no seats field as a single seat, not unlimited', async () => {
    withPurchase({
      item: { relationTo: 'products', value: { ...teamProduct, seats: null } },
    })
    const state = await add('octocat')
    expect(state.error?.message).toMatch(/1 account/)
    expect(inviteToRepo).not.toHaveBeenCalled()
  })

  it('re-invites someone already on a full licence without spending a seat', async () => {
    withPurchase({
      seatMembers: ['a', 'b', 'c', 'd', 'e'].map((githubUsername) => ({
        githubUsername,
      })),
    })
    const state = await add('A')
    expect(state.error).toBeNull()
    // Invited again, but not recorded again: a full team must be able to
    // re-send an invitation nobody accepted.
    expect(inviteToRepo).toHaveBeenCalled()
    expect(update).not.toHaveBeenCalled()
    expect(state.seats.used).toHaveLength(5)
  })

  it('does not let one person take two seats by changing capitalisation', async () => {
    withPurchase({ seatMembers: [{ githubUsername: 'OctoCat' }] })
    const state = await add('octocat')
    expect(state.error).toBeNull()
    expect(update).not.toHaveBeenCalled()
    expect(state.seats.used).toEqual(['OctoCat'])
  })
})

describe('addSeat — delivery', () => {
  it('records the seat with its invite link', async () => {
    withPurchase()
    await add('octocat')
    const written = update.mock.calls[0][0].data.seatMembers
    expect(written).toHaveLength(2)
    expect(written[1]).toMatchObject({
      githubUsername: 'octocat',
      inviteUrl: `https://github.com/${REPO}/invitations`,
    })
  })

  it('still records the seat when the invitation could not be sent', async () => {
    withPurchase()
    inviteToRepo.mockResolvedValue({ ok: false, reason: 'not-configured' })
    const state = await add('octocat')
    expect(state.ok?.manual).toBe(true)
    // The seat is spent either way: a human is going to finish this invite.
    expect(update).toHaveBeenCalled()
  })

  it('rejects an account GitHub says does not exist', async () => {
    withPurchase()
    global.fetch = vi.fn().mockResolvedValue({ status: 404, ok: false })
    const state = await add('ghost')
    expect(state.error?.field).toBe('githubUsername')
    expect(inviteToRepo).not.toHaveBeenCalled()
  })
})

describe('SeatManager', () => {
  const seats = { used: ['owner', 'octocat'], limit: 5 }

  it('shows seats used against the limit', () => {
    render(<SeatManager token="t" repo={REPO} initialSeats={seats} />)
    expect(screen.getByText('2 / 5')).toBeInTheDocument()
    expect(screen.getByText(/3 seats left/i)).toBeInTheDocument()
  })

  it('says every seat is in use rather than showing zero left', () => {
    render(
      <SeatManager
        token="t"
        repo={REPO}
        initialSeats={{ used: ['a', 'b', 'c', 'd', 'e'], limit: 5 }}
      />
    )
    expect(screen.getByText(/every seat in use/i)).toBeInTheDocument()
  })

  it('keeps the form usable when full, so a lapsed invite can be re-sent', () => {
    render(
      <SeatManager
        token="t"
        repo={REPO}
        initialSeats={{ used: ['a', 'b', 'c', 'd', 'e'], limit: 5 }}
      />
    )
    // A dead form with no explanation is the worse failure.
    expect(
      screen.getByRole('button', { name: /add to the licence/i })
    ).toBeEnabled()
    expect(screen.getByText(/re-send an invitation/i)).toBeInTheDocument()
  })

  it('carries the signed link with the submission', () => {
    const { container } = render(
      <SeatManager token="signed-tok" repo={REPO} initialSeats={seats} />
    )
    expect(container.querySelector('input[name="token"]')).toHaveValue(
      'signed-tok'
    )
  })

  it('links each seat to its GitHub profile', () => {
    render(<SeatManager token="t" repo={REPO} initialSeats={seats} />)
    expect(screen.getByRole('link', { name: '@octocat' })).toHaveAttribute(
      'href',
      'https://github.com/octocat'
    )
  })
})
