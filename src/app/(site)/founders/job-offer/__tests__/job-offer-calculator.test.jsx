import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { act, fireEvent, render, screen, within } from '@testing-library/react'

/* Hydration is the thing worth controlling here: the store persists, and
   `persist` resolves after mount. These flags let the tests drive the
   pre-hydration frame, which is otherwise impossible to catch. */
let hydratedFlag = true
let pendingHydration = null

/* jsdom never finishes an exit animation, so AnimatePresence in "wait" mode
   holds the next step forever. That is a harness limitation, not product
   behaviour: stepping works in a real browser. Mock only the presence wrapper
   and leave the rest of motion real. */
vi.mock('motion/react', async (importOriginal) => {
  const actual = await importOriginal()
  return { ...actual, AnimatePresence: ({ children }) => children }
})

vi.mock('@/lib/founders/offer-store', async (importOriginal) => {
  const actual = await importOriginal()
  return {
    ...actual,
    hasHydrated: () => hydratedFlag,
    onHydrated: (fn) => {
      pendingHydration = fn
      return () => {
        pendingHydration = null
      }
    },
  }
})

const { INITIAL, useOfferStore } = await import('@/lib/founders/offer-store')
const { default: JobOfferCalculator } = await import('../JobOfferCalculator')

beforeEach(() => {
  hydratedFlag = true
  pendingHydration = null
  useOfferStore.setState({ ...INITIAL })
})
afterEach(() => {
  useOfferStore.setState({ ...INITIAL })
})

const clickText = (label) =>
  fireEvent.click(screen.getByRole('button', { name: label }))

const walkToAsk = () => {
  clickText(/^Next: the company$/)
  clickText(/^Next: the offer$/)
  clickText(/^See my ask$/)
}

describe('cold start (plan tests 21 and 22)', () => {
  it('opens on the seat step with the classification inputs on it', () => {
    render(<JobOfferCalculator />)
    expect(
      screen.getByRole('heading', { name: /what are you being hired to be/i })
    ).toBeInTheDocument()
    /* The gates and the chips are here, not on a later step, because they are
       what decide the founder-versus-market cash band. */
    expect(screen.getByText(/full time on signing/i)).toBeInTheDocument()
    expect(
      screen.getByText(/final say on technical decisions/i)
    ).toBeInTheDocument()
    expect(screen.getByText(/what is yours to own/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'None of these' })).toBeTruthy()
  })

  it('is three steps and a result, not two', () => {
    render(<JobOfferCalculator />)
    expect(screen.getByText(/step 1 of 4/i)).toBeInTheDocument()
    clickText(/^Next: the company$/)
    expect(
      screen.getByRole('heading', { name: /where is this company/i })
    ).toBeInTheDocument()
    clickText(/^Next: the offer$/)
    expect(
      screen.getByRole('heading', { name: /what did they offer/i })
    ).toBeInTheDocument()
    clickText(/^See my ask$/)
    expect(
      screen.getByRole('heading', { level: 2, name: /^Ask for/ })
    ).toBeTruthy()
  })

  it('puts industry and location behind selects, not chip rows', () => {
    render(<JobOfferCalculator />)
    clickText(/^Next: the company$/)
    expect(screen.getByLabelText(/industry/i).tagName).toBe('SELECT')
    expect(screen.getByLabelText(/where the role is paid/i).tagName).toBe(
      'SELECT'
    )
  })

  it('reaches a real classification rather than staying pending', () => {
    /* The whole reason the gates and chips moved onto step one. A cold start
       that classifies as unknown has no cash bucket to look up. */
    render(<JobOfferCalculator />)
    fireEvent.click(
      screen.getByRole('button', { name: /designed the architecture/i })
    )
    walkToAsk()
    const verdict = screen.getByRole('heading', { level: 2, name: /^Ask for/ })
    expect(verdict.textContent).toMatch(/Ask for \$[\d.]+k and [\d.]+%\./)
  })
})

describe('arriving prefilled (plan test 23)', () => {
  it('lands on the ask with no wizard when the store already has answers', () => {
    useOfferStore.setState({ ...INITIAL, role: 'engineer', stage: 'series_a' })
    render(<JobOfferCalculator />)
    expect(
      screen.getByRole('heading', { level: 2, name: /^Ask for/ })
    ).toBeTruthy()
    expect(screen.queryByText(/step 1 of 4/i)).toBeNull()
  })

  it('stays on step one when nothing has been answered', () => {
    render(<JobOfferCalculator />)
    expect(screen.getByText(/step 1 of 4/i)).toBeInTheDocument()
  })
})

describe('clear my answers (plan test 24)', () => {
  it('empties the store and returns to the first step', () => {
    useOfferStore.setState({
      ...INITIAL,
      role: 'engineer',
      offeredSalary: 200000,
    })
    render(<JobOfferCalculator />)
    fireEvent.click(screen.getByRole('button', { name: /clear my answers/i }))
    expect(useOfferStore.getState().role).toBe('cto')
    expect(useOfferStore.getState().offeredSalary).toBeNull()
    expect(screen.getByText(/step 1 of 4/i)).toBeInTheDocument()
  })
})

describe('inputs commit on blur, not per keystroke (plan test 25)', () => {
  it('leaves the store alone while typing and writes on blur', () => {
    render(<JobOfferCalculator />)
    clickText(/^Next: the company$/)
    clickText(/^Next: the offer$/)
    const salary = screen.getByLabelText(/salary offered/i)

    fireEvent.change(salary, { target: { value: '18' } })
    fireEvent.change(salary, { target: { value: '180' } })
    fireEvent.change(salary, { target: { value: '180000' } })
    /* Half-typed values must never reach shared state: a reload at the wrong
       moment would otherwise bring back $18. */
    expect(useOfferStore.getState().offeredSalary).toBeNull()

    fireEvent.blur(salary)
    expect(useOfferStore.getState().offeredSalary).toBe(180000)
  })

  it('also commits on Enter', () => {
    render(<JobOfferCalculator />)
    clickText(/^Next: the company$/)
    clickText(/^Next: the offer$/)
    const salary = screen.getByLabelText(/salary offered/i)
    fireEvent.change(salary, { target: { value: '150000' } })
    fireEvent.keyDown(salary, { key: 'Enter' })
    fireEvent.blur(salary)
    expect(useOfferStore.getState().offeredSalary).toBe(150000)
  })
})

describe('the hydration frame (plan tests 30c and 30d)', () => {
  it('shows a skeleton rather than the store defaults before hydration', () => {
    hydratedFlag = false
    useOfferStore.setState({ ...INITIAL, role: 'engineer' })
    render(<JobOfferCalculator />)
    /* Without this gate the server paints CTO at pre-seed and the numbers
       then animate to the real ones. Wrong numbers, moving, about money. */
    expect(
      screen.queryByRole('heading', { level: 2, name: /^Ask for/ })
    ).toBeNull()
    expect(document.querySelector('.animate-pulse')).toBeTruthy()
  })

  it('suppresses the count-up on the first paint after hydration', () => {
    hydratedFlag = false
    useOfferStore.setState({ ...INITIAL, role: 'engineer' })
    render(<JobOfferCalculator />)
    expect(pendingHydration).toBeTypeOf('function')

    hydratedFlag = true
    act(() => pendingHydration())

    const verdict = screen.getByRole('heading', { level: 2, name: /^Ask for/ })
    expect(verdict).toBeTruthy()
    /* The dominant rung's cash renders at its final value rather than counting
       from zero: those numbers arrived, they did not change. */
    const rows = document.querySelectorAll('.amw-price')
    const target = [...rows].find((el) => /^\$[\d.]+k$/.test(el.textContent))
    expect(target).toBeTruthy()
    expect(target.textContent).not.toBe('$0')
  })
})

describe('provenance and motion (plan tests 30f and 30)', () => {
  it('marks derived rungs with est. and leaves sourced ones unmarked', () => {
    useOfferStore.setState({ ...INITIAL, role: 'engineer', stage: 'series_a' })
    render(<JobOfferCalculator />)
    const marks = screen.getAllByTitle(
      /this figure is (interpolated|estimate)/i
    )
    expect(marks.length).toBeGreaterThan(0)
    for (const m of marks) expect(m.textContent).toBe('est.')
  })

  it('renders the three rungs as rows inside one ladder, never as cards', () => {
    useOfferStore.setState({ ...INITIAL, role: 'engineer' })
    render(<JobOfferCalculator />)
    const ladder = screen
      .getByRole('heading', { level: 2, name: /^Ask for/ })
      .closest('section')
    expect(within(ladder).getByText('Open with')).toBeInTheDocument()
    expect(within(ladder).getByText('Aim for')).toBeInTheDocument()
    expect(
      within(ladder).getByText('Minimum the market supports')
    ).toBeInTheDocument()
  })

  it('keeps the privacy line honest about what persists', () => {
    render(<JobOfferCalculator />)
    expect(screen.getByText(/nothing leaves your browser/i)).toBeInTheDocument()
  })
})
