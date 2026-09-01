import type { CollectionConfig } from 'payload'

import { slugField } from '@/fields/slug'
import { creemProductField } from '@/fields/creem'

export const Courses: CollectionConfig = {
  slug: 'courses',
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'level', 'status', 'order'],
  },
  access: {
    read: ({ req: { user } }) => {
      if (user) return true
      return { status: { equals: 'published' } }
    },
  },
  fields: [
    { name: 'title', type: 'text', required: true },
    ...slugField('title', {
      slugOverrides: { required: true, unique: true },
    }),
    { name: 'summary', type: 'textarea' },
    { name: 'description', type: 'richText' },
    { name: 'coverImage', type: 'upload', relationTo: 'media' },
    {
      name: 'level',
      type: 'select',
      options: [
        { label: 'Beginner', value: 'beginner' },
        { label: 'Intermediate', value: 'intermediate' },
        { label: 'Advanced', value: 'advanced' },
      ],
    },
    creemProductField(),
    { name: 'price', type: 'number' },
    { name: 'featured', type: 'checkbox', defaultValue: false },
    { name: 'order', type: 'number', defaultValue: 0 },
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
