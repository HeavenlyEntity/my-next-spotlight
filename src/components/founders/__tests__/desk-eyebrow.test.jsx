import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'

import { DeskEyebrow } from '../desk-eyebrow'
import { TOOLS } from '@/lib/founders/tools'

describe('DeskEyebrow', () => {
  it('links live tools and renders soon tools as disabled non-links', () => {
    render(<DeskEyebrow current="equity" />)
    const list = screen.getByRole('list', { name: 'Desk tools' })
    const links = list.querySelectorAll('a')
    const live = TOOLS.filter((t) => t.status === 'live')
    expect(links).toHaveLength(live.length)
    expect(links[0]).toHaveAttribute('href', '/founders/equity')
    expect(links[0]).toHaveAttribute('aria-current', 'page')
    const soon = list.querySelectorAll('[aria-disabled="true"]')
    expect(soon).toHaveLength(TOOLS.length - live.length)
    expect(screen.getByText('AMWARE // Founders’ Desk')).toHaveAttribute(
      'href',
      '/founders'
    )
  })
})
