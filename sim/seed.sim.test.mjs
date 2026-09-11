import { describe, expect, it } from 'vitest'
import { getPayload } from 'payload'
import config from '@payload-config'

const SLUG = 'warekit'
const CREEM_ID = process.env.CREEM_BOILERPLATE_PRODUCT_ID

const richText = (paragraphs) => ({
  root: {
    type: 'root',
    format: '',
    indent: 0,
    version: 1,
    direction: 'ltr',
    children: paragraphs.map((text) => ({
      type: 'paragraph',
      format: '',
      indent: 0,
      version: 1,
      direction: 'ltr',
      textFormat: 0,
      textStyle: '',
      children: [
        {
          type: 'text',
          text,
          format: 0,
          style: '',
          mode: 'normal',
          detail: 0,
          version: 1,
        },
      ],
    })),
  },
})

const data = {
  name: 'WareKit',
  slug: SLUG,
  type: 'boilerplate',
  tagline:
    'The commerce and CMS foundation this site runs on — Next.js 16, Payload 3, and a checkout that actually ships.',
  description: richText([
    'WareKit is the working codebase behind amware.dev, packaged so you start from a product that already sells rather than a starter that only renders.',
    'It is an App Router application on Next.js 16 and React 19, with Payload CMS 3 on Postgres for content, Creem for payments as merchant of record, and Resend for transactional mail. The checkout, the signed webhook, idempotent order recording, subscription handling, and access-token delivery are all in place and covered by tests.',
    'You get the private repository by GitHub invitation. Invitations are sent by hand within one business day of purchase, to the username you confirm at checkout.',
  ]),
  features: [
    { feature: 'Next.js 16 App Router + React 19, TypeScript throughout' },
    { feature: 'Payload CMS 3 on Postgres, with a working admin panel' },
    {
      feature: 'Creem checkout, merchant of record, one-time and subscription',
    },
    { feature: 'Signed webhook with idempotent order recording' },
    { feature: 'Signed access tokens and Resend delivery emails' },
    { feature: 'Tailwind CSS 4 design system and component library' },
    { feature: 'Vitest suite across engine and UI projects' },
    { feature: 'Private GitHub repository access by invitation' },
  ],
  techStack: [
    { tech: 'Next.js 16' },
    { tech: 'React 19' },
    { tech: 'Payload CMS 3' },
    { tech: 'Postgres' },
    { tech: 'Tailwind CSS 4' },
    { tech: 'Creem' },
    { tech: 'Resend' },
    { tech: 'Vitest' },
  ],
  price: 249,
  currency: 'USD',
  priceLabel: 'one-time',
  featured: true,
  order: 1,
  status: 'published',
  ...(CREEM_ID ? { creemProductId: CREEM_ID } : {}),
}

describe('seed WareKit', () => {
  it('writes the product row', async () => {
    const payload = await getPayload({ config })
    const existing = await payload.find({
      collection: 'products',
      where: { slug: { equals: SLUG } },
      limit: 1,
      overrideAccess: true,
    })
    const doc = existing.docs.length
      ? await payload.update({
          collection: 'products',
          id: existing.docs[0].id,
          data,
          overrideAccess: true,
        })
      : await payload.create({
          collection: 'products',
          data,
          overrideAccess: true,
        })
    console.log(
      `${existing.docs.length ? 'updated' : 'created'} product id=${
        doc.id
      } slug=${doc.slug} creem=${doc.creemProductId}`
    )
    expect(doc.slug).toBe(SLUG)
    expect(doc.status).toBe('published')
  })
})
