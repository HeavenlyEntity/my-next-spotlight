# Payload CMS Integration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a Payload CMS backend (admin + API + 5 collections) embedded in this Next.js app, backed by Supabase Postgres/Storage and Resend, with zero public-facing change except a rebuilt native contact form.

**Architecture:** Payload 3 mounts as an App Router route group (`src/app/(payload)`) coexisting with the existing Pages Router site. Content lives in Supabase Postgres; media in Supabase Storage (S3 adapter). A native contact form posts to Payload's REST API, which fires Resend emails via an `afterChange` hook. TypeScript is added additively (`allowJs`) so existing `.jsx` is untouched.

**Tech Stack:** Next.js 15, React 19, Payload 3, `@payloadcms/db-postgres`, `@payloadcms/storage-s3`, `@payloadcms/richtext-lexical`, Resend, Supabase (Postgres + Storage), pnpm, TypeScript (additive), tsx.

**Reference spec:** `docs/superpowers/specs/2026-06-03-payload-cms-integration-design.md`

---

## File Structure

| File | Responsibility |
|---|---|
| `tsconfig.json` (create) | Additive TS config; `@/*` + `@payload-config` aliases; `allowJs` |
| `jsconfig.json` (delete) | Superseded by tsconfig |
| `next.config.mjs` (modify) | Compose `withPayload(withMDX(...))`; add `ts`/`tsx` to `pageExtensions` |
| `package.json` (modify) | Deps + `payload` / `generate:types` / `seed:articles` scripts |
| `.env.example` (modify) | Document new env vars |
| `src/payload.config.ts` (create) | Central Payload config: db, storage, collections |
| `src/collections/Users.ts` (create) | Admin auth collection |
| `src/collections/Media.ts` (create) | Upload collection → Supabase Storage |
| `src/collections/Articles.ts` (create) | Article content model (mirrors MDX meta) |
| `src/collections/Projects.ts` (create) | Portfolio projects model |
| `src/collections/ContactSubmissions.ts` (create) | Contact submissions + Resend `afterChange` hook |
| `src/lib/resend.ts` (create) | Resend email helper (owner notice + submitter thank-you) |
| `src/app/(payload)/layout.tsx` (create) | Payload admin root layout |
| `src/app/(payload)/admin/[[...segments]]/page.tsx` (create) | Admin UI catch-all |
| `src/app/(payload)/admin/[[...segments]]/not-found.tsx` (create) | Admin not-found |
| `src/app/(payload)/admin/importMap.js` (create) | Payload import map (generated) |
| `src/app/(payload)/api/[...slug]/route.ts` (create) | REST API |
| `src/app/(payload)/api/graphql/route.ts` (create) | GraphQL API |
| `src/app/(payload)/api/graphql-playground/route.ts` (create) | GraphQL playground |
| `src/payload-types.ts` (generated) | Generated TS types |
| `scripts/seed-articles.ts` (create) | One-off MDX-meta → Articles import |
| `src/pages/contact.jsx` (modify) | Iframe → native form (built with frontend-design skill) |

---

## Task 1: Provision external services (manual, user-performed)

These cannot be automated — they produce the secrets every later task needs. Fill real values into `.env.local` (gitignored). No commit.

- [ ] **Step 1: Supabase Postgres**
  - In the Supabase project → Settings → Database → Connection string → **Session pooler** (port 5432). Copy it; this becomes `DATABASE_URI`. Ensure it ends with `?sslmode=require`.

- [ ] **Step 2: Supabase Storage bucket + S3 keys**
  - Create a public Storage bucket named `media`.
  - Settings → Storage → S3 connection: copy the **Endpoint**, **Region**, and generate **Access key**/**Secret key**.

- [ ] **Step 3: Resend**
  - Confirm the `amware.dev` domain is verified in Resend. Create an API key → `RESEND_API_KEY`.
  - Choose a from address on that domain, e.g. `Amware <hello@amware.dev>` → `RESEND_FROM`.
  - Decide the owner notification address → `CONTACT_NOTIFY_TO` (e.g. `amware.develop@gmail.com`).

- [ ] **Step 4: Generate a Payload secret**

  Run: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`
  Put the output in `.env.local` as `PAYLOAD_SECRET`.

- [ ] **Step 5: Write `.env.local`** (gitignored — values are illustrative)

```bash
# existing
NEXT_PUBLIC_SITE_URL=https://amware.dev
# payload
DATABASE_URI=postgres://postgres.<ref>:<pwd>@aws-0-<region>.pooler.supabase.com:5432/postgres?sslmode=require
PAYLOAD_SECRET=<64-hex-chars>
# supabase storage (S3)
S3_BUCKET=media
S3_REGION=<region>
S3_ENDPOINT=https://<ref>.supabase.co/storage/v1/s3
S3_ACCESS_KEY_ID=<key>
S3_SECRET_ACCESS_KEY=<secret>
# resend
RESEND_API_KEY=<key>
RESEND_FROM=Amware <hello@amware.dev>
CONTACT_NOTIFY_TO=amware.develop@gmail.com
```

---

## Task 2: Add additive TypeScript support

**Files:**
- Create: `tsconfig.json`
- Delete: `jsconfig.json`

- [ ] **Step 1: Install TypeScript toolchain**

Run: `pnpm add -D typescript @types/react @types/react-dom @types/node`
Expected: packages added to `devDependencies`.

- [ ] **Step 2: Create `tsconfig.json`**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "checkJs": false,
    "skipLibCheck": true,
    "strict": false,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [{ "name": "next" }],
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"],
      "@payload-config": ["./src/payload.config.ts"]
    }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

> `checkJs: false` + `strict: false` ensures existing `.jsx` is **not** type-checked — additive only.

- [ ] **Step 3: Delete `jsconfig.json`**

Run: `git rm jsconfig.json`
Expected: file removed (path alias now lives in `tsconfig.json`).

- [ ] **Step 4: Verify the existing site still builds**

Run: `pnpm build`
Expected: build succeeds; Next generates `next-env.d.ts`. Existing pages compile unchanged.

- [ ] **Step 5: Commit**

```bash
git add tsconfig.json next-env.d.ts package.json pnpm-lock.yaml
git rm jsconfig.json
git commit -m "chore: add additive TypeScript support (allowJs), retire jsconfig"
```

---

## Task 3: Install Payload dependencies and scripts

**Files:**
- Modify: `package.json`
- Modify: `.env.example`

- [ ] **Step 1: Install runtime deps**

Run:
```bash
pnpm add payload @payloadcms/next @payloadcms/db-postgres @payloadcms/richtext-lexical @payloadcms/storage-s3 resend sharp graphql
```
Expected: packages added to `dependencies`.

- [ ] **Step 2: Install seed-runner dev dep**

Run: `pnpm add -D tsx`
Expected: `tsx` in `devDependencies`.

- [ ] **Step 3: Add scripts to `package.json`** (inside `"scripts"`)

```json
"payload": "payload",
"generate:types": "payload generate:types",
"generate:importmap": "payload generate:importmap",
"seed:articles": "tsx --env-file=.env.local scripts/seed-articles.ts"
```

- [ ] **Step 4: Document env vars in `.env.example`**

```bash
NEXT_PUBLIC_SITE_URL=https://example.com

# Payload / Supabase Postgres
DATABASE_URI=
PAYLOAD_SECRET=

# Supabase Storage (S3-compatible) for media
S3_BUCKET=
S3_REGION=
S3_ENDPOINT=
S3_ACCESS_KEY_ID=
S3_SECRET_ACCESS_KEY=

# Resend (contact notifications)
RESEND_API_KEY=
RESEND_FROM=Amware <hello@amware.dev>
CONTACT_NOTIFY_TO=
```

- [ ] **Step 5: Commit**

```bash
git add package.json pnpm-lock.yaml .env.example
git commit -m "chore: install Payload, Resend, tsx deps and add CMS scripts"
```

---

## Task 4: Compose next.config.mjs with Payload

**Files:**
- Modify: `next.config.mjs`

- [ ] **Step 1: Rewrite `next.config.mjs`**

```js
import nextMDX from '@next/mdx'
import { withPayload } from '@payloadcms/next/withPayload'

/** @type {import('next').NextConfig} */
const nextConfig = {
  pageExtensions: ['js', 'jsx', 'ts', 'tsx', 'mdx'],
  reactStrictMode: true,
  experimental: {
    scrollRestoration: true,
  },
}

const withMDX = nextMDX({
  extension: /\.mdx?$/,
  options: {
    remarkPlugins: ['remark-gfm'],
    rehypePlugins: ['@mapbox/rehype-prism'],
  },
})

export default withPayload(withMDX(nextConfig))
```

- [ ] **Step 2: Verify config parses**

Run: `node --input-type=module -e "import('./next.config.mjs').then(()=>console.log('ok'))"`
Expected: prints `ok` (no import/syntax error). If `withPayload` errors on a missing config, that's fine — it resolves once `payload.config.ts` exists in Task 6.

- [ ] **Step 3: Commit**

```bash
git add next.config.mjs
git commit -m "feat: compose Next config with withPayload and ts/tsx pageExtensions"
```

---

## Task 5: Create Users and Media collections

**Files:**
- Create: `src/collections/Users.ts`
- Create: `src/collections/Media.ts`

- [ ] **Step 1: Create `src/collections/Users.ts`**

```ts
import type { CollectionConfig } from 'payload'

export const Users: CollectionConfig = {
  slug: 'users',
  auth: true,
  admin: {
    useAsTitle: 'email',
  },
  fields: [],
}
```

- [ ] **Step 2: Create `src/collections/Media.ts`**

```ts
import type { CollectionConfig } from 'payload'

export const Media: CollectionConfig = {
  slug: 'media',
  access: {
    read: () => true,
  },
  upload: true,
  fields: [
    {
      name: 'alt',
      type: 'text',
    },
  ],
}
```

- [ ] **Step 3: Commit**

```bash
git add src/collections/Users.ts src/collections/Media.ts
git commit -m "feat: add Users (auth) and Media (upload) collections"
```

---

## Task 6: Create payload.config.ts (Postgres + S3 storage)

**Files:**
- Create: `src/payload.config.ts`

- [ ] **Step 1: Create `src/payload.config.ts`**

```ts
import path from 'path'
import { fileURLToPath } from 'url'
import { buildConfig } from 'payload'
import { postgresAdapter } from '@payloadcms/db-postgres'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import { s3Storage } from '@payloadcms/storage-s3'
import sharp from 'sharp'

import { Users } from './collections/Users'
import { Media } from './collections/Media'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

export default buildConfig({
  admin: {
    user: Users.slug,
  },
  collections: [Users, Media],
  editor: lexicalEditor(),
  secret: process.env.PAYLOAD_SECRET || '',
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
  db: postgresAdapter({
    pool: {
      connectionString: process.env.DATABASE_URI || '',
    },
  }),
  sharp,
  plugins: [
    s3Storage({
      collections: {
        media: true,
      },
      bucket: process.env.S3_BUCKET || '',
      config: {
        endpoint: process.env.S3_ENDPOINT,
        region: process.env.S3_REGION,
        forcePathStyle: true,
        credentials: {
          accessKeyId: process.env.S3_ACCESS_KEY_ID || '',
          secretAccessKey: process.env.S3_SECRET_ACCESS_KEY || '',
        },
      },
    }),
  ],
})
```

> `forcePathStyle: true` is required for Supabase's S3 endpoint.

- [ ] **Step 2: Generate Payload types (also validates the config + DB connection)**

Run: `pnpm generate:types`
Expected: creates `src/payload-types.ts` with `User` and `Media` interfaces. Requires `DATABASE_URI` + `PAYLOAD_SECRET` from Task 1.

- [ ] **Step 3: Commit**

```bash
git add src/payload.config.ts src/payload-types.ts
git commit -m "feat: add Payload config with Postgres adapter and Supabase S3 storage"
```

---

## Task 7: Scaffold the (payload) App Router route group

**Files:**
- Create: `src/app/(payload)/layout.tsx`
- Create: `src/app/(payload)/admin/[[...segments]]/page.tsx`
- Create: `src/app/(payload)/admin/[[...segments]]/not-found.tsx`
- Create: `src/app/(payload)/admin/importMap.js`
- Create: `src/app/(payload)/api/[...slug]/route.ts`
- Create: `src/app/(payload)/api/graphql/route.ts`
- Create: `src/app/(payload)/api/graphql-playground/route.ts`

- [ ] **Step 1: Create `src/app/(payload)/admin/importMap.js`**

```js
export const importMap = {}
```

- [ ] **Step 2: Create `src/app/(payload)/layout.tsx`**

```tsx
import type { ServerFunctionClient } from 'payload'
import config from '@payload-config'
import '@payloadcms/next/css'
import { RootLayout, handleServerFunctions } from '@payloadcms/next/layouts'
import React from 'react'

import { importMap } from './admin/importMap.js'

type Args = {
  children: React.ReactNode
}

const serverFunction: ServerFunctionClient = async function (args) {
  'use server'
  return handleServerFunctions({
    ...args,
    config,
    importMap,
  })
}

const Layout = ({ children }: Args) => (
  <RootLayout config={config} importMap={importMap} serverFunction={serverFunction}>
    {children}
  </RootLayout>
)

export default Layout
```

- [ ] **Step 3: Create `src/app/(payload)/admin/[[...segments]]/page.tsx`**

```tsx
import type { Metadata } from 'next'
import config from '@payload-config'
import { generatePageMetadata, RootPage } from '@payloadcms/next/views'

import { importMap } from '../importMap.js'

type Args = {
  params: Promise<{ segments: string[] }>
  searchParams: Promise<{ [key: string]: string | string[] }>
}

export const generateMetadata = ({ params, searchParams }: Args): Promise<Metadata> =>
  generatePageMetadata({ config, params, searchParams })

const Page = ({ params, searchParams }: Args) =>
  RootPage({ config, params, searchParams, importMap })

export default Page
```

- [ ] **Step 4: Create `src/app/(payload)/admin/[[...segments]]/not-found.tsx`**

```tsx
import type { Metadata } from 'next'
import config from '@payload-config'
import { generatePageMetadata, NotFoundPage } from '@payloadcms/next/views'

import { importMap } from '../importMap.js'

type Args = {
  params: Promise<{ segments: string[] }>
  searchParams: Promise<{ [key: string]: string | string[] }>
}

export const generateMetadata = ({ params, searchParams }: Args): Promise<Metadata> =>
  generatePageMetadata({ config, params, searchParams })

const NotFound = ({ params, searchParams }: Args) =>
  NotFoundPage({ config, params, searchParams, importMap })

export default NotFound
```

- [ ] **Step 5: Create `src/app/(payload)/api/[...slug]/route.ts`**

```ts
import config from '@payload-config'
import {
  REST_DELETE,
  REST_GET,
  REST_OPTIONS,
  REST_PATCH,
  REST_POST,
  REST_PUT,
} from '@payloadcms/next/routes'

export const GET = REST_GET(config)
export const POST = REST_POST(config)
export const DELETE = REST_DELETE(config)
export const PATCH = REST_PATCH(config)
export const PUT = REST_PUT(config)
export const OPTIONS = REST_OPTIONS(config)
```

- [ ] **Step 6: Create `src/app/(payload)/api/graphql/route.ts`**

```ts
import config from '@payload-config'
import { GRAPHQL_POST, GRAPHQL_OPTIONS } from '@payloadcms/next/routes'

export const POST = GRAPHQL_POST(config)
export const OPTIONS = GRAPHQL_OPTIONS(config)
```

- [ ] **Step 7: Create `src/app/(payload)/api/graphql-playground/route.ts`**

```ts
import config from '@payload-config'
import { GRAPHQL_PLAYGROUND_GET } from '@payloadcms/next/routes'

export const GET = GRAPHQL_PLAYGROUND_GET(config)
```

- [ ] **Step 8: Populate the import map**

Run: `pnpm generate:importmap`
Expected: rewrites `src/app/(payload)/admin/importMap.js` with Payload's component imports.

- [ ] **Step 9: Verify build with Payload routes**

Run: `pnpm build`
Expected: build succeeds and lists `/admin/[[...segments]]` and `/api/[...slug]` routes alongside the existing Pages routes.

- [ ] **Step 10: Smoke-test the admin (manual)**

Run: `pnpm dev` (user runs this — never auto-start a dev server). Visit `http://localhost:3000/admin`, create the first user, confirm login. Verify the existing public pages (`/`, `/about`, `/articles`, `/projects`) render identically. Stop the dev server.

- [ ] **Step 11: Commit**

```bash
git add "src/app/(payload)"
git commit -m "feat: scaffold Payload admin + REST/GraphQL route group"
```

---

## Task 8: Add Articles collection

**Files:**
- Create: `src/collections/Articles.ts`
- Modify: `src/payload.config.ts`

- [ ] **Step 1: Create `src/collections/Articles.ts`**

```ts
import type { CollectionConfig } from 'payload'

export const Articles: CollectionConfig = {
  slug: 'articles',
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'slug', 'status', 'publishedDate'],
  },
  access: {
    read: () => true,
  },
  fields: [
    { name: 'title', type: 'text', required: true },
    { name: 'slug', type: 'text', required: true, unique: true, index: true },
    { name: 'publishedDate', type: 'date', required: true },
    { name: 'author', type: 'text', defaultValue: 'Alec Mingione' },
    { name: 'description', type: 'textarea' },
    {
      name: 'keywords',
      type: 'array',
      labels: { singular: 'Keyword', plural: 'Keywords' },
      fields: [{ name: 'keyword', type: 'text', required: true }],
    },
    { name: 'canonical', type: 'text' },
    { name: 'ogImage', type: 'upload', relationTo: 'media' },
    { name: 'content', type: 'richText' },
    { name: 'mdxSlug', type: 'text', admin: { description: 'Links this entry to its file-based MDX article.' } },
    {
      name: 'status',
      type: 'select',
      options: [
        { label: 'Draft', value: 'draft' },
        { label: 'Published', value: 'published' },
      ],
      defaultValue: 'draft',
      admin: { position: 'sidebar' },
    },
  ],
}
```

- [ ] **Step 2: Register it in `src/payload.config.ts`**

Add the import near the other collection imports:
```ts
import { Articles } from './collections/Articles'
```
Update the `collections` array:
```ts
collections: [Users, Media, Articles],
```

- [ ] **Step 3: Regenerate types**

Run: `pnpm generate:types`
Expected: `src/payload-types.ts` now includes an `Article` interface.

- [ ] **Step 4: Verify build**

Run: `pnpm build`
Expected: build succeeds.

- [ ] **Step 5: Commit**

```bash
git add src/collections/Articles.ts src/payload.config.ts src/payload-types.ts
git commit -m "feat: add Articles collection mirroring MDX meta"
```

---

## Task 9: Add Projects collection

**Files:**
- Create: `src/collections/Projects.ts`
- Modify: `src/payload.config.ts`

- [ ] **Step 1: Create `src/collections/Projects.ts`**

```ts
import type { CollectionConfig } from 'payload'

export const Projects: CollectionConfig = {
  slug: 'projects',
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'order'],
  },
  access: {
    read: () => true,
  },
  fields: [
    { name: 'name', type: 'text', required: true },
    { name: 'description', type: 'textarea' },
    {
      name: 'link',
      type: 'group',
      fields: [
        { name: 'url', type: 'text' },
        { name: 'label', type: 'text' },
      ],
    },
    { name: 'logo', type: 'upload', relationTo: 'media' },
    { name: 'order', type: 'number', defaultValue: 0 },
  ],
}
```

- [ ] **Step 2: Register it in `src/payload.config.ts`**

Add import:
```ts
import { Projects } from './collections/Projects'
```
Update array:
```ts
collections: [Users, Media, Articles, Projects],
```

- [ ] **Step 3: Regenerate types**

Run: `pnpm generate:types`
Expected: `Project` interface added.

- [ ] **Step 4: Verify build**

Run: `pnpm build`
Expected: build succeeds.

- [ ] **Step 5: Commit**

```bash
git add src/collections/Projects.ts src/payload.config.ts src/payload-types.ts
git commit -m "feat: add Projects collection"
```

---

## Task 10: Add Resend helper + ContactSubmissions collection

**Files:**
- Create: `src/lib/resend.ts`
- Create: `src/collections/ContactSubmissions.ts`
- Modify: `src/payload.config.ts`

- [ ] **Step 1: Create `src/lib/resend.ts`**

```ts
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY || '')

export type ContactSubmission = {
  name: string
  email: string
  subject?: string
  message: string
}

export async function sendContactEmails(submission: ContactSubmission): Promise<void> {
  const from = process.env.RESEND_FROM || 'Amware <hello@amware.dev>'
  const notifyTo = process.env.CONTACT_NOTIFY_TO

  if (notifyTo) {
    await resend.emails.send({
      from,
      to: notifyTo,
      replyTo: submission.email,
      subject: `New contact submission: ${submission.subject || '(no subject)'}`,
      text: `Name: ${submission.name}\nEmail: ${submission.email}\n\n${submission.message}`,
    })
  }

  await resend.emails.send({
    from,
    to: submission.email,
    subject: 'Thanks for reaching out',
    text: `Hi ${submission.name},\n\nThanks for getting in touch — I received your message and will get back to you soon.\n\n— Alec`,
  })
}
```

- [ ] **Step 2: Create `src/collections/ContactSubmissions.ts`**

```ts
import type { CollectionConfig } from 'payload'

import { sendContactEmails } from '../lib/resend'

export const ContactSubmissions: CollectionConfig = {
  slug: 'contact-submissions',
  admin: {
    useAsTitle: 'email',
    defaultColumns: ['name', 'email', 'subject', 'status', 'createdAt'],
  },
  access: {
    create: () => true,
    read: ({ req }) => Boolean(req.user),
    update: ({ req }) => Boolean(req.user),
    delete: ({ req }) => Boolean(req.user),
  },
  fields: [
    { name: 'name', type: 'text', required: true },
    { name: 'email', type: 'email', required: true },
    { name: 'subject', type: 'text' },
    { name: 'message', type: 'textarea', required: true },
    {
      name: 'status',
      type: 'select',
      options: [
        { label: 'New', value: 'new' },
        { label: 'Read', value: 'read' },
        { label: 'Archived', value: 'archived' },
      ],
      defaultValue: 'new',
      admin: { position: 'sidebar' },
    },
  ],
  hooks: {
    afterChange: [
      async ({ doc, operation }) => {
        if (operation === 'create') {
          try {
            await sendContactEmails({
              name: doc.name,
              email: doc.email,
              subject: doc.subject,
              message: doc.message,
            })
          } catch (err) {
            console.error('Resend contact emails failed:', err)
          }
        }
        return doc
      },
    ],
  },
}
```

> The hook catches and logs Resend failures so they never block the submission write or the user's redirect.

- [ ] **Step 3: Register it in `src/payload.config.ts`**

Add import:
```ts
import { ContactSubmissions } from './collections/ContactSubmissions'
```
Update array:
```ts
collections: [Users, Media, Articles, Projects, ContactSubmissions],
```

- [ ] **Step 4: Regenerate types**

Run: `pnpm generate:types`
Expected: `ContactSubmission` interface added.

- [ ] **Step 5: Verify build**

Run: `pnpm build`
Expected: build succeeds.

- [ ] **Step 6: Commit**

```bash
git add src/lib/resend.ts src/collections/ContactSubmissions.ts src/payload.config.ts src/payload-types.ts
git commit -m "feat: add ContactSubmissions collection with Resend afterChange hook"
```

---

## Task 11: Seed existing MDX articles into the CMS

**Files:**
- Create: `scripts/seed-articles.ts`

- [ ] **Step 1: Create `scripts/seed-articles.ts`**

```ts
import { getPayload } from 'payload'
import glob from 'fast-glob'
import { readFileSync } from 'fs'
import path from 'path'

import config from '../src/payload.config'

async function run() {
  const payload = await getPayload({ config })
  const dir = path.join(process.cwd(), 'src/pages/articles')
  const files = await glob(['*.mdx', '*/index.mdx'], { cwd: dir })

  for (const file of files) {
    const src = readFileSync(path.join(dir, file), 'utf8')
    const match = src.match(/export const meta = (\{[\s\S]*?\n\})/)
    if (!match) {
      console.warn(`No meta found in ${file}; skipping`)
      continue
    }
    // Files are trusted (our own content); meta is a plain object literal.
    // eslint-disable-next-line no-new-func
    const meta = new Function(`return (${match[1]})`)() as {
      title: string
      date: string
      author?: string
      description?: string
      keywords?: string[] | string
      canonical?: string
    }

    const slug = file.replace(/(\/index)?\.mdx$/, '')

    const keywords = Array.isArray(meta.keywords)
      ? meta.keywords.map((k) => ({ keyword: k }))
      : typeof meta.keywords === 'string'
        ? meta.keywords.split(',').map((k) => ({ keyword: k.trim() }))
        : []

    const data = {
      title: meta.title,
      slug,
      publishedDate: meta.date,
      author: meta.author || 'Alec Mingione',
      description: meta.description,
      keywords,
      canonical: meta.canonical,
      mdxSlug: slug,
      status: 'published' as const,
    }

    const existing = await payload.find({
      collection: 'articles',
      where: { slug: { equals: slug } },
      limit: 1,
    })

    if (existing.docs.length) {
      await payload.update({ collection: 'articles', id: existing.docs[0].id, data })
      console.log(`Updated: ${slug}`)
    } else {
      await payload.create({ collection: 'articles', data })
      console.log(`Created: ${slug}`)
    }
  }

  process.exit(0)
}

run().catch((err) => {
  console.error(err)
  process.exit(1)
})
```

> The regex extracts the `meta` object literal so the script never needs to compile/run MDX/JSX. Idempotent on `slug`.

- [ ] **Step 2: Run the seed**

Run: `pnpm seed:articles`
Expected: prints `Created: ...` for each of the 4 MDX articles (`neatsuite-http`, `setting-up-alpinejs-in-suitescript`, `introducing-custom-modules-for-netsuite-suitescript`, `suitecloud-monorepo-support-pr-865`). Re-running prints `Updated:`.

- [ ] **Step 3: Verify in admin (manual)**

Start `pnpm dev` (user-run), open `/admin/collections/articles`, confirm 4 entries with correct titles/dates/keywords. Stop the server.

- [ ] **Step 4: Commit**

```bash
git add scripts/seed-articles.ts
git commit -m "feat: add idempotent seed script importing MDX meta into Articles"
```

---

## Task 12: Replace contact iframe with native form (frontend-design skill)

**Files:**
- Modify: `src/pages/contact.jsx`

This is the single intentional front-facing change. **Invoke the `frontend-design:frontend-design` skill** to build the form's markup/styling so it matches the existing card container and the site's aesthetic.

- [ ] **Step 1: Invoke the frontend-design skill**

Use the `frontend-design:frontend-design` skill with this brief: a contact form inside the existing `SimpleLayout` (`title="Get in touch"`, same intro), wrapped in the existing card container styling `rounded-3xl ring-1 ring-zinc-200 dark:ring-zinc-700`. Fields: **Name**, **Email**, **Subject**, **Message** (textarea), plus a submit button. Match the zinc palette and dark-mode treatment used across the site. Keep it a client-side form in this Pages Router page.

- [ ] **Step 2: Wire submission to Payload + redirect** — the page must implement this exact behavior regardless of visual styling

```jsx
import Head from 'next/head'
import { useState } from 'react'
import { useRouter } from 'next/router'
import { SimpleLayout } from '@/components/SimpleLayout'

export default function Contact() {
  const router = useRouter()
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)

  async function handleSubmit(event) {
    event.preventDefault()
    setSubmitting(true)
    setError(null)

    const form = new FormData(event.currentTarget)
    const payload = {
      name: form.get('name'),
      email: form.get('email'),
      subject: form.get('subject'),
      message: form.get('message'),
    }

    try {
      const res = await fetch('/api/contact-submissions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (!res.ok) throw new Error('Submission failed')
      router.push('/thank-you')
    } catch (err) {
      setError('Something went wrong. Please try again.')
      setSubmitting(false)
    }
  }

  return (
    <>
      <Head>
        <title>Contact - Alec Mingione</title>
        <meta
          name="description"
          content="Have a question or proposal? Use the form to get in touch."
        />
      </Head>

      <SimpleLayout
        title="Get in touch"
        intro="Have a question, proposal, or just want to say hello? Fill out the form below and I'll get back to you."
      >
        {/* frontend-design skill provides the styled form markup below.
            It MUST: use onSubmit={handleSubmit}, input names name/email/subject/message,
            disable the submit button while `submitting`, and render `error` when set. */}
        <form onSubmit={handleSubmit} className="...">
          {/* fields: name, email, subject, message + submit */}
        </form>
      </SimpleLayout>
    </>
  )
}
```

> POST target is `/api/contact-submissions` (Payload REST create for the `contact-submissions` slug). Payload accepts the JSON body and runs the `afterChange` hook.

- [ ] **Step 3: Build check**

Run: `pnpm build`
Expected: build succeeds.

- [ ] **Step 4: End-to-end smoke test (manual)**

Start `pnpm dev` (user-run). Submit the form with a real test email. Verify: (a) redirect to `/thank-you`; (b) a new row in `/admin/collections/contact-submissions`; (c) owner notification email arrives at `CONTACT_NOTIFY_TO`; (d) thank-you email arrives at the submitter address. Stop the server.

- [ ] **Step 5: Commit**

```bash
git add src/pages/contact.jsx
git commit -m "feat: replace Deftform iframe with native contact form posting to Payload"
```

---

## Task 13: Final verification

- [ ] **Step 1: Lint**

Run: `pnpm lint`
Expected: passes (no new errors).

- [ ] **Step 2: Format changed files**

Run: `npx prettier --write src/payload.config.ts "src/collections/**/*.ts" src/lib/resend.ts "src/app/(payload)/**/*.{ts,tsx}" scripts/seed-articles.ts src/pages/contact.jsx`
Expected: files formatted.

- [ ] **Step 3: Production build**

Run: `pnpm build`
Expected: succeeds; route list shows existing Pages routes unchanged plus `/admin` and `/api/*`.

- [ ] **Step 4: Visual parity check (manual)**

Start `pnpm dev` (user-run). Confirm `/`, `/about`, `/articles`, an article page, `/projects`, `/uses`, `/speaking`, `/thank-you` render identically to before. Confirm `/contact` shows the new native form. Stop the server.

- [ ] **Step 5: Code quality review**

Run the code quality reviewer agent over all created/modified files.

- [ ] **Step 6: Commit any review fixes**

```bash
git add -A
git commit -m "chore: address code review for Payload integration"
```

---

## Self-Review Notes (spec coverage)

- Embedded App Router topology → Tasks 4, 7 ✓
- Additive TypeScript → Task 2 ✓
- Postgres (Supabase) adapter → Task 6 ✓
- Supabase Storage (S3) for Media → Tasks 5, 6 ✓
- Collections: Users, Media, Articles, Projects, ContactSubmissions → Tasks 5, 8, 9, 10 ✓
- Articles still render from MDX (no page wired to Payload) → confirmed by omission; only `contact.jsx` changes ✓
- `keywords` as CMS array for SEO → Task 8 ✓
- Native contact form via frontend-design → Task 12 ✓
- Resend owner notice + submitter thank-you via afterChange hook → Task 10 ✓
- Resend sender on verified `amware.dev` → Tasks 1, 3, 10 ✓
- Seed 4 MDX articles → Task 11 ✓
- Verification (lint, prettier, build, quality review) → Task 13 ✓
```
