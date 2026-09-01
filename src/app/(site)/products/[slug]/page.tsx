import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Container } from '@/components/Container'
import { RichText } from '@/components/site/RichText'
import { getPayloadClient } from '@/lib/getPayloadClient'
import { BuyButton } from '@/components/commerce/BuyButton'
import { typeMeta } from '@/components/commerce/storefront'

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
  const t = typeMeta(product.type)
  const stack = Array.isArray(product.techStack) ? product.techStack : []
  const features = Array.isArray(product.features) ? product.features : []
  const demoHref = safeHref(product.demoUrl)
  const isBoilerplate = product.type === 'boilerplate'

  return (
    <Container className="mt-16 sm:mt-32">
      <div className="amw">
        <Link
          href="/products"
          className="amw-kicker hover:text-[var(--amw-accent)] inline-flex items-center gap-2 transition-colors"
        >
          ← all products
        </Link>

        <div className="mt-7 grid grid-cols-1 gap-10 lg:grid-cols-[minmax(0,1fr)_330px] lg:gap-14">
          {/* ---- main column ---- */}
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span
                className={`amw-chip ${
                  t.accent ? 'amw-chip--accent amw-chip--dot' : ''
                }`}
              >
                {t.label}
              </span>
              <span className="amw-kicker">/{product.slug}</span>
            </div>

            <h1 className="mt-5 text-4xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 sm:text-5xl">
              {product.name}
            </h1>
            {product.tagline && (
              <p className="mt-5 max-w-2xl text-lg leading-relaxed text-zinc-600 dark:text-zinc-400">
                {product.tagline}
              </p>
            )}

            {hero && (
              <div className="amw-ticks border-[var(--amw-line)] bg-[var(--amw-card-2)] relative mt-10 overflow-hidden rounded-xl border">
                <div
                  className="amw-grid-bg absolute inset-0 opacity-50"
                  aria-hidden="true"
                />
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={hero}
                  alt={product.name}
                  className="relative mx-auto max-h-[480px] w-full object-contain p-4"
                />
              </div>
            )}

            {product.description && (
              <section className="mt-12">
                <p className="amw-eyebrow">{'// overview'}</p>
                <RichText data={product.description} className="mt-4" />
              </section>
            )}

            {features.length > 0 && (
              <section className="mt-12">
                <p className="amw-eyebrow">{'// what’s included'}</p>
                <ul className="mt-6 grid grid-cols-1 gap-3.5 sm:grid-cols-2">
                  {features.map((f, i) => (
                    <li
                      key={i}
                      className="amw-check text-sm leading-relaxed text-zinc-700 dark:text-zinc-300"
                    >
                      {f.feature}
                    </li>
                  ))}
                </ul>
              </section>
            )}
          </div>

          {/* ---- spec / buy rail ---- */}
          <aside className="lg:sticky lg:top-24 lg:self-start">
            <div className="amw-card amw-ticks p-6">
              <p className="amw-eyebrow">{'// datasheet'}</p>
              <p className="amw-price mt-3 text-3xl font-bold text-zinc-900 dark:text-zinc-50">
                {typeof product.price === 'number'
                  ? `$${product.price.toFixed(2)}`
                  : 'Soon'}
              </p>
              <p className="amw-kicker mt-1">
                {product.priceLabel || 'one-time'} · {product.currency || 'USD'}
              </p>

              <dl className="mt-6">
                <div className="amw-spec">
                  <dt>type</dt>
                  <dd>{t.label}</dd>
                </div>
                {stack.length > 0 && (
                  <div className="amw-spec">
                    <dt>stack</dt>
                    <dd>
                      {stack
                        .slice(0, 3)
                        .map((s) => s.tech)
                        .join(' · ')}
                    </dd>
                  </div>
                )}
                {features.length > 0 && (
                  <div className="amw-spec">
                    <dt>includes</dt>
                    <dd>{features.length} items</dd>
                  </div>
                )}
                <div className="amw-spec">
                  <dt>delivery</dt>
                  <dd>{isBoilerplate ? 'GitHub invite' : 'instant link'}</dd>
                </div>
              </dl>

              {product.creemProductId ? (
                <BuyButton
                  itemType="product"
                  slug={product.slug}
                  isBoilerplate={isBoilerplate}
                  label={
                    typeof product.price === 'number'
                      ? `Buy — $${product.price.toFixed(2)}`
                      : 'Buy now'
                  }
                />
              ) : (
                <p className="amw-kicker mt-6">not yet available</p>
              )}

              {demoHref && (
                <a
                  href={demoHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="amw-mono border-[var(--amw-line)] hover:border-[var(--amw-accent)] hover:text-[var(--amw-accent)] mt-3 inline-flex w-full items-center justify-center gap-2 rounded-md border px-3 py-2 text-xs font-medium text-zinc-700 transition-colors dark:text-zinc-300"
                >
                  live demo ↗
                </a>
              )}
            </div>
          </aside>
        </div>
      </div>
    </Container>
  )
}
