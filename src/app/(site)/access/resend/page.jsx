import { Container } from '@/components/Container'
import { Button } from '@/components/Button'
import { getPayloadClient } from '@/lib/getPayloadClient'
import { createAccessToken } from '@/lib/commerce/accessToken'
import { sendAccessLinkEmail } from '@/lib/commerce/fulfillment'

export const metadata = {
  title: 'Resend access link',
  robots: { index: false },
}

async function resendLink(formData) {
  'use server'
  const email = String(formData.get('email') || '').trim()
  if (!email) return
  const payload = await getPayloadClient()
  const { docs } = await payload.find({
    collection: 'purchases',
    where: { email: { equals: email }, status: { equals: 'paid' } },
    sort: '-createdAt',
    depth: 0,
    limit: 1,
    overrideAccess: true,
  })
  const purchase = docs[0]
  if (purchase) {
    const { token, jti } = createAccessToken({
      purchaseId: purchase.id,
      itemType: purchase.itemType,
      itemId:
        typeof purchase.item === 'object' && purchase.item
          ? purchase.item.value
          : purchase.item,
    })
    await payload.update({
      collection: 'purchases',
      id: purchase.id,
      overrideAccess: true,
      data: { accessTokenJti: jti },
    })
    await sendAccessLinkEmail({
      to: email,
      itemName: 'your purchase',
      token,
    })
  }
  // Always behaves identically (no account enumeration).
}

export default function ResendPage() {
  return (
    <Container className="mt-16 sm:mt-32">
      <div className="mx-auto max-w-md">
        <h1 className="text-3xl font-bold tracking-tight text-zinc-800 dark:text-zinc-100">
          Resend your access link
        </h1>
        <p className="mt-4 text-sm text-zinc-600 dark:text-zinc-400">
          Enter the email you purchased with. If we find a purchase, we'll email
          a fresh link.
        </p>
        <form action={resendLink} className="mt-6 flex gap-3">
          <input
            type="email"
            name="email"
            required
            placeholder="you@example.com"
            className="min-w-0 flex-auto rounded-md border border-zinc-900/10 bg-white px-3 py-2 text-sm text-zinc-800 shadow-sm focus:border-teal-500 focus:outline-hidden focus:ring-4 focus:ring-teal-500/10 dark:border-zinc-700 dark:bg-zinc-700/[0.15] dark:text-zinc-200"
          />
          <Button type="submit">Send link</Button>
        </form>
      </div>
    </Container>
  )
}
