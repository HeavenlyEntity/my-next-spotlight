'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

import { trackCopied } from '@/components/founders/analytics'

/*
 * One clipboard, three states: idle, copied, fallback.
 *
 * The fallback is the reason this is a hook rather than two lines inline. The
 * clipboard API is unavailable in an insecure context and can be denied by
 * permission, and both failures are silent: the button looks like it worked and
 * nothing is on the clipboard. So a failed write reveals a focused, selected
 * textarea holding the text instead of leaving a dead control.
 *
 * Extracted from `BriefActions`, which is now one of its two callers. Two
 * copies of this would drift, and the one that drifts is the one that stops
 * having a fallback.
 */
export function useClipboard({ resetAfter = 2000 } = {}) {
  const [state, setState] = useState('idle')
  const areaRef = useRef(null)

  useEffect(() => {
    if (state !== 'copied') return undefined
    const timer = setTimeout(() => setState('idle'), resetAfter)
    return () => clearTimeout(timer)
  }, [state, resetAfter])

  useEffect(() => {
    if (state !== 'fallback') return
    areaRef.current?.focus()
    areaRef.current?.select()
  }, [state])

  const copy = useCallback(async (text) => {
    try {
      if (!navigator.clipboard?.writeText) throw new Error('no clipboard')
      await navigator.clipboard.writeText(text)
      setState('copied')
      trackCopied()
    } catch {
      setState('fallback')
    }
  }, [])

  return { state, areaRef, copy }
}
