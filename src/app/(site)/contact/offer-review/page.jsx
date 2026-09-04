import ContactForm from '../ContactForm'

/* Static landing for the Founders' Desk CTA. A real route (not a query
   string) keeps /contact statically rendered and lets the nav highlight
   the desk. The form only prefills a subject and a template with
   blanks; nothing from the calculator travels here. */

export const metadata = {
  title: 'Offer review',
  description:
    'Send the equity offer you ran through the Founders’ Desk and get a read from AMWARE.',
}

export default function OfferReviewPage() {
  return <ContactForm topic="offer-review" />
}
