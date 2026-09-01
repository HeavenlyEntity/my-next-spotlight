import Link from 'next/link'
import { Container } from '@/components/Container'

export default function ProductNotFound() {
  return (
    <Container className="mt-16 sm:mt-32">
      <h1 className="text-2xl font-bold text-zinc-800 dark:text-zinc-100">
        Product not found
      </h1>
      <p className="mt-4 text-zinc-600 dark:text-zinc-400">
        That product doesn't exist or isn't published yet.{' '}
        <Link href="/products" className="text-teal-500">
          Back to products
        </Link>
        .
      </p>
    </Container>
  )
}
