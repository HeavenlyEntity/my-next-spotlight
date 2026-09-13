import { describe, expect, it, vi, beforeEach } from 'vitest'
import { render, screen, waitFor, fireEvent } from '@testing-library/react'

/* The action lives in src/lib but is tested from here on purpose: vitest's
   engine project has no `@/` alias, and checkout.ts imports through it, so a
   test placed beside the action would fail to resolve its own subject. */
vi.mock('@/lib/getPayloadClient', () => ({ getPayloadClient: vi.fn() }))
vi.mock('@/lib/commerce/creem', () => ({ createCheckoutSession: vi.fn() }))
vi.mock('next/navigation', () => ({
  redirect: vi.fn(() => {
    throw new Error('NEXT_REDIRECT')
  }),
}))

import { getPayloadClient } from '@/lib/getPayloadClient'
import { createCheckoutSession } from '@/lib/commerce/creem'
import { createCheckout } from '@/lib/commerce/checkout'
import { verifyOnboardingLink } from '@/lib/commerce/onboardingLink'
import { BuyButton } from '@/components/commerce/BuyButton'

const boilerplate = {
  id: 7,
  slug: 'saas-kit',
  type: 'boilerplate',
  creemProductId: 'prod_1',
}

const form = (fields) => {
  const fd = new FormData()
  for (const [k, v] of Object.entries(fields)) fd.set(k, v)
  return fd
}

const withItem = (item) =>
  getPayloadClient.mockResolvedValue({
    find: vi.fn().mockResolvedValue({ docs: item ? [item] : [] }),
  })

const buy = (over = {}) =>
  createCheckout(
    { error: null },
    form({ itemType: 'product', slug: 'saas-kit', ...over })
  )

beforeEach(() => {
  vi.clearAllMocks()
  process.env.NEXT_PUBLIC_SITE_URL = 'https://example.com'
  process.env.ACCESS_LINK_SECRET = 'checkout-test-secret'
  createCheckoutSession.mockResolvedValue({ checkoutUrl: 'https://creem/x' })
})

describe('createCheckout', () => {
  it('no longer asks for a GitHub username to take payment', async () => {
    withItem(boilerplate)
    /* It used to refuse a boilerplate without one. The username is collected
       after payment now, so a checkout with nothing but the item must go
       straight through -- a field between someone and a purchase they have
       already decided on is a field that costs sales. */
    await expect(buy()).rejects.toThrow(/NEXT_REDIRECT/)
    expect(createCheckoutSession).toHaveBeenCalled()
  })

  it('sends no username to Creem even if one is posted', async () => {
    withItem(boilerplate)
    await expect(buy({ githubUsername: 'octocat' })).rejects.toThrow()
    const { metadata } = createCheckoutSession.mock.calls[0][0]
    // Nothing downstream reads it any more, and carrying it would leave two
    // sources of truth for which account the kit goes to.
    expect(metadata).not.toHaveProperty('githubUsername')
    expect(metadata).toMatchObject({ itemType: 'product', slug: 'saas-kit' })
  })

  it('returns a form error when the item is not purchasable yet', async () => {
    withItem({ ...boilerplate, creemProductId: undefined })
    const state = await buy()
    expect(state.error?.message).toMatch(/not on sale yet/i)
    // The buyer never reaches Creem, so nothing was charged or reserved.
    expect(createCheckoutSession).not.toHaveBeenCalled()
  })

  it('signs the return URL so onboarding can recognise the buyer', async () => {
    withItem(boilerplate)
    await expect(buy()).rejects.toThrow()
    const { successUrl, requestId } = createCheckoutSession.mock.calls[0][0]
    const url = new URL(successUrl)
    expect(url.pathname).toBe('/checkout/onboarding')
    // The id Creem echoes back on the webhook is the thread between the
    // redirect and the purchase row.
    expect(url.searchParams.get('r')).toBe(requestId)
    expect(
      verifyOnboardingLink(url.searchParams.get('r'), url.searchParams.get('s'))
    ).toBe(true)
  })

  it('refuses to sell a KIT it cannot hand over afterwards', async () => {
    withItem(boilerplate)
    delete process.env.ACCESS_LINK_SECRET
    delete process.env.ACCESS_TOKEN_SECRET
    /* Without a signing secret the return URL cannot be proven later, so the
       buyer would pay and land on a page unable to recognise them. Better to
       fail before the money than after it. */
    await expect(buy()).rejects.toThrow(/ACCESS_LINK_SECRET/)
    expect(createCheckoutSession).not.toHaveBeenCalled()
  })

  it('sends a digital download to the plain success page, not onboarding', async () => {
    /* A guide has no repository and its buyer has no GitHub username to
       give. Sending them to a page that demands one would ask for something
       they do not have, for a product that cannot use it. */
    withItem({ ...boilerplate, type: 'digital' })
    await expect(buy()).rejects.toThrow(/NEXT_REDIRECT/)
    const { successUrl } = createCheckoutSession.mock.calls[0][0]
    expect(new URL(successUrl).pathname).toBe('/checkout/success')
  })

  it('does not make the signing secret a condition of selling a guide', async () => {
    withItem({ ...boilerplate, type: 'digital' })
    delete process.env.ACCESS_LINK_SECRET
    delete process.env.ACCESS_TOKEN_SECRET
    // The $12 guide is the one product currently on sale. Requiring a secret
    // it never uses would have taken it down on deploy.
    await expect(buy()).rejects.toThrow(/NEXT_REDIRECT/)
    expect(createCheckoutSession).toHaveBeenCalled()
  })

  it('still throws for a genuine fault rather than a polite message', async () => {
    withItem(boilerplate)
    delete process.env.NEXT_PUBLIC_SITE_URL
    await expect(buy()).rejects.toThrow(/NEXT_PUBLIC_SITE_URL/)
  })
})

describe('BuyButton', () => {
  it('is just the button now', () => {
    render(
      <BuyButton itemType="product" slug="saas-kit" label="Buy this kit" />
    )
    expect(screen.queryByLabelText(/github username/i)).toBeNull()
    expect(screen.queryByRole('alert')).toBeNull()
    expect(
      screen.getByRole('button', { name: 'Buy this kit' })
    ).toBeInTheDocument()
  })

  it('shows a form error and moves focus to it', async () => {
    withItem({ ...boilerplate, creemProductId: undefined })
    render(<BuyButton itemType="product" slug="saas-kit" />)
    fireEvent.submit(screen.getByRole('button').closest('form'))

    const alert = await screen.findByRole('alert')
    expect(alert).toHaveTextContent(/not on sale yet/i)
    /* Focused, not merely announced: it is the only thing that changed, and
       it sits below the button that was just pressed. */
    await waitFor(() => expect(document.activeElement).toBe(alert))
  })

  it('carries the item through hidden fields', () => {
    const { container } = render(
      <BuyButton itemType="product" slug="saas-kit" />
    )
    expect(container.querySelector('[name="itemType"]')).toHaveValue('product')
    expect(container.querySelector('[name="slug"]')).toHaveValue('saas-kit')
  })
})
