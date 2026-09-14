import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { render } from '@testing-library/react'

import { TrackView } from '../TrackView'
import { TrackPurchase } from '../TrackPurchase'
import { WhopRouteEvents } from '../WhopRouteEvents'

/* Every tracker talks to window.whop and nothing else, so a spy on that one
   function is the whole assertion surface. In production the pixel stub in
   <head> is what puts window.whop there; here it is put there by hand. */

let track
let pathname = '/'

vi.mock('next/navigation', () => ({
  usePathname: () => pathname,
}))

beforeEach(() => {
  track = vi.fn()
  window.whop = { track }
  pathname = '/'
})

afterEach(() => {
  delete window.whop
})

describe('TrackView', () => {
  it('reports a content view with its type, id and name', () => {
    render(<TrackView type="blog" id="hello-world" name="Hello, world" />)
    expect(track).toHaveBeenCalledTimes(1)
    expect(track).toHaveBeenCalledWith('view_content', {
      content_type: 'blog',
      content_id: 'hello-world',
      content_name: 'Hello, world',
    })
  })

  it('reports again when the content changes under it, not on a mere re-render', () => {
    const { rerender } = render(<TrackView type="blog" id="a" name="A" />)
    rerender(<TrackView type="blog" id="a" name="A" />)
    expect(track).toHaveBeenCalledTimes(1)
    rerender(<TrackView type="blog" id="b" name="B" />)
    expect(track).toHaveBeenCalledTimes(2)
    expect(track).toHaveBeenLastCalledWith(
      'view_content',
      expect.objectContaining({ content_id: 'b' })
    )
  })

  it('renders nothing', () => {
    const { container } = render(<TrackView type="blog" id="a" name="A" />)
    expect(container).toBeEmptyDOMElement()
  })
})

describe('TrackPurchase', () => {
  it('reports the sale with value, currency, id and email', () => {
    render(
      <TrackPurchase
        eventId="req_1"
        value={499}
        currency="USD"
        email="a@b.co"
        contentName="Pro kit"
      />
    )
    expect(track).toHaveBeenCalledWith('purchase', {
      value: 499,
      currency: 'USD',
      event_id: 'req_1',
      email: 'a@b.co',
      content_name: 'Pro kit',
    })
  })

  it('leaves email out when the page could not verify the viewer', () => {
    render(<TrackPurchase eventId="req_2" value={12} contentName="Guide" />)
    const [, data] = track.mock.calls[0]
    expect(data).not.toHaveProperty('email')
    expect(data).toMatchObject({
      value: 12,
      currency: 'USD',
      event_id: 'req_2',
    })
  })

  it('sends nothing for a zero-value sale, as Whop would reject it', () => {
    render(<TrackPurchase eventId="req_3" value={0} />)
    expect(track).not.toHaveBeenCalled()
  })
})

describe('WhopRouteEvents', () => {
  it('does not double-count the first page view the head snippet sent', () => {
    render(<WhopRouteEvents />)
    expect(track).not.toHaveBeenCalled()
  })

  it('reports each client-side navigation as a page view', () => {
    const { rerender } = render(<WhopRouteEvents />)
    pathname = '/pricing'
    rerender(<WhopRouteEvents />)
    pathname = '/services'
    rerender(<WhopRouteEvents />)
    expect(track).toHaveBeenCalledTimes(2)
    expect(track).toHaveBeenNthCalledWith(1, 'page')
    expect(track).toHaveBeenNthCalledWith(2, 'page')
  })

  it('ignores re-renders on the same route', () => {
    const { rerender } = render(<WhopRouteEvents />)
    pathname = '/pricing'
    rerender(<WhopRouteEvents />)
    rerender(<WhopRouteEvents />)
    expect(track).toHaveBeenCalledTimes(1)
  })
})
