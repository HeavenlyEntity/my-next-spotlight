/*
 * Turning the products collection into a pricing table.
 *
 * Pulled out of the page because this is the part that can be wrong in a way
 * that costs money: a tier shown at the wrong price, a seat count that does
 * not match what the seat page enforces, or a "Buy" button on something with
 * no Creem product behind it. A server component that awaits a database is
 * awkward to test; these are plain functions over plain data.
 */

export type PricingKit = {
  id: number | string
  name: string
  slug: string
  tagline?: string | null
  price?: number | null
  seats?: number | null
  stack?: string | null
  tier?: string | null
  popular?: boolean | null
  creemProductId?: string | null
  pricingHighlights?: { highlight?: string | null }[] | null
}

export const STACK_ORDER = ['next-netsuite', 'react-netsuite'] as const
export const TIER_ORDER = ['lite', 'pro', 'team'] as const

export const STACK_LABEL: Record<string, string> = {
  'next-netsuite': 'Next.js + NetSuite',
  'react-netsuite': 'React in NetSuite',
}

export const STACK_BLURB: Record<string, string> = {
  'next-netsuite':
    'A Next.js app on Vercel that reaches NetSuite from its API routes, over OAuth 2 for sign-in and token auth for server-to-server calls.',
  'react-netsuite':
    'A React app served by a Suitelet from inside your NetSuite account, same-origin with the signed-in session. No hosting and no tokens in the browser.',
}

/** Free is a price of exactly 0. No price at all means unfinished. */
export function priceLabel(kit: PricingKit): string {
  if (kit.price === 0) return 'Free'
  if (typeof kit.price === 'number') return `$${kit.price.toFixed(0)}`
  return 'Soon'
}

export function periodLabel(kit: PricingKit): string {
  return kit.price === 0 ? 'no card required' : 'one time'
}

/* Generated from the same field the seat page enforces, never typed into the
   bullets by hand -- a pricing page promising six seats on a five-seat
   licence is a refund, not a typo. */
export function seatLine(kit: PricingKit): string {
  const n = typeof kit.seats === 'number' && kit.seats >= 1 ? kit.seats : 1
  return n === 1 ? 'Access for 1 user (only you)' : `Up to ${n} collaborators`
}

/* Published and purchasable are different things, and the page has to say
   which. A tier still being built belongs on the pricing table -- leaving it
   out makes the stack look half-finished and hides the roadmap -- but it must
   never carry a Buy button, because the checkout could not complete and the
   repository does not exist to invite anyone to.
 *
 * The absence of a Creem product is what marks it, rather than a flag someone
 * has to remember to unset: a kit becomes buyable at the moment there is
 * something to charge against, and not before. Free kits need no product. */
export function cta(kit: PricingKit): {
  label: string
  live: boolean
  soon: boolean
} {
  if (kit.price === 0) return { label: 'Get it free', live: true, soon: false }
  if (!kit.creemProductId) {
    return { label: 'In development', live: false, soon: true }
  }
  return { label: 'Buy this kit', live: true, soon: false }
}

export function highlights(kit: PricingKit): string[] {
  return (kit.pricingHighlights ?? [])
    .map((b) => b?.highlight)
    .filter((h): h is string => Boolean(h && h.trim()))
}

/** Only the first popular kit wins, so marking everything marks nothing. */
export function popularId(kits: PricingKit[]): PricingKit['id'] | null {
  return kits.find((k) => k.popular)?.id ?? null
}

export type PricingStack = { stack: string; tiers: PricingKit[] }

/* Grouped by stack, ordered by tier, with empty stacks dropped. A kit with no
   stack or tier set is left out rather than guessed at: it would otherwise
   land in an arbitrary column at an arbitrary position, which looks like a
   bug in the pricing rather than a missing field in the admin. */
export function buildPricingTable(kits: PricingKit[]): PricingStack[] {
  return STACK_ORDER.map((stack) => ({
    stack: stack as string,
    tiers: TIER_ORDER.map((tier) =>
      kits.find((k) => k.stack === stack && k.tier === tier)
    ).filter((k): k is PricingKit => Boolean(k)),
  })).filter((s) => s.tiers.length > 0)
}
