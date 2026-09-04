import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'

import { AskLadder } from '../ask-ladder'
import { EXAMPLE } from '@/lib/founders/equity/benchmarks'
import { computeRead } from '@/lib/founders/equity/engine'
import { computeAsk } from '@/lib/founders/equity/negotiation'
import { EQUITY_HREF } from '@/lib/founders/tools'

describe('the hand-off back to the equity read (T7)', () => {
  it('attaches to the sentence that quotes the bands, not to a button row', () => {
    const ask = computeAsk(computeRead({ ...EXAMPLE, role: 'engineer' }))
    render(<AskLadder ask={ask} />)

    const link = screen.getByRole('link', {
      name: /see how the equity band was sized/i,
    })
    expect(link).toHaveAttribute('href', EQUITY_HREF)
    /* The trade sentence names two bands without saying where they came from.
       The link belongs in that paragraph, where the question is asked. */
    expect(link.closest('p').textContent).toMatch(
      /the band you can defend moves up/i
    )
  })
})
