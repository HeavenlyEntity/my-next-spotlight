/*
 * Sends the repository invitation a boilerplate buyer paid for.
 *
 * `PUT /repos/{owner}/{repo}/collaborators/{username}` is the whole API. It
 * answers 201 with an invitation object when it creates one, and 204 with no
 * body when the person is already a collaborator -- which is not a failure
 * and must not be reported as one, because it is exactly what a second
 * webhook delivery for the same order looks like.
 *
 * Access is `pull`. A buyer needs to clone and fork the kit, never to push to
 * the product itself, and `push` is the default the API would otherwise pick
 * for you.
 *
 * Nothing here throws. This runs inside a payment webhook, where an exception
 * means Creem retries an order that was already captured, and where GitHub
 * being unreachable says nothing about whether the sale was good. Every
 * failure comes back as a value so the caller can record the order, fall back
 * to the manual path, and tell the buyer the truth.
 */

const API = 'https://api.github.com'
const TIMEOUT_MS = 8000

/** Read access: clone and fork, never push to the product repository. */
const PERMISSION = 'pull'

export type InviteFailure =
  | 'not-configured' // no GITHUB_TOKEN, so we cannot invite anyone
  | 'no-repo' // the product names no repository
  | 'no-username' // the purchase carries no GitHub account
  | 'not-found' // repo or user gone, or the token cannot see the repo
  | 'forbidden' // token lacks the scope, or SSO is not authorised
  | 'rate-limited'
  | 'unreachable' // timeout, DNS, GitHub 5xx

export type InviteResult =
  | { ok: true; state: 'invited'; url: string | null; id: number | null }
  | { ok: true; state: 'already-a-collaborator'; url: null; id: null }
  | { ok: false; reason: InviteFailure; detail?: string }

/** `owner/repo`, the shape the products collection stores. */
const REPO = /^[\w.-]+\/[\w.-]+$/

export async function inviteToRepo(args: {
  repo?: string | null
  username?: string | null
}): Promise<InviteResult> {
  const token = process.env.GITHUB_TOKEN
  if (!token) return { ok: false, reason: 'not-configured' }

  const repo = args.repo?.trim()
  if (!repo || !REPO.test(repo)) {
    return { ok: false, reason: 'no-repo', detail: args.repo ?? undefined }
  }

  const username = args.username?.trim()
  if (!username) return { ok: false, reason: 'no-username' }

  let res: Response
  try {
    res = await fetch(
      `${API}/repos/${repo}/collaborators/${encodeURIComponent(username)}`,
      {
        method: 'PUT',
        headers: {
          Accept: 'application/vnd.github+json',
          Authorization: `Bearer ${token}`,
          'X-GitHub-Api-Version': '2022-11-28',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ permission: PERMISSION }),
        signal: AbortSignal.timeout(TIMEOUT_MS),
      }
    )
  } catch {
    return { ok: false, reason: 'unreachable' }
  }

  // 204: already a collaborator. The commonest cause is a retried webhook,
  // so treating it as success is what makes this safe to call twice.
  if (res.status === 204) {
    return { ok: true, state: 'already-a-collaborator', url: null, id: null }
  }

  if (res.status === 201) {
    const body = await res.json().catch(() => null)
    return {
      ok: true,
      state: 'invited',
      // Null rather than a guessed URL: a link that 404s is worse in an
      // email than no link at all.
      url: typeof body?.html_url === 'string' ? body.html_url : null,
      id: typeof body?.id === 'number' ? body.id : null,
    }
  }

  if (res.status === 404) return { ok: false, reason: 'not-found' }
  if (res.status === 403) {
    // GitHub returns 403 for both "no scope" and "you are out of requests";
    // the header is the only thing that separates them.
    const remaining = res.headers.get('x-ratelimit-remaining')
    return {
      ok: false,
      reason: remaining === '0' ? 'rate-limited' : 'forbidden',
    }
  }
  if (res.status === 429) return { ok: false, reason: 'rate-limited' }

  return { ok: false, reason: 'unreachable', detail: String(res.status) }
}
