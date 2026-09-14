import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'

/* Whop's embed is an iframe loader; here it is a stub that records its
   props and offers a button that stands in for a completed payment. */
vi.mock('@whop/checkout/react', () => ({
  WhopCheckoutEmbed: (props) => (
    <div data-testid="embed" data-plan={props.planId} data-theme={props.theme}>
      <button
        type="button"
        onClick={() => props.onComplete('plan_x', 'rcpt_1')}
      >
        simulate payment
      </button>
    </div>
  ),
}))

import { DepositCheckout } from '../DepositCheckout'

let track

beforeEach(() => {
  track = vi.fn()
  window.whop = { track }
})

afterEach(() => {
  delete window.whop
  document.documentElement.classList.remove('dark')
})

const open = () =>
  fireEvent.click(screen.getByRole('button', { name: /reserve your start/i }))

describe('DepositCheckout', () => {
  it('opens a sheet with the embed for the service plan, and reports begin_checkout', () => {
    render(
      <DepositCheckout planId="plan_dep" serviceName="Advisor" amount={1500}>
        Reserve your start
      </DepositCheckout>
    )
    expect(screen.queryByTestId('embed')).toBeNull()
    open()
    expect(screen.getByRole('dialog')).toBeInTheDocument()
    expect(screen.getByTestId('embed')).toHaveAttribute('data-plan', 'plan_dep')
    expect(screen.getByText(/\$1,500 deposit for Advisor/)).toBeInTheDocument()
    expect(track).toHaveBeenCalledWith('begin_checkout', {
      value: 1500,
      currency: 'USD',
      content_type: 'deposit',
      content_id: 'plan_dep',
      content_name: 'Advisor',
    })
  })

  it('never reports purchase itself: Whop processed the sale and reports it', () => {
    render(
      <DepositCheckout planId="plan_dep" serviceName="Advisor" amount={1500}>
        Reserve your start
      </DepositCheckout>
    )
    open()
    fireEvent.click(screen.getByRole('button', { name: 'simulate payment' }))
    expect(track.mock.calls.map(([e]) => e)).not.toContain('purchase')
  })

  it('shows the received state with the booking link once payment completes', () => {
    render(
      <DepositCheckout
        planId="plan_dep"
        serviceName="Advisor"
        amount={1500}
        bookingUrl="https://cal.com/amware/on-demand-outcome"
      >
        Reserve your start
      </DepositCheckout>
    )
    open()
    fireEvent.click(screen.getByRole('button', { name: 'simulate payment' }))
    expect(screen.getByRole('status')).toHaveTextContent('Deposit received')
    expect(
      screen.getByRole('link', { name: /book the intro call/i })
    ).toHaveAttribute('href', 'https://cal.com/amware/on-demand-outcome')
    expect(screen.queryByTestId('embed')).toBeNull()
  })

  it('tells the embed which theme the page is in', () => {
    document.documentElement.classList.add('dark')
    render(
      <DepositCheckout planId="plan_dep" serviceName="Advisor">
        Reserve your start
      </DepositCheckout>
    )
    open()
    expect(screen.getByTestId('embed')).toHaveAttribute('data-theme', 'dark')
  })
})
