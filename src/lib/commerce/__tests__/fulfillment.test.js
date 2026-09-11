import { describe, expect, it, vi, beforeEach } from 'vitest'

/* Relative imports and a mocked Resend: this module reaches no `@/` alias, so
   it runs in the engine project without one. */
const send = vi.fn().mockResolvedValue({})
// A class, not vi.fn: the module calls `new Resend(...)`, and an arrow
// function is not a constructor.
vi.mock('resend', () => ({
  Resend: class {
    emails = { send }
  },
}))

import { sendBoilerplateConfirmationEmail } from '../fulfillment'

const body = () => send.mock.calls.at(-1)[0].text

beforeEach(() => {
  send.mockClear()
  process.env.NEXT_PUBLIC_SITE_URL = 'https://example.com'
})

describe('boilerplate confirmation email', () => {
  it('repeats the username back, which is the only chance to catch a typo', async () => {
    await sendBoilerplateConfirmationEmail({
      to: 'buyer@example.com',
      itemName: 'SaaS Kit',
      githubUsername: 'octocat',
    })
    expect(body()).toContain('@octocat')
  })

  it('offers a correction route naming that account', async () => {
    await sendBoilerplateConfirmationEmail({
      to: 'buyer@example.com',
      itemName: 'SaaS Kit',
      githubUsername: 'octocat',
    })
    // Not just "contact us": the buyer must know what to say and why.
    expect(body()).toMatch(/reply to this email/i)
    expect(body()).toMatch(/not the right account/i)
  })

  it('says access is manual rather than implying it is automatic', async () => {
    await sendBoilerplateConfirmationEmail({
      to: 'buyer@example.com',
      itemName: 'SaaS Kit',
      githubUsername: 'octocat',
    })
    const text = body()
    expect(text).toMatch(/by hand/i)
    expect(text).toMatch(/not instant/i)
    // The regression this guards: a bare "shortly" with nothing behind it.
    expect(text).not.toMatch(/shortly/i)
  })

  it('commits to a window, so silence is measurable rather than ambiguous', async () => {
    await sendBoilerplateConfirmationEmail({
      to: 'buyer@example.com',
      itemName: 'SaaS Kit',
      githubUsername: 'octocat',
    })
    expect(body()).toMatch(/within one business day/i)
  })

  it('still reads correctly when no username reached the webhook', async () => {
    await sendBoilerplateConfirmationEmail({
      to: 'buyer@example.com',
      itemName: 'SaaS Kit',
    })
    const text = body()
    expect(text).not.toContain('@undefined')
    expect(text).toMatch(/gave at checkout/i)
    expect(text).toMatch(/reply to this email/i)
  })
})
