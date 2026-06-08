import type { Metadata } from 'next'
import { Inter, JetBrains_Mono } from 'next/font/google'

import { SiteShell } from '@/components/site/SiteShell'
import { ThemeScript } from '@/components/site/ThemeScript'

import '@/styles/tailwind.css'
import '@/styles/global.css'
import '@/styles/globals.css'

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

export const metadata: Metadata = {
  title: { default: 'Alec Mingione', template: '%s - Alec Mingione' },
}

export default function SiteLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${navCode.variable}`}
      suppressHydrationWarning
    >
      <head>
        <ThemeScript />
      </head>
      <body className="bg-zinc-50 font-sans antialiased dark:bg-black">
        <SiteShell>{children}</SiteShell>
      </body>
    </html>
  )
}
