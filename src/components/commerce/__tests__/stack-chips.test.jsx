import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'

import { StackChips, stackIcon } from '@/components/commerce/StackChips'
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
