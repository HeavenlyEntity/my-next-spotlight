import { describe, expect, it, vi } from 'vitest'
import { render, waitFor } from '@testing-library/react'

import CountUp from '@/components/react-bits/count-up'

describe('CountUp', () => {
  it('starts at the from value with the final value as its accessible name', () => {
    const { container } = render(
      <CountUp to={12.5} from={0} format={(v) => `${Number(v.toFixed(1))}%`} />
    )
    const span = container.querySelector('span')
    expect(span.textContent).toBe('0%')
    expect(span).toHaveAttribute('aria-label', '12.5%')
  })

  it('renders the final value immediately under reduced motion', () => {
    /* motion caches the OS media query per process, so the reduced path is
       exercised through the explicit prop the OS setting also feeds. */
    const { container } = render(
      <CountUp
        reduce
        to={1400000}
        format={(v) => `$${Math.round(v / 1e5) / 10}M`}
      />
    )
    expect(container.querySelector('span').textContent).toBe('$1.4M')
  })

  it('calls onStart once it is in view', async () => {
    const onStart = vi.fn()
    render(<CountUp to={8} onStart={onStart} />)
    /* Wait on the callback, not the clock. A fixed 20ms sleep passes alone and
       fails under the full suite, where 37 workers share the CPU and the
       in-view callback can land later than that. */
    await waitFor(() => expect(onStart).toHaveBeenCalled())
  })
})
