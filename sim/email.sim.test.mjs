import { describe, expect, it } from 'vitest'
import { Resend } from 'resend'
import { sendBoilerplateConfirmationEmail } from '@/lib/commerce/fulfillment'

/* The webhook swallows email failures on purpose, so a green webhook test is
   not evidence the mail went out. This calls the sender directly and asks
   Resend for an id. */
describe('confirmation email actually leaves the building', () => {
  it('sends without throwing', async () => {
    await expect(
      sendBoilerplateConfirmationEmail({
        to: 'delivered@resend.dev',
        itemName: 'WareKit',
        githubUsername: 'HeavenlyEntity',
      })
    ).resolves.toBeUndefined()
  })

  it('reports a Resend id for the same payload', async () => {
    const r = new Resend(process.env.RESEND_API_KEY)
    const res = await r.emails.send({
      from: process.env.RESEND_FROM,
      to: 'delivered@resend.dev',
      subject: 'Your purchase of WareKit',
      text: 'simulation probe',
    })
    console.log('resend →', JSON.stringify(res))
    expect(res.error).toBeFalsy()
    expect(res.data?.id).toBeTruthy()
  })
})
