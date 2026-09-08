import { act, fireEvent, render, screen, cleanup } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { MasterpieceInterlude } from '../masterpiece-interlude'

const preference = vi.hoisted(() => ({ reduced: false }))
vi.mock('@/hooks/use-client-value', () => ({
  useMediaQuery: () => preference.reduced,
}))
let intersect, callbacks, nextFrame, ctx
beforeEach(() => {
  preference.reduced = false
  callbacks = new Map()
  nextFrame = 0
  ctx = {
    clearRect: vi.fn(),
    drawImage: vi.fn(),
    setTransform: vi.fn(),
    scale: vi.fn(),
    fillRect: vi.fn(),
    beginPath: vi.fn(),
    moveTo: vi.fn(),
    arc: vi.fn(),
    fill: vi.fn(),
  }
  vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(ctx)
  vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockReturnValue({
    width: 1280,
    height: 460,
  })
  vi.stubGlobal(
    'requestAnimationFrame',
    vi.fn((fn) => {
      callbacks.set(++nextFrame, fn)
      return nextFrame
    })
  )
  vi.stubGlobal(
    'cancelAnimationFrame',
    vi.fn((id) => callbacks.delete(id))
  )
  vi.stubGlobal(
    'IntersectionObserver',
    class {
      constructor(fn) {
        intersect = fn
      }
      observe() {}
      disconnect() {}
    }
  )
  vi.stubGlobal(
    'ResizeObserver',
    class {
      observe() {}
      disconnect() {}
    }
  )
})
afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
})
function frame(now) {
  const pending = [...callbacks.values()]
  callbacks.clear()
  act(() => pending.forEach((fn) => fn(now)))
}
describe('masterpiece playback', () => {
  it('schedules only while visible, pauses on demand and cleans up', () => {
    const { unmount } = render(<MasterpieceInterlude />)
    expect(callbacks.size).toBe(0)
    act(() => intersect([{ isIntersecting: true }]))
    expect(callbacks.size).toBe(1)
    frame(0)
    frame(50)
    fireEvent.click(
      screen.getByRole('button', { name: 'Pause masterpiece animation' })
    )
    expect(callbacks.size).toBe(0)
    expect(
      screen.getByRole('button', { name: 'Play masterpiece animation' })
    ).toHaveAttribute('aria-pressed', 'true')
    fireEvent.click(
      screen.getByRole('button', { name: 'Play masterpiece animation' })
    )
    expect(callbacks.size).toBe(1)
    act(() => intersect([{ isIntersecting: false }]))
    expect(callbacks.size).toBe(0)
    act(() => intersect([{ isIntersecting: true }]))
    unmount()
    expect(callbacks.size).toBe(0)
  })
  it('renders a completed still for reduced motion without a loop or pause control', () => {
    preference.reduced = true
    render(<MasterpieceInterlude />)
    act(() => intersect([{ isIntersecting: true }]))
    expect(callbacks.size).toBe(0)
    expect(screen.queryByRole('button')).not.toBeInTheDocument()
    expect(screen.getByTestId('masterpiece-interlude')).toHaveAttribute(
      'data-phase',
      'play'
    )
    expect(ctx.arc).toHaveBeenCalled()
  })
  it('stops when the document is hidden and resumes when visible', () => {
    render(<MasterpieceInterlude />)
    act(() => intersect([{ isIntersecting: true }]))
    const hidden = vi.spyOn(document, 'hidden', 'get').mockReturnValue(true)
    act(() => document.dispatchEvent(new Event('visibilitychange')))
    expect(callbacks.size).toBe(0)
    hidden.mockReturnValue(false)
    act(() => document.dispatchEvent(new Event('visibilitychange')))
    expect(callbacks.size).toBe(1)
  })
})
