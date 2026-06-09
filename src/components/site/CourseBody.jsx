import { RichText } from '@/components/site/RichText'

export function CourseBody({ course, lessons }) {
  const groups = []
  for (const lesson of lessons) {
    const label = lesson.module || 'Lessons'
    let group = groups.find((g) => g.module === label)
    if (!group) {
      group = { module: label, lessons: [] }
      groups.push(group)
    }
    group.lessons.push(lesson)
  }
  return (
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
  )
}
