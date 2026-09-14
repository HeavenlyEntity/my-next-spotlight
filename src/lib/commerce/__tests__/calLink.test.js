import { describe, expect, it } from 'vitest'

import { calLinkFromUrl } from '../calLink'

describe('calLinkFromUrl', () => {
  it('extracts the link and names the namespace after the event type', () => {
    expect(calLinkFromUrl('https://cal.com/amware/on-demand-outcome')).toEqual({
      link: 'amware/on-demand-outcome',
      namespace: 'on-demand-outcome',
    })
  })

  it('tolerates a trailing slash and a www or app host', () => {
    expect(calLinkFromUrl('https://www.cal.com/amware/intro/')?.link).toBe(
      'amware/intro'
    )
    expect(calLinkFromUrl('https://app.cal.com/amware/intro')?.namespace).toBe(
      'intro'
    )
  })

  it('refuses anything that is not a bookable Cal.com event', () => {
    expect(calLinkFromUrl(null)).toBeNull()
    expect(calLinkFromUrl('')).toBeNull()
    expect(calLinkFromUrl('not a url')).toBeNull()
    expect(calLinkFromUrl('https://calendly.com/amware/intro')).toBeNull()
    expect(calLinkFromUrl('https://cal.com/amware')).toBeNull()
    expect(calLinkFromUrl('https://evilcal.com/amware/intro')).toBeNull()
  })
})
