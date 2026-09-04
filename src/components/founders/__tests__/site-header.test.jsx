import { existsSync } from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'

import { SiteHeader } from '@/components/SiteHeader'
import { menuHrefs } from '@/lib/site-nav'

const APP = path.resolve(process.cwd(), 'src/app/(site)')

describe('SiteHeader', () => {
  it('opens the card menu from the Menu button and exposes every nav link', () => {
    render(<SiteHeader />)
    const button = screen.getByRole('button', { name: /menu/i })
    expect(button).toHaveAttribute('aria-expanded', 'false')
    fireEvent.click(button)
    expect(button).toHaveAttribute('aria-expanded', 'true')
    for (const href of menuHrefs()) {
      expect(document.querySelector(`a[href="${href}"]`)).not.toBeNull()
    }
    expect(screen.getByRole('link', { name: /work with me/i })).toHaveAttribute(
      'href',
      '/contact'
    )
  })

  it('closes on Escape and returns focus to the button', () => {
    render(<SiteHeader />)
    const button = screen.getByRole('button', { name: /menu/i })
    fireEvent.click(button)
    fireEvent.keyDown(window, { key: 'Escape' })
    expect(button).toHaveAttribute('aria-expanded', 'false')
    expect(document.activeElement).toBe(button)
  })

  it('marks the current route as the current page', () => {
    render(<SiteHeader />)
    fireEvent.click(screen.getByRole('button', { name: /menu/i }))
    /* vitest.setup mocks usePathname as /founders/equity */
    const current = document.querySelector('a[aria-current="page"]')
    expect(current).not.toBeNull()
    expect(current).toHaveAttribute('href', '/founders/equity')
  })
})

describe('site nav registry', () => {
  it('every internal menu route has a page under src/app/(site)', () => {
    for (const href of menuHrefs()) {
      const dir = path.join(APP, href.replace(/^\//, ''))
      const exists = ['page.jsx', 'page.tsx', 'page.js'].some((f) =>
        existsSync(path.join(dir, f))
      )
      expect(exists, `${href} has no page`).toBe(true)
    }
  })
})
