import { describe, expect, it } from 'vitest'

/* Relative import, not the `@/` alias: vitest's engine project defines no
   alias, and this module has no imports of its own so it runs here cleanly. */
import {
  checkGithubUsername,
  usernameMessage,
  GITHUB_USERNAME_MAX,
} from '../githubUsername'

const ok = (name) => expect(checkGithubUsername(name)).toBeNull()
const bad = (name, problem) => expect(checkGithubUsername(name)).toBe(problem)

describe('checkGithubUsername', () => {
  it('accepts the shapes GitHub actually issues', () => {
    ok('octocat')
    ok('HeavenlyEntity')
    ok('a') // single character is legal
    ok('a-b')
    ok('user-name-with-many-hyphens')
    ok('123')
    ok('a'.repeat(GITHUB_USERNAME_MAX)) // exactly at the limit
  })

  it('rejects hyphens where GitHub does', () => {
    bad('-octocat', 'malformed') // leading
    bad('octocat-', 'malformed') // trailing
    bad('octo--cat', 'malformed') // doubled
    bad('-', 'malformed')
  })

  it('rejects what a typo actually looks like', () => {
    bad('octo cat', 'malformed') // a space, the commonest slip
    bad('octo_cat', 'malformed') // underscore, legal almost everywhere else
    bad('octo.cat', 'malformed')
    bad('https://github.com/octocat', 'malformed') // pasted profile URL
    bad('@octocat', 'malformed') // pasted handle
  })

  it('distinguishes empty from malformed so the message can differ', () => {
    bad('', 'empty')
    bad('   ', 'empty')
  })

  it('reports over-length separately from malformed', () => {
    bad('a'.repeat(GITHUB_USERNAME_MAX + 1), 'too-long')
  })

  it('trims before judging, so a stray space is not an error', () => {
    ok('  octocat  ')
  })
})

describe('usernameMessage', () => {
  it('gives every problem a message that says what to do', () => {
    for (const p of ['empty', 'too-long', 'malformed']) {
      expect(usernameMessage(p)).toBeTruthy()
    }
    expect(usernameMessage(null)).toBeNull()
  })

  it('never returns a bare "invalid" with no remedy', () => {
    expect(usernameMessage('malformed')).toMatch(/letters, numbers/i)
    expect(usernameMessage('too-long')).toMatch(/39/)
  })
})
