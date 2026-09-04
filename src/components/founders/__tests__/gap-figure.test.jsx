import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'

import { GapFigure } from '../gap-figure'

/* jsdom has no layout, so these assert the rule that prevents the overlap
   rather than measuring pixels: the offer label must never sit on the same row
   as the band labels. */

const rowOf = (el) => el.className.match(/\bmt-[\d.]+\b/)?.[0]

describe('labels that do not collide', () => {
  it('puts the offer on its own row, below the band edges', () => {
    /* The landing's own example: offered 3% against a band opening at 8.5%.
       On one row at 375px this rendered as "offered 3%.5%". */
    render(<GapFigure lo={8.5} hi={15.5} offer={3} />)
    const offer = screen.getByText(/offered 3%/)
    const lo = screen.getByText('8.5%')
    expect(rowOf(offer)).toBeTruthy()
    expect(rowOf(offer)).not.toBe(rowOf(lo))
  })

  it('keeps the two band edges on one row as before', () => {
    render(<GapFigure lo={8.5} hi={15.5} offer={3} />)
    expect(rowOf(screen.getByText('8.5%'))).toBe(
      rowOf(screen.getByText('15.5%'))
    )
  })

  it('leaves the callout tight when there is no offer row to clear', () => {
    const { rerender } = render(
      <GapFigure lo={1} hi={9} callout="Enter the offer to see the gap." />
    )
    const tight = screen.getByText(/enter the offer/i).className
    rerender(
      <GapFigure lo={1} hi={9} offer={3} callout="6 points below the band." />
    )
    const loose = screen.getByText(/6 points below/i).className
    expect(tight).not.toBe(loose)
    expect(tight).toMatch(/mt-9/)
  })
})
