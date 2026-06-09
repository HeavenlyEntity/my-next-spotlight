import Link from 'next/link'
import { Container } from '@/components/Container'

export const metadata = { title: 'Payment received' }

export default function CheckoutSuccess() {
  return (
    <Container className="mt-16 sm:mt-32">
      <div className="mx-auto max-w-2xl">
        <h1 className="text-4xl font-bold tracking-tight text-zinc-800 dark:text-zinc-100 sm:text-5xl">
          Thank you — payment received
        </h1>
        <p className="mt-6 text-base text-zinc-600 dark:text-zinc-400">
          Check your email for your access link (or your repository invitation
          for boilerplates). Didn't get it?{' '}
          <Link href="/access/resend" className="text-teal-500">
            Resend my access link
          </Link>
          .
        </p>
      </div>
    </Container>
  )
}
