import type { CollectionConfig } from 'payload'

export const Products: CollectionConfig = {
  slug: 'products',
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'type', 'status', 'order'],
  },
  access: {
    read: ({ req: { user } }) => {
      if (user) return true
      return { status: { equals: 'published' } }
    },
  },
  fields: [
    { name: 'name', type: 'text', required: true },
    { name: 'slug', type: 'text', required: true, unique: true, index: true },
    {
      name: 'type',
      type: 'select',
      required: true,
      defaultValue: 'digital',
      options: [
        { label: 'Digital Product', value: 'digital' },
        { label: 'Boilerplate', value: 'boilerplate' },
        { label: 'Service Package', value: 'service-package' },
      ],
    },
    { name: 'tagline', type: 'text' },
    { name: 'description', type: 'richText' },
    {
      name: 'features',
      type: 'array',
      labels: { singular: 'Feature', plural: 'Features' },
      fields: [{ name: 'feature', type: 'text', required: true }],
    },
    {
      name: 'techStack',
      type: 'array',
      labels: { singular: 'Tech', plural: 'Tech Stack' },
      fields: [{ name: 'tech', type: 'text', required: true }],
    },
    { name: 'price', type: 'number' },
    { name: 'currency', type: 'text', defaultValue: 'USD' },
    {
      name: 'priceLabel',
      type: 'text',
      admin: { description: 'e.g. "one-time", "from"' },
    },
    { name: 'heroImage', type: 'upload', relationTo: 'media' },
    {
      name: 'gallery',
      type: 'array',
      fields: [{ name: 'image', type: 'upload', relationTo: 'media' }],
    },
    {
      name: 'githubRepo',
      type: 'text',
      admin: {
        description:
          'owner/repo — reserved for the future GitHub-invite phase.',
      },
    },
    { name: 'demoUrl', type: 'text' },
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
