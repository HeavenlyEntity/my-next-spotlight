import { notFound } from 'next/navigation'
import { Container } from '@/components/Container'
import { RichText } from '@/components/site/RichText'
import { getPayloadClient } from '@/lib/getPayloadClient'

export const revalidate = 60

function safeHref(u?: string | null) {
  if (!u) return null
  try {
    const url = new URL(u, 'https://placeholder.local')
    return url.protocol === 'http:' || url.protocol === 'https:' ? u : null
  } catch {
    return null
  }
}

async function getProduct(slug: string) {
  const payload = await getPayloadClient()
  const { docs } = await payload.find({
    collection: 'products',
    where: { slug: { equals: slug }, status: { equals: 'published' } },
    depth: 1,
    limit: 1,
  })
  return docs[0] ?? null
}

export async function generateStaticParams() {
  const payload = await getPayloadClient()
  const { docs } = await payload.find({
    collection: 'products',
    where: { status: { equals: 'published' } },
    depth: 0,
    limit: 1000,
  })
  return docs.map((d) => ({ slug: d.slug as string }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const product = await getProduct(slug)
  if (!product) return {}
  return { title: product.name, description: product.tagline ?? undefined }
}

export default async function ProductPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const product = await getProduct(slug)
  if (!product) notFound()

  const hero =
    product.heroImage && typeof product.heroImage === 'object'
      ? product.heroImage.url
      : null

  return (
    <Container className="mt-16 sm:mt-32">
      <article className="mx-auto max-w-2xl">
        <header>
          <h1 className="text-4xl font-bold tracking-tight text-zinc-800 dark:text-zinc-100 sm:text-5xl">
            {product.name}
          </h1>
          {product.tagline && (
            <p className="mt-6 text-base text-zinc-600 dark:text-zinc-400">
              {product.tagline}
            </p>
          )}
        </header>

        {hero && (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src={hero}
            alt={product.name}
            className="mt-10 w-full rounded-3xl object-contain"
          />
        )}

        <RichText data={product.description} className="mt-10" />

        {Array.isArray(product.features) && product.features.length > 0 && (
          <ul className="mt-10 space-y-2">
            {product.features.map((f, i) => (
              <li key={i} className="text-sm text-zinc-600 dark:text-zinc-400">
                • {f.feature}
              </li>
            ))}
          </ul>
        )}

        {(() => {
          const demoHref = safeHref(product.demoUrl)
          return demoHref ? (
            <a
              href={demoHref}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-10 inline-flex rounded-md bg-zinc-800 px-3 py-2 text-sm font-semibold text-zinc-100 transition hover:bg-zinc-700 dark:bg-zinc-700 dark:hover:bg-zinc-600"
            >
              View demo
            </a>
          ) : null
        })()}
      </article>
    </Container>
  )
}
