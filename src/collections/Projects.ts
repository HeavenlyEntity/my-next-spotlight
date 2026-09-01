import type { CollectionConfig } from 'payload'

export const Projects: CollectionConfig = {
  slug: 'projects',
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'order'],
  },
  access: {
    read: () => true,
  },
  fields: [
    { name: 'name', type: 'text', required: true },
    { name: 'description', type: 'textarea' },
    {
      name: 'link',
      type: 'group',
      fields: [
        { name: 'url', type: 'text' },
        { name: 'label', type: 'text' },
      ],
    },
    { name: 'logo', type: 'upload', relationTo: 'media' },
    { name: 'order', type: 'number', defaultValue: 0 },
  ],
}
