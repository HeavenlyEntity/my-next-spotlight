import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { act, render, screen } from '@testing-library/react'

/* Same harness as the job offer calculator's tests: hydration resolves after
   mount, so the flags below let a test drive the pre-hydration frame. */
let hydratedFlag = true
let pendingHydration = null

vi.mock('motion/react', async (importOriginal) => {
  const actual = await importOriginal()
  return { ...actual, AnimatePresence: ({ children }) => children }
})

vi.mock('@/lib/founders/offer-store', async (importOriginal) => {
  const actual = await importOriginal()
  return {
    ...actual,
    hasHydrated: () => hydratedFlag,
    onHydrated: (fn) => {
      pendingHydration = fn
      return () => {
        pendingHydration = null
      }
    },
  }
})

const { INITIAL, useOfferStore } = await import('@/lib/founders/offer-store')
const { default: EquityCalculator } = await import('../EquityCalculator')

beforeEach(() => {
  hydratedFlag = true
  pendingHydration = null
  useOfferStore.setState({ ...INITIAL })
})

afterEach(() => {
  vi.restoreAllMocks()
})

describe('the hand-off from the job offer calculator (T7)', () => {
  it('opens on the answers already in the store, not an empty wizard', () => {
    /* "See how the equity band was sized" is a link off the ask ladder. If
       this page ignored the store, that link would drop someone into a blank
       three-step form and ask them to retype what they just answered. */
    useOfferStore.setState({
      role: 'engineer',
      stage: 'series_a',
      joining: 'hired_after',
      offeredSalary: 175_000,
    })
    render(<EquityCalculator />)

    const engineer = screen.getByRole('radio', { name: /software engineer/i })
    expect(engineer).toHaveAttribute('aria-checked', 'true')
    const cto = screen.getByRole('radio', { name: /^CTO$/i })
    expect(cto).toHaveAttribute('aria-checked', 'false')
  })

  it('leaves its own defaults alone when the store is untouched', () => {
    /* A pristine store holds the same shape as INITIAL. Copying it in would be
       a no-op at best and, once the two default sets drift, a silent override
       of this wizard's own defaults by the other tool's. */
    render(<EquityCalculator />)
    expect(screen.getByRole('radio', { name: /^CTO$/i })).toHaveAttribute(
      'aria-checked',
      'true'
    )
  })

  it('holds a skeleton rather than painting defaults before hydration', () => {
    hydratedFlag = false
    const { container } = render(<EquityCalculator />)
    expect(screen.queryByRole('radio', { name: /^CTO$/i })).toBeNull()
    expect(container.querySelector('.animate-pulse')).toBeInTheDocument()
  })

  it('seeds when persisted answers arrive after mount', () => {
    hydratedFlag = false
    render(<EquityCalculator />)
    useOfferStore.setState({ role: 'engineer' })
    act(() => {
      hydratedFlag = true
      pendingHydration?.()
    })
    expect(
      screen.getByRole('radio', { name: /software engineer/i })
    ).toHaveAttribute('aria-checked', 'true')
  })
})

describe('the privacy claim and the control that keeps it true (D3)', () => {
  it('says nothing leaves the browser and offers a way to empty it', () => {
    useOfferStore.setState({ role: 'engineer' })
    render(<EquityCalculator />)
    expect(screen.getByText(/nothing leaves your browser/i)).toBeInTheDocument()

    act(() => {
      screen.getByRole('button', { name: /clear my answers/i }).click()
    })
    /* Both halves: the shared store and this wizard's own local copy. */
    expect(useOfferStore.getState().isPristine()).toBe(true)
    expect(screen.getByRole('radio', { name: /^CTO$/i })).toHaveAttribute(
      'aria-checked',
      'true'
    )
  })
})
