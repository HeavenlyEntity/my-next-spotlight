import { withSocialImage } from '@/lib/social/metadata'
import AboutContent from './AboutContent'

export const metadata = withSocialImage(
  {
    title: 'About',
    description:
      'I’m Alec Mingione. I live in Phoenix Arizona, where I engineer the future.',
  },
  'about'
)

export default function AboutPage() {
  return <AboutContent />
}
