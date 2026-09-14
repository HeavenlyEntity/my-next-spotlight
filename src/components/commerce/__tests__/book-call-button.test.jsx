import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'

vi.mock('@calcom/embed-react', () => ({ getCalApi: vi.fn() }))

import { getCalApi } from '@calcom/embed-react'
import { BookCallButton } from '@/components/commerce/BookCallButton'

/* What the embed is told, and what a confirmed booking turns into. The Cal
   API is a function that takes a command name, so the mock records every
   call and the test replays the one that matters. */

let cal
let track

beforeEach(() => {
  cal = vi.fn()
  getCalApi.mockResolvedValue(cal)
  track = vi.fn()
  window.whop = { track }
})

afterEach(() => {
  delete window.whop
})

const calls = (name) => cal.mock.calls.filter(([c]) => c === name)

describe('BookCallButton', () => {
  it('renders the element-click embed the Cal script looks for', () => {
    render(
      <BookCallButton
        calLink="amware/on-demand-outcome"
        namespace="on-demand-outcome"
        serviceName="On-Demand CTO"
      >
        Book
      </BookCallButton>
    )
    const button = screen.getByRole('button', { name: 'Book' })
    expect(button).toHaveAttribute('type', 'button')
    expect(button).toHaveAttribute('data-cal-link', 'amware/on-demand-outcome')
    expect(button).toHaveAttribute('data-cal-namespace', 'on-demand-outcome')
    expect(button).toHaveAttribute('data-cal-config', '{"layout":"month_view"}')
  })

  it('brands the popup with the Cal.com snippet values', async () => {
    render(
      <BookCallButton calLink="a/b" namespace="branding" serviceName="X">
        Book
      </BookCallButton>
    )
    await waitFor(() =>
      expect(getCalApi).toHaveBeenCalledWith({ namespace: 'branding' })
    )
    await waitFor(() => expect(calls('ui')).toHaveLength(1))
    expect(calls('ui')[0][1]).toEqual({
      cssVarsPerTheme: {
        light: { 'cal-brand': '#3fc5ac' },
        dark: { 'cal-brand': '#3fc5ac' },
      },
      hideEventTypeDetails: false,
      layout: 'month_view',
    })
  })

  it('reports a confirmed booking as a schedule event keyed on the booking uid', async () => {
    render(
      <BookCallButton
        calLink="a/b"
        namespace="schedule-ns"
        serviceName="Advisor"
      >
        Book
      </BookCallButton>
    )
    await waitFor(() => expect(calls('on')).toHaveLength(1))
    const { action, callback } = calls('on')[0][1]
    expect(action).toBe('bookingSuccessfulV2')

    callback({ detail: { data: { uid: 'bk_9', title: 'Intro' } } })

    expect(track).toHaveBeenCalledTimes(1)
    expect(track).toHaveBeenCalledWith('schedule', {
      event_id: 'bk_9',
      content_name: 'Advisor',
    })
  })

  it('listens once per namespace, however many cards share it', async () => {
    render(
      <>
        <BookCallButton calLink="a/b" namespace="shared-ns" serviceName="One">
          One
        </BookCallButton>
        <BookCallButton calLink="a/c" namespace="shared-ns" serviceName="Two">
          Two
        </BookCallButton>
      </>
    )
    await waitFor(() => expect(calls('ui')).toHaveLength(2))
    expect(calls('on')).toHaveLength(1)
  })
})
