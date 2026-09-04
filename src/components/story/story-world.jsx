'use client'

import { useEffect, useRef } from 'react'
import { mountScrollWorld } from '@/lib/scroll-world/scrub-engine'

/* The /story film: the AMWARE journey as a continuous camera flight.
   Section copy follows a problem, cost, mechanism, offer, proof, close
   arc; the engine scrubs pre-rendered clips by scroll position. */

const SECTIONS = [
  {
    id: 'grind',
    label: 'The Grind',
    still: '/story/still_1.webp',
    clip: '/story/vid/dive_1.mp4',
    accent: '#3ce8ce',
    eyebrow: 'SOUND FAMILIAR',
    title: 'Your product is dying in the plumbing.',
    body: 'Auth, billing, deploys, admin. Months of runway spent rebuilding what every product already has, while the thing only you can build waits.',
    tags: ['auth again', 'billing again', 'still not live'],
  },
  {
    id: 'cost',
    label: 'The Cost',
    still: '/story/still_2.webp',
    clip: '/story/vid/dive_2.mp4',
    accent: '#3ce8ce',
    eyebrow: 'EVERY WEEK YOU WAIT',
    title: 'Slow shipping is the silent killer.',
    body: 'Every week not live is interest paid on nothing: no users, no feedback, no revenue. The market does not wait for polish.',
    tags: ['runway burns daily'],
  },
  {
    id: 'forge',
    label: 'The Forge',
    still: '/story/still_3.webp',
    clip: '/story/vid/dive_3.mp4',
    accent: '#3ce8ce',
    eyebrow: 'THE MECHANISM',
    title: 'Forged where failure was expensive.',
    body: "Factory floors that could not stop. A bank's production code that could not break. Two startups of my own. The playbook survived because it had to.",
    tags: ['since 2017', 'schwab-grade', '2 companies founded'],
  },
  {
    id: 'catalog',
    label: 'The Catalog',
    still: '/story/still_4.webp',
    clip: '/story/vid/dive_4.mp4',
    accent: '#3ce8ce',
    scroll: 1.6,
    linger: 0.45,
    eyebrow: 'THE STACK',
    title: 'Skip the first three months.',
    body: 'Production boilerplates with auth, billing, CMS and deploys already wired, plus a fractional CTO who has shipped them before. Days to launch, not quarters.',
    tags: ['boilerplates', 'fractional cto', 'ship in days'],
  },
  {
    id: 'proof',
    label: 'Field Evidence',
    still: '/story/still_5.webp',
    clip: '/story/vid/dive_5.mp4',
    accent: '#3ce8ce',
    eyebrow: 'FIELD EVIDENCE',
    title: 'Shipped, not staged.',
    body: 'Kingdom Kode, MiPi, client builds that are live and earning. The same foundations you would be starting on.',
    tags: ['live products', 'real deadlines'],
  },
  {
    id: 'desk',
    label: 'The Creed',
    still: '/story/still_6.webp',
    clip: '/story/vid/dive_6.mp4',
    accent: '#3ce8ce',
    scroll: 1.7,
    linger: 0.5,
    eyebrow: 'THE CREED',
    title: 'A Masterpiece Will Always Require Effort.',
    body: 'That is the name: AMWARE. Bring the effort and I bring everything I have already built. If the foundations do not save you time, I will make it right.',
    cta: {
      primary: { label: 'work with me', href: '/services' },
      secondary: { label: 'browse boilerplates', href: '/products' },
    },
  },
]

const CONNECTORS = [
  '/story/vid/conn_1.mp4',
  '/story/vid/conn_2.mp4',
  '/story/vid/conn_3.mp4',
  '/story/vid/conn_4.mp4',
  '/story/vid/conn_5.mp4',
]

export default function StoryWorld() {
  const hostRef = useRef(null)

  useEffect(() => {
    const host = hostRef.current
    if (!host) return
    host.replaceChildren()
    mountScrollWorld(host, {
      brand: { name: 'AMWARE', href: '/' },
      diveScroll: 1.3,
      connScroll: 0.9,
      hint: 'scroll to fly in',
      nav: true,
      atmosphere: true,
      sections: SECTIONS,
      connectors: CONNECTORS,
    })
    return () => {
      host.replaceChildren()
    }
  }, [])

  return (
    <div
      ref={hostRef}
      style={{
        '--sw-bg': '#0b0b0f',
        '--sw-ink': '#f4f4f5',
        '--sw-ink-soft': '#a1a1aa',
        '--sw-accent': '#3ce8ce',
        '--sw-font-display': 'Layer, sans-serif',
        '--sw-font-body': 'var(--font-sans), sans-serif',
      }}
    />
  )
}
