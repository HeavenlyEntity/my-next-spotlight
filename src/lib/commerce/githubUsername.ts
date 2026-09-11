/*
 * GitHub's own account-name rules, in one place because both sides need them:
 * the browser to give instant feedback, the server to re-check a submission it
 * cannot trust.
 *
 * Alphanumerics and single hyphens, never leading or trailing, 39 characters
 * at most. The lookahead is what forbids a doubled hyphen: a hyphen is only
 * allowed when another alphanumeric follows it, which also rules out a
 * trailing one without a second pattern.
 *
 * Deliberately no network call. Format is decidable offline, and rejecting a
 * malformed name here means never spending a GitHub request on input that
 * could not match an account anyway.
 */
const PATTERN = /^[a-z\d](?:[a-z\d]|-(?=[a-z\d])){0,38}$/i

/** Shared with the input's `pattern` attribute for native browser validation. */
export const GITHUB_USERNAME_PATTERN = PATTERN.source
export const GITHUB_USERNAME_MAX = 39

export type UsernameProblem = 'empty' | 'too-long' | 'malformed' | null

export function checkGithubUsername(raw: string): UsernameProblem {
  const value = raw.trim()
  if (!value) return 'empty'
  if (value.length > GITHUB_USERNAME_MAX) return 'too-long'
  return PATTERN.test(value) ? null : 'malformed'
}

/* Messages say what is wrong and what to do, rather than "invalid input". */
export function usernameMessage(problem: UsernameProblem): string | null {
  switch (problem) {
    case 'empty':
      return 'Enter the GitHub username that should receive repository access.'
    case 'too-long':
      return `GitHub usernames are at most ${GITHUB_USERNAME_MAX} characters.`
    case 'malformed':
      return 'Use letters, numbers and single hyphens only — no spaces, and not starting or ending with a hyphen.'
    default:
      return null
  }
}
