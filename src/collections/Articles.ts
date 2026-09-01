import type { CollectionConfig } from 'payload'

export const Articles: CollectionConfig = {
  slug: 'articles',
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'slug', 'status', 'publishedDate'],
  },
  access: {
    read: ({ req: { user } }) => {
      if (user) return true
      return { status: { equals: 'published' } }
    },
  },
  fields: [
    { name: 'title', type: 'text', required: true },
    { name: 'slug', type: 'text', required: true, unique: true, index: true },
    { name: 'publishedDate', type: 'date', required: true },
    { name: 'author', type: 'text', defaultValue: 'Alec Mingione' },
    { name: 'description', type: 'textarea' },
    {
      name: 'keywords',
      type: 'array',
      labels: { singular: 'Keyword', plural: 'Keywords' },
      fields: [{ name: 'keyword', type: 'text', required: true }],
    },
    { name: 'canonical', type: 'text' },
    { name: 'ogImage', type: 'upload', relationTo: 'media' },
    { name: 'coverImage', type: 'upload', relationTo: 'media' },
    { name: 'content', type: 'richText' },
    {
      name: 'mdxSlug',
      type: 'text',
      admin: {
        description: 'Links this entry to its file-based MDX article.',
      },
    },
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
