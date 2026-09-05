import { describe, expect, it, vi } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'

/*
 * The bug this exists to prevent.
 *
 * Both calculators gate their render on `hasHydrated()` so a chip row or a
 * salary figure cannot change under the reader a beat after it paints (DD5).
 * The tempting way to seed that flag is `useState(() => hasHydrated())`, and it
 * is wrong: the call answers differently in the two places it runs. On the
 * server there is no sessionStorage, so `persist` never hydrates and it returns
 * false. In the browser sessionStorage is SYNCHRONOUS, so the store is already
 * hydrated by the time React renders and it returns true. The server ships the
 * skeleton, the client's first render produces the wizard, and React throws the
 * whole server tree away and re-renders on the client.
 *
 * These tests render the way the server does, with the store reporting itself
 * hydrated. Effects never run in `renderToStaticMarkup`, so what comes back is
 * exactly the first render, and it has to be the skeleton either way.
 */

let hydratedFlag = true

vi.mock('motion/react', async (importOriginal) => {
  const actual = await importOriginal()
  return { ...actual, AnimatePresence: ({ children }) => children }
})

vi.mock('@/lib/founders/offer-store', async (importOriginal) => {
  const actual = await importOriginal()
  return {
    ...actual,
    hasHydrated: () => hydratedFlag,
    onHydrated: () => () => {},
  }
})

const { INITIAL, useOfferStore } = await import('@/lib/founders/offer-store')
const { default: JobOfferCalculator } = await import(
  '../job-offer/JobOfferCalculator'
)
const { default: EquityCalculator } = await import('../equity/EquityCalculator')

const CASES = [
  {
    name: 'job offer calculator',
    Component: JobOfferCalculator,
    /* The verdict the gate exists to keep off the first paint. */
    content: /Ask for/,
  },
  {
    name: 'equity calculator',
    Component: EquityCalculator,
    content: /Which seat are you negotiating for/,
  },
]

describe('the first render is the skeleton on both sides', () => {
  for (const { name, Component, content } of CASES) {
    it(`${name} renders the skeleton even when the store reports hydrated`, () => {
      hydratedFlag = true
      useOfferStore.setState({
        ...INITIAL,
        role: 'engineer',
        stage: 'series_a',
        offeredSalary: 175_000,
      })

      const html = renderToStaticMarkup(<Component />)
      expect(html, name).toContain('animate-pulse')
      expect(html, name).not.toMatch(content)
    })
  }

  it('is identical whether or not the store has hydrated yet', () => {
    /* The whole point: these two must be the same string. If a gate ever reads
       hydration state during render again, they diverge and the divergence is
       the mismatch React reports. */
    useOfferStore.setState({ ...INITIAL, role: 'engineer' })
    hydratedFlag = false
    const cold = renderToStaticMarkup(<JobOfferCalculator />)
    hydratedFlag = true
    const warm = renderToStaticMarkup(<JobOfferCalculator />)
    expect(warm).toBe(cold)
  })
})
