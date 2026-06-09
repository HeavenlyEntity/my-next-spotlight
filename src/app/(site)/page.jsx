import HomeContent from './HomeContent'
import { getAllArticles } from '@/lib/getAllArticles'

export const metadata = {
  title: {
    absolute: 'Alec Mingione - Fractional CTO, Software Engineer & Founder',
  },
  description:
    "I'm Alec Mingione, a fractional CTO and software engineer based in Phoenix, Arizona. I bridge the gap between business strategy and technical execution — from whiteboard architecture to investor-ready unit economics.",
}

export default async function HomePage() {
  const articles = (await getAllArticles())
    .slice(0, 4)
    .map(({ component, ...meta }) => meta)
  return <HomeContent articles={articles} />
}
