import { describe, expect, it } from 'vitest'
import { render, screen, within } from '@testing-library/react'

import FoundersDeskPage from '../page'
import { EXAMPLE_READ } from '@/lib/founders/equity/engine'
import { computeAsk } from '@/lib/founders/equity/negotiation'
import { ASK_HREF, EQUITY_HREF, liveTools } from '@/lib/founders/tools'

const ask = computeAsk(EXAMPLE_READ)

describe('the desk landing is a hero, never a menu', () => {
  /* The page's first design decision, hard-rejected in its menu form by both
     outside voices. A second live tool is the obvious way to undo it by
     accident, so it is asserted rather than only written down. */
  it('offers exactly one primary action', () => {
    const { container } = render(<FoundersDeskPage />)
    const primaries = container.querySelectorAll('a.rounded-md.bg-zinc-900')
    expect(primaries).toHaveLength(1)
    expect(primaries[0]).toHaveAttribute('href', EQUITY_HREF)
    expect(primaries[0]).toHaveTextContent(/read my offer/i)
  })

  it('renders no cards and no tool grid', () => {
    const { container } = render(<FoundersDeskPage />)
    /* One anchor panel. A second rounded panel would be the start of a grid. */
    expect(container.querySelectorAll('.rounded-2xl')).toHaveLength(1)
  })

  it('reaches the second tool as a link, not a rival button', () => {
    render(<FoundersDeskPage />)
    const link = screen.getByRole('link', { name: /turn it into an ask/i })
    expect(link).toHaveAttribute('href', ASK_HREF)
    expect(link.className).not.toMatch(/bg-zinc-900/)
  })

  it('names every live tool in the inventory line', () => {
    render(<FoundersDeskPage />)
    for (const tool of liveTools()) {
      const links = screen.getAllByRole('link', {
        name: new RegExp(tool.label, 'i'),
      })
      expect(links.length, tool.id).toBeGreaterThan(0)
    }
  })
})

describe('the anchor shows both of the desk outputs', () => {
  it('prices the same example as an ask, from the engine', () => {
    render(<FoundersDeskPage />)
    const ladder = screen
      .getByText(/the same example, priced as an ask/i)
      .closest('figure')

    for (const id of ask.order) {
      /* Generated, never typed: if a benchmark refresh moves these, the page
         moves with it and this test follows. */
      expect(within(ladder).getByText(ask[id].label)).toBeInTheDocument()
    }
    expect(within(ladder).getByText('$100k')).toBeInTheDocument()
    expect(within(ladder).getByText('13%')).toBeInTheDocument()
  })

  it('makes the middle rung dominant by weight, never by an accent fill', () => {
    render(<FoundersDeskPage />)
    const ladder = screen
      .getByText(/the same example, priced as an ask/i)
      .closest('figure')
    /* A teal fill reads as "selected" in this design system, which would have
       the landing recommending an ask to someone who has not used the tool. */
    expect(ladder.innerHTML).not.toMatch(/amw-accent\)/)
    expect(within(ladder).getByText('$100k').className).toMatch(/font-medium/)
    expect(within(ladder).getByText('$118k').className).not.toMatch(
      /font-medium/
    )
  })

  it('reads the finding off the example rather than asserting one', () => {
    render(<FoundersDeskPage />)
    const gap = EXAMPLE_READ.offer.gapPts
    expect(
      screen.getByText(new RegExp(`${gap[0]} to ${gap[1]} points short`))
    ).toBeInTheDocument()
  })

  it('cites the cash source too, now that it shows cash figures', () => {
    render(<FoundersDeskPage />)
    /* A benchmarks line covering half the figures above it is worse than
       none. */
    expect(
      screen.getByText(new RegExp(ask.bands.cash.asOf))
    ).toBeInTheDocument()
  })
})

describe('the copy covers both tools', () => {
  it('promises the range and the number to ask for', () => {
    render(<FoundersDeskPage />)
    expect(
      screen.getByText(/range to say out loud, then the number to ask for/i)
    ).toBeInTheDocument()
  })
})
