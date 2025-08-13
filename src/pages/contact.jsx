import Head from 'next/head'
import { useEffect, useState } from 'react'

import { SimpleLayout } from '@/components/SimpleLayout'

export default function Contact() {

  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
  }, [])

  useEffect(() => {
    // Ensure container is clean before (re)initializing
    const container = document.querySelector('.deftform[data-form-id="eCcVtS"]')
    if (container) {
      container.innerHTML = ''
      container.removeAttribute('data-deft-initialized')
    }

    // Remove any previous embed script to force re-execution
    const existing = document.getElementById('deftform-embed')
    if (existing && existing.parentNode) existing.parentNode.removeChild(existing)

    // Inject a fresh script (cache-busted) so it rescans and mounts the form
    const script = document.createElement('script')
    script.id = 'deftform-embed'
    script.src = `https://cdn.deftform.com/embed.js?v=${Date.now()}`
    script.defer = true
    script.addEventListener('load', () => {
      // Some versions expose a global initializer
      try {
        if (window && window.Deftform && typeof window.Deftform.init === 'function') {
          window.Deftform.init()
        }
      } catch (_) {}
    })
    document.body.appendChild(script)

    

    // No cleanup needed; on next mount we replace again
  }, [])
  return (
    <>
      <Head>
        <title>Contact - Alec Mingione</title>
        <meta
          name="description"
          content="Have a question or proposal? Use the form to get in touch."
        />
      </Head>
      <SimpleLayout
        title="Get in touch"
        intro="Have a question, proposal, or just want to say hello? Fill out the form below and I’ll get back to you."
      >
        <div className="relative w-full overflow-hidden rounded-3xl ring-1 ring-zinc-200 dark:ring-zinc-700">
          <div className="df-grid-overlay" />
          <div
            className="deftform w-full bg-transparent p-4 sm:p-8"
            data-form-id="eCcVtS"
            data-form-width="100%"
            data-form-align="center"
            data-form-auto-height="1"
          />
        </div>
        
      </SimpleLayout>
    </>
  )
}




