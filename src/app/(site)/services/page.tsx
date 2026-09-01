import { Container } from '@/components/Container'
import { getPayloadClient } from '@/lib/getPayloadClient'
import {
  StoreHero,
  StoreEmpty,
  ServiceCard,
} from '@/components/commerce/storefront'

export const revalidate = 60

export const metadata = {
  title: 'Services',
  description:
    'Fractional CTO leadership and focused engineering engagements — scoped, senior, outcome-driven.',
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
      <div className="amw">
        <StoreHero
          eyebrow="// AMWARE · ENGAGEMENTS"
          title="Work with the engineer behind the tools."
          intro="Fractional CTO leadership and focused build engagements — scoped, senior, and pointed at the outcome instead of the hours."
          meta={
            <>
              <span className="amw-chip amw-chip--accent amw-chip--dot">
                {docs.length} engagements
              </span>
              <span className="amw-chip">remote-first</span>
            </>
          }
        />

        {docs.length === 0 ? (
          <StoreEmpty label="services" />
        ) : (
          <ul className="mt-10 grid grid-cols-1 gap-5 sm:mt-12 lg:grid-cols-2">
            {docs.map((service, i) => (
              <ServiceCard key={service.id} service={service} index={i} />
            ))}
          </ul>
        )}
      </div>
    </Container>
  )
}
