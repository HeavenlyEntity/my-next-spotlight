import type { CollectionConfig } from 'payload'

export const Purchases: CollectionConfig = {
  slug: 'purchases',
  admin: {
    useAsTitle: 'email',
    defaultColumns: [
      'email',
      'itemType',
      'status',
      'fulfillmentStatus',
      'createdAt',
    ],
  },
  // Admin-only; the webhook writes via Local API with overrideAccess: true.
  access: {
    create: ({ req: { user } }) => Boolean(user),
    read: ({ req: { user } }) => Boolean(user),
    update: ({ req: { user } }) => Boolean(user),
    delete: ({ req: { user } }) => Boolean(user),
  },
  fields: [
    { name: 'email', type: 'email', required: true },
    {
      name: 'item',
      type: 'relationship',
      relationTo: ['products', 'courses', 'services'],
    },
    {
      name: 'itemType',
      type: 'select',
      options: [
        { label: 'Product', value: 'product' },
        { label: 'Course', value: 'course' },
        { label: 'Service', value: 'service' },
      ],
    },
    { name: 'creemProductId', type: 'text' },
    {
      name: 'creemOrderId',
      type: 'text',
      required: true,
      unique: true,
      index: true,
      admin: { description: 'Idempotency key (Creem order id).' },
    },
    {
      name: 'creemSubscriptionId',
      type: 'text',
      index: true,
      admin: {
        description:
          'Retainers only. Ties every renewal row back to one subscription.',
      },
    },
    {
      name: 'creemTransactionId',
      type: 'text',
      index: true,
      admin: {
        description:
          'Retainers only. The individual payment inside a subscription. ' +
          'Separate from creemOrderId because the first payment arrives twice: ' +
          'once as checkout.completed with an order id, once as ' +
          'subscription.paid with a transaction id. Keying renewals on this ' +
          'is what stops that first payment being banked as two sales.',
      },
    },
    { name: 'amount', type: 'number', admin: { description: 'Cents.' } },
    { name: 'currency', type: 'text' },
    {
      name: 'githubUsername',
      type: 'text',
      admin: { description: 'Boilerplate orders — consumed by Phase B3.' },
    },
    { name: 'accessTokenJti', type: 'text' },
    {
      name: 'status',
      type: 'select',
      options: [
        { label: 'Paid', value: 'paid' },
        { label: 'Refunded', value: 'refunded' },
      ],
      defaultValue: 'paid',
      admin: { position: 'sidebar' },
    },
    {
      name: 'subscriptionStatus',
      type: 'select',
      options: [
        { label: 'Trialing', value: 'trialing' },
        { label: 'Active', value: 'active' },
        { label: 'Paid', value: 'paid' },
        { label: 'Past due', value: 'past_due' },
        { label: 'Cancels at period end', value: 'scheduled_cancel' },
        { label: 'Canceled', value: 'canceled' },
        { label: 'Expired', value: 'expired' },
      ],
      admin: {
        position: 'sidebar',
        description: 'Retainers only. Empty on one-time purchases.',
      },
    },
    {
      name: 'fulfillmentStatus',
      type: 'select',
      options: [
        { label: 'Pending', value: 'pending' },
        { label: 'Pending invite', value: 'pending_invite' },
        { label: 'Sent', value: 'sent' },
        { label: 'Failed', value: 'failed' },
        { label: 'Not required', value: 'not_required' },
      ],
      defaultValue: 'pending',
      admin: { position: 'sidebar' },
    },
  ],
}
