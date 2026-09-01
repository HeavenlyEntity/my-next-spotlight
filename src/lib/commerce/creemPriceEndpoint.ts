import type { Endpoint, PayloadRequest } from 'payload'

import { retrieveProduct } from './creem'

const billingLabel = (billingType?: string, billingPeriod?: string): string => {
  if (billingType === 'onetime') return 'one-time'
  switch (billingPeriod) {
    case 'every-month':
      return 'per month'
    case 'every-three-months':
      return 'per quarter'
    case 'every-six-months':
      return 'per 6 months'
    case 'every-year':
      return 'per year'
    default:
      return 'recurring'
  }
}

/**
 * Admin-only endpoint mounted at `/api/creem/product`. Given a `?product_id=`,
 * returns the price (converted cents → dollars), currency, and a price label
 * so the admin can auto-populate product/course pricing from Creem.
 */
export const creemPriceEndpoint: Endpoint = {
  path: '/creem/product',
  method: 'get',
  handler: async (req: PayloadRequest) => {
    // Only authenticated admin users may proxy Creem lookups.
    if (!req.user) {
      return Response.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const productId =
      typeof req.query?.product_id === 'string'
        ? req.query.product_id.trim()
        : ''
    if (!productId) {
      return Response.json({ error: 'Missing product_id' }, { status: 400 })
    }

    try {
      const product = await retrieveProduct(productId)
      return Response.json({
        // Creem returns minor units (cents); store dollars. Round first so a
        // value like 4999¢ becomes 49.99, not 49.989999999999995.
        price: Math.round(product.price) / 100,
        currency: product.currency,
        priceLabel: billingLabel(product.billingType, product.billingPeriod),
        billingType: product.billingType,
        name: product.name,
      })
    } catch (err) {
      const message =
        process.env.NODE_ENV === 'production'
          ? 'Creem lookup failed'
          : err instanceof Error
          ? err.message
          : 'Creem lookup failed'
      return Response.json({ error: message }, { status: 502 })
    }
  },
}
