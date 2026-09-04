import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'

import { ResultsRail } from '../results-rail'
import { computeRead, EXAMPLE_READ } from '@/lib/founders/equity/engine'
import { EXAMPLE } from '@/lib/founders/equity/benchmarks'

describe('ResultsRail', () => {
  it('shows a possible range and no badge on step 1', () => {
    const read = computeRead({ ...EXAMPLE, responsibilities: [] })
    render(<ResultsRail read={read} step={1} />)
    expect(screen.getByText(/Possible range/)).toBeInTheDocument()
    expect(screen.queryByText('Founding executive')).not.toBeInTheDocument()
    expect(screen.getByText('Still needed')).toBeInTheDocument()
    expect(screen.getByText('step 2')).toBeInTheDocument()
  })

  it('keeps the badge at "?" on step 2 with zero chips and asks the user to pick', () => {
    const read = computeRead({ ...EXAMPLE, responsibilities: [] })
    render(<ResultsRail read={read} step={2} />)
    expect(screen.queryByText('Founding executive')).not.toBeInTheDocument()
    expect(screen.getByText(/Pick what was yours/)).toBeInTheDocument()
  })

  it('shows the class badge from the first chip and an empty offer note before step 3', () => {
    render(<ResultsRail read={EXAMPLE_READ} step={2} />)
    expect(screen.getByText('Founding executive')).toBeInTheDocument()
    expect(screen.getByText('Offer not entered yet.')).toBeInTheDocument()
  })

  it('marks banked work as n/a for salaried joiners', () => {
    const read = computeRead({ ...EXAMPLE, joining: 'hired_after' })
    render(<ResultsRail read={read} step={2} />)
    expect(screen.getByText('n/a (salaried)')).toBeInTheDocument()
  })
})
