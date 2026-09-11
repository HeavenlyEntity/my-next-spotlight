import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'

import {
  StackChips,
  StackLogos,
  stackIcon,
} from '@/components/commerce/StackChips'
import {
  IconBrandNextjs,
  IconBrandReact,
  IconCode,
  IconDatabase,
  IconShieldLock,
} from '@tabler/icons-react'

describe('stackIcon', () => {
  it('finds the brand mark', () => {
    expect(stackIcon('Next.js')).toBe(IconBrandNextjs)
    expect(stackIcon('React 19')).toBe(IconBrandReact)
    expect(stackIcon('Postgres')).toBe(IconDatabase)
  })

  /* These values are typed into a CMS field. "Next.js" becomes "Next.js 16"
     the first time someone updates a kit, and an equality map would fall back
     to a generic glyph with nobody noticing. */
  it('survives a CMS edit that adds a version', () => {
    expect(stackIcon('Next.js 16')).toBe(IconBrandNextjs)
    expect(stackIcon('react 19.2')).toBe(IconBrandReact)
  })

  it('lets the longest match win, so react cannot claim TanStack React Query', () => {
    // 'tanstack' is longer than 'react', so the API glyph wins.
    expect(stackIcon('TanStack React Query')).not.toBe(IconBrandReact)
  })

  it('falls back to a neutral glyph rather than a wrong brand', () => {
    // SuiteScript and SDF have no logo anywhere, and never will.
    expect(stackIcon('SuiteScript')).toBe(IconCode)
    expect(stackIcon('Some Internal Tool')).toBe(IconCode)
    expect(stackIcon('')).toBe(IconCode)
    expect(stackIcon(undefined)).toBe(IconCode)
  })

  it('maps by meaning when there is no brand', () => {
    expect(stackIcon('Better Auth')).toBe(IconShieldLock)
  })
})

describe('StackChips', () => {
  const stack = [
    { tech: 'Next.js' },
    { tech: 'React 19' },
    { tech: 'TypeScript' },
    { tech: 'SuiteScript' },
  ]

  it('shows every technology, not the first three', () => {
    render(<StackChips stack={stack} />)
    for (const s of stack) {
      expect(screen.getByText(s.tech)).toBeInTheDocument()
    }
  })

  it('accepts plain strings as well as CMS rows', () => {
    render(<StackChips stack={['Vercel', 'Playwright']} />)
    expect(screen.getByText('Vercel')).toBeInTheDocument()
    expect(screen.getByText('Playwright')).toBeInTheDocument()
  })

  it('hides the marks from screen readers, since the name is right there', () => {
    const { container } = render(<StackChips stack={stack} />)
    const svgs = container.querySelectorAll('svg')
    expect(svgs.length).toBe(stack.length)
    for (const svg of svgs) expect(svg).toHaveAttribute('aria-hidden', 'true')
  })

  it('renders nothing at all for an empty stack', () => {
    const { container } = render(<StackChips stack={[]} />)
    expect(container.firstChild).toBeNull()
  })

  it('drops blank rows rather than rendering an empty chip', () => {
    const { container } = render(
      <StackChips stack={[{ tech: 'Vercel' }, { tech: '' }, {}]} />
    )
    expect(container.querySelectorAll('li')).toHaveLength(1)
  })
})

describe('StackLogos', () => {
  const stack = [
    { tech: 'Next.js' },
    { tech: 'React 19' },
    { tech: 'TypeScript' },
    { tech: 'SuiteScript' },
  ]

  it('names every technology in text, not just a tooltip', () => {
    render(<StackLogos stack={stack} />)
    // A title attribute would be invisible to most screen readers and to
    // search. The name is real text inside each item.
    for (const s of stack) {
      expect(screen.getAllByText(s.tech).length).toBeGreaterThan(0)
    }
  })

  it('stacks later discs behind earlier ones', () => {
    const { container } = render(<StackLogos stack={stack} />)
    const z = [...container.querySelectorAll('li')].map((li) =>
      Number(li.style.zIndex)
    )
    // Descending, so the row reads left to right instead of the last mark
    // covering the first.
    expect(z).toEqual([...z].sort((a, b) => b - a))
    expect(new Set(z).size).toBe(z.length)
  })

  it('gives each mark its brand colour', () => {
    const { container } = render(<StackLogos stack={stack} />)
    const discs = container.querySelectorAll('.amw-logo')
    expect(discs[1].getAttribute('style')).toContain('#61dafb') // React
    expect(discs[2].getAttribute('style')).toContain('#3178c6') // TypeScript
  })

  it('uses the ink token for black-logo brands so they survive dark mode', () => {
    const { container } = render(<StackLogos stack={[{ tech: 'Next.js' }]} />)
    // #000 would be invisible on a dark card.
    const style = container.querySelector('.amw-logo').getAttribute('style')
    expect(style).toContain('--amw-ink')
    expect(style).not.toContain('#000')
  })

  it('is reachable by keyboard, so the label is not hover-only', () => {
    const { container } = render(<StackLogos stack={stack} />)
    const focusable = container.querySelectorAll('[tabindex="0"]')
    expect(focusable).toHaveLength(stack.length)
  })

  it('labels the whole row for screen readers', () => {
    render(<StackLogos stack={stack} />)
    expect(
      screen.getByLabelText(/built with next\.js, react 19/i)
    ).toBeInTheDocument()
  })

  it('renders nothing for an empty stack', () => {
    const { container } = render(<StackLogos stack={[]} />)
    expect(container.firstChild).toBeNull()
  })
})
