import { Container } from '@/components/Container'
import { getPayloadClient } from '@/lib/getPayloadClient'
import {
  StoreHero,
  StoreEmpty,
  CourseCard,
} from '@/components/commerce/storefront'

export const revalidate = 60

export const metadata = {
  title: 'Courses',
  description:
    'Practical, build-along courses drawn from real production engineering.',
}

export default async function CoursesPage() {
  const payload = await getPayloadClient()
  const { docs } = await payload.find({
    collection: 'courses',
    where: { status: { equals: 'published' } },
    sort: 'order',
    depth: 0,
    limit: 100,
  })

  return (
    <Container className="mt-16 sm:mt-32">
      <div className="amw">
        <StoreHero
          eyebrow="// AMWARE · COURSES"
          title="Learn the systems, not just the syntax."
          intro="Build-along courses pulled straight from production work — the patterns, trade-offs, and plumbing that tutorials skip."
          meta={
            <>
              <span className="amw-chip amw-chip--accent amw-chip--dot">
                {docs.length} courses
              </span>
              <span className="amw-chip">self-paced</span>
            </>
          }
        />

        {docs.length === 0 ? (
          <StoreEmpty label="courses" />
        ) : (
          <ul className="mt-10 grid grid-cols-1 gap-5 sm:mt-12 sm:grid-cols-2">
            {docs.map((course, i) => (
              <CourseCard key={course.id} course={course} index={i} />
            ))}
          </ul>
        )}
      </div>
    </Container>
  )
}
