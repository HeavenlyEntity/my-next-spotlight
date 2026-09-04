import { Hero } from '@/components/landing/hero'
import { HowItWorks } from '@/components/landing/how-it-works'
import { Features } from '@/components/landing/features'
import { Stats } from '@/components/landing/stats'
import { Testimonials } from '@/components/landing/testimonials'
import { Pricing } from '@/components/landing/pricing'
import { FAQ } from '@/components/landing/faq'
import { FinalCTA } from '@/components/landing/final-cta'

/* Homepage sequencing ported verbatim from the "minimal" landing
   template (app/page.tsx): Hero, How It Works, Features, Stats,
   Testimonials, Pricing, FAQ, Final CTA. The AMWARE creed closes the
   site from the footer (see components/Footer.jsx).

   The previous terminal-cover-sheet homepage (crown hero, catalog,
   masonry, service record) is preserved in HomeContent.legacy.jsx. */

export default function HomeContent() {
  return (
    <div className="amw">
      <Hero />
      <HowItWorks />
      <Features />
      <Stats />
      <Testimonials />
      <Pricing />
      <FAQ />
      <FinalCTA />
    </div>
  )
}
