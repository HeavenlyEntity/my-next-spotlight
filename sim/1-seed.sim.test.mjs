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
    githubRepo: `${ORG}/warekit-react-netsuite-lite`,
    order: 1,
    featured: true,
    status: 'published',
    tagline:
      'Build React apps that run inside your NetSuite account. Served by a Suitelet, same-origin with the signed-in session.',
    description: [
      'A blank, production-shaped starter — React 19, TypeScript, Tailwind v4, shadcn, TanStack Query, Playwright, oxlint and oxfmt — served to your users by a Suitelet out of the NetSuite File Cabinet. No separate hosting, no CORS proxy, and no API keys in the browser, because the app is same-origin with the session cookie and there is no token to leak.',
      'It runs on `pnpm dev` right now, with no NetSuite account and no credentials, against built-in fixtures. Provision the account later. Endpoints resolve at runtime, so one build ships to every account without a rebuild, and `pnpm ns:push` uploads only what changed.',
      'Lite is the whole architecture, not a crippled demo. Everything in it works, is tested, and is yours to ship.',
    ],
    features: [
      'Suitelet-served React app, same-origin with the NetSuite session',
      'Endpoint discovery and a typed client',
      'Both deploy modes, with a generated SDF project',
      'Offline mock mode and a single `pnpm check` gate',
      'End-to-end and unit tests that run without a NetSuite account',
      'No session store to run — the NetSuite session cookie is the session',
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
    price: 499,
    githubRepo: `${ORG}/warekit-react-netsuite`,
    order: 2,
    featured: false,
    // Draft on purpose: this repository does not exist yet, so there is
    // nothing an invitation could be sent to.
    status: 'draft',
    tagline:
      'Everything in Lite, plus what a commercial SuiteApp needs once you are selling it into other people’s accounts.',
    description: [
      'The parts that are specific to distributing software on NetSuite, and the parts that take months to get right: licensing and entitlement, role mapping, a typed data layer, a schema generator, the bundle pipeline and an admin center.',
      'In development. The repository does not exist yet, so this stays a draft until it does.',
    ],
    features: [
      'Licensing and entitlement — key validation, seat metering, per-account activation',
      'Role mapping — NetSuite roles to app permissions, role-aware routing',
      'Data layer — typed record CRUD, saved-search runner, governance-aware paging',
      'Schema generator — typed definitions to SDF objects, with migrations',
      'Bundle pipeline — packaging and publishing to customer accounts',
      'Admin center — a SuiteApp tab for configuration and licence state',
      'Observability — script log shipping, error tracking, governance telemetry',
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
    githubRepo: `${ORG}/warekit-next-netsuite-lite`,
    order: 3,
    featured: true,
    status: 'published',
    tagline:
      'Build Next.js apps that talk to NetSuite. Hosted on Vercel, authenticated over OAuth 2, with the SuiteScript half deployed by SDF.',
    description: [
      'The hybrid kit: a Next.js App Router frontend on Vercel that reaches NetSuite from its API routes — OAuth 2 for user sign-in, token-based auth for server-to-server calls — rather than running inside a Suitelet on the session cookie.',
      'It runs on `pnpm dev` with no NetSuite account and no credentials, against built-in fixtures. NetSuite rejects http:// redirect URIs, so sign-in is the one flow that needs a tunnel; `pnpm dev:tunnel` starts one, prints the callback to paste into the integration record, and points AUTH_URL at it.',
      'Lite keeps sessions in Postgres. That works, and on Vercel it means one more service to provision and pay for — which is the line Pro moves.',
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
    price: 499,
    githubRepo: `${ORG}/warekit-next-netsuite`,
    order: 4,
    featured: false,
    status: 'published',
    tagline:
      'The hybrid kit with sessions in NetSuite instead of Postgres — one less service to provision, and a concurrency budget that survives real traffic.',
    description: [
      'The same architecture as Lite, with session reads moved into a NetSuite custom record behind a single-purpose RESTlet. The record is the easy part. The reason it is Pro is the concurrency budget: NetSuite governs concurrent requests at the account level across every RESTlet and web services call, so a naive session read per HTTP request saturates it and starts returning 429s.',
      'Pro answers that with a per-instance cache, in-flight collapsing and N/cache, so session reads stop being a per-request cost.',
      'Session storage is the first Pro feature to land. Licensing, role mapping, the data layer, the schema generator and observability are roadmap, and the repository says so rather than implying otherwise.',
    ],
    features: [
      'Everything in the Lite edition',
      'Session storage backed by a NetSuite custom record, not Postgres',
      'Concurrency-aware session reads — per-instance cache, in-flight collapsing, `N/cache`',
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
    })
  }

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

  /* Every kit must name a repository. Without one the confirmation email
     promises an invitation with no address to send it to, which is the
     failure this whole column exists to prevent. */
  it('no boilerplate is published without a repository to invite people to', async () => {
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
    const orphans = docs.filter((d) => !d.githubRepo)
    if (orphans.length) {
      console.log(
        'published boilerplates with no githubRepo:',
        orphans.map((d) => `${d.id}:${d.slug}`).join(', ')
      )
    }
    expect(orphans.map((d) => d.slug)).toEqual([])
  })
})
