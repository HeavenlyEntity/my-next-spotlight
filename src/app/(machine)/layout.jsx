import { JetBrains_Mono } from 'next/font/google'
import { siteOrigin } from '@/lib/site-origin'
import '@/styles/machine.css'
const mono = JetBrains_Mono({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  variable: '--machine-font',
  display: 'swap',
})
export const metadata = {
  metadataBase: new URL(siteOrigin),
  title: { default: 'AMWARE / Machine view', template: '%s | AMWARE' },
  description:
    'Public knowledge about Alec Mingione, fractional CTO and software engineer.',
}
/* No theme script. The machine view is a terminal and is dark unconditionally,
   so there is no stored preference to read and nothing to resolve before paint.
   Deviates from the plan's "provide equivalent light-theme tokens and respect
   the stored/system preference" -- see the note in machine.css. */
/* AMWARE drawn in the character cell, 53 columns wide. The anchor carries
   the accessible name; the banner itself is aria-hidden, because a screen
   reader given box-drawing characters reads noise. */
const WORDMARK = ` █████╗ ███╗   ███╗██╗    ██╗ █████╗ ██████╗ ███████╗
██╔══██╗████╗ ████║██║    ██║██╔══██╗██╔══██╗██╔════╝
███████║██╔████╔██║██║ █╗ ██║███████║██████╔╝█████╗  
██╔══██║██║╚██╔╝██║██║███╗██║██╔══██║██╔══██╗██╔══╝  
██║  ██║██║ ╚═╝ ██║╚███╔███╔╝██║  ██║██║  ██║███████╗
╚═╝  ╚═╝╚═╝     ╚═╝ ╚══╝╚══╝ ╚═╝  ╚═╝╚═╝  ╚═╝╚══════╝`

export default function MachineLayout({ children }) {
  return (
    <html lang="en" className={`machine-root ${mono.variable}`}>
      <head>
        <meta name="color-scheme" content="dark" />
        <link rel="describedby" href="/llms.txt" />
      </head>
      <body className="machine">
        <a className="machine-skip" href="#machine-content">
          Skip to content
        </a>
        <div className="machine-shell">
          <header className="machine-header">
            <a
              href="/ai/home"
              className="machine-wordmark"
              aria-label="AMWARE machine home"
            >
              <pre className="machine-glyph" aria-hidden="true">
                {WORDMARK}
              </pre>
            </a>
            <a className="machine-return" href="/">
              Back to human site <span aria-hidden="true">↗</span>
            </a>
          </header>
          {children}
          <footer className="machine-footer">
            <a href="/ai/contact">Contact Alec</a>
            <span>AMWARE / Alec Mingione</span>
          </footer>
        </div>
      </body>
    </html>
  )
}
