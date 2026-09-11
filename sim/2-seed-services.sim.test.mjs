import { describe, expect, it, beforeAll } from 'vitest'
import { getPayload } from 'payload'
import config from '@payload-config'

/*
 * The retainer tiers.
 *
 * The `services` collection was empty, so /services rendered "0 engagements"
 * -- while the homepage advertised three tiers and pointed its call to action
 * straight at that empty page. The numbers only existed hardcoded in a
 * landing component, which is the same drift the kit prices had.
 *
 * These are the real ones, confirmed 2026-09-09, and they are also what Creem
 * was told during merchant verification. Change them here and change them
 * there together.
 */

const CAL = 'https://cal.com/amware/on-demand-outcome'

const DEPOSIT =
  'Retainers begin after an intro call, with a $1,500 deposit credited in full against your first month.'

/* Lexical stores formatting as a bitmask on each text node, not as markup in
   the string -- 16 is inline code. Backticks written here are therefore
   parsed into real formatted nodes rather than shipped as literal characters,
   which is what they were: the product page rendered "`pnpm dev`" with the
   backticks showing, because nothing downstream parses markdown and nothing
   should have to. This produces the same document the editor's code button
   would, so it stays editable in the admin afterwards. */
const CODE_FORMAT = 16

const textNode = (text, format) => ({
  type: 'text',
  text,
  format,
  style: '',
  mode: 'normal',
  detail: 0,
  version: 1,
})

const inlineNodes = (text) =>
  text
    .split(/(`[^`\n]+`)/g)
    .filter((part) => part !== '')
    .map((part) =>
      part.startsWith('`') && part.endsWith('`') && part.length > 2
        ? textNode(part.slice(1, -1), CODE_FORMAT)
        : textNode(part, 0)
    )

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
      children: inlineNodes(text),
    })),
  },
})

const TIERS = [
  {
    name: 'Advisor',
    slug: 'advisor',
    order: 1,
    startingPrice: 3000,
    commitment: 'about 10 hrs a month',
    summary: 'Best for pre-seed',
    description: [
      'Two strategy calls a month, async Slack and email between them, and someone senior reading the architecture before it calcifies.',
      'For a founding team that is building and wants the decisions checked: the database you are about to pick, the auth you are about to write, the hire you are about to make.',
      'Architecture reviews and technology roadmap input. No standing meetings beyond the two calls.',
    ],
  },
  {
    name: 'Fractional CTO',
    slug: 'fractional-cto',
    order: 2,
    startingPrice: 7500,
    commitment: 'about 20 to 25 hrs a month',
    summary: 'Best for seed to Series A',
    description: [
      'Weekly strategy calls, team mentoring and code review, hiring support including interviews, vendor negotiations and AI integration planning.',
      'For a team that has engineers and needs the person who sets the bar for them: what gets built, how it gets reviewed, and who gets hired next.',
      'This is the tier most companies want when they say they need a CTO and are not ready to pay for a full-time one.',
    ],
  },
  {
    name: 'Embedded CTO',
    slug: 'embedded-cto',
    order: 3,
    startingPrice: 12000,
    commitment: 'about 35 to 40 hrs a month',
    summary: 'Best for Series A+ or M&A prep',
    description: [
      'Near full-time commitment: direct engineering leadership, board and investor reporting, technical due diligence and fundraising support.',
      'For a company where the technical story is about to be examined by people who do this for a living: an acquirer, a lead investor, a board.',
      'Due diligence is easier to pass than to survive. This tier exists to make it the former.',
    ],
  },
]

let payload
beforeAll(async () => {
  payload = await getPayload({ config })
})

describe('seed the retainer tiers', () => {
  for (const tier of TIERS) {
    it(`${tier.slug} — $${tier.startingPrice}/mo`, async () => {
      const data = {
        name: tier.name,
        slug: tier.slug,
        summary: tier.summary,
        description: richText(tier.description),
        startingPrice: tier.startingPrice,
        priceLabel: 'per month',
        commitment: tier.commitment,
        bookingUrl: CAL,
        depositNote: DEPOSIT,
        order: tier.order,
        status: 'published',
      }

      const existing = await payload.find({
        collection: 'services',
        where: { slug: { equals: tier.slug } },
        limit: 1,
        overrideAccess: true,
      })

      const doc = existing.docs.length
        ? await payload.update({
            collection: 'services',
            id: existing.docs[0].id,
            data,
            overrideAccess: true,
          })
        : await payload.create({
            collection: 'services',
            data,
            overrideAccess: true,
          })

      console.log(
        `${existing.docs.length ? 'updated' : 'created'} id=${doc.id} ${
          doc.slug
        } ` + `$${doc.startingPrice} ${doc.priceLabel} · ${doc.status}`
      )
      expect(doc.status).toBe('published')
      expect(doc.startingPrice).toBe(tier.startingPrice)
    })
  }

  /* The homepage sends people here. An empty list under a call to action that
     promised three tiers is the failure this file exists to prevent. */
  it('/services has engagements to list', async () => {
    const { docs } = await payload.find({
      collection: 'services',
      where: { status: { equals: 'published' } },
      sort: 'order',
      limit: 100,
      overrideAccess: true,
    })
    console.log(
      'published engagements:',
      docs.map((d) => `${d.name} $${d.startingPrice}`).join(', ')
    )
    expect(docs.length).toBeGreaterThanOrEqual(3)
    // Every one must say what the price is per, or a monthly retainer reads
    // as a flat fee.
    expect(docs.filter((d) => !d.priceLabel).map((d) => d.slug)).toEqual([])
    // And every one must offer a way to start.
    expect(
      docs.filter((d) => !d.bookingUrl && !d.creemProductId).map((d) => d.slug)
    ).toEqual([])
  })
})
