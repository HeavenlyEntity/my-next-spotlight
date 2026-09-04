import { describe, expect, it } from 'vitest'
import { render } from '@testing-library/react'

import { AnimateDigits } from '../animate-digits'

describe('AnimateDigits', () => {
  it('renders every character and exposes the whole value as its name', () => {
    const { container } = render(<AnimateDigits value="8%–15%" />)
    const root = container.firstChild
    expect(root).toHaveAttribute('aria-label', '8%–15%')
    expect(root.textContent).toBe('8%–15%')
  })

  it('updates to the new value when it changes', () => {
    const { container, rerender } = render(<AnimateDigits value="0.5%–15%" />)
    rerender(<AnimateDigits value="8%–15%" />)
    expect(container.firstChild).toHaveAttribute('aria-label', '8%–15%')
    expect(container.firstChild.textContent).toContain('8%')
  })
})
