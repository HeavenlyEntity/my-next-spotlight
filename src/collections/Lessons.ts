import type { CollectionConfig } from 'payload'

export const Lessons: CollectionConfig = {
  slug: 'lessons',
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'course', 'module', 'order', 'status'],
  },
  access: {
    read: ({ req: { user } }) => {
      if (user) return true
      return { status: { equals: 'published' } }
    },
  },
  fields: [
    { name: 'title', type: 'text', required: true },
    {
      name: 'slug',
      type: 'text',
      index: true,
      admin: { description: 'Used as the on-page anchor id.' },
    },
    {
      name: 'course',
      type: 'relationship',
      relationTo: 'courses',
      required: true,
    },
    {
      name: 'module',
      type: 'text',
      admin: {
        description:
          'Grouping label; lessons are grouped by this on the course page.',
      },
    },
    { name: 'order', type: 'number', defaultValue: 0 },
    { name: 'content', type: 'richText' },
    { name: 'videoUrl', type: 'text' },
    { name: 'durationMinutes', type: 'number' },
    { name: 'isPreview', type: 'checkbox', defaultValue: false },
    {
      name: 'status',
      type: 'select',
      options: [
        { label: 'Draft', value: 'draft' },
        { label: 'Published', value: 'published' },
      ],
      defaultValue: 'draft',
      admin: { position: 'sidebar' },
    },
  ],
}
