import { notFound } from 'next/navigation'
import { Container } from '@/components/Container'
import { CourseBody } from '@/components/site/CourseBody'
import { getPayloadClient } from '@/lib/getPayloadClient'
import { BuyButton } from '@/components/commerce/BuyButton'

export const revalidate = 60

async function getCourse(slug: string) {
  const payload = await getPayloadClient()
  const { docs } = await payload.find({
    collection: 'courses',
    where: { slug: { equals: slug }, status: { equals: 'published' } },
    depth: 1,
    limit: 1,
  })
  return docs[0] ?? null
}

export async function generateStaticParams() {
  const payload = await getPayloadClient()
  const { docs } = await payload.find({
    collection: 'courses',
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
  const course = await getCourse(slug)
  if (!course) return {}
  return { title: course.title, description: course.summary ?? undefined }
}

export default async function CoursePage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const course = await getCourse(slug)
  if (!course) notFound()

  const payload = await getPayloadClient()
  const { docs: lessons } = await payload.find({
    collection: 'lessons',
    where: { course: { equals: course.id }, status: { equals: 'published' } },
    sort: 'order',
    depth: 0,
    limit: 1000,
  })

  return (
    <Container className="mt-16 sm:mt-32">
      <CourseBody course={course} lessons={lessons} />
      {course.creemProductId ? (
        <div className="mx-auto max-w-2xl">
          <BuyButton
            itemType="course"
            slug={course.slug}
            label={
              typeof course.price === 'number'
                ? `Enroll — USD ${(course.price as number).toFixed(2)}`
                : 'Enroll now'
            }
          />
        </div>
      ) : null}
    </Container>
  )
}
