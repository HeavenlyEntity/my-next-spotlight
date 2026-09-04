import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { act, render, screen } from '@testing-library/react'

import { LiveAnnouncer } from '../live-announcer'

describe('LiveAnnouncer', () => {
  beforeEach(() => vi.useFakeTimers())
  afterEach(() => vi.useRealTimers())

  it('stays silent until armed', () => {
    const { rerender, container } = render(
      <LiveAnnouncer message="Hire." armed={false} />
    )
    act(() => vi.advanceTimersByTime(1000))
    expect(container.querySelector('[aria-live]').textContent).toBe('')
    rerender(<LiveAnnouncer message="Hire." armed />)
    act(() => vi.advanceTimersByTime(600))
    expect(screen.getByText('Hire.')).toBeInTheDocument()
  })

  it('debounces and announces only the last message in the window', () => {
    const { rerender } = render(<LiveAnnouncer message="A" armed delay={500} />)
    act(() => vi.advanceTimersByTime(200))
    rerender(<LiveAnnouncer message="B" armed delay={500} />)
    act(() => vi.advanceTimersByTime(600))
    expect(screen.queryByText('A')).not.toBeInTheDocument()
    expect(screen.getByText('B')).toBeInTheDocument()
  })
})
