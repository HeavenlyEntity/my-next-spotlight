import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'

import { AskActions } from '../ask-actions'
import { EXAMPLE } from '@/lib/founders/equity/benchmarks'
import { computeRead } from '@/lib/founders/equity/engine'
import { computeAsk } from '@/lib/founders/equity/negotiation'

const askWith = (over = {}, options = { industry: 'ai', geo: 'bay_nyc' }) =>
  computeAsk(computeRead({ ...EXAMPLE, role: 'engineer', ...over }), options)

/** Install a clipboard that resolves, and hand back what it was given. */
function stubClipboard() {
  const writeText = vi.fn().mockResolvedValue(undefined)
  Object.defineProperty(navigator, 'clipboard', {
    value: { writeText },
    configurable: true,
  })
  return writeText
}

/** Install one that rejects, the way a denied permission does. */
function breakClipboard() {
  Object.defineProperty(navigator, 'clipboard', {
    value: {
      writeText: vi.fn().mockRejectedValue(new Error('denied')),
    },
    configurable: true,
  })
}

describe('copy the ask (plan test 30g)', () => {
  it('puts cash, equity, both reasons and the as-of date on the clipboard', async () => {
    const writeText = stubClipboard()
    const ask = askWith({ offeredSalary: 180_000 })
    render(<AskActions ask={ask} onEdit={() => {}} onClear={() => {}} />)

    fireEvent.click(screen.getByRole('button', { name: /copy the ask/i }))
    await waitFor(() => expect(writeText).toHaveBeenCalledTimes(1))
    const text = writeText.mock.calls[0][0]

    /* The two numbers, written the way someone writes a salary down. */
    expect(text).toContain(
      `$${ask.target.cash.toLocaleString('en-US')} base and ${
        ask.target.equityPct
      }% fully diluted`
    )
    /* One defensibility line each, each carrying its own source. */
    expect(text).toMatch(/Why \$[\d,]+\. .*Source: /)
    expect(text).toMatch(/Why [\d.]+%\. .*Source: /)
    expect(text).toContain(ask.target.read.band.source)
    /* The room either side, which is what makes it an ask rather than a
       number, and the honest note that both edges are derived. */
    expect(text).toContain(`$${ask.ceiling.cash.toLocaleString('en-US')}`)
    expect(text).toContain(`$${ask.floor.cash.toLocaleString('en-US')}`)
    expect(text).toMatch(/not from published quartiles/)
    /* How old the data is. */
    expect(text).toMatch(/Market figures as of \d{4}/)
  })

  it('names the multipliers in words, not as bare numbers', async () => {
    const writeText = stubClipboard()
    render(
      <AskActions
        ask={askWith({ offeredSalary: 180_000 })}
        onEdit={() => {}}
        onClear={() => {}}
      />
    )
    fireEvent.click(screen.getByRole('button', { name: /copy the ask/i }))
    await waitFor(() => expect(writeText).toHaveBeenCalled())
    const text = writeText.mock.calls[0][0]
    expect(text).toContain('1.10x for AI')
    expect(text).toContain('1.12x for the Bay Area or New York')
  })

  it('confirms the copy so the click is not silent', async () => {
    stubClipboard()
    render(<AskActions ask={askWith()} onEdit={() => {}} onClear={() => {}} />)
    fireEvent.click(screen.getByRole('button', { name: /copy the ask/i }))
    expect(
      await screen.findByRole('button', { name: /^copied$/i })
    ).toBeInTheDocument()
  })

  it('reveals the text instead of a dead button when the clipboard is blocked', async () => {
    breakClipboard()
    const ask = askWith({ offeredSalary: 180_000 })
    render(<AskActions ask={ask} onEdit={() => {}} onClear={() => {}} />)
    fireEvent.click(screen.getByRole('button', { name: /copy the ask/i }))

    const area = await screen.findByLabelText(/blocked the clipboard/i)
    expect(area.value).toContain(
      `$${ask.target.cash.toLocaleString('en-US')} base`
    )
    /* Focused and selected, so the user's next keystroke is a copy. */
    expect(document.activeElement).toBe(area)
  })
})

describe('the rest of the action row', () => {
  it('offers edit, print and clear beside the primary action', () => {
    const onEdit = vi.fn()
    const onClear = vi.fn()
    const print = vi.fn()
    window.print = print
    render(<AskActions ask={askWith()} onEdit={onEdit} onClear={onClear} />)

    fireEvent.click(screen.getByRole('button', { name: /edit answers/i }))
    fireEvent.click(screen.getByRole('button', { name: /^print$/i }))
    fireEvent.click(screen.getByRole('button', { name: /clear my answers/i }))
    expect(onEdit).toHaveBeenCalled()
    expect(print).toHaveBeenCalled()
    expect(onClear).toHaveBeenCalled()
  })

  it('never prints itself: the sheet is the ask, not the buttons', () => {
    const { container } = render(
      <AskActions ask={askWith()} onEdit={() => {}} onClear={() => {}} />
    )
    expect(container.firstChild).toHaveAttribute('data-print', 'hide')
  })
})
