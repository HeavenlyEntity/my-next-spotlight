import { describe, expect, it, beforeAll } from 'vitest'
import { getPayload } from 'payload'
import config from '@payload-config'

/*
 * Seeds the WareKit catalogue from the AMWARE org (github.com/amwaredotdev).
 *
 * Copy and feature lists are taken from each repository's own README rather
 * than invented here, and only rows the READMEs mark as shipping are listed
 * as included -- a roadmap item sold as a feature is the same mistake as an
 * invitation nothing sends.
 *
 * `githubRepo` is the whole point of this file: it is the address the
 * repository invitation goes to, so a kit without one cannot be fulfilled.
 *
 * Prices and Creem ids are deliberately absent. A product with no
 * creemProductId renders as "not yet available" instead of a checkout that
 * cannot complete.
 */

const ORG = 'amwaredotdev'

/* Every kit is held back while the catalogue is finished: the Creem products
 * are still test-mode, GITHUB_TOKEN is unset so invitations do not send, and
 * there is no Discord server for the step that offers one. Draft keeps them
 * out of /products, /pricing and their own pages without losing a word of the
 * copy -- flip this to 'published' when the pieces are in place.
 *
 * One switch rather than six literals, so the catalogue cannot go live by
 * halves, and so re-running this seed cannot quietly republish what was
 * deliberately taken down. */
const KIT_STATUS = process.env.SEED_KIT_STATUS || 'draft'

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

const list = (key, values) => values.map((v) => ({ [key]: v }))

/* Creem ids come from the environment, never the repository. A `prod_…` from
   a test key and one from a live key are different objects, and this database
   is shared between local and production -- committing either would point the
   wrong environment at the wrong product. A kit with no id renders as "not
   yet available" rather than a checkout that cannot complete. */
const creemIdFor = (slug) =>
  process.env[`CREEM_PRODUCT_${slug.toUpperCase().replaceAll('-', '_')}`] ||
  undefined

const KITS = [
  {
    name: 'WareKit React NetSuite (Lite)',
    slug: 'warekit-react-netsuite-lite',
    stack: 'react-netsuite',
    tier: 'lite',
    popular: false,
    pricingHighlights: [
      'The whole architecture, not a crippled demo',
      'Suitelet-served React app, same-origin with the session',
      'Both deploy modes and a generated SDF project',
      'Offline mock mode that runs with no NetSuite account',
      'End-to-end and unit tests',
      'Community support',
    ],
    // Free tier. Exactly 0, not absent: absent means unfinished.
    price: 0,
    seats: 1,
    githubRepo: `${ORG}/warekit-react-netsuite-lite`,
    order: 1,
    featured: true,
    status: KIT_STATUS,
    tagline:
      'Build React apps that run inside your NetSuite account. Served by a Suitelet, same-origin with the signed-in session.',
    description: [
      'A blank, production-shaped starter (React 19, TypeScript, Tailwind v4, shadcn, TanStack Query, Playwright, oxlint and oxfmt), served to your users by a Suitelet out of the NetSuite File Cabinet. No separate hosting, no CORS proxy, and no API keys in the browser, because the app is same-origin with the session cookie and there is no token to leak.',
      'It runs on `pnpm dev` right now, with no NetSuite account and no credentials, against built-in fixtures. Provision the account later. Endpoints resolve at runtime, so one build ships to every account without a rebuild, and `pnpm ns:push` uploads only what changed.',
      'Lite is the whole architecture, not a crippled demo. Everything in it works, is tested, and is yours to ship.',
    ],
    features: [
      'Suitelet-served React app, same-origin with the NetSuite session',
      'Endpoint discovery and a typed client',
      'Both deploy modes, with a generated SDF project',
      'Offline mock mode and a single `pnpm check` gate',
      'End-to-end and unit tests that run without a NetSuite account',
      'No session store to run: the NetSuite session cookie is the session',
      'Project identity in `.env`, so upstream updates never conflict',
      'Scaffolding through the open-source `warekit` CLI and MCP server',
    ],
    techStack: [
      'React 19',
      'TypeScript',
      'Tailwind v4',
      'shadcn/ui',
      'TanStack Query',
      'Playwright',
      'SuiteScript',
      'SDF',
    ],
  },
  {
    name: 'WareKit React NetSuite (Pro)',
    slug: 'warekit-react-netsuite-pro',
    stack: 'react-netsuite',
    tier: 'pro',
    popular: false,
    pricingHighlights: [
      'Everything in Lite',
      'Licensing and entitlement: keys, seat metering, activation',
      'Role mapping and a typed data layer',
      'Schema generator and bundle pipeline',
      'Admin center and observability',
      'Lifetime updates',
    ],
    price: 499,
    seats: 1,
    githubRepo: `${ORG}/warekit-react-netsuite`,
    order: 2,
    featured: false,
    status: KIT_STATUS,
    tagline:
      'Everything in Lite, plus what a commercial SuiteApp needs once you are selling it into other people’s accounts.',
    description: [
      'The parts that are specific to distributing software on NetSuite, and the parts that take months to get right: licensing and entitlement, role mapping, a typed data layer, a schema generator, the bundle pipeline and an admin center.',
      'In development. The repository does not exist yet, so this stays a draft until it does.',
    ],
    features: [
      'Licensing and entitlement: key validation, seat metering, per-account activation',
      'Role mapping: NetSuite roles to app permissions, role-aware routing',
      'Data layer: typed record CRUD, saved-search runner, governance-aware paging',
      'Schema generator: typed definitions to SDF objects, with migrations',
      'Bundle pipeline: packaging and publishing to customer accounts',
      'Admin center: a SuiteApp tab for configuration and licence state',
      'Observability: script log shipping, error tracking, governance telemetry',
      'Live-account E2E lane and SuiteScript unit tests',
    ],
    techStack: [
      'React 19',
      'TypeScript',
      'Tailwind v4',
      'shadcn/ui',
      'TanStack Query',
      'Playwright',
      'SuiteScript',
      'SDF',
    ],
  },
  {
    name: 'WareKit Next NetSuite (Lite)',
    slug: 'warekit-next-netsuite-lite',
    stack: 'next-netsuite',
    tier: 'lite',
    popular: false,
    pricingHighlights: [
      'The whole architecture, not a crippled demo',
      'OAuth 2 sign-in and machine-to-machine signing',
      'SDF project and RESTlets, generated and deployable',
      'Offline mock mode that runs with no NetSuite account',
      'Sessions in Postgres',
      'Community support',
    ],
    // Free tier. Exactly 0, not absent: absent means unfinished.
    price: 0,
    seats: 1,
    githubRepo: `${ORG}/warekit-next-netsuite-lite`,
    order: 3,
    featured: true,
    status: KIT_STATUS,
    tagline:
      'Build Next.js apps that talk to NetSuite. Hosted on Vercel, authenticated over OAuth 2, with the SuiteScript half deployed by SDF.',
    description: [
      'The hybrid kit: a Next.js App Router frontend on Vercel that reaches NetSuite from its API routes (OAuth 2 for user sign-in, token-based auth for server-to-server calls) rather than running inside a Suitelet on the session cookie.',
      'It runs on `pnpm dev` with no NetSuite account and no credentials, against built-in fixtures. NetSuite rejects http:// redirect URIs, so sign-in is the one flow that needs a tunnel; `pnpm dev:tunnel` starts one, prints the callback to paste into the integration record, and points AUTH_URL at it.',
      'Lite keeps sessions in Postgres. That works, and on Vercel it means one more service to provision and pay for. That is the line Pro moves.',
    ],
    features: [
      'Next.js App Router app, deployed to Vercel',
      'OAuth 2 sign-in via Better Auth, with the userinfo RESTlet included',
      'OAuth 2 machine-to-machine signing, two-integration credential split',
      'SDF project and RESTlets, generated and deployable',
      'Offline mock mode and a single `pnpm check` gate',
      'End-to-end and unit tests that run without a NetSuite account',
      'Session storage in Postgres',
      '`pnpm dev:tunnel` for the one flow NetSuite will not serve over http',
    ],
    techStack: [
      'Next.js',
      'React 19',
      'TypeScript',
      'Better Auth',
      'Postgres',
      'Vercel',
      'SuiteScript',
      'SDF',
      'Playwright',
    ],
  },
  {
    name: 'WareKit Next NetSuite (Pro)',
    slug: 'warekit-next-netsuite-pro',
    stack: 'next-netsuite',
    tier: 'pro',
    popular: true,
    pricingHighlights: [
      'Everything in Lite',
      'Sessions in NetSuite, not Postgres, so one less service',
      'Concurrency-aware session reads that survive real traffic',
      'End-to-end and unit tests',
      'Lifetime updates',
    ],
    price: 499,
    seats: 1,
    githubRepo: `${ORG}/warekit-next-netsuite`,
    order: 4,
    featured: false,
    status: KIT_STATUS,
    tagline:
      'The hybrid kit with sessions in NetSuite instead of Postgres: one less service to provision, and a concurrency budget that survives real traffic.',
    description: [
      'The same architecture as Lite, with session reads moved into a NetSuite custom record behind a single-purpose RESTlet. The record is the easy part. The reason it is Pro is the concurrency budget: NetSuite governs concurrent requests at the account level across every RESTlet and web services call, so a naive session read per HTTP request saturates it and starts returning 429s.',
      'Pro answers that with a per-instance cache, in-flight collapsing and N/cache, so session reads stop being a per-request cost.',
      'Session storage is the first Pro feature to land. Licensing, role mapping, the data layer, the schema generator and observability are roadmap, and the repository says so rather than implying otherwise.',
    ],
    features: [
      'Everything in the Lite edition',
      'Session storage backed by a NetSuite custom record, not Postgres',
      'Concurrency-aware session reads: per-instance cache, in-flight collapsing, `N/cache`',
      'Next.js App Router app, deployed to Vercel',
      'OAuth 2 sign-in via Better Auth, with the userinfo RESTlet included',
      'OAuth 2 machine-to-machine signing, two-integration credential split',
      'SDF project and RESTlets, generated and deployable',
      'End-to-end and unit tests that run without a NetSuite account',
    ],
    techStack: [
      'Next.js',
      'React 19',
      'TypeScript',
      'Better Auth',
      'Vercel',
      'SuiteScript',
      'SDF',
      'Playwright',
    ],
  },
  {
    name: 'WareKit Next NetSuite (Team)',
    slug: 'warekit-next-netsuite-team',
    stack: 'next-netsuite',
    tier: 'team',
    popular: false,
    pricingHighlights: [
      'Everything in Pro',
      'Add collaborators after purchase, from a link',
      'No account for your team to create',
      'One invitation each, to their own GitHub account',
      'Lifetime updates',
    ],
    githubRepo: `${ORG}/warekit-next-netsuite`,
    order: 5,
    featured: false,
    status: KIT_STATUS,
    price: 999,
    seats: 5,
    tagline:
      'The Pro kit licensed for a team: up to five GitHub accounts on one repository, added whenever you hire.',
    description: [
      'Everything in Next NetSuite (Pro), licensed for five people instead of one. Sessions live in a NetSuite custom record rather than Postgres, with the concurrency-aware reads that keeps a real traffic load under NetSuite’s account-level request budget.',
      'Seats are filled after purchase, not at checkout. You get a link that adds a GitHub account to the licence whenever someone joins, and each one gets their own repository invitation. No account to create and no seat to pre-assign.',
      'One payment. The licence does not lapse and neither does the repository access.',
    ],
    features: [
      'Everything in the Pro edition',
      'Up to 5 GitHub accounts on one licence',
      'Add collaborators after purchase, from a link. No account needed',
      'Session storage backed by a NetSuite custom record, not Postgres',
      'Concurrency-aware session reads: per-instance cache, in-flight collapsing, `N/cache`',
      'Next.js App Router app, deployed to Vercel',
      'OAuth 2 sign-in via Better Auth, with the userinfo RESTlet included',
      'SDF project and RESTlets, generated and deployable',
    ],
    techStack: [
      'Next.js',
      'React 19',
      'TypeScript',
      'Better Auth',
      'Vercel',
      'SuiteScript',
      'SDF',
      'Playwright',
    ],
  },
  {
    name: 'WareKit React NetSuite (Team)',
    slug: 'warekit-react-netsuite-team',
    stack: 'react-netsuite',
    tier: 'team',
    popular: false,
    pricingHighlights: [
      'Everything in Pro',
      'Add collaborators after purchase, from a link',
      'No account for your team to create',
      'One invitation each, to their own GitHub account',
      'Lifetime updates',
    ],
    githubRepo: `${ORG}/warekit-react-netsuite`,
    order: 6,
    featured: false,
    status: KIT_STATUS,
    price: 999,
    seats: 5,
    tagline:
      'The Pro kit licensed for a team: up to five GitHub accounts on one repository.',
    description: [
      'Everything in React NetSuite (Pro), licensed for five people instead of one: licensing and entitlement, role mapping, the typed data layer, the schema generator, the bundle pipeline and the admin center.',
      'Seats are filled after purchase from a link, each with its own repository invitation.',
      'In development, alongside the Pro edition it is licensed from.',
    ],
    features: [
      'Everything in the Pro edition',
      'Up to 5 GitHub accounts on one licence',
      'Add collaborators after purchase, from a link. No account needed',
      'Licensing and entitlement: key validation, seat metering, per-account activation',
      'Role mapping: NetSuite roles to app permissions, role-aware routing',
      'Data layer: typed record CRUD, saved-search runner, governance-aware paging',
      'Schema generator: typed definitions to SDF objects, with migrations',
      'Admin center: a SuiteApp tab for configuration and licence state',
    ],
    techStack: [
      'React 19',
      'TypeScript',
      'Tailwind v4',
      'shadcn/ui',
      'TanStack Query',
      'Playwright',
      'SuiteScript',
      'SDF',
    ],
  },
]

let payload
beforeAll(async () => {
  payload = await getPayload({ config })
})

describe('seed the WareKit catalogue', () => {
  for (const kit of KITS) {
    it(`${kit.slug} — ${kit.status}`, async () => {
      const data = {
        name: kit.name,
        slug: kit.slug,
        type: 'boilerplate',
        tagline: kit.tagline,
        description: richText(kit.description),
        features: list('feature', kit.features),
        techStack: list('tech', kit.techStack),
        githubRepo: kit.githubRepo,
        ...(kit.price === undefined ? {} : { price: kit.price }),
        seats: kit.seats ?? 1,
        stack: kit.stack,
        tier: kit.tier,
        popular: Boolean(kit.popular),
        pricingHighlights: list('highlight', kit.pricingHighlights ?? []),
        ...(creemIdFor(kit.slug)
          ? { creemProductId: creemIdFor(kit.slug) }
          : {}),
        currency: 'USD',
        priceLabel: 'one-time',
        featured: kit.featured,
        order: kit.order,
        status: kit.status,
      }

      const existing = await payload.find({
        collection: 'products',
        where: { slug: { equals: kit.slug } },
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
        `${existing.docs.length ? 'updated' : 'created'} id=${doc.id} ${
          doc.slug
        } repo=${doc.githubRepo} status=${doc.status} creem=${
          doc.creemProductId ?? '—'
        }`
      )
      expect(doc.githubRepo).toBe(kit.githubRepo)
      expect(doc.status).toBe(kit.status)
      expect(doc.status).toBe(KIT_STATUS)
    })
  }

  /* The copy around the table, so changing "One payment" does not need a
     deploy. Seeded once with sensible defaults; edit it in the admin after
     that -- this writes the same values every run, so anything changed by
     hand here would be reverted. Kept deliberately small for that reason:
     only the words that were going to be hardcoded otherwise. */
  it('seeds the pricing page copy', async () => {
    const copy = await payload.updateGlobal({
      slug: 'pricing-page',
      overrideAccess: true,
      data: {
        eyebrow: 'pricing',
        heading: 'One payment. The kit is yours.',
        intro:
          'Start on Lite for nothing. It is the whole architecture, not a demo. Move up when you are shipping to other people’s NetSuite accounts.',
        footnote:
          'Prices are in USD and charged once. Amware is the merchant of record through Creem. Repository access arrives as a GitHub invitation to the account you confirm at checkout, and Lite needs no card and no account.',
        faqs: [
          {
            question: 'What does a seat actually mean?',
            answer:
              'One GitHub account with access to the kit’s repository. Pro covers one: you. Team covers five, and you add them whenever someone joins, from a link you get at purchase. Nobody has to create an account here.',
          },
          {
            question: 'Is Lite a trial?',
            answer:
              'No. Lite is the whole architecture and it does not expire. Pro adds what you need once you are selling a SuiteApp into other people’s accounts: licensing, role mapping, the typed data layer, the schema generator.',
          },
          {
            question: 'How does the kit reach me?',
            answer:
              'As a GitHub invitation to the account you confirm at checkout. You see the account and its avatar before you pay, because an invitation sent to the wrong username is very hard to undo.',
          },
          {
            question: 'Which kit do I want?',
            answer:
              'If the app should run inside NetSuite on the session cookie, take React in NetSuite. If it should live on Vercel and talk to NetSuite over OAuth 2, take Next.js + NetSuite. The SuiteScript half is the same work either way.',
          },
        ],
      },
    })
    console.log(
      `pricing copy: "${copy.heading}" · ${copy.faqs?.length ?? 0} FAQ`
    )
    expect(copy.heading).toBeTruthy()
  })

  /* The placeholder that preceded the real catalogue. Its copy described
     this website's own codebase, which is not what WareKit sells, and it
     names no repository -- so it is retired rather than deleted, in case
     its Creem product is wanted for something later. */
  it('retires the generic `warekit` placeholder', async () => {
    const { docs } = await payload.find({
      collection: 'products',
      where: { slug: { equals: 'warekit' } },
      limit: 1,
      overrideAccess: true,
    })
    if (!docs.length) return
    const doc = await payload.update({
      collection: 'products',
      id: docs[0].id,
      data: { status: 'draft', featured: false, order: 99 },
      overrideAccess: true,
    })
    console.log(`retired id=${doc.id} warekit -> ${doc.status}`)
    expect(doc.status).toBe('draft')
  })

  /* Anything someone can actually obtain must name a repository -- free kits
     and anything with a Creem product behind it. Without one the confirmation
     email promises an invitation with no address to send it to, which is the
     failure this whole column exists to prevent.
   *
   * Deliberately scoped to obtainable kits rather than published ones. A tier
   * shown as "In development" is published on purpose, so the roadmap is
   * visible, and its repository does not exist yet by definition. Requiring
   * one there would mean either hiding the tier or creating an empty repo to
   * satisfy a test. */
  it('nothing obtainable lacks a repository to invite people to', async () => {
    const { docs } = await payload.find({
      collection: 'products',
      where: {
        and: [
          { type: { equals: 'boilerplate' } },
          { status: { equals: 'published' } },
        ],
      },
      limit: 100,
      overrideAccess: true,
    })
    const obtainable = docs.filter((d) => d.price === 0 || d.creemProductId)
    const orphans = obtainable.filter((d) => !d.githubRepo)
    console.log(
      `obtainable: ${obtainable.map((d) => d.slug).join(', ')}` +
        ` · in development: ${docs
          .filter((d) => !obtainable.includes(d))
          .map((d) => d.slug)
          .join(', ')}`
    )
    expect(orphans.map((d) => d.slug)).toEqual([])
  })
})
