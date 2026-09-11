import { describe, expect, it, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'

import { GithubAccountField } from '@/components/commerce/GithubAccountField'

beforeEach(() => {
  vi.clearAllMocks()
  global.fetch = vi.fn(() => new Promise(() => {})) // never settles
})

describe('GithubAccountField status', () => {
  it('is silent on an untouched field', () => {
    render(<GithubAccountField />)
    /* The bug: an empty field reported "Checking GitHub…" on every product
       page load, forever, while the effect's guard meant nothing was being
       checked and never would be. */
    expect(screen.queryByText(/checking github/i)).toBeNull()
    expect(global.fetch).not.toHaveBeenCalled()
  })

  it('stays silent while the name cannot be looked up anyway', () => {
    render(<GithubAccountField />)
    const input = screen.getByLabelText(/github username/i)
    fireEvent.change(input, { target: { value: 'not a username' } })
    // Malformed: no request will be made, so claiming a check is in flight
    // would be the same lie in a different state.
    expect(screen.queryByText(/checking github/i)).toBeNull()
    expect(global.fetch).not.toHaveBeenCalled()
  })

  it('does not nag an untouched field with the empty-name message', () => {
    render(<GithubAccountField />)
    expect(screen.queryByRole('alert')).toBeNull()
    expect(screen.getByLabelText(/github username/i)).not.toHaveAttribute(
      'aria-invalid'
    )
  })

  it('says it is checking only while a lookup is genuinely in flight', async () => {
    render(<GithubAccountField />)
    fireEvent.change(screen.getByLabelText(/github username/i), {
      target: { value: 'octocat' },
    })
    expect(await screen.findByText(/checking github/i)).toBeInTheDocument()
  })

  it('goes quiet again when the name is cleared', async () => {
    render(<GithubAccountField />)
    const input = screen.getByLabelText(/github username/i)
    fireEvent.change(input, { target: { value: 'octocat' } })
    expect(await screen.findByText(/checking github/i)).toBeInTheDocument()
    fireEvent.change(input, { target: { value: '' } })
    await waitFor(() =>
      expect(screen.queryByText(/checking github/i)).toBeNull()
    )
  })
})
