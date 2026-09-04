import { LABELS } from './equity/benchmarks.js'
import { fmtMoney, fmtPct } from './equity/brief.js'

/* One-shot handoff from the calculator's results screen to the contact
   form. The filled brief lives in memory for the client-side navigation
   and, as a fallback for a full page load, in sessionStorage on this
   device only. The contact form takes it once and clears both. Nothing
   goes into a URL and nothing leaves the browser. */

const KEY = 'amw:offer-review'
let memory = null

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

/**
 * Stash the filled brief for the contact form.
 * @param {{ subject: string, message: string }} payload
 */
export function stashBrief(payload) {
  memory = payload
  try {
    window.sessionStorage.setItem(KEY, JSON.stringify(payload))
  } catch {
    /* storage may be unavailable; memory still carries the client-side navigation */
  }
}

/**
 * Take the stashed brief once, clearing memory and storage.
 * @returns {{ subject: string, message: string }|null}
 */
export function takeBrief() {
  let payload = memory
  memory = null
  try {
    if (!payload) {
      const raw = window.sessionStorage.getItem(KEY)
      if (raw) payload = JSON.parse(raw)
    }
    window.sessionStorage.removeItem(KEY)
  } catch {
    /* ignore */
  }
  return payload && typeof payload.message === 'string' ? payload : null
}
