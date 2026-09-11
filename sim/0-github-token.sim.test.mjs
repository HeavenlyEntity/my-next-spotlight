import { describe, expect, it } from 'vitest'
import { getPayload } from 'payload'
import config from '@payload-config'

/*
 * Preflight for GITHUB_TOKEN. See docs/github-token.md.
 *
 * The invitation is attempted inside a payment webhook and is deliberately
 * allowed to fail soft, which means a broken token produces no alarm at all:
 * orders keep landing, every one takes the manual path, and the first person
 * to notice is a customer waiting for access. This is the check that runs
 * before that, on demand.
 *
 * It never sends an invitation. Proving the token can write by writing would
 * mean inviting a real person to a real repository, so it proves the two
 * things that actually fail in practice -- the token cannot see the repo, or
 * it is not an admin of it -- and reports the rest.
 *
 * With no token it says so and skips. A preflight that passes when there is
 * nothing to check is worse than no preflight.
 */

const TOKEN = process.env.GITHUB_TOKEN
if (!TOKEN) {
  console.log(
    'SKIPPED: GITHUB_TOKEN is unset, so every purchase takes the manual-invite fallback. See docs/github-token.md.'
  )
}

const gh = (path) =>
  fetch(`https://api.github.com${path}`, {
    headers: {
      Accept: 'application/vnd.github+json',
      Authorization: `Bearer ${TOKEN}`,
      'X-GitHub-Api-Version': '2022-11-28',
    },
  })

const payload = TOKEN ? await getPayload({ config }) : null

/* Every repository the catalogue can actually invite someone to. Read from
   the products collection rather than a list here, so adding a kit brings it
   into the preflight automatically.
 *
 * Obtainable, not merely published: a tier shown as "In development" is on
 * the pricing page on purpose and its repository does not exist yet, so
 * demanding admin on it would fail the preflight for a kit nobody can buy. */
const repos = payload
  ? [
      ...new Set(
        (
          await payload.find({
            collection: 'products',
            where: { type: { equals: 'boilerplate' } },
            limit: 100,
            overrideAccess: true,
          })
        ).docs
          .filter(
            (d) =>
              d.status === 'published' &&
              d.githubRepo &&
              (d.price === 0 || d.creemProductId)
          )
          .map((d) => d.githubRepo)
      ),
    ]
  : []

describe.skipIf(!TOKEN)('GITHUB_TOKEN preflight', () => {
  it('is a token GitHub recognises', async () => {
    const res = await gh('/user')
    const scopes = res.headers.get('x-oauth-scopes')
    const body = await res.json().catch(() => ({}))
    console.log(
      `token acts as: ${body.login ?? '(fine-grained, no /user identity)'} · ` +
        `classic scopes: ${scopes || '— (fine-grained)'}`
    )
    // 403 on /user is normal for a fine-grained token with no user
    // permissions. 401 is not: that is a token GitHub has rejected outright.
    expect(res.status).not.toBe(401)
  })

  it('has a repository to check', () => {
    console.log('kit repositories:', repos.join(', ') || '(none)')
    expect(repos.length).toBeGreaterThan(0)
  })

  for (const repo of repos) {
    it(`can administer ${repo}`, async () => {
      const res = await gh(`/repos/${repo}`)
      expect(
        res.status,
        `GET /repos/${repo} returned ${res.status}. 404 usually means the ` +
          `token's resource owner is a personal account rather than the org, ` +
          `or this repo was not in the selected-repositories list.`
      ).toBe(200)

      const body = await res.json()
      /* Admin is what "add a repository collaborator" needs. A token that can
         read the repo but not administer it fails at the only moment that
         matters -- after someone has paid. */
      expect(
        body.permissions?.admin,
        `the token can read ${repo} but is not an admin of it, so it cannot ` +
          `add collaborators. Fine-grained tokens need Administration: ` +
          `read and write.`
      ).toBe(true)

      // Administration:read, and the queue of invitations already outstanding.
      const inv = await gh(`/repos/${repo}/invitations`)
      expect(inv.status).toBe(200)
      const pending = await inv.json()
      console.log(
        `${repo}: admin ✓, ${pending.length} invitation(s) pending` +
          (pending.length
            ? ` → ${pending.map((i) => '@' + i.invitee?.login).join(', ')}`
            : '')
      )
    })
  }
})
