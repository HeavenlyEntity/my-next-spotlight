import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'

import { AmountCell } from '@/components/admin/AmountCell'

/* The column this replaces showed raw cents, so a $499 order read as 49900
   -- either $49,900 or a bug, depending on the reader. */
describe('AmountCell', () => {
  it('renders cents as dollars', () => {
    render(<AmountCell cellData={49900} />)
    expect(screen.getByText('$499.00')).toBeInTheDocument()
  })

  it('keeps the cents when there are any', () => {
    render(<AmountCell cellData={1250} />)
    expect(screen.getByText('$12.50')).toBeInTheDocument()
  })

  it('groups thousands, so a team licence is not misread', () => {
    render(<AmountCell cellData={99900} />)
    expect(screen.getByText('$999.00')).toBeInTheDocument()
  })

  it('calls zero Free rather than $0.00', () => {
    // A free claim is a different kind of row, not a sale that cost nothing.
    render(<AmountCell cellData={0} />)
    expect(screen.getByText('Free')).toBeInTheDocument()
  })

  it('shows a dash for a missing amount instead of $NaN', () => {
    const { rerender } = render(<AmountCell cellData={undefined} />)
    expect(screen.getByText('—')).toBeInTheDocument()
    rerender(<AmountCell cellData={null} />)
    expect(screen.getByText('—')).toBeInTheDocument()
    rerender(<AmountCell cellData="49900" />)
    expect(screen.getByText('—')).toBeInTheDocument()
  })
})
