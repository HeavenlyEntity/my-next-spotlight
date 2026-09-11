/*
 * Seat accounting for a team licence.
 *
 * Kept as pure functions over plain data, deliberately. The interesting part
 * of a seat limit is not the invitation, it is deciding whether this account
 * is allowed one -- and that decision has to survive a buyer refreshing the
 * page twice, adding someone who is already on the licence, and changing the
 * capitalisation of a username. None of that needs a database to test.
 *
 * The limit lives on the product, the used seats live on the purchase. A
 * purchase with no `seats` recorded on its product is a single-seat licence:
 * every Lite and Pro sale predates this field, and treating an absent limit
 * as unlimited would give away exactly the thing being sold.
 */

export type SeatMember = {
  githubUsername?: string | null
  inviteUrl?: string | null
  addedAt?: string | null
}

export type SeatVerdict =
  | { allowed: true; reason: 'new' }
  /* Already on the licence: not an error. Re-inviting is how someone who
     never accepted gets another chance, and it must not cost a seat. */
  | { allowed: true; reason: 'already-a-member' }
  | { allowed: false; reason: 'licence-full'; used: number; limit: number }

/** A licence always has at least one seat, even if the product forgot to say. */
export function seatLimit(product: { seats?: number | null } | null): number {
  const n = product?.seats
  return typeof n === 'number' && n >= 1 ? Math.floor(n) : 1
}

/** GitHub usernames are case-insensitive; two spellings are one person. */
const key = (name?: string | null) => (name || '').trim().toLowerCase()

export function seatsUsed(members: SeatMember[] | null | undefined): number {
  return listSeats(members).length
}

/** Deduplicated, in the order they were added. */
export function listSeats(members: SeatMember[] | null | undefined): string[] {
  const seen = new Set<string>()
  const out: string[] = []
  for (const m of members || []) {
    const k = key(m?.githubUsername)
    if (!k || seen.has(k)) continue
    seen.add(k)
    out.push((m.githubUsername || '').trim())
  }
  return out
}

export function hasSeat(
  members: SeatMember[] | null | undefined,
  username: string
): boolean {
  const k = key(username)
  return !!k && listSeats(members).some((n) => key(n) === k)
}

export function canAddSeat(
  members: SeatMember[] | null | undefined,
  username: string,
  product: { seats?: number | null } | null
): SeatVerdict {
  if (hasSeat(members, username)) {
    return { allowed: true, reason: 'already-a-member' }
  }
  const used = seatsUsed(members)
  const limit = seatLimit(product)
  if (used >= limit)
    return { allowed: false, reason: 'licence-full', used, limit }
  return { allowed: true, reason: 'new' }
}

export function seatsFullMessage(used: number, limit: number): string {
  return `This licence covers ${limit} ${
    limit === 1 ? 'account' : 'accounts'
  } and all ${used} are in use. Remove someone from the repository on GitHub to free a seat, or get in touch about a larger licence.`
}
