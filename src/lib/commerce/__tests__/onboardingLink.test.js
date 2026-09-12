import { describe, expect, it, beforeEach, afterEach } from 'vitest'

import {
  onboardingPath,
  onboardingSignature,
  verifyOnboardingLink,
} from '../onboardingLink'

const ID = '8f0d6a1e-0f3c-4b5a-9f2e-1c4d5e6f7a8b'

beforeEach(() => {
  process.env.ACCESS_LINK_SECRET = 'onboarding-test-secret'
})
afterEach(() => {
  delete process.env.ACCESS_LINK_SECRET
  delete process.env.ACCESS_TOKEN_SECRET
})

describe('onboarding link', () => {
  it('round-trips', () => {
    expect(verifyOnboardingLink(ID, onboardingSignature(ID))).toBe(true)
  })

  it('rejects a made-up request id', () => {
    /* The whole point. Without the signature, anyone who learns the URL
       shape could try ids until one matched a real purchase. */
    expect(verifyOnboardingLink('some-other-id', onboardingSignature(ID))).toBe(
      false
    )
  })

  it('rejects a signature from a different secret', () => {
    const sig = onboardingSignature(ID)
    process.env.ACCESS_LINK_SECRET = 'a-different-secret'
    expect(verifyOnboardingLink(ID, sig)).toBe(false)
  })

  it('rejects empty, missing and malformed input rather than throwing', () => {
    for (const [id, sig] of [
      [null, null],
      [ID, null],
      [null, 'x'],
      [ID, ''],
      [ID, 'not-a-signature'],
      ['', ''],
    ]) {
      expect(verifyOnboardingLink(id, sig)).toBe(false)
    }
  })

  it('verifies nothing when no secret is configured', () => {
    const sig = onboardingSignature(ID)
    delete process.env.ACCESS_LINK_SECRET
    // Fails closed. An empty HMAC key is still a valid key, so without this
    // a misconfigured deployment would verify links it never signed.
    expect(verifyOnboardingLink(ID, sig)).toBe(false)
    expect(onboardingSignature(ID)).toBeNull()
    expect(onboardingPath(ID)).toBeNull()
  })

  it('still works under the legacy secret name', () => {
    delete process.env.ACCESS_LINK_SECRET
    process.env.ACCESS_TOKEN_SECRET = 'old-name'
    expect(verifyOnboardingLink(ID, onboardingSignature(ID))).toBe(true)
  })

  it('builds a path with both halves, url-encoded', () => {
    const p = onboardingPath(ID)
    expect(p).toMatch(/^\/checkout\/onboarding\?r=/)
    const url = new URL(p, 'https://example.com')
    expect(url.searchParams.get('r')).toBe(ID)
    expect(verifyOnboardingLink(ID, url.searchParams.get('s'))).toBe(true)
  })

  it('produces a signature safe to put in a URL', () => {
    // base64url: a raw base64 "+" or "/" would be mangled by the round trip.
    expect(onboardingSignature(ID)).toMatch(/^[A-Za-z0-9_-]+$/)
  })
})
