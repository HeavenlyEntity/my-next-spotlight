import { withSocialImage } from '@/lib/social/metadata'
import ContactForm from './ContactForm'

export const metadata = withSocialImage(
  {
    title: 'Contact',
    description: 'Have a question or proposal? Use the form to get in touch.',
  },
  'contact'
)

export default function ContactPage() {
  return <ContactForm />
}
