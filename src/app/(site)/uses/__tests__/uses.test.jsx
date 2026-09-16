import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'

import Uses from '../page'

const affiliates = [
  { name: 'Rize', href: 'https://pxllnk.co/rize' },
  { name: 'Blitzit', href: 'https://pxllnk.co/blitzit' },
  { name: 'Roam HQ', href: 'https://pxllnk.co/roamware' },
]

describe('Uses', () => {
  it('points the productivity tools at their affiliate links and drops Jira', () => {
    render(<Uses />)

    for (const { name, href } of affiliates) {
      const link = screen.getByRole('link', { name })
      expect(link).toHaveAttribute('href', href)
      expect(link).toHaveAttribute('rel', expect.stringContaining('sponsored'))
      expect(link.querySelector('svg')).not.toBeNull()
    }

    const stashpad = screen.getByRole('heading', { name: 'Stashpad' })
    expect(stashpad.querySelector('svg')).toBeNull()

    expect(
      screen.queryByRole('heading', { name: 'Jira' })
    ).not.toBeInTheDocument()
    expect(
      screen.queryByRole('heading', { name: 'TidyCal' })
    ).not.toBeInTheDocument()
  })
})
