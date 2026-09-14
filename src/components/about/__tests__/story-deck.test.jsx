import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'

/* gsap drives the deal; in jsdom every tween completes at once, so the
   deck's bookkeeping (which card is in front, what is announced, what is
   hidden from assistive tech) can be asserted without waiting on frames. */
vi.mock('gsap', () => {
  const apply = (el, vars) => {
    if (!el || !el.style) return
    if (vars.visibility) el.style.visibility = vars.visibility
    if (vars.zIndex !== undefined) el.style.zIndex = String(vars.zIndex)
    if (vars.opacity !== undefined) el.style.opacity = String(vars.opacity)
  }
  const to = (el, vars) => {
    apply(el, vars)
    vars.onComplete?.()
    return {}
  }
  const set = (el, vars) => apply(el, vars)
  const timeline = (opts) => {
    const tl = {
      to(el, vars) {
        to(el, vars)
        opts?.onComplete?.()
        return tl
      },
    }
    return tl
  }
  return { default: { to, set, timeline, killTweensOf: () => {} } }
})

import { StoryDeck } from '../story-deck'

const chapters = [
  { number: '01', title: 'First', copy: 'One.' },
  { number: '02', title: 'Second', copy: 'Two, a little longer.' },
  { number: '03', title: 'Third', copy: 'Three.' },
]

const live = () => screen.getByText(/^Chapter \d of 3/)
const heading = (name) => screen.getByRole('heading', { name })

describe('StoryDeck', () => {
  it('shows the first chapter and announces it', () => {
    render(<StoryDeck chapters={chapters} />)
    expect(heading('First')).toBeInTheDocument()
    expect(live()).toHaveTextContent('Chapter 1 of 3: First')
    expect(screen.getByText('01 / 03')).toBeInTheDocument()
  })

  it('hides the cards behind the front one from assistive tech', () => {
    render(<StoryDeck chapters={chapters} />)
    // Only the front card is exposed as a heading; the rest are aria-hidden.
    expect(screen.getAllByRole('heading')).toHaveLength(1)
    expect(screen.queryByRole('heading', { name: 'Second' })).toBeNull()
  })

  it('deals the next card from the button, and announces it', () => {
    render(<StoryDeck chapters={chapters} />)
    fireEvent.click(screen.getByRole('button', { name: 'Next chapter' }))
    expect(heading('Second')).toBeInTheDocument()
    expect(live()).toHaveTextContent('Chapter 2 of 3: Second')
    expect(screen.getByText('02 / 03')).toBeInTheDocument()
  })

  it('goes back, and wraps from the first card to the last', () => {
    render(<StoryDeck chapters={chapters} />)
    fireEvent.click(screen.getByRole('button', { name: 'Previous chapter' }))
    expect(heading('Third')).toBeInTheDocument()
    expect(live()).toHaveTextContent('Chapter 3 of 3: Third')
  })

  it('deals with the keyboard on the deck itself', () => {
    render(<StoryDeck chapters={chapters} />)
    const deck = screen.getByRole('group', { name: /story/i })
    fireEvent.keyDown(deck, { key: 'ArrowRight' })
    expect(heading('Second')).toBeInTheDocument()
    fireEvent.keyDown(deck, { key: 'ArrowLeft' })
    expect(heading('First')).toBeInTheDocument()
    fireEvent.keyDown(deck, { key: ' ' })
    expect(heading('Second')).toBeInTheDocument()
  })

  it('deals on a click of the pile, the way the original does', () => {
    render(<StoryDeck chapters={chapters} />)
    fireEvent.click(heading('First'))
    expect(heading('Second')).toBeInTheDocument()
  })

  it('cycles all the way round', () => {
    render(<StoryDeck chapters={chapters} />)
    const next = screen.getByRole('button', { name: 'Next chapter' })
    fireEvent.click(next)
    fireEvent.click(next)
    fireEvent.click(next)
    expect(heading('First')).toBeInTheDocument()
    expect(live()).toHaveTextContent('Chapter 1 of 3')
  })
})
