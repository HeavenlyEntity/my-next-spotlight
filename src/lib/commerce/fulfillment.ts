import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY || '')
const FROM = process.env.RESEND_FROM || 'Amware <hello@amware.dev>'
const SITE = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, '') || ''

export async function sendAccessLinkEmail(args: {
  to: string
  itemName: string
  token: string
}): Promise<void> {
  const url = `${SITE}/access/${args.token}`
  await resend.emails.send({
    from: FROM,
    to: args.to,
    subject: `Your access to ${args.itemName}`,
    text: `Thanks for your purchase of ${args.itemName}.\n\nAccess it here:\n${url}\n\nThis link is personal to you and expires in 30 days. You can request a fresh link any time at ${SITE}/access/resend.\n\n— Alec`,
  })
}

export async function sendBoilerplateConfirmationEmail(args: {
  to: string
  itemName: string
}): Promise<void> {
  await resend.emails.send({
    from: FROM,
    to: args.to,
    subject: `Your purchase of ${args.itemName}`,
    text: `Thanks for buying ${args.itemName}.\n\nWe'll send a GitHub repository invitation to the username you provided shortly. If you don't receive it, reply to this email.\n\n— Alec`,
  })
}
