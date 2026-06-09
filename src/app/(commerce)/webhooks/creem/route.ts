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
  if (raw.length > 65536) {
    return new Response('Payload too large', { status: 413 })
  }
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
  let purchase
  try {
    purchase = await payload.create({
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
  } catch (err) {
    // Likely a unique-constraint race on creemOrderId — re-check; treat as duplicate.
    const recheck = await payload.find({
      collection: 'purchases',
      where: { creemOrderId: { equals: orderId } },
      limit: 1,
      overrideAccess: true,
    })
    if (recheck.docs.length) {
      return new Response('ok (duplicate)', { status: 200 })
    }
    console.error('Purchase create failed for order', orderId, err)
    return new Response('error', { status: 500 }) // genuine error — let Creem retry
  }

  if (isBoilerplate) {
    // Confirmation email is best-effort; the repo invite (Phase B3) is the real
    // fulfillment, so a failed confirmation must NOT flip the order to 'failed'.
    try {
      await sendBoilerplateConfirmationEmail({ to: email, itemName })
    } catch {
      console.error('Boilerplate confirmation email failed for order', orderId)
    }
  } else if (item) {
    const { token, jti } = createAccessToken({
      purchaseId: purchase.id,
      itemType,
      itemId: item.id,
    })
    let emailed = false
    try {
      await sendAccessLinkEmail({ to: email, itemName, token })
      emailed = true
    } catch {
      console.error('Access link email failed for order', orderId)
    }
    await payload
      .update({
        collection: 'purchases',
        id: purchase.id,
        overrideAccess: true,
        data: {
          accessTokenJti: jti,
          fulfillmentStatus: emailed ? 'sent' : 'failed',
        },
      })
      .catch(() =>
        console.error('Purchase status update failed for order', orderId)
      )
  } else {
    console.warn('Webhook: item not found', {
      itemType,
      itemId,
      creemProductId,
    })
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
