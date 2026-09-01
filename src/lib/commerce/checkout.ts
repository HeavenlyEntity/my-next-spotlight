'use server'

import crypto from 'crypto'
import { redirect } from 'next/navigation'
import { getPayloadClient } from '@/lib/getPayloadClient'
import { createCheckoutSession } from '@/lib/commerce/creem'

const COLLECTION = {
  product: 'products',
  course: 'courses',
  service: 'services',
} as const

export async function createCheckout(formData: FormData): Promise<void> {
  const itemType = String(formData.get('itemType') || '') as
    | 'product'
    | 'course'
    | 'service'
  const slug = String(formData.get('slug') || '')
  const githubUsername = String(formData.get('githubUsername') || '').trim()

  const collection = Object.prototype.hasOwnProperty.call(COLLECTION, itemType)
    ? COLLECTION[itemType]
    : undefined
  if (!collection || !slug) throw new Error('Invalid checkout request')

  const payload = await getPayloadClient()
  const { docs } = await payload.find({
    collection,
    where: { slug: { equals: slug }, status: { equals: 'published' } },
    depth: 0,
    limit: 1,
  })
  const item = docs[0]
  if (!item || !item.creemProductId) {
    throw new Error('This item is not available for purchase yet')
  }

  if (
    itemType === 'product' &&
    item.type === 'boilerplate' &&
    !githubUsername
  ) {
    throw new Error('A GitHub username is required for this purchase')
  }

  const site = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, '')
  if (!site) throw new Error('NEXT_PUBLIC_SITE_URL is not configured')
  const { checkoutUrl } = await createCheckoutSession({
    productId: item.creemProductId,
    requestId: crypto.randomUUID(),
    successUrl: `${site}/checkout/success`,
    metadata: {
      itemType,
      itemId: String(item.id),
      slug,
      ...(githubUsername ? { githubUsername } : {}),
    },
  })

  redirect(checkoutUrl) // external redirect to Creem's hosted page
}
