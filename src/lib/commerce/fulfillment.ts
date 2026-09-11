import { Resend } from 'resend'

let resend: Resend | null = null

function getResend(): Resend {
  if (!resend) resend = new Resend(process.env.RESEND_API_KEY)
  return resend
}
const FROM = process.env.RESEND_FROM || 'Amware <hello@amware.dev>'
const SITE = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, '') || ''

export async function sendAccessLinkEmail(args: {
  to: string
  itemName: string
  token: string
}): Promise<void> {
  if (!SITE)
    throw new Error('NEXT_PUBLIC_SITE_URL is required to send access links')
  const url = `${SITE}/access/${args.token}`
  await getResend().emails.send({
    from: FROM,
    to: args.to,
    subject: `Your access to ${args.itemName}`,
    text: `Thanks for your purchase of ${args.itemName}.\n\nAccess it here:\n${url}\n\nThis link is personal to you and expires in 30 days. You can request a fresh link any time at ${SITE}/access/resend.\n\n— Alec`,
  })
}

/* How long a buyer should wait before assuming something went wrong. Change
 * this and the email changes with it -- it is a commitment, so it lives where
 * it can be found rather than buried in a sentence. */
const INVITE_WINDOW = 'one business day'

/* The old copy said an invitation would arrive "shortly". Nothing sends one:
 * repository access is granted by hand, and the automated invite is still
 * unbuilt. A promise the system cannot keep costs more than a slower promise
 * it can, so this describes the process that actually happens.
 *
 * It also repeats the username back. That is the single moment a buyer can
 * catch their own typo -- after this, the next signal is an invitation that
 * never arrives, by which point they have paid and have no way to correct it.
 */
export async function sendBoilerplateConfirmationEmail(args: {
  to: string
  itemName: string
  githubUsername?: string
}): Promise<void> {
  const target = args.githubUsername
    ? `@${args.githubUsername}`
    : 'the GitHub account you gave at checkout'

  const correction = args.githubUsername
    ? `\n\nIf @${args.githubUsername} is not the right account, reply to this email and I will fix it before sending the invitation.`
    : '\n\nIf you need the invitation sent to a different account, reply to this email.'

  await getResend().emails.send({
    from: FROM,
    to: args.to,
    subject: `Your purchase of ${args.itemName}`,
    text: `Thanks for buying ${args.itemName}.

I grant repository access by hand rather than automatically, so it is not instant. You will get a GitHub invitation to ${target} within ${INVITE_WINDOW}.${correction}

GitHub sends its own email when the invitation goes out, and it does sometimes land in spam.

— Alec`,
  })
}
