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

/* Two emails, because there are two truths.
 *
 * When the invitation actually went out, the email says so and carries the
 * link to accept it. When it did not -- no token configured, GitHub
 * unreachable, a repository the token cannot see -- the email falls back to
 * describing the manual process, which is what really happens next.
 *
 * The old copy said an invitation would arrive "shortly" in both cases.
 * Nothing sent one. A promise the system cannot keep costs more than a slower
 * promise it can, so neither branch claims more than it did.
 *
 * Both repeat the username back. That is the single moment a buyer can catch
 * their own typo -- after this, the next signal is an invitation that never
 * arrives, by which point they have paid and have no way to correct it.
 */
export async function sendBoilerplateConfirmationEmail(args: {
  to: string
  itemName: string
  githubUsername?: string
  /** `owner/repo`, so the buyer can tell which kit was granted. */
  repo?: string
  /** GitHub's accept link. Present only when an invitation really was sent. */
  inviteUrl?: string | null
  /** True when GitHub reports the buyer already had access. */
  alreadyHadAccess?: boolean
  /** Signed seat-management link. Only for licences with more than one seat. */
  seatsUrl?: string | null
  /** How many accounts the licence covers, when more than one. */
  seats?: number
}): Promise<void> {
  const target = args.githubUsername
    ? `@${args.githubUsername}`
    : 'the GitHub account you gave at checkout'

  const correction = args.githubUsername
    ? `\n\nIf @${args.githubUsername} is not the right account, reply to this email and I will fix it.`
    : '\n\nIf you need access sent to a different account, reply to this email.'

  const repoName = args.repo ? ` for ${args.repo}` : ''

  let body: string

  if (args.alreadyHadAccess) {
    body = `Thanks for buying ${args.itemName}.

${target} already has access to the repository${repoName}, so there is nothing to accept — open it and clone.${correction}

— Alec`
  } else if (args.inviteUrl) {
    body = `Thanks for buying ${args.itemName}.

A GitHub invitation${repoName} is waiting for ${target}. Accept it here:
${args.inviteUrl}

GitHub also emails you the invitation, and that one does sometimes land in spam. Invitations do lapse if they sit unaccepted — if yours has, reply to this email and I will send another.${correction}

— Alec`
  } else {
    body = `Thanks for buying ${args.itemName}.

I could not send the GitHub invitation automatically, so I am granting access by hand — which means it is not instant. You will get an invitation${repoName} to ${target} within ${INVITE_WINDOW}.${correction}

GitHub sends its own email when the invitation goes out, and it does sometimes land in spam.

— Alec`
  }

  /* Appended rather than woven into each branch: whether the invitation sent
     is a different question from how many accounts the licence covers, and
     the team half of the email should read the same either way. */
  if (args.seatsUrl && args.seats && args.seats > 1) {
    body += `

Your licence covers ${args.seats} GitHub accounts. Add the rest of your team here, one invitation each:
${args.seatsUrl}

Keep that link — it is how you add someone later, and it does not need an account.`
  }

  await getResend().emails.send({
    from: FROM,
    to: args.to,
    subject: `Your purchase of ${args.itemName}`,
    text: body,
  })
}
