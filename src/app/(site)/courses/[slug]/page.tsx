import { notFound } from 'next/navigation'
import { Container } from '@/components/Container'
import { RichText } from '@/components/site/RichText'
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

  // Group lessons by module label, preserving order.
  const groups: { module: string; lessons: typeof lessons }[] = []
  for (const lesson of lessons) {
    const label = (lesson.module as string) || 'Lessons'
    let group = groups.find((g) => g.module === label)
    if (!group) {
      group = { module: label, lessons: [] }
      groups.push(group)
    }
    group.lessons.push(lesson)
  }

  return (
    <Container className="mt-16 sm:mt-32">
      <article className="mx-auto max-w-2xl">
        <header>
          <h1 className="text-4xl font-bold tracking-tight text-zinc-800 dark:text-zinc-100 sm:text-5xl">
            {course.title}
          </h1>
          {course.summary && (
            <p className="mt-6 text-base text-zinc-600 dark:text-zinc-400">
              {course.summary}
            </p>
          )}
          {course.creemProductId ? (
            <BuyButton
              itemType="course"
              slug={course.slug}
              label={
                typeof course.price === 'number'
                  ? `Enroll — USD ${course.price.toFixed(2)}`
                  : 'Enroll now'
              }
            />
          ) : null}
        </header>

        <RichText data={course.description} className="mt-10" />

        {groups.map((group) => (
          <section key={group.module} className="mt-12">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
              {group.module}
            </h2>
            <div className="mt-4 space-y-8">
              {group.lessons.map((lesson) => (
                <div key={lesson.id} id={lesson.slug ?? undefined}>
                  <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
                    {lesson.title}
                    {lesson.isPreview && (
                      <span className="ml-2 rounded-full bg-teal-50 px-2 py-0.5 text-[11px] font-medium text-teal-600 dark:bg-teal-500/10 dark:text-teal-400">
                        Preview
                      </span>
                    )}
                  </h3>
                  <RichText data={lesson.content} className="mt-3" />
                </div>
              ))}
            </div>
          </section>
        ))}
      </article>
    </Container>
  )
}
