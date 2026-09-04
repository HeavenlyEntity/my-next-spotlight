import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'

import ContactForm from '../ContactForm'
import { EXAMPLE } from '@/lib/founders/equity/benchmarks'
import { INITIAL, useOfferStore } from '@/lib/founders/offer-store'

/* REGRESSION SUITE (plan tests 32 and 33).
 *
 * The offer-review prefill used to come from a one-shot stash in handoff.js.
 * The store now owns the user's answers and the form derives the brief from
 * them. This flow works today, so these two tests exist to make sure the
 * storage merge did not quietly break it. */

vi.mock('@vercel/analytics', () => ({ track: vi.fn() }))

const seed = (over = {}) =>
  useOfferStore.setState({ ...INITIAL, ...EXAMPLE, ...over })

beforeEach(() => {
  useOfferStore.setState({ ...INITIAL })
})

const messageBox = () => screen.getByLabelText(/message/i)
const subjectBox = () => screen.getByLabelText(/subject/i)

describe('offer-review prefill via the store (test 32)', () => {
  it('fills every line, with values rather than blanks after a colon', () => {
    seed({ askedAt: new Date().toISOString() })
    render(<ContactForm topic="offer-review" />)

    const text = messageBox().value
    expect(text).toContain('Role and seat: CTO')
    expect(text).toContain('Stage (last closed round): pre-seed')
    expect(text).toMatch(/Offered equity: [\d.]+%/)
    expect(text).toMatch(/Salary vs market: \$\d+k offered vs \$\d+k market/)
    expect(text).toMatch(/The read: .+, range [\d.]+–[\d.]+%/)
    expect(text).toContain('--- Full brief ---')

    /* The one line left blank on purpose is the one asking them what they
       want. Everything else must carry a value. */
    const blanks = text.split('\n').filter((l) => /:\s*$/.test(l))
    expect(blanks).toEqual(['What I want help with: '])
  })

  it('fills the subject from the seat and the stage', () => {
    seed({ askedAt: new Date().toISOString(), role: 'engineer', stage: 'seed' })
    render(<ContactForm topic="offer-review" />)
    expect(subjectBox().value).toBe('Offer review: Software engineer at seed')
  })

  it('follows the store, so a different seat produces a different brief', () => {
    seed({ askedAt: new Date().toISOString(), role: 'engineer' })
    render(<ContactForm topic="offer-review" />)
    expect(messageBox().value).toContain('Role and seat: Software engineer')
  })
})

describe('a plain visit stays empty (test 33)', () => {
  it('does not prefill when the user never asked for a review', () => {
    /* Answers may well be in the store from using the calculator. Without the
       asked marker, typing this URL is not a handoff. */
    seed({ askedAt: null })
    render(<ContactForm topic="offer-review" />)
    const text = messageBox().value
    /* The template carries the same labels, so assert on the VALUES: nothing
       after the colons, and no full brief appended. */
    expect(text).not.toContain('--- Full brief ---')
    expect(text).not.toMatch(/Role and seat: \S/)
    expect(text).not.toMatch(/Salary vs market: \S/)
    const blanks = text.split('\n').filter((l) => /:\s*$/.test(l))
    expect(blanks.length).toBeGreaterThan(1)
    expect(subjectBox().value).toBe('Offer review')
  })

  it('leaves the ordinary contact form alone entirely', () => {
    seed({ askedAt: new Date().toISOString() })
    render(<ContactForm />)
    expect(messageBox().value).toBe('')
    expect(subjectBox().value).toBe('')
  })

  it('says the answers stay in the browser, matching the new privacy line', () => {
    seed({ askedAt: new Date().toISOString() })
    render(<ContactForm topic="offer-review" />)
    expect(screen.getByText(/stay in this browser/i)).toBeInTheDocument()
  })
})
