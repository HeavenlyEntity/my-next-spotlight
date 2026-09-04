import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'

import { SliderField } from '../slider-field'

const track = { min: 0, max: 36 }
const bounds = { min: 0, max: 120 }

function setup(props = {}) {
  const onCommit = vi.fn()
  render(
    <SliderField
      id="months"
      label="Months"
      value={9}
      onCommit={onCommit}
      track={track}
      bounds={bounds}
      {...props}
    />
  )
  return {
    onCommit,
    input: screen.getByLabelText('Months', { selector: 'input' }),
  }
}

describe('SliderField', () => {
  it('keeps raw text while focused and does not commit on every keystroke', () => {
    const { onCommit, input } = setup()
    fireEvent.focusIn(input)
    fireEvent.change(input, { target: { value: '1' } })
    expect(input).toHaveValue(1)
    expect(onCommit).not.toHaveBeenCalled()
    fireEvent.change(input, { target: { value: '15' } })
    expect(onCommit).not.toHaveBeenCalled()
  })

  it('commits on blur and on Enter', () => {
    const { onCommit, input } = setup()
    fireEvent.focusIn(input)
    fireEvent.change(input, { target: { value: '15' } })
    fireEvent.focusOut(input)
    expect(onCommit).toHaveBeenCalledWith(15)

    fireEvent.focusIn(input)
    fireEvent.change(input, { target: { value: '20' } })
    fireEvent.keyDown(input, { key: 'Enter' })
    fireEvent.focusOut(input)
    expect(onCommit).toHaveBeenLastCalledWith(20)
  })

  it('commits null for a blank field so the engine restores the default', () => {
    const { onCommit, input } = setup()
    fireEvent.focusIn(input)
    fireEvent.change(input, { target: { value: '' } })
    fireEvent.focusOut(input)
    expect(onCommit).toHaveBeenCalledWith(null)
  })

  it('shows the clamp note and the pin suffix above the track', () => {
    setup({ value: 60, clampedNote: 'capped at 120' })
    expect(screen.getByText('capped at 120')).toBeInTheDocument()
    expect(screen.getByText('60+')).toBeInTheDocument()
  })
})
