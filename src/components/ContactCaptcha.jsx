'use client'

import Script from 'next/script'
import { identity } from '@/content/site/identity'
import { useCallback, useEffect, useRef, useState } from 'react'

export function ContactCaptcha({ onToken }) {
  const container = useRef(null)
  const [ready, setReady] = useState(false)
  const [attempt, setAttempt] = useState(0)
  const [status, setStatus] = useState('loading')
  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY
  const handleReady = useCallback(() => setReady(true), [])

  useEffect(() => {
    if (!siteKey || ready) return
    const timeout = setTimeout(
      () => setStatus((current) => (current === 'loading' ? 'error' : current)),
      20000
    )
    return () => clearTimeout(timeout)
  }, [siteKey, ready, attempt])

  useEffect(() => {
    if (!ready || !siteKey || !window.turnstile || !container.current) return
    const turnstile = window.turnstile
    let widget
    try {
      widget = turnstile.render(container.current, {
        sitekey: siteKey,
        action: 'contact',
        size: 'compact',
        theme: 'auto',
        'response-field': false,
        callback: (token) => {
          onToken(token)
          setStatus('verified')
        },
        'expired-callback': () => {
          onToken('')
          setStatus('loading')
        },
        'error-callback': () => {
          onToken('')
          setStatus('error')
        },
        'timeout-callback': () => {
          onToken('')
          setStatus('error')
        },
      })
    } catch {
      onToken('')
      // Surface a synchronous failure from the external widget API.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setStatus('error')
    }
    return () => {
      if (widget !== undefined) turnstile.remove(widget)
    }
  }, [ready, siteKey, attempt, onToken])

  const failed = !siteKey || status === 'error'
  return (
    <div className="mt-6">
      {siteKey && (
        <Script
          id="cloudflare-turnstile"
          src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit"
          onReady={handleReady}
          onError={() => {
            onToken('')
            setStatus('error')
          }}
        />
      )}
      <div ref={container} className="min-h-16" />
      <p
        role="status"
        className="mt-2 text-xs text-zinc-600 dark:text-zinc-400"
      >
        {failed
          ? 'The security check could not load. Please try again or refresh the page.'
          : status === 'verified'
          ? 'Security check complete.'
          : 'Please complete the security check before sending.'}
      </p>
      <p className="mt-2 text-xs text-zinc-600 dark:text-zinc-400">
        Trouble with the security check?{' '}
        <a
          className="underline underline-offset-4"
          href={`mailto:${identity.email}`}
        >
          Email me directly
        </a>
        .
      </p>
      {failed && siteKey && (
        <button
          type="button"
          className="min-h-11 mt-2 px-2 text-sm underline"
          onClick={() => {
            onToken('')
            setStatus('loading')
            if (!window.turnstile) {
              window.location.reload()
              return
            }
            setAttempt((value) => value + 1)
          }}
        >
          Retry security check
        </button>
      )}
    </div>
  )
}
