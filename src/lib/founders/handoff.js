import { LABELS } from './equity/benchmarks.js'
import { fmtMoney, fmtPct } from './equity/brief.js'

/* Formatting only.
 *
 * This used to own a second sessionStorage key ('amw:offer-review') alongside
 * the shared store's 'amw:offer'. Two mechanisms holding the same six fields,
 * under names one character apart, is how a tool starts showing one number on
 * one page and a different number on the next. The store is now the single
 * source of truth for the user's answers; this file just turns a read into the
 * text of a message (design review D6).
 */

/**
 * Build the subject and the filled message for the contact form from a
 * read: the seat, the offer, the read itself, the leaver terms, then the
 * full plain-text brief so nothing has to be retyped.
 * @param {object} read a computeRead() result
 * @returns {{ subject: string, message: string }}
 */
export function briefForContact(read) {
  const { inputs, classification, offer, adjustments, leaver, brief } = read
  const hasOffer = offer.pct !== null
  const salary =
    inputs.offeredSalary !== null
      ? `${fmtMoney(inputs.offeredSalary)} offered vs ${fmtMoney(
          inputs.marketSalary
        )} market (${fmtMoney(Math.abs(adjustments.salary.gap))} ${
          adjustments.salary.gap >= 0 ? 'below' : 'above'
        })`
      : `not entered (market ${fmtMoney(inputs.marketSalary)})`
  const lines = [
    `Role and seat: ${LABELS.role[inputs.role]}, ${LABELS.joining[
      inputs.joining
    ].toLowerCase()}`,
    `Stage (last closed round): ${LABELS.stage[inputs.stageKey]}`,
    `Offered equity: ${
      hasOffer
        ? `${fmtPct(offer.pct)}% fully diluted${
            offer.mode === 'shares' ? ' (from option count / FD shares)' : ''
          }`
        : 'not entered'
    }`,
    `Salary vs market: ${salary}`,
    `Company’s stated exit path: ${LABELS.path[inputs.path]}`,
    `The read: ${
      classification.pending ? 'pending' : LABELS.class[classification.class]
    }, range ${fmtPct(offer.range.lo)}–${fmtPct(offer.range.hi)}%${
      hasOffer ? `, offer ${offer.position} the band` : ''
    }`,
    `The number to say: ${
      offer.numberToSay?.sentence ?? brief.numberToSay?.sentence ?? ''
    }`,
  ]
  if (leaver) {
    lines.push(
      `If it ends: ${leaver.exercise.label}; acceleration ${
        LABELS.accelerationCoC[inputs.accelerationCoC]
      }, ${
        inputs.accelerationTerminationMonths
      } mo on termination; repurchase ${
        LABELS.repurchaseVested[inputs.repurchaseVested]
      }; severance ${inputs.severanceMonths} mo`
    )
  }
  lines.push(
    '',
    'What I want help with: ',
    '',
    '--- Full brief ---',
    brief.text
  )
  return {
    subject: `Offer review: ${LABELS.role[inputs.role]} at ${
      LABELS.stage[inputs.stageKey]
    }`,
    message: lines.join('\n'),
  }
}
