import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'

/* The two funnel moments that live inside commerce components. Each is
   exercised the way a person triggers it -- a submitted form -- and the only
   thing checked is what reached window.whop. The server actions behind them
   are mocked: what they do is their own tests' business. */

vi.mock('@/lib/commerce/checkout', () => ({ createCheckout: vi.fn() }))
vi.mock('@/lib/commerce/claim', () => ({ claimFreeKit: vi.fn() }))
vi.mock('@/components/commerce/GithubAccountField', () => ({
  GithubAccountField: ({ inputRef }) => (
    <input ref={inputRef} name="githubUsername" aria-label="GitHub username" />
  ),
}))

import { createCheckout } from '@/lib/commerce/checkout'
import { claimFreeKit } from '@/lib/commerce/claim'
import { BuyButton } from '@/components/commerce/BuyButton'
import { ClaimFreeKit } from '@/components/commerce/ClaimFreeKit'

let track

beforeEach(() => {
  track = vi.fn()
  window.whop = { track }
  createCheckout.mockReset()
  claimFreeKit.mockReset()
})

afterEach(() => {
  delete window.whop
})

describe('BuyButton', () => {
  it('reports begin_checkout with the price the moment the form is sent', async () => {
    createCheckout.mockResolvedValue({ error: null })
    render(
      <BuyButton
        itemType="product"
        slug="pro-kit"
        price={499}
        name="Pro kit"
        label="Buy this kit"
      />
    )

    fireEvent.submit(
      screen.getByRole('button', { name: 'Buy this kit' }).closest('form')
    )

    expect(track).toHaveBeenCalledTimes(1)
    expect(track).toHaveBeenCalledWith('begin_checkout', {
      value: 499,
      currency: 'USD',
      content_type: 'product',
      content_id: 'pro-kit',
      content_name: 'Pro kit',
    })
    await waitFor(() => expect(createCheckout).toHaveBeenCalled())
  })

  it('still reports the attempt when no price is known', () => {
    createCheckout.mockResolvedValue({ error: null })
    render(<BuyButton itemType="service" slug="advisor" name="Advisor" />)
    fireEvent.submit(screen.getByRole('button').closest('form'))
    const [event, data] = track.mock.calls[0]
    expect(event).toBe('begin_checkout')
    expect(data).not.toHaveProperty('value')
  })

  it('reports before the action runs, so a redirect cannot lose it', async () => {
    const order = []
    createCheckout.mockImplementation(async () => {
      order.push('action')
      return { error: null }
    })
    track.mockImplementation(() => order.push('track'))
    render(<BuyButton itemType="product" slug="pro-kit" price={499} />)
    fireEvent.submit(screen.getByRole('button').closest('form'))
    await waitFor(() => expect(order).toContain('action'))
    expect(order[0]).toBe('track')
  })
})

describe('ClaimFreeKit', () => {
  const claimed = {
    itemName: 'Lite kit',
    repo: 'amwaredotdev/warekit-lite',
    username: 'ada',
    inviteUrl: 'https://github.com/x/invitations',
    alreadyHadAccess: false,
    manual: false,
    eventId: 'free:lite-kit:ada',
    email: 'ada@example.com',
  }

  it('reports kit_claimed once the claim lands, keyed on the server claim id', async () => {
    claimFreeKit.mockResolvedValue({ error: null, ok: claimed })
    render(<ClaimFreeKit slug="lite-kit" />)

    fireEvent.change(screen.getByLabelText('Email'), {
      target: { value: 'ada@example.com' },
    })
    fireEvent.change(screen.getByLabelText('GitHub username'), {
      target: { value: 'ada' },
    })
    fireEvent.submit(
      screen.getByRole('button', { name: 'Get free access' }).closest('form')
    )

    await screen.findByRole('status')
    expect(track).toHaveBeenCalledTimes(1)
    expect(track).toHaveBeenCalledWith('kit_claimed', {
      event_id: 'free:lite-kit:ada',
      email: 'ada@example.com',
      content_type: 'boilerplate',
      content_id: 'lite-kit',
      content_name: 'Lite kit',
    })
  })

  it('reports nothing when the claim fails', async () => {
    claimFreeKit.mockResolvedValue({
      error: { field: 'email', message: 'Enter an email address.' },
      ok: null,
    })
    render(<ClaimFreeKit slug="lite-kit" />)
    fireEvent.submit(
      screen.getByRole('button', { name: 'Get free access' }).closest('form')
    )
    await screen.findByRole('alert')
    expect(track).not.toHaveBeenCalled()
  })
})
