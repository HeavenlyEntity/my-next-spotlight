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

beforeEach(() => {
  vi.clearAllMocks()
  process.env.NEXT_PUBLIC_SITE_URL = 'https://example.com'
})

describe('createCheckout error contract', () => {
  it('returns a field error for a boilerplate with no GitHub username', async () => {
    withItem(boilerplate)
    const state = await createCheckout(
      { error: null },
      form({ itemType: 'product', slug: 'saas-kit' })
    )
    expect(state.error?.field).toBe('githubUsername')
    expect(state.error?.message).toMatch(/github username/i)
    // The buyer never reaches Creem, so nothing was charged or reserved.
    expect(createCheckoutSession).not.toHaveBeenCalled()
  })

  it('returns a form error when the item is not purchasable yet', async () => {
    withItem({ ...boilerplate, creemProductId: undefined })
    const state = await createCheckout(
      { error: null },
      form({ itemType: 'product', slug: 'saas-kit', githubUsername: 'octocat' })
    )
    expect(state.error?.field).toBeNull()
    expect(state.error?.message).toMatch(/not on sale yet/i)
  })

  it('still throws for a genuine fault rather than returning a polite message', async () => {
    withItem(boilerplate)
    delete process.env.NEXT_PUBLIC_SITE_URL
    await expect(
      createCheckout(
        { error: null },
        form({
          itemType: 'product',
          slug: 'saas-kit',
          githubUsername: 'octocat',
        })
      )
    ).rejects.toThrow(/NEXT_PUBLIC_SITE_URL/)
  })
})

describe('BuyButton error presentation', () => {
  it('renders no error before submission', () => {
    render(<BuyButton itemType="product" slug="saas-kit" isBoilerplate />)
    expect(screen.queryByRole('alert')).toBeNull()
    // Absent, not "false": an untouched field is not invalid.
    expect(screen.getByLabelText(/github username/i)).not.toHaveAttribute(
      'aria-invalid'
    )
  })

  it('attaches a field error to the input it belongs to and focuses it', async () => {
    withItem(boilerplate)
    render(<BuyButton itemType="product" slug="saas-kit" isBoilerplate />)

    const input = screen.getByLabelText(/github username/i)
    // Bypass the browser's own required check to reach the server contract.
    input.removeAttribute('required')
    fireEvent.submit(input.closest('form'))

    const alert = await screen.findByRole('alert')
    expect(alert).toHaveTextContent(/github username/i)
    // The message is reachable from the field, not just visually near it.
    expect(input).toHaveAttribute('aria-describedby', alert.id)
    expect(input).toHaveAttribute('aria-invalid', 'true')
    await waitFor(() => expect(document.activeElement).toBe(input))
  })

  it('renders a form-level error with no field to attach to', async () => {
    withItem({ ...boilerplate, creemProductId: undefined })
    render(<BuyButton itemType="product" slug="saas-kit" isBoilerplate />)

    const input = screen.getByLabelText(/github username/i)
    fireEvent.change(input, { target: { value: 'octocat' } })
    fireEvent.submit(input.closest('form'))

    const alert = await screen.findByRole('alert')
    expect(alert).toHaveTextContent(/not on sale yet/i)
    expect(input).not.toHaveAttribute('aria-describedby')
  })
})
