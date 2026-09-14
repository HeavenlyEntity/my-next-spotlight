import Link from 'next/link'
import { Container } from '@/components/Container'

export const metadata = {
  title: 'Deposit',
  robots: { index: false },
}

/* Where Whop sends a buyer back after an external payment method (a bank
   redirect, a wallet) that had to leave the page. Card payments never come
   here; they finish inside the sheet. Whop appends ?status=success or
   ?status=error. */
export default async function DepositReturn({ searchParams }) {
  const { status = '' } = await searchParams
  const ok = status === 'success'

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
            ? 'The deposit is credited in full against your first month. A receipt is on its way, and I will be in touch within one business day to set the engagement up.'
            : 'Nothing was charged. You can try again from the engagement you chose, or get in touch and we will sort it out by hand.'}
        </p>
        <p className="mt-8 flex flex-wrap gap-4">
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
        </p>
      </div>
    </Container>
  )
}
