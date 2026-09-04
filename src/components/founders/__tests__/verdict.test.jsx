import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'

import { Verdict } from '../results/verdict'
import { computeRead } from '@/lib/founders/equity/engine'
import { EXAMPLE } from '@/lib/founders/equity/benchmarks'
import { ASK_HREF } from '@/lib/founders/tools'

const cases = [
  {
    name: 'below',
    inputs: { ...EXAMPLE, offeredEquityPct: 3 },
    text: /sized as a hire while doing founder work/i,
  },
  {
    name: 'within',
    inputs: { ...EXAMPLE, offeredEquityPct: 10 },
    text: /The percent is fair/i,
  },
  {
    name: 'above',
    inputs: { ...EXAMPLE, offeredEquityPct: 25 },
    text: /Above the band/i,
  },
  {
    name: 'no offer',
    inputs: { ...EXAMPLE, offeredEquityPct: null },
    text: /Enter the offer to see the gap/i,
  },
  {
    name: 'formation founder',
    inputs: { ...EXAMPLE, joining: 'formation', founders: 2 },
    text: /founder shares/i,
  },
  {
    name: 'hire',
    inputs: {
      ...EXAMPLE,
      joining: 'hired_after',
      responsibilities: ['infra_oncall'],
    },
    text: /employee role/i,
  },
]

describe('Verdict headline', () => {
  for (const c of cases) {
    it(`renders the ${c.name} sentence`, () => {
      const read = computeRead(c.inputs)
      render(<Verdict read={read} />)
      expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(
        c.text
      )
      expect(
        screen.getByRole('link', { name: /review this offer/i })
      ).toHaveAttribute('href', '/contact/offer-review')
    })
  }
})

describe('the hand-off to the ask (T7)', () => {
  it('offers the next question as a link, never as a second button', () => {
    render(<Verdict read={computeRead(EXAMPLE)} />)
    const handoff = screen.getByRole('link', { name: /turn this into an ask/i })
    expect(handoff).toHaveAttribute('href', ASK_HREF)
    /* One primary. Two buttons side by side is a tool menu, and the reader has
       to choose before they know what either does. */
    expect(handoff.className).not.toMatch(/bg-\[var\(--amw-accent\)\]/)
  })
})
