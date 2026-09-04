import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'

import { ChipGroup } from '../chip-group'

const options = [
  { id: 'a', label: 'Alpha', description: 'First seat' },
  { id: 'b', label: 'Beta', description: 'Second seat' },
  { id: 'c', label: 'Gamma' },
]

describe('ChipGroup', () => {
  it('single mode renders a radiogroup with aria-checked and a check glyph on the selection', () => {
    render(
      <ChipGroup label="Seat" options={options} value="b" onChange={() => {}} />
    )
    expect(screen.getByRole('radiogroup', { name: 'Seat' })).toBeInTheDocument()
    const radios = screen.getAllByRole('radio')
    expect(radios).toHaveLength(3)
    expect(radios[1]).toHaveAttribute('aria-checked', 'true')
    expect(radios[0]).toHaveAttribute('aria-checked', 'false')
    expect(radios[1].querySelector('svg')).not.toBeNull()
    expect(radios[0].querySelector('svg')).toBeNull()
    expect(radios[1].className).toContain('amw-chip--accent')
    expect(radios[1].className).toContain('amw-chip--input')
  })

  it('arrow keys move and select in single mode', () => {
    const onChange = vi.fn()
    render(
      <ChipGroup label="Seat" options={options} value="a" onChange={onChange} />
    )
    const radios = screen.getAllByRole('radio')
    radios[0].focus()
    fireEvent.keyDown(radios[0], { key: 'ArrowRight' })
    expect(onChange).toHaveBeenCalledWith('b')
    fireEvent.keyDown(radios[0], { key: 'ArrowLeft' })
    expect(onChange).toHaveBeenCalledWith('c')
  })

  it('multi mode uses aria-pressed and toggles ids in and out', () => {
    const onChange = vi.fn()
    render(
      <ChipGroup
        label="Work"
        options={options}
        value={['a']}
        onChange={onChange}
        mode="multi"
      />
    )
    const buttons = screen.getAllByRole('button')
    expect(buttons[0]).toHaveAttribute('aria-pressed', 'true')
    expect(buttons[1]).toHaveAttribute('aria-pressed', 'false')
    fireEvent.click(buttons[1])
    expect(onChange).toHaveBeenCalledWith(['a', 'b'])
    fireEvent.click(buttons[0])
    expect(onChange).toHaveBeenCalledWith([])
  })

  it('segmented variant describes the selected option once', () => {
    render(
      <ChipGroup
        label="Seat"
        options={options}
        value="a"
        onChange={() => {}}
        variant="segmented"
        describeSelected
      />
    )
    expect(screen.getByText('First seat')).toBeInTheDocument()
    expect(screen.queryByText('Second seat')).not.toBeInTheDocument()
    expect(screen.getByRole('radiogroup').className).toContain('amw-segmented')
  })
})
