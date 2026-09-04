import { track } from '@vercel/analytics'

/* Value-free funnel events. Only event names and a step index are ever
   sent; no calculator input, output, or free text. Wrapped so an ad
   blocker or a missing provider can never surface as an error. */

const EVENTS = {
  step: 'founders_step_viewed',
  completed: 'founders_completed',
  printed: 'founders_printed',
  copied: 'founders_copied',
  cta: 'founders_cta_clicked',
}

export function trackStep(step) {
  safeTrack(EVENTS.step, { step: Number(step) || 0 })
}

export function trackCompleted() {
  safeTrack(EVENTS.completed)
}

export function trackPrinted() {
  safeTrack(EVENTS.printed)
}

export function trackCopied() {
  safeTrack(EVENTS.copied)
}

export function trackCta() {
  safeTrack(EVENTS.cta)
}

function safeTrack(name, props) {
  try {
    track(name, props)
  } catch {
    /* analytics is best-effort by design */
  }
}
