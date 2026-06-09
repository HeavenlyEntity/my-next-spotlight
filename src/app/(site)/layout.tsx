import type { Metadata } from 'next'
import { Inter, JetBrains_Mono } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import { SpeedInsights } from '@vercel/speed-insights/next'

import { AppHeader } from '@/components/AppHeader'
import { Footer } from '@/components/Footer'
import { StagewiseInit } from '@/components/StagewiseInit'

import '@/styles/tailwind.css'
import '@/styles/global.css'
import '@/styles/globals.css'
import 'focus-visible'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
})

const navCode = JetBrains_Mono({
  subsets: ['latin'],
  weight: ['500', '600'],
  variable: '--font-nav-code',
  display: 'swap',
})

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL

export const metadata: Metadata = {
  title: { default: 'Alec Mingione', template: '%s - Alec Mingione' },
  alternates: {
    types: {
      'application/rss+xml': `${siteUrl}/rss/feed.xml`,
      'application/feed+json': `${siteUrl}/rss/feed.json`,
    },
  },
  other: { 'impact-site-verification': 'f77f8902-5007-4ccb-8dc0-d58a1ceb6915' },
}

// Pre-paint dark-mode script (ported verbatim from the old _document.jsx).
const modeScript = `
  let darkModeMediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
  updateMode()
  darkModeMediaQuery.addEventListener('change', updateModeWithoutTransitions)
  window.addEventListener('storage', updateModeWithoutTransitions)
  function updateMode() {
    let isSystemDarkMode = darkModeMediaQuery.matches
    let isDarkMode = window.localStorage.isDarkMode === 'true' || (!('isDarkMode' in window.localStorage) && isSystemDarkMode)
    if (isDarkMode) { document.documentElement.classList.add('dark') } else { document.documentElement.classList.remove('dark') }
    if (isDarkMode === isSystemDarkMode) { delete window.localStorage.isDarkMode }
  }
  function disableTransitionsTemporarily() {
    document.documentElement.classList.add('[&_*]:!transition-none')
    window.setTimeout(() => { document.documentElement.classList.remove('[&_*]:!transition-none') }, 0)
  }
  function updateModeWithoutTransitions() { disableTransitionsTemporarily(); updateMode() }
`

export default function SiteLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html
      lang="en"
      className={`h-full antialiased ${inter.variable} ${navCode.variable}`}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: modeScript }} />
      </head>
      <body className="flex h-full flex-col bg-zinc-50 font-sans dark:bg-black">
        <div className="fixed inset-0 flex justify-center sm:px-8">
          <div className="flex w-full max-w-7xl lg:px-8">
            <div className="w-full bg-white ring-1 ring-zinc-100 dark:bg-zinc-900 dark:ring-zinc-300/20" />
          </div>
        </div>
        <div className="relative flex w-full flex-col">
          <AppHeader />
          <main className="flex-auto">{children}</main>
          <Footer />
        </div>
        <Analytics />
        <SpeedInsights />
        <StagewiseInit />
      </body>
    </html>
  )
}
