import { getPayloadClient } from '@/lib/getPayloadClient'
import { verifyCreemSignature } from '@/lib/commerce/creem'
import { createAccessToken } from '@/lib/commerce/accessToken'
import {
  sendAccessLinkEmail,
  sendBoilerplateConfirmationEmail,
} from '@/lib/commerce/fulfillment'

export const dynamic = 'force-dynamic'

const COLLECTION = {
  product: 'products',
  course: 'courses',
  service: 'services',
}

export async function POST(req) {
  const raw = await req.text()
  if (!verifyCreemSignature(raw, req.headers.get('creem-signature'))) {
    return new Response('Invalid signature', { status: 401 })
  }

  let event
  try {
    event = JSON.parse(raw)
  } catch {
    return new Response('Bad JSON', { status: 400 })
  }
  if (event?.eventType !== 'checkout.completed') {
    return new Response('ignored', { status: 200 })
  }

  const obj = event.object || {}
  const orderId = obj.order?.id || obj.id
  const email = obj.customer?.email
  const amount = obj.order?.amount
  const currency = obj.order?.currency
  const creemProductId = obj.product?.id
  const meta = obj.metadata || {}
  const itemType = meta.itemType
  const itemId = meta.itemId
  const githubUsername = meta.githubUsername

  if (!orderId || !email || !itemType || !itemId) {
    return new Response('ignored (missing fields)', { status: 200 })
  }

  const payload = await getPayloadClient()

  // Idempotency: skip if we already recorded this order.
  const existing = await payload.find({
    collection: 'purchases',
    where: { creemOrderId: { equals: orderId } },
    limit: 1,
    overrideAccess: true,
  })
  if (existing.docs.length) {
    return new Response('ok (duplicate)', { status: 200 })
  }

  const collection = Object.prototype.hasOwnProperty.call(COLLECTION, itemType)
    ? COLLECTION[itemType]
    : null

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let item: any = null
  if (collection) {
    item = await payload
      .findByID({ collection, id: itemId, depth: 1, overrideAccess: true })
      .catch(() => null)
  }

  const isBoilerplate = itemType === 'product' && item?.type === 'boilerplate'
  const itemName = item?.name || item?.title || 'your purchase'

  // Create the Purchase first (need its id to sign the access token).
  const purchase = await payload.create({
    collection: 'purchases',
    overrideAccess: true,
    data: {
      email,
      item: item ? { relationTo: collection, value: item.id } : undefined,
      itemType,
      creemProductId,
      creemOrderId: orderId,
      amount,
      currency,
      githubUsername: githubUsername || undefined,
      status: 'paid',
      fulfillmentStatus: isBoilerplate ? 'pending_invite' : 'pending',
    },
  })

  if (isBoilerplate) {
    // Confirmation email is best-effort; the repo invite (Phase B3) is the real
    // fulfillment, so a failed confirmation must NOT flip the order to 'failed'.
    try {
      await sendBoilerplateConfirmationEmail({ to: email, itemName })
    } catch (err) {
      console.error('Boilerplate confirmation email failed:', err)
    }
  } else if (item) {
    try {
      const { token, jti } = createAccessToken({
        purchaseId: purchase.id,
        itemType,
        itemId: item.id,
      })
      await payload.update({
        collection: 'purchases',
        id: purchase.id,
        overrideAccess: true,
        data: { accessTokenJti: jti },
      })
      await sendAccessLinkEmail({ to: email, itemName, token })
      await payload.update({
        collection: 'purchases',
        id: purchase.id,
        overrideAccess: true,
        data: { fulfillmentStatus: 'sent' },
      })
    } catch (err) {
      console.error('Fulfillment failed:', err)
      await payload
        .update({
          collection: 'purchases',
          id: purchase.id,
          overrideAccess: true,
          data: { fulfillmentStatus: 'failed' },
        })
        .catch(() => {})
    }
  } else {
    // No item resolved — record exists but cannot be fulfilled automatically.
    await payload
      .update({
        collection: 'purchases',
        id: purchase.id,
        overrideAccess: true,
        data: { fulfillmentStatus: 'failed' },
      })
      .catch(() => {})
  }

  // Always 200 once recorded so Creem doesn't retry a captured order.
  return new Response('ok', { status: 200 })
}
