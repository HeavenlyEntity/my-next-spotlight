import type { Metadata } from 'next'
import ContactForm from './ContactForm'

export const metadata: Metadata = {
  title: 'Contact',
  description: 'Have a question or proposal? Use the form to get in touch.',
}

export default function ContactPage() {
  return <ContactForm />
}
