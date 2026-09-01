import HomeContent from './HomeContent'
import { getAllArticles } from '@/lib/getAllArticles'
import { getPayloadClient } from '@/lib/getPayloadClient'

export const revalidate = 60

export const metadata = {
  title: {
    absolute: 'Alec Mingione - Fractional CTO, Software Engineer & Founder',
  },
  description:
    "I'm Alec Mingione, a fractional CTO and software engineer based in Phoenix, Arizona. I bridge the gap between business strategy and technical execution — from whiteboard architecture to investor-ready unit economics.",
  keywords: [
    'Alec Mingione',
    'fractional CTO',
    'software engineer',
    'AI expert',
    'technology founder',
    'Phoenix Arizona',
    'technical strategy',
    'software architecture',
    'Steve Wozniak certified full-stack engineer',
    'Brian Meece mentorship',
    'Rocket Hub',
    'Green Light Go',
  ],
  authors: [{ name: 'Alec Mingione', url: '/' }],
  creator: 'Alec Mingione',
  publisher: 'Amware',
  alternates: { canonical: '/' },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: '/',
    siteName: 'Amware',
    title: 'Alec Mingione - Fractional CTO, Software Engineer & Founder',
    description:
      'Alec Mingione is a fractional CTO, founder, and full-stack engineer certified by Apple co-founder Steve Wozniak and mentored by Rocket Hub and Green Light Go founder Brian Meece.',
    images: [
      {
        url: '/images/og/alec-mingione-og.png',
        width: 1200,
        height: 630,
        alt: 'Alec Mingione — fractional CTO, founder, Steve Wozniak-certified full-stack engineer, and mentee of Brian Meece',
        type: 'image/png',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    site: '@AmwareDotDev',
    creator: '@AmwareDotDev',
    title: 'Alec Mingione - Fractional CTO, Software Engineer & Founder',
    description:
      'Fractional CTO, founder, and full-stack engineer certified by Apple co-founder Steve Wozniak and mentored by Brian Meece.',
    images: [
      {
        url: '/images/og/alec-mingione-og.png',
        alt: 'Alec Mingione — fractional CTO, founder, Steve Wozniak-certified full-stack engineer, and mentee of Brian Meece',
      },
    ],
  },
}

export default async function HomePage() {
  const articles = (await getAllArticles())
    .slice(0, 4)
    .map(({ component, ...meta }) => meta)

  let products = []
  let services = []
  let catalogError = false

  try {
    const payload = await getPayloadClient()
    const [productsRes, servicesRes] = await Promise.all([
      payload.find({
        collection: 'products',
        where: { status: { equals: 'published' } },
        sort: 'order',
        depth: 1,
        limit: 24,
      }),
      payload.find({
        collection: 'services',
        where: { status: { equals: 'published' } },
        sort: 'order',
        depth: 0,
        limit: 6,
      }),
    ])

    // Featured products lead; fall back to catalog order when none are flagged.
    const featured = productsRes.docs.filter((p) => p.featured)
    products = (featured.length > 0 ? featured : productsRes.docs).slice(0, 3)
    services = servicesRes.docs.slice(0, 3)
  } catch {
    catalogError = true
  }

  return (
    <HomeContent
      articles={articles}
      products={products}
      services={services}
      catalogError={catalogError}
    />
  )
}
