import Link from 'next/link'
import { Container } from '@/components/Container'
import { getPayloadClient } from '@/lib/getPayloadClient'

export const revalidate = 60

export const metadata = {
  title: 'Products',
  description: 'Boilerplates, templates, and digital products for founders.',
}

export default async function ProductsPage() {
  const payload = await getPayloadClient()
  const { docs } = await payload.find({
    collection: 'products',
    where: { status: { equals: 'published' } },
    sort: 'order',
    depth: 1,
    limit: 100,
  })

  return (
    <Container className="mt-16 sm:mt-32">
      <header className="max-w-2xl">
        <h1 className="text-4xl font-bold tracking-tight text-zinc-800 dark:text-zinc-100 sm:text-5xl">
          Products
        </h1>
        <p className="mt-6 text-base text-zinc-600 dark:text-zinc-400">
          Boilerplates, templates, and digital products to help founders ship
          faster.
        </p>
      </header>

      {docs.length === 0 ? (
        <p className="mt-16 text-zinc-500 dark:text-zinc-400">
          No products yet — check back soon.
        </p>
      ) : (
        <ul className="mt-16 grid grid-cols-1 gap-6 sm:grid-cols-2">
          {docs.map((product) => {
            const hero =
              product.heroImage && typeof product.heroImage === 'object'
                ? product.heroImage.url
                : null
            return (
              <li
                key={product.id}
                className="group rounded-3xl p-6 ring-1 ring-zinc-200 transition hover:ring-zinc-300 dark:ring-zinc-700 dark:hover:ring-zinc-600"
              >
                <Link href={`/products/${product.slug}`} className="block">
                  {hero && (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img
                      src={hero}
                      alt={product.name}
                      className="mb-5 aspect-video w-full rounded-2xl object-contain"
                    />
                  )}
                  <div className="flex items-center gap-2">
                    <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
                      {product.name}
                    </h2>
                    <span className="rounded-full border border-zinc-200 bg-zinc-50 px-2 py-0.5 text-[11px] font-medium text-zinc-600 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-400">
                      {product.type}
                    </span>
                  </div>
                  {product.tagline && (
                    <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
                      {product.tagline}
                    </p>
                  )}
                  {typeof product.price === 'number' && (
                    <p className="mt-4 text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                      {product.priceLabel ? `${product.priceLabel} ` : ''}
                      {product.currency ?? 'USD'} {product.price.toFixed(2)}
                    </p>
                  )}
                </Link>
              </li>
            )
          })}
        </ul>
      )}
    </Container>
  )
}
