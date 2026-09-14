import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { WHOP_EVENT, centsToValue, whopTrack } from '../whop'

/* The engine project runs in node, so `window` is ours to define. That is
   the point: the helper must be safe to import from a server component and
   silent when the pixel is absent, and both are easiest to prove without a
   DOM. */

let track

beforeEach(() => {
  track = vi.fn()
  globalThis.window = { whop: { track } }
})

afterEach(() => {
  delete globalThis.window
})

describe('whopTrack', () => {
  it('hands the event and its data to the pixel', () => {
    const sent = whopTrack(WHOP_EVENT.lead, {
      email: 'a@b.co',
      name: 'Ada',
      event_id: 'contact_7',
    })
    expect(sent).toBe(true)
    expect(track).toHaveBeenCalledWith('lead', {
      email: 'a@b.co',
      name: 'Ada',
      event_id: 'contact_7',
    })
  })

  it('sends a bare event when there is no data', () => {
    whopTrack(WHOP_EVENT.page)
    expect(track).toHaveBeenCalledWith('page')
  })

  it('drops empty fields rather than sending blanks to be matched on', () => {
    whopTrack(WHOP_EVENT.lead, { email: '', name: undefined, phone: null })
    expect(track).toHaveBeenCalledWith('lead')
  })

  it('is a no-op without a pixel on the page', () => {
    delete globalThis.window
    expect(whopTrack(WHOP_EVENT.lead, { email: 'a@b.co' })).toBe(false)
  })

  it('is a no-op when window.whop is missing or malformed', () => {
    globalThis.window = {}
    expect(whopTrack(WHOP_EVENT.page)).toBe(false)
    globalThis.window = { whop: { track: 'not a function' } }
    expect(whopTrack(WHOP_EVENT.page)).toBe(false)
  })

  it('never throws, even when the pixel does', () => {
    track.mockImplementation(() => {
      throw new Error('boom')
    })
    expect(() => whopTrack(WHOP_EVENT.page)).not.toThrow()
    expect(whopTrack(WHOP_EVENT.page)).toBe(false)
  })

  describe('purchase', () => {
    it('requires a positive value, as Whop does', () => {
      expect(whopTrack(WHOP_EVENT.purchase, { event_id: 'x' })).toBe(false)
      expect(whopTrack(WHOP_EVENT.purchase, { value: 0 })).toBe(false)
      expect(whopTrack(WHOP_EVENT.purchase, { value: -5 })).toBe(false)
      expect(whopTrack(WHOP_EVENT.purchase, { value: NaN })).toBe(false)
      expect(track).not.toHaveBeenCalled()
    })

    it('sends a real sale with its value, currency and id', () => {
      whopTrack(WHOP_EVENT.purchase, {
        value: 499,
        currency: 'USD',
        event_id: 'req_1',
        email: 'a@b.co',
      })
      expect(track).toHaveBeenCalledWith('purchase', {
        value: 499,
        currency: 'USD',
        event_id: 'req_1',
        email: 'a@b.co',
      })
    })
  })
})

describe('event names', () => {
  it('uses the standard names Whop forwards to ad platforms', () => {
    expect(WHOP_EVENT.lead).toBe('lead')
    expect(WHOP_EVENT.schedule).toBe('schedule')
    expect(WHOP_EVENT.purchase).toBe('purchase')
    expect(WHOP_EVENT.viewContent).toBe('view_content')
    expect(WHOP_EVENT.page).toBe('page')
  })

  it('keeps every name short, stable and unique', () => {
    const names = Object.values(WHOP_EVENT)
    expect(new Set(names).size).toBe(names.length)
    for (const n of names) expect(n).toMatch(/^[a-z_]{1,32}$/)
  })
})

describe('centsToValue', () => {
  it('turns stored cents into the major units Whop wants', () => {
    expect(centsToValue(49900)).toBe(499)
    expect(centsToValue(1200)).toBe(12)
    expect(centsToValue(1250)).toBe(12.5)
    expect(centsToValue(0)).toBe(0)
  })
})
