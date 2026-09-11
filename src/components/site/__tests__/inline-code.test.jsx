import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'

import { inlineCode } from '@/components/site/inline-code'

const show = (text) => render(<p>{inlineCode(text)}</p>)

describe('inlineCode', () => {
  it('turns a backtick span into code', () => {
    show('It runs on `pnpm dev` right now')
    const code = screen.getByText('pnpm dev')
    expect(code.tagName).toBe('CODE')
    // The backticks themselves must not survive into the page.
    expect(document.body.textContent).toBe('It runs on pnpm dev right now')
  })

  it('handles several spans in one line', () => {
    show('`pnpm check` then `pnpm ns:push`')
    expect(screen.getByText('pnpm check').tagName).toBe('CODE')
    expect(screen.getByText('pnpm ns:push').tagName).toBe('CODE')
  })

  it('handles a span at the very start and very end', () => {
    show('`N/cache` is the trick')
    expect(screen.getByText('N/cache').tagName).toBe('CODE')
    show('the trick is `N/cache`')
    expect(screen.getAllByText('N/cache')[1].tagName).toBe('CODE')
  })

  it('leaves an unpaired backtick alone rather than eating the line', () => {
    // Half a convention is worse than none: the author should see the stray
    // character, not lose the rest of their sentence.
    show('a stray ` backtick and more words')
    expect(document.body.textContent).toBe('a stray ` backtick and more words')
    expect(document.querySelector('code')).toBeNull()
  })

  it('returns plain text untouched, allocating nothing', () => {
    expect(inlineCode('no code here')).toBe('no code here')
  })

  it('survives non-strings', () => {
    expect(inlineCode(undefined)).toBeUndefined()
    expect(inlineCode(null)).toBeNull()
  })

  it('does not span a newline', () => {
    // A backtick opening on one line and closing on another is a typo, not
    // a code span.
    show('one ` line\nanother ` line')
    expect(document.querySelector('code')).toBeNull()
  })

  it('is reusable — the regex does not carry state between calls', () => {
    const first = render(<p>{inlineCode('`a` and `b`')}</p>)
    expect(first.container.querySelectorAll('code')).toHaveLength(2)
    const second = render(<p>{inlineCode('`a` and `b`')}</p>)
    expect(second.container.querySelectorAll('code')).toHaveLength(2)
  })
})
