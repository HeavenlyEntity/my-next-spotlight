'use client'

import { useEffect, useRef } from 'react'
import { usePathname } from 'next/navigation'
import { WHOP_EVENT, whopTrack } from '@/lib/analytics/whop'

/* The pixel snippet fires one `page` event when the document loads, and the
   App Router then never loads another document: every link is a client-side
   transition. Without this, Whop would see the landing page and nothing
   after it -- a funnel with one step.

   The first render is skipped on purpose. The head script has already
   reported that view; firing again here would count every landing twice. */
export function WhopRouteEvents() {
  const pathname = usePathname()
  const last = useRef(null)

  useEffect(() => {
    if (last.current === null) {
      last.current = pathname
      return
    }
    if (last.current === pathname) return
    last.current = pathname
    whopTrack(WHOP_EVENT.page)
  }, [pathname])

  return null
}
