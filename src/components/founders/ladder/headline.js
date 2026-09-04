import { fmtMoney, fmtPct } from '@/lib/founders/equity/brief'

/*
 * The sentence under the ask.
 *
 * The equity calculator has six of these keyed to where the offer sits, and
 * tests assert each one. Without them an implementer ships a static label in
 * the highest-value place on the page, which is what the design review caught
 * this plan about to do.
 *
 * Priority matters more than coverage here. Someone whose offer is below what
 * the market supports needs to hear that before they hear anything about
 * exchange rates, so the variants are ordered by urgency rather than by where
 * they happen to fall on the ladder.
 */

const VARIANTS = [
  {
    id: 'below_floor',
    when: ({ offer }) => offer?.position === 'below_floor',
    line: ({ ask, offer }) =>
      `Their offer is ${fmtMoney(
        ask.floor.cash - offer.cash
      )} below the least this seat pays anywhere in the researched band. That gap is the conversation.`,
  },
  {
    id: 'above_ceiling',
    when: ({ offer }) => offer?.position === 'above_ceiling',
    line: () =>
      'Their cash offer already sits above the researched band for this seat. If something here still feels wrong, it is the equity, not the salary.',
  },
  {
    id: 'late_stage_trade',
    when: ({ ask, offer }) =>
      offer?.position === 'within' && ask.trade.perTenK <= 0.05,
    line: ({ ask }) =>
      `The cash is inside the band, so the question is the equity. At this stage ${fmtMoney(
        10000
      )} of salary buys only about ${fmtPct(
        ask.trade.perTenK
      )} points, so trading pay for shares is a poor deal here.`,
  },
  {
    id: 'below_target',
    when: ({ ask, offer }) =>
      offer?.position === 'within' && offer.cash < ask.target.cash,
    line: ({ ask, offer }) =>
      `Their offer is inside the band but ${fmtMoney(
        ask.target.cash - offer.cash
      )} under the middle of it. Asking to reach the middle is not an aggressive request.`,
  },
  {
    id: 'above_target',
    when: ({ offer }) => offer?.position === 'within',
    line: () =>
      'Their cash offer is already at or above the middle of the band. Spend the negotiation on the equity and the terms instead.',
  },
  {
    id: 'no_offer',
    when: () => true,
    line: () =>
      'Nothing has been offered yet, or you have not entered it. This is the band the market supports for this seat, which is what you would be asking against.',
  },
]

/**
 * Pick the sentence that goes under the ask.
 * @param {object} ask a computeAsk() ladder
 * @returns {{ id: string, line: string }}
 */
export function headlineFor(ask) {
  const offer = ask?.offer ?? null
  const ctx = { ask, offer }
  /* `no_offer` is the last entry and always matches, so this cannot fall
     through to undefined. */
  const variant =
    VARIANTS.find((v) => v.when(ctx)) ?? VARIANTS[VARIANTS.length - 1]
  return { id: variant.id, line: variant.line(ctx) }
}

/** Every variant id, so a test can assert all six are reachable. */
export const HEADLINE_IDS = Object.freeze(VARIANTS.map((v) => v.id))
