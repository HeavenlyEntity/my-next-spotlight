'use server'

import { getPayloadClient } from '@/lib/getPayloadClient'
import { inviteToRepo } from '@/lib/commerce/githubInvite'
import { sendBoilerplateConfirmationEmail } from '@/lib/commerce/fulfillment'
import { verifyOnboardingLink } from '@/lib/commerce/onboardingLink'
import {
  checkGithubUsername,
  usernameMessage,
} from '@/lib/commerce/githubUsername'

/*
 * Finishing a purchase: the buyer names the GitHub account, and the kit goes
 * there.
 *
 * Every route into this action re-verifies the signed link. The page verified
 * it to render, but a page render is not a permission -- the form posts on its
 * own and has to prove itself on its own.
 *
 * Two gates, both required. The signature proves we minted the link. A paid
 * purchase carrying that request id proves the money arrived, which the
 * signature cannot, because the link is minted before payment.
 */

export type OnboardingState = {
  error: { field: 'githubUsername' | null; message: string } | null
  ok: {
    username: string
    repo: string
    inviteUrl: string | null
    alreadyHadAccess: boolean
    /** True when nothing could be sent and a human has to finish it. */
    manual: boolean
  } | null
}

const fail = (
  field: 'githubUsername' | null,
  message: string
): OnboardingState => ({ error: { field, message }, ok: null })

async function githubAccountExists(login: string): Promise<boolean | null> {
  const token = process.env.GITHUB_TOKEN
  try {
    const res = await fetch(
      `https://api.github.com/users/${encodeURIComponent(login)}`,
      {
        headers: {
          Accept: 'application/vnd.github+json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        signal: AbortSignal.timeout(4000),
      }
    )
    if (res.status === 404) return false
    if (!res.ok) return null
    return true
  } catch {
    return null
  }
}

export async function completeOnboarding(
  _prevState: OnboardingState,
  formData: FormData
): Promise<OnboardingState> {
  const requestId = String(formData.get('r') || '')
  const signature = String(formData.get('s') || '')
  const username = String(formData.get('githubUsername') || '').trim()

  if (!verifyOnboardingLink(requestId, signature)) {
    return fail(
      null,
      'This setup link is not valid. Use the link in your purchase email, or reply to it and I will send a new one.'
    )
  }

  const problem = checkGithubUsername(username)
  if (problem) return fail('githubUsername', usernameMessage(problem)!)

  const payload = await getPayloadClient()
  const { docs } = await payload.find({
    collection: 'purchases',
    where: { creemRequestId: { equals: requestId } },
    depth: 1,
    limit: 1,
    overrideAccess: true,
  })
  const purchase = docs[0]

  /* Signed but unpaid. The link is minted at checkout, so someone can hold it
     without ever paying -- and the webhook is what creates this row. It can
     also simply be early: the browser redirect regularly beats the
     server-to-server webhook by a second or two. Either way the honest answer
     is the same, and it is never the kit. */
  if (!purchase || purchase.status !== 'paid') {
    return fail(
      null,
      'That payment has not reached me yet. It usually takes a few seconds — refresh this page, and if it persists reply to your receipt.'
    )
  }

  const product =
    purchase.item && typeof purchase.item === 'object'
      ? (purchase.item as { value?: unknown }).value
      : null
  const productDoc = (
    product && typeof product === 'object' ? product : null
  ) as { githubRepo?: string | null; name?: string | null } | null

  const repo = productDoc?.githubRepo || purchase.githubRepo
  if (!repo) {
    return fail(
      null,
      'This kit has no repository attached yet. Reply to your receipt and I will sort it by hand.'
    )
  }

  /* Fails open, as everywhere else: only GitHub saying the account is absent
     stops this. A timeout or a rate limit says nothing about the name, and
     this buyer has already paid. */
  if ((await githubAccountExists(username)) === false) {
    return fail(
      'githubUsername',
      `GitHub has no account called “${username}”. Check the spelling: this is where the repository invitation is sent.`
    )
  }

  const invite = await inviteToRepo({ repo, username })
  if (!invite.ok) {
    console.error('Onboarding invite failed', {
      purchase: purchase.id,
      repo,
      reason: invite.reason,
    })
  }

  const alreadyHadAccess =
    invite.ok && invite.state === 'already-a-collaborator'

  /* Recorded whether or not the invitation sent. The username is the answer
     to the question this page exists to ask, and losing it because GitHub was
     down would mean asking again. */
  await payload
    .update({
      collection: 'purchases',
      id: purchase.id,
      overrideAccess: true,
      data: {
        githubUsername: username,
        githubRepo: repo,
        ...(invite.ok && invite.url ? { githubInviteUrl: invite.url } : {}),
        /* The buyer is seat one. Recorded here rather than at the webhook,
           because at the webhook there was no username to record. */
        seatMembers: [
          {
            githubUsername: username,
            inviteUrl: (invite.ok && invite.url) || undefined,
            addedAt: new Date().toISOString(),
          },
        ],
        fulfillmentStatus: invite.ok ? 'sent' : 'pending_invite',
      },
    })
    .catch(() => console.error('Onboarding record failed', purchase.id))

  // Best-effort: access is already granted, and a bounced email must not
  // undo it. The page shows the same information either way.
  try {
    await sendBoilerplateConfirmationEmail({
      to: purchase.email,
      itemName: productDoc?.name || 'your kit',
      githubUsername: username,
      repo,
      inviteUrl: invite.ok ? invite.url : null,
      alreadyHadAccess,
    })
  } catch {
    console.error('Onboarding email failed', purchase.id)
  }

  return {
    error: null,
    ok: {
      username,
      repo,
      inviteUrl: invite.ok ? invite.url : null,
      alreadyHadAccess,
      manual: !invite.ok,
    },
  }
}
