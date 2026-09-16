import Link from 'next/link'
import { Container } from '@/components/Container'
import { BookCallButton } from '@/components/commerce/BookCallButton'
import { calLinkFromUrl } from '@/lib/commerce/calLink'

export const metadata = {
  title: 'Deposit',
  robots: { index: false },
}

/* Where Whop sends a buyer back after an external payment method (a bank
   redirect, a wallet) that had to leave the page. Card payments never come
   here; they finish inside the sheet. Whop appends ?status=success or
   ?status=error.

   The sheet also puts the service name and its Cal.com booking URL on the
   return URL, so a successful payment can flow straight into the intro
   call -- the same popup the card's "Book an intro call" opens. The booking
   param is untrusted query input; calLinkFromUrl only accepts a real
   Cal.com URL, and anything else falls back to the plain links. */
export default async function DepositReturn({ searchParams }) {
  const { status = '', booking = '', service = '' } = await searchParams
  const ok = status === 'success'
  const cal = ok && typeof booking === 'string' ? calLinkFromUrl(booking) : null
  const serviceName = typeof service === 'string' ? service : ''

  return (
    <Container className="mt-16 sm:mt-32">
      <div className="amw mx-auto max-w-2xl">
        <p className="amw-kicker">{ok ? 'deposit received' : 'deposit'}</p>
        <h1
          style={{ fontFamily: 'Layer, sans-serif' }}
          className="mt-5 text-4xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 sm:text-5xl"
        >
          {ok ? 'Your start is reserved.' : 'That payment did not go through.'}
        </h1>
        <p className="mt-6 text-lg leading-relaxed text-zinc-600 dark:text-zinc-400">
          {ok
            ? cal
              ? 'The deposit is credited in full against your first month. A receipt is on its way — one thing left: pick a time for the intro call.'
              : 'The deposit is credited in full against your first month. A receipt is on its way, and I will be in touch within one business day to set the engagement up.'
            : 'Nothing was charged. You can try again from the engagement you chose, or get in touch and we will sort it out by hand.'}
        </p>
        <p className="mt-8 flex flex-wrap items-center gap-4">
          {cal ? (
            <>
              <BookCallButton
                calLink={cal.link}
                namespace={cal.namespace}
                serviceName={serviceName}
                className="amw-cta inline-flex max-w-xs"
              >
                Book the intro call
              </BookCallButton>
              <Link
                href="/services"
                className="hover:text-[var(--amw-accent-ink)] min-h-11 inline-flex items-center text-sm font-medium text-zinc-700 no-underline transition-colors dark:text-zinc-300"
              >
                Back to engagements →
              </Link>
            </>
          ) : (
            <>
              <Link href="/services" className="amw-cta inline-flex max-w-xs">
                {ok ? 'Back to engagements' : 'Try again'}
              </Link>
              {!ok && (
                <Link
                  href="/contact"
                  className="hover:text-[var(--amw-accent-ink)] min-h-11 inline-flex items-center text-sm font-medium text-zinc-700 no-underline transition-colors dark:text-zinc-300"
                >
                  Get in touch →
                </Link>
              )}
            </>
          )}
        </p>
      </div>
    </Container>
  )
}
