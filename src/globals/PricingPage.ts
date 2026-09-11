import type { GlobalConfig } from 'payload'

/*
 * The copy around the pricing table. The tiers themselves are products --
 * price, seats and bullets live on each one -- so this is only the framing:
 * the words that would otherwise need a deploy to change.
 *
 * Published without auth like the rest of the public content, and read with
 * a fallback in the page, so an empty global renders sensible defaults rather
 * than an empty heading.
 */
export const PricingPage: GlobalConfig = {
  slug: 'pricing-page',
  admin: { group: 'Pages' },
  access: { read: () => true },
  fields: [
    {
      name: 'eyebrow',
      type: 'text',
      defaultValue: 'pricing',
      admin: { description: 'Small label above the heading.' },
    },
    {
      name: 'heading',
      type: 'text',
      defaultValue: 'One payment. The kit is yours.',
    },
    {
      name: 'intro',
      type: 'textarea',
      defaultValue:
        'Start on Lite for nothing — it is the whole architecture, not a demo. Move up when you are shipping to other people’s NetSuite accounts.',
    },
    {
      name: 'footnote',
      type: 'textarea',
      admin: {
        description:
          'Small print under the table. Anything quoted here is also what '
          + 'Creem is told during merchant verification — keep them together.',
      },
      defaultValue:
        'Prices are in USD and charged once. Amware is the merchant of record through Creem. Repository access arrives as a GitHub invitation to the account you confirm at checkout.',
    },
    {
      name: 'faqs',
      type: 'array',
      labels: { singular: 'Question', plural: 'FAQ' },
      fields: [
        { name: 'question', type: 'text', required: true },
        { name: 'answer', type: 'textarea', required: true },
      ],
    },
  ],
}
