/*
 * A service's booking link is stored as the full Cal.com URL, because that
 * is what a person pastes into the admin. The embed wants the part after the
 * host -- `amware/on-demand-outcome` -- and a namespace to keep its state
 * separate from any other embed on the page. The last path segment is that
 * namespace: it names the event type, which is exactly the thing being
 * booked.
 *
 * Anything that is not a Cal.com URL returns null, and the card falls back
 * to a plain link. A booking link on another service still works; it just
 * cannot report the booking back.
 */
export type CalLink = { link: string; namespace: string }

export function calLinkFromUrl(url?: string | null): CalLink | null {
  if (!url) return null
  let parsed: URL
  try {
    parsed = new URL(url)
  } catch {
    return null
  }
  if (!/^(www\.|app\.)?cal\.com$/i.test(parsed.hostname)) return null

  const link = parsed.pathname.replace(/^\/+|\/+$/g, '')
  const segments = link.split('/').filter(Boolean)
  // user/event-type at minimum; a bare profile page is not bookable.
  if (segments.length < 2) return null

  return { link, namespace: segments[segments.length - 1] }
}
