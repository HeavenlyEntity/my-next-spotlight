'use client'

import { useEffect, useRef, useState } from 'react'

/* One visually hidden polite live region for the wizard. It announces
   only when the classification or the below/within/above position
   changes, debounced, and stays silent until the user has interacted, so
   the first thing a screen reader hears on a step is never a verdict. */

export function LiveAnnouncer({ message, armed = true, delay = 500 }) {
  const [text, setText] = useState('')
  const last = useRef(null)

  useEffect(() => {
    if (!armed || !message || message === last.current) return
    const timer = setTimeout(() => {
      last.current = message
      setText(message)
    }, delay)
    return () => clearTimeout(timer)
  }, [message, armed, delay])

  return (
    <div aria-live="polite" aria-atomic="true" className="sr-only">
      {text}
    </div>
  )
}
