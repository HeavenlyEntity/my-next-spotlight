'use client'

import { useEffect } from 'react'
import { WHOP_EVENT, whopTrack } from '@/lib/analytics/whop'

/* Marks a page as content worth counting. Rendered by the server component
   that owns the page, so the decision of what counts stays with the page and
   this only carries the fact.

   Keyed on the identity, not the mount: moving from one post to the next
   re-uses this component under the App Router, and the second post is a
   second view. */
export function TrackView({ type, id, name }) {
  useEffect(() => {
    whopTrack(WHOP_EVENT.viewContent, {
      content_type: type,
      content_id: id,
      content_name: name,
    })
  }, [type, id, name])

  return null
}
