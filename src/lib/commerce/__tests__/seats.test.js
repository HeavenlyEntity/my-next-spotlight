import { describe, expect, it } from 'vitest'

/* Relative import: the engine project defines no `@/` alias, and this module
   reaches nothing at all. */
import {
  canAddSeat,
  hasSeat,
  listSeats,
  seatLimit,
  seatsFullMessage,
  seatsUsed,
} from '../seats'

const members = (...names) =>
  names.map((githubUsername) => ({ githubUsername }))
const team = { seats: 5 }
const solo = { seats: 1 }

describe('seatLimit', () => {
  it('reads the limit off the product', () => {
    expect(seatLimit(team)).toBe(5)
  })

  /* Every Lite and Pro sale predates this field. Treating an absent limit as
     unlimited would give away the exact thing Team is selling. */
  it('treats a missing limit as one seat, never as unlimited', () => {
    expect(seatLimit({})).toBe(1)
    expect(seatLimit(null)).toBe(1)
    expect(seatLimit({ seats: null })).toBe(1)
    expect(seatLimit({ seats: 0 })).toBe(1)
    expect(seatLimit({ seats: -3 })).toBe(1)
  })
})

describe('counting seats', () => {
  it('counts members', () => {
    expect(seatsUsed(members('a', 'b'))).toBe(2)
    expect(seatsUsed([])).toBe(0)
    expect(seatsUsed(null)).toBe(0)
  })

  it('counts one person once, however they capitalised it', () => {
    // GitHub usernames are case-insensitive. Two spellings are one seat.
    expect(seatsUsed(members('OctoCat', 'octocat', 'OCTOCAT'))).toBe(1)
    expect(listSeats(members('OctoCat', 'octocat'))).toEqual(['OctoCat'])
  })

  it('ignores blank rows rather than billing a seat for them', () => {
    expect(
      seatsUsed([{ githubUsername: '' }, { githubUsername: '  ' }, {}])
    ).toBe(0)
  })

  it('trims before comparing, so a stray space is not a second seat', () => {
    expect(seatsUsed(members('octocat', '  octocat  '))).toBe(1)
  })
})

describe('hasSeat', () => {
  it('matches case-insensitively', () => {
    expect(hasSeat(members('OctoCat'), 'octocat')).toBe(true)
    expect(hasSeat(members('octocat'), 'OCTOCAT')).toBe(true)
  })

  it('is false for an empty name rather than matching a blank row', () => {
    expect(hasSeat(members('octocat'), '')).toBe(false)
    expect(hasSeat([{ githubUsername: '' }], '')).toBe(false)
  })
})

describe('canAddSeat', () => {
  it('allows a new account while the licence has room', () => {
    expect(canAddSeat(members('a', 'b'), 'c', team)).toEqual({
      allowed: true,
      reason: 'new',
    })
  })

  it('allows the last seat exactly, and refuses the one after', () => {
    const four = members('a', 'b', 'c', 'd')
    expect(canAddSeat(four, 'e', team).allowed).toBe(true)
    expect(canAddSeat([...four, { githubUsername: 'e' }], 'f', team)).toEqual({
      allowed: false,
      reason: 'licence-full',
      used: 5,
      limit: 5,
    })
  })

  /* Re-adding someone already on the licence must not cost a seat. It is how
     a person who never accepted their invitation gets another one, and a team
     of five would otherwise lock itself out by retrying. */
  it('lets an existing member through without spending a seat', () => {
    const full = members('a', 'b', 'c', 'd', 'e')
    expect(canAddSeat(full, 'a', team)).toEqual({
      allowed: true,
      reason: 'already-a-member',
    })
    expect(canAddSeat(full, 'A', team).allowed).toBe(true)
  })

  it('refuses a second account on a single-seat licence', () => {
    expect(canAddSeat(members('a'), 'b', solo)).toMatchObject({
      allowed: false,
      limit: 1,
    })
    // But the buyer themselves can always be re-invited.
    expect(canAddSeat(members('a'), 'a', solo).allowed).toBe(true)
  })

  it('allows the first seat on an empty licence', () => {
    expect(canAddSeat([], 'a', solo).allowed).toBe(true)
    expect(canAddSeat(null, 'a', team).allowed).toBe(true)
  })
})

describe('seatsFullMessage', () => {
  it('says what to do, not just that it is full', () => {
    const m = seatsFullMessage(5, 5)
    expect(m).toMatch(/5 accounts/)
    expect(m).toMatch(/remove someone/i)
  })

  it('reads correctly for a single seat', () => {
    expect(seatsFullMessage(1, 1)).toMatch(/1 account\b/)
  })
})
