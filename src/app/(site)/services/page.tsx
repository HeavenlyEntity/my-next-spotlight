import { Container } from '@/components/Container'
import { RichText } from '@/components/site/RichText'
import { getPayloadClient } from '@/lib/getPayloadClient'

export const revalidate = 60

export const metadata = {
  title: 'Services',
  description: 'Services and engagements.',
}

export default async function ServicesPage() {
  const payload = await getPayloadClient()
  const { docs } = await payload.find({
    collection: 'services',
    where: { status: { equals: 'published' } },
    sort: 'order',
    depth: 0,
    limit: 100,
  })

  return (
    <Container className="mt-16 sm:mt-32">
      <header className="max-w-2xl">
        <h1 className="text-4xl font-bold tracking-tight text-zinc-800 dark:text-zinc-100 sm:text-5xl">
          Services
        </h1>
        <p className="mt-6 text-base text-zinc-600 dark:text-zinc-400">
          Ways we can work together.
        </p>
      </header>

      {docs.length === 0 ? (
        <p className="mt-16 text-zinc-500 dark:text-zinc-400">
          No services listed yet.
        </p>
      ) : (
        <div className="mt-16 grid grid-cols-1 gap-10 sm:grid-cols-2">
          {docs.map((service) => (
            <section
              key={service.id}
              className="rounded-3xl p-6 ring-1 ring-zinc-200 dark:ring-zinc-700"
            >
              <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
                {service.name}
              </h2>
              {service.summary && (
                <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
                  {service.summary}
                </p>
              )}
              <RichText data={service.description} className="mt-4" />
              {typeof service.startingPrice === 'number' && (
                <p className="mt-4 text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                  From USD {service.startingPrice.toFixed(2)}
                </p>
              )}
            </section>
          ))}
        </div>
      )}
    </Container>
  )
}
