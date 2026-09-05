'use client'

import { useCallback, useSyncExternalStore } from 'react'

/*
 * Reading browser-only state without a hydration mismatch.
 *
 * The tempting shape is `useState(false)` plus an effect that flips it. That
 * works, but it makes React commit a render just to record something it could
 * have been told, and `react-hooks/set-state-in-effect` flags it because
 * cascading renders from effects are a real performance trap.
 *
 * `useSyncExternalStore` is the API built for it. React renders
 * `getServerSnapshot` first, so the hydrating render matches the server HTML
 * byte for byte, then immediately re-renders with the client value. That is the
 * same guarantee the effect version gave, without the extra state.
 *
 * The snapshot functions MUST return a stable value for an unchanged store, or
 * React re-renders forever. Everything here returns primitives.
 */

const NEVER_CHANGES = () => () => {}
const TRUE = () => true
const FALSE = () => false

/**
 * True once the client has hydrated, false on the server and during the
 * hydrating render. The honest replacement for a `mounted` flag.
 */
export function useMounted() {
  return useSyncExternalStore(NEVER_CHANGES, TRUE, FALSE)
}

/**
 * Live match state for a media query.
 * @param {string} query e.g. '(prefers-reduced-motion: reduce)'
 * @param {boolean} [serverValue] what the server should assume
 */
export function useMediaQuery(query, serverValue = false) {
  const subscribe = useCallback(
    (onChange) => {
      if (typeof window === 'undefined' || !window.matchMedia) return () => {}
      const mq = window.matchMedia(query)
      mq.addEventListener('change', onChange)
      return () => mq.removeEventListener('change', onChange)
    },
    [query]
  )

  const getSnapshot = useCallback(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return serverValue
    return window.matchMedia(query).matches
  }, [query, serverValue])

  const getServerSnapshot = useCallback(() => serverValue, [serverValue])

  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)
}

/*
 * The theme, read off the `dark` class an inline script puts on <html> before
 * React runs. A MutationObserver is an external store like any other, so this
 * is the same shape as `useMediaQuery`: subscribe, snapshot, server default.
 */
function subscribeToRootClass(onChange) {
  if (typeof document === 'undefined') return () => {}
  const observer = new MutationObserver(onChange)
  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ['class'],
  })
  return () => observer.disconnect()
}

const readTheme = () =>
  typeof document !== 'undefined' &&
  document.documentElement.classList.contains('dark')
    ? 'dark'
    : 'light'

const LIGHT = () => 'light'

/** `'dark'` or `'light'`. Light on the server, matching the pre-paint default. */
export function useRootTheme() {
  return useSyncExternalStore(subscribeToRootClass, readTheme, LIGHT)
}
