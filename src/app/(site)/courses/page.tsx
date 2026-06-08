import Link from 'next/link'
import { Container } from '@/components/Container'
import { getPayloadClient } from '@/lib/getPayloadClient'

export const revalidate = 60

export const metadata = {
  title: 'Courses',
  description: 'Courses and learning paths.',
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
      <header className="max-w-2xl">
        <h1 className="text-4xl font-bold tracking-tight text-zinc-800 dark:text-zinc-100 sm:text-5xl">
          Courses
        </h1>
        <p className="mt-6 text-base text-zinc-600 dark:text-zinc-400">
          Structured, practical courses — learn by building.
        </p>
      </header>

      {docs.length === 0 ? (
        <p className="mt-16 text-zinc-500 dark:text-zinc-400">
          No courses yet — check back soon.
        </p>
      ) : (
        <ul className="mt-16 grid grid-cols-1 gap-6 sm:grid-cols-2">
          {docs.map((course) => (
            <li
              key={course.id}
              className="rounded-3xl p-6 ring-1 ring-zinc-200 transition hover:ring-zinc-300 dark:ring-zinc-700 dark:hover:ring-zinc-600"
            >
              <Link href={`/courses/${course.slug}`} className="block">
                <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
                  {course.title}
                </h2>
                {course.summary && (
                  <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
                    {course.summary}
                  </p>
                )}
                {course.level && (
                  <span className="mt-4 inline-block rounded-full border border-zinc-200 bg-zinc-50 px-2 py-0.5 text-[11px] font-medium text-zinc-600 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-400">
                    {course.level}
                  </span>
                )}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </Container>
  )
}
