# Phase B1 — Content Collections + App Router Rendering — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add CMS-managed Products, Courses (+Lessons), Services, and a Payload-authored blog, rendered into the public site via App Router server components reading Payload's Local API — leaving the existing Pages Router site and MDX articles untouched.

**Architecture:** A new `src/app/(site)/` route group (a *second App Router root layout* via route groups — it renders its own `<html><body>`, sibling to `(payload)`). Server components fetch through a cached `getPayloadClient()` singleton (Local API, no HTTP). Lexical bodies render with `@payloadcms/richtext-lexical/react`'s `RichText`. New blog posts live at `/blog` because Next forbids App + Pages Router both owning `/articles`.

**Tech Stack:** Next.js 15 (hybrid Pages + App Router), React 19, Payload 3.85, `@payloadcms/db-postgres`, `@payloadcms/richtext-lexical`, Tailwind v4, TypeScript (additive).

**Reference spec:** `docs/superpowers/specs/2026-06-07-payload-content-rendering-b1-design.md`

> **Testing note:** This repo has no unit-test framework (see `AGENTS.md`). Per the established foundation-plan pattern, each task is verified with `npx tsc --noEmit`, `pnpm build`, `pnpm lint`, `npx prettier --write`, and manual `/admin` checks (the user runs `pnpm dev` — never auto-start a dev server). `pnpm generate:types` / `pnpm build` require `DATABASE_URI` + `PAYLOAD_SECRET` in `.env.local`.

---

## File Structure

| File | Responsibility |
|---|---|
| `src/lib/getPayloadClient.ts` (create) | Cached `getPayload({config})` singleton for server components |
| `src/collections/Products.ts` (create) | Products collection (boilerplates = `type:'boilerplate'`) |
| `src/collections/Courses.ts` (create) | Courses collection |
| `src/collections/Lessons.ts` (create) | Lessons collection (relationship → courses) |
| `src/collections/Services.ts` (create) | Services collection |
| `src/collections/Articles.ts` (modify) | Add optional `coverImage` upload field |
| `src/payload.config.ts` (modify) | Register the 4 new collections |
| `src/payload-types.ts` (generated) | Regenerated types |
| `src/components/site/RichText.tsx` (create) | Lexical → React render wrapper |
| `src/components/site/SiteModeToggle.tsx` (create) | Self-contained dark-mode toggle for `(site)` |
| `src/components/site/SiteHeader.tsx` (create) | Client header: avatar + PillNav + toggle |
| `src/components/site/SiteFooter.tsx` (create) | Client footer wrapper |
| `src/components/site/SiteShell.tsx` (create) | `'use client'` shell composing header/footer around children |
| `src/components/site/ThemeScript.tsx` (create) | Inline no-flash dark-mode init script |
| `src/app/(site)/layout.tsx` (create) | **Root** layout for `(site)`: `<html><body>`, fonts, CSS, shell |
| `src/app/(site)/products/page.tsx` (create) | Products listing |
| `src/app/(site)/products/[slug]/page.tsx` (create) | Product detail |
| `src/app/(site)/products/[slug]/not-found.tsx` (create) | Product 404 |
| `src/app/(site)/courses/page.tsx` (create) | Courses listing |
| `src/app/(site)/courses/[slug]/page.tsx` (create) | Course detail (lessons grouped by module) |
| `src/app/(site)/courses/[slug]/not-found.tsx` (create) | Course 404 |
| `src/app/(site)/services/page.tsx` (create) | Services listing |
| `src/app/(site)/blog/page.tsx` (create) | Payload-authored blog listing |
| `src/app/(site)/blog/[slug]/page.tsx` (create) | Blog post detail |
| `src/app/(site)/blog/[slug]/not-found.tsx` (create) | Blog 404 |

---

## Task 1: Cached Payload client singleton

**Files:**
- Create: `src/lib/getPayloadClient.ts`

- [ ] **Step 1: Create `src/lib/getPayloadClient.ts`**

```ts
import { getPayload, type Payload } from 'payload'
import config from '@payload-config'

// Cache the Payload instance on globalThis so the Postgres pool is reused
// across requests (and across HMR reloads in dev).
type PayloadCache = {
  client: Payload | null
  promise: Promise<Payload> | null
}

const globalForPayload = globalThis as unknown as {
  _payloadClient?: PayloadCache
}

const cache: PayloadCache =
  globalForPayload._payloadClient ?? { client: null, promise: null }

if (!globalForPayload._payloadClient) {
  globalForPayload._payloadClient = cache
}

export async function getPayloadClient(): Promise<Payload> {
  if (cache.client) return cache.client
  if (!cache.promise) {
    cache.promise = getPayload({ config })
  }
  cache.client = await cache.promise
  return cache.client
}
```

- [ ] **Step 2: Type-check**

Run: `npx tsc --noEmit`
Expected: no errors referencing `src/lib/getPayloadClient.ts`.

- [ ] **Step 3: Commit**

```bash
git add src/lib/getPayloadClient.ts
git commit -m "feat: add cached Payload Local API client singleton"
```

---

## Task 2: Products collection

**Files:**
- Create: `src/collections/Products.ts`
- Modify: `src/payload.config.ts`

- [ ] **Step 1: Create `src/collections/Products.ts`**

```ts
import type { CollectionConfig } from 'payload'

export const Products: CollectionConfig = {
  slug: 'products',
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'type', 'status', 'order'],
  },
  access: {
    read: () => true,
  },
  fields: [
    { name: 'name', type: 'text', required: true },
    { name: 'slug', type: 'text', required: true, unique: true, index: true },
    {
      name: 'type',
      type: 'select',
      required: true,
      defaultValue: 'digital',
      options: [
        { label: 'Digital Product', value: 'digital' },
        { label: 'Boilerplate', value: 'boilerplate' },
        { label: 'Service Package', value: 'service-package' },
      ],
    },
    { name: 'tagline', type: 'text' },
    { name: 'description', type: 'richText' },
    {
      name: 'features',
      type: 'array',
      labels: { singular: 'Feature', plural: 'Features' },
      fields: [{ name: 'feature', type: 'text', required: true }],
    },
    {
      name: 'techStack',
      type: 'array',
      labels: { singular: 'Tech', plural: 'Tech Stack' },
      fields: [{ name: 'tech', type: 'text', required: true }],
    },
    { name: 'price', type: 'number' },
    { name: 'currency', type: 'text', defaultValue: 'USD' },
    {
      name: 'priceLabel',
      type: 'text',
      admin: { description: 'e.g. "one-time", "from"' },
    },
    { name: 'heroImage', type: 'upload', relationTo: 'media' },
    {
      name: 'gallery',
      type: 'array',
      fields: [{ name: 'image', type: 'upload', relationTo: 'media' }],
    },
    {
      name: 'githubRepo',
      type: 'text',
      admin: {
        description: 'owner/repo — reserved for the future GitHub-invite phase.',
      },
    },
    { name: 'demoUrl', type: 'text' },
    { name: 'featured', type: 'checkbox', defaultValue: false },
    { name: 'order', type: 'number', defaultValue: 0 },
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

- [ ] **Step 2: Register in `src/payload.config.ts`**

Add the import alongside the other collection imports:
```ts
import { Products } from './collections/Products'
```
Update the `collections` array to:
```ts
collections: [Users, Media, Articles, Projects, Products, ContactSubmissions],
```

- [ ] **Step 3: Regenerate types**

Run: `pnpm generate:types`
Expected: `src/payload-types.ts` gains a `Product` interface.

- [ ] **Step 4: Type-check**

Run: `npx tsc --noEmit`
Expected: clean.

- [ ] **Step 5: Commit**

```bash
git add src/collections/Products.ts src/payload.config.ts src/payload-types.ts
git commit -m "feat: add Products collection (boilerplates as a product type)"
```

---

## Task 3: Courses and Lessons collections

**Files:**
- Create: `src/collections/Courses.ts`
- Create: `src/collections/Lessons.ts`
- Modify: `src/payload.config.ts`

- [ ] **Step 1: Create `src/collections/Courses.ts`**

```ts
import type { CollectionConfig } from 'payload'

export const Courses: CollectionConfig = {
  slug: 'courses',
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'level', 'status', 'order'],
  },
  access: {
    read: () => true,
  },
  fields: [
    { name: 'title', type: 'text', required: true },
    { name: 'slug', type: 'text', required: true, unique: true, index: true },
    { name: 'summary', type: 'textarea' },
    { name: 'description', type: 'richText' },
    { name: 'coverImage', type: 'upload', relationTo: 'media' },
    {
      name: 'level',
      type: 'select',
      options: [
        { label: 'Beginner', value: 'beginner' },
        { label: 'Intermediate', value: 'intermediate' },
        { label: 'Advanced', value: 'advanced' },
      ],
    },
    { name: 'price', type: 'number' },
    { name: 'featured', type: 'checkbox', defaultValue: false },
    { name: 'order', type: 'number', defaultValue: 0 },
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

- [ ] **Step 2: Create `src/collections/Lessons.ts`**

```ts
import type { CollectionConfig } from 'payload'

export const Lessons: CollectionConfig = {
  slug: 'lessons',
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'course', 'module', 'order', 'status'],
  },
  access: {
    read: () => true,
  },
  fields: [
    { name: 'title', type: 'text', required: true },
    {
      name: 'slug',
      type: 'text',
      index: true,
      admin: { description: 'Used as the on-page anchor id.' },
    },
    {
      name: 'course',
      type: 'relationship',
      relationTo: 'courses',
      required: true,
    },
    {
      name: 'module',
      type: 'text',
      admin: { description: 'Grouping label; lessons are grouped by this on the course page.' },
    },
    { name: 'order', type: 'number', defaultValue: 0 },
    { name: 'content', type: 'richText' },
    { name: 'videoUrl', type: 'text' },
    { name: 'durationMinutes', type: 'number' },
    { name: 'isPreview', type: 'checkbox', defaultValue: false },
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

- [ ] **Step 3: Register in `src/payload.config.ts`**

Add imports:
```ts
import { Courses } from './collections/Courses'
import { Lessons } from './collections/Lessons'
```
Update the `collections` array to:
```ts
collections: [Users, Media, Articles, Projects, Products, Courses, Lessons, ContactSubmissions],
```

- [ ] **Step 4: Regenerate types**

Run: `pnpm generate:types`
Expected: `Course` and `Lesson` interfaces added.

- [ ] **Step 5: Type-check**

Run: `npx tsc --noEmit`
Expected: clean.

- [ ] **Step 6: Commit**

```bash
git add src/collections/Courses.ts src/collections/Lessons.ts src/payload.config.ts src/payload-types.ts
git commit -m "feat: add Courses and Lessons collections"
```

---

## Task 4: Services collection

**Files:**
- Create: `src/collections/Services.ts`
- Modify: `src/payload.config.ts`

- [ ] **Step 1: Create `src/collections/Services.ts`**

```ts
import type { CollectionConfig } from 'payload'

export const Services: CollectionConfig = {
  slug: 'services',
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'status', 'order'],
  },
  access: {
    read: () => true,
  },
  fields: [
    { name: 'name', type: 'text', required: true },
    { name: 'slug', type: 'text', required: true, unique: true, index: true },
    { name: 'summary', type: 'textarea' },
    { name: 'description', type: 'richText' },
    { name: 'icon', type: 'upload', relationTo: 'media' },
    { name: 'startingPrice', type: 'number' },
    { name: 'order', type: 'number', defaultValue: 0 },
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

- [ ] **Step 2: Register in `src/payload.config.ts`**

Add import:
```ts
import { Services } from './collections/Services'
```
Update the `collections` array to:
```ts
collections: [Users, Media, Articles, Projects, Products, Courses, Lessons, Services, ContactSubmissions],
```

- [ ] **Step 3: Regenerate types**

Run: `pnpm generate:types`
Expected: `Service` interface added.

- [ ] **Step 4: Type-check**

Run: `npx tsc --noEmit`
Expected: clean.

- [ ] **Step 5: Commit**

```bash
git add src/collections/Services.ts src/payload.config.ts src/payload-types.ts
git commit -m "feat: add Services collection"
```

---

## Task 5: Extend Articles with a cover image

**Files:**
- Modify: `src/collections/Articles.ts`

- [ ] **Step 1: Add `coverImage` to `src/collections/Articles.ts`**

Insert this field immediately after the existing `ogImage` field:
```ts
    { name: 'coverImage', type: 'upload', relationTo: 'media' },
```

- [ ] **Step 2: Regenerate types**

Run: `pnpm generate:types`
Expected: `Article` interface gains `coverImage`.

- [ ] **Step 3: Type-check**

Run: `npx tsc --noEmit`
Expected: clean.

- [ ] **Step 4: Commit**

```bash
git add src/collections/Articles.ts src/payload-types.ts
git commit -m "feat: add optional coverImage to Articles"
```

---

## Task 6: Lexical RichText render component

**Files:**
- Create: `src/components/site/RichText.tsx`

- [ ] **Step 1: Create `src/components/site/RichText.tsx`**

```tsx
import { RichText as LexicalRichText } from '@payloadcms/richtext-lexical/react'

// Derive the data type from the component itself — robust against version drift,
// no fragile subpath type import.
type Props = {
  data?: React.ComponentProps<typeof LexicalRichText>['data'] | null
  className?: string
}

export function RichText({ data, className }: Props) {
  if (!data) return null
  return (
    <div
      className={`prose prose-zinc max-w-none dark:prose-invert ${className ?? ''}`}
    >
      <LexicalRichText data={data} />
    </div>
  )
}
```

> The site already depends on `@tailwindcss/typography` (`prose`).

- [ ] **Step 2: Type-check**

Run: `npx tsc --noEmit`
Expected: clean.

- [ ] **Step 3: Commit**

```bash
git add src/components/site/RichText.tsx
git commit -m "feat: add Lexical RichText render component"
```

---

## Task 7: Site chrome (mode toggle, header, footer, shell)

**Files:**
- Create: `src/components/site/SiteModeToggle.tsx`
- Create: `src/components/site/ThemeScript.tsx`
- Create: `src/components/site/SiteHeader.tsx`
- Create: `src/components/site/SiteFooter.tsx`
- Create: `src/components/site/SiteShell.tsx`

- [ ] **Step 1: Create `src/components/site/ThemeScript.tsx`**

```tsx
// Inline, runs before paint to avoid a dark-mode flash. Mirrors the
// localStorage convention used by the existing Pages-Router site.
export function ThemeScript() {
  const code = `
(function () {
  try {
    var stored = window.localStorage.isDarkMode;
    var system = window.matchMedia('(prefers-color-scheme: dark)').matches;
    var dark = stored === undefined ? system : stored === 'true';
    document.documentElement.classList.toggle('dark', dark);
  } catch (e) {}
})();`
  return <script dangerouslySetInnerHTML={{ __html: code }} />
}
```

- [ ] **Step 2: Create `src/components/site/SiteModeToggle.tsx`**

```tsx
'use client'

import clsx from 'clsx'

function SunIcon(props: React.ComponentProps<'svg'>) {
  return (
    <svg
      viewBox="0 0 24 24"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      <path d="M8 12.25A4.25 4.25 0 0 1 12.25 8v0a4.25 4.25 0 0 1 4.25 4.25v0a4.25 4.25 0 0 1-4.25 4.25v0A4.25 4.25 0 0 1 8 12.25v0Z" />
      <path
        d="M12.25 3v1.5M21.5 12.25H20M18.791 18.791l-1.06-1.06M18.791 5.709l-1.06 1.06M12.25 20v1.5M4.5 12.25H3M6.77 6.77 5.709 5.709M6.77 17.73l-1.061 1.061"
        fill="none"
      />
    </svg>
  )
}

function MoonIcon(props: React.ComponentProps<'svg'>) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" {...props}>
      <path
        d="M17.25 16.22a6.937 6.937 0 0 1-9.47-9.47 7.451 7.451 0 1 0 9.47 9.47ZM12.75 7C17 7 17 2.75 17 2.75S17 7 21.25 7C17 7 17 11.25 17 11.25S17 7 12.75 7Z"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export function SiteModeToggle({ className }: { className?: string }) {
  function toggleMode() {
    const isDarkMode = document.documentElement.classList.toggle('dark')
    const system = window.matchMedia('(prefers-color-scheme: dark)').matches
    if (isDarkMode === system) {
      delete window.localStorage.isDarkMode
    } else {
      window.localStorage.isDarkMode = String(isDarkMode)
    }
  }

  return (
    <button
      type="button"
      aria-label="Toggle dark mode"
      onClick={toggleMode}
      className={clsx(
        className,
        'group rounded-full bg-white/90 px-3 py-2 shadow-lg shadow-zinc-800/5 ring-1 ring-zinc-900/5 backdrop-blur transition dark:bg-zinc-800/90 dark:ring-white/10 dark:hover:ring-white/20'
      )}
    >
      <SunIcon className="h-6 w-6 fill-zinc-100 stroke-zinc-500 transition group-hover:fill-zinc-200 group-hover:stroke-zinc-700 dark:hidden" />
      <MoonIcon className="hidden h-6 w-6 fill-zinc-700 stroke-zinc-500 transition dark:block" />
    </button>
  )
}
```

- [ ] **Step 3: Create `src/components/site/SiteHeader.tsx`**

```tsx
'use client'

import Image from 'next/image'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import clsx from 'clsx'

import { Container } from '@/components/Container'
import PillNav from '@/components/PillNav'
import { SiteModeToggle } from '@/components/site/SiteModeToggle'
import avatarImage from '@/images/avatar.png'
import amwareLogo from '@/images/logos/Amware-icon-mono.svg'

const navItems = [
  { label: 'Products', href: '/products' },
  { label: 'Courses', href: '/courses' },
  { label: 'Services', href: '/services' },
  { label: 'Blog', href: '/blog' },
  { label: 'Site', href: '/' },
]

export function SiteHeader() {
  const pathname = usePathname()
  const [theme, setTheme] = useState<'light' | 'dark'>('light')

  useEffect(() => {
    const read = () =>
      setTheme(
        document.documentElement.classList.contains('dark') ? 'dark' : 'light'
      )
    read()
    const observer = new MutationObserver(read)
    observer.observe(document.documentElement, { attributes: true })
    return () => observer.disconnect()
  }, [])

  return (
    <header className="relative z-50 pt-6">
      <Container>
        <div className="relative flex gap-4">
          <div className="flex flex-1">
            <Link
              href="/"
              aria-label="Home"
              className={clsx(
                'h-10 w-10 rounded-full bg-white/90 p-0.5 shadow-lg shadow-zinc-800/5 ring-1 ring-zinc-900/5 backdrop-blur dark:bg-zinc-800/90 dark:ring-white/10'
              )}
            >
              <Image
                src={avatarImage}
                alt=""
                sizes="2.25rem"
                className="h-9 w-9 rounded-full bg-zinc-100 object-cover dark:bg-zinc-800"
                priority
              />
            </Link>
          </div>
          <div className="flex flex-1 justify-center">
            <PillNav
              theme={theme === 'light' ? 'color' : 'dark'}
              logo={amwareLogo.src}
              logoAlt="AMWare Logo"
              logoClassName={theme === 'dark' ? '' : 'invert'}
              items={navItems}
              activeHref={pathname}
              className="custom-nav"
              ease="power2.easeOut"
              baseColor={theme === 'dark' ? '#000' : '#ededed'}
              pillColor={theme === 'dark' ? '#252429' : '#fefefe'}
              hoveredPillTextColor={theme === 'light' ? '#79c9b8' : '#f4f3f5'}
              pillTextColor={theme === 'dark' ? '#3ce8ce' : '#343434'}
              initialLoadAnimation={false}
            />
          </div>
          <div className="flex flex-1 justify-end">
            <SiteModeToggle />
          </div>
        </div>
      </Container>
    </header>
  )
}
```

> `PillNav` reads `activeHref` against full pathnames; `usePathname()` supplies the App Router pathname. The nav points to the new `(site)` routes plus a "Site" link back to the Pages-Router home.

- [ ] **Step 4: Create `src/components/site/SiteFooter.tsx`**

```tsx
import Link from 'next/link'
import { Container } from '@/components/Container'

export function SiteFooter() {
  return (
    <footer className="mt-32">
      <Container.Outer>
        <div className="border-t border-zinc-100 pb-16 pt-10 dark:border-zinc-700/40">
          <Container.Inner>
            <div className="flex flex-col items-center justify-between gap-6 sm:flex-row">
              <div className="flex flex-wrap justify-center gap-x-6 gap-y-1 text-sm font-medium text-zinc-800 dark:text-zinc-200">
                <Link href="/products" className="transition hover:text-teal-500 dark:hover:text-teal-400">Products</Link>
                <Link href="/courses" className="transition hover:text-teal-500 dark:hover:text-teal-400">Courses</Link>
                <Link href="/services" className="transition hover:text-teal-500 dark:hover:text-teal-400">Services</Link>
                <Link href="/blog" className="transition hover:text-teal-500 dark:hover:text-teal-400">Blog</Link>
                <Link href="/" className="transition hover:text-teal-500 dark:hover:text-teal-400">Home</Link>
              </div>
              <p className="text-sm text-zinc-400 dark:text-zinc-500">
                &copy; {new Date().getFullYear()} Alec Mingione. All rights reserved.
              </p>
            </div>
          </Container.Inner>
        </div>
      </Container.Outer>
    </footer>
  )
}
```

> `Container.Outer` and `Container.Inner` are confirmed sub-exports of `src/components/Container.jsx` (lines 41–42).

- [ ] **Step 5: Create `src/components/site/SiteShell.tsx`**

```tsx
'use client'

import { SiteHeader } from '@/components/site/SiteHeader'
import { SiteFooter } from '@/components/site/SiteFooter'

export function SiteShell({ children }: { children: React.ReactNode }) {
  return (
    <>
      <div className="fixed inset-0 flex justify-center sm:px-8">
        <div className="flex w-full max-w-7xl lg:px-8">
          <div className="w-full bg-white ring-1 ring-zinc-100 dark:bg-zinc-900 dark:ring-zinc-300/20" />
        </div>
      </div>
      <div className="relative flex min-h-screen flex-col">
        <SiteHeader />
        <main className="flex-auto">{children}</main>
        <SiteFooter />
      </div>
    </>
  )
}
```

> The fixed background div mirrors the framing the Pages-Router `_app.jsx` renders, so `(site)` pages sit on the same canvas.

- [ ] **Step 6: Type-check**

Run: `npx tsc --noEmit`
Expected: clean.

- [ ] **Step 7: Commit**

```bash
git add src/components/site/ThemeScript.tsx src/components/site/SiteModeToggle.tsx src/components/site/SiteHeader.tsx src/components/site/SiteFooter.tsx src/components/site/SiteShell.tsx
git commit -m "feat: add (site) chrome — header, footer, shell, mode toggle"
```

---

## Task 8: `(site)` root layout

**Files:**
- Create: `src/app/(site)/layout.tsx`

- [ ] **Step 1: Create `src/app/(site)/layout.tsx`**

```tsx
import type { Metadata } from 'next'
import { Inter, JetBrains_Mono } from 'next/font/google'

import { SiteShell } from '@/components/site/SiteShell'
import { ThemeScript } from '@/components/site/ThemeScript'

import '@/styles/tailwind.css'
import '@/styles/global.css'
import '@/styles/globals.css'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
})

const navCode = JetBrains_Mono({
  subsets: ['latin'],
  weight: ['500', '600'],
  variable: '--font-nav-code',
  display: 'swap',
})

export const metadata: Metadata = {
  title: { default: 'Alec Mingione', template: '%s - Alec Mingione' },
}

export default function SiteLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={`${inter.variable} ${navCode.variable}`} suppressHydrationWarning>
      <head>
        <ThemeScript />
      </head>
      <body className="bg-zinc-50 font-sans antialiased dark:bg-black">
        <SiteShell>{children}</SiteShell>
      </body>
    </html>
  )
}
```

> This is a **second root layout** (rendering `<html><body>`), valid because route groups `(payload)` and `(site)` each own their root and there is no `src/app/layout.tsx`. Do NOT add a root `app/layout.tsx` — it would break Payload's `(payload)` layout.

- [ ] **Step 2: Type-check**

Run: `npx tsc --noEmit`
Expected: clean.

- [ ] **Step 3: Commit**

```bash
git add "src/app/(site)/layout.tsx"
git commit -m "feat: add (site) root layout with fonts, theme, and shell"
```

---

## Task 9: Products listing + detail

**Files:**
- Create: `src/app/(site)/products/page.tsx`
- Create: `src/app/(site)/products/[slug]/page.tsx`
- Create: `src/app/(site)/products/[slug]/not-found.tsx`

- [ ] **Step 1: Create `src/app/(site)/products/page.tsx`**

```tsx
import Link from 'next/link'
import { Container } from '@/components/Container'
import { getPayloadClient } from '@/lib/getPayloadClient'

export const revalidate = 60

export const metadata = {
  title: 'Products',
  description: 'Boilerplates, templates, and digital products for founders.',
}

export default async function ProductsPage() {
  const payload = await getPayloadClient()
  const { docs } = await payload.find({
    collection: 'products',
    where: { status: { equals: 'published' } },
    sort: 'order',
    depth: 1,
    limit: 100,
  })

  return (
    <Container className="mt-16 sm:mt-32">
      <header className="max-w-2xl">
        <h1 className="text-4xl font-bold tracking-tight text-zinc-800 dark:text-zinc-100 sm:text-5xl">
          Products
        </h1>
        <p className="mt-6 text-base text-zinc-600 dark:text-zinc-400">
          Boilerplates, templates, and digital products to help founders ship faster.
        </p>
      </header>

      {docs.length === 0 ? (
        <p className="mt-16 text-zinc-500 dark:text-zinc-400">No products yet — check back soon.</p>
      ) : (
        <ul className="mt-16 grid grid-cols-1 gap-6 sm:grid-cols-2">
          {docs.map((product) => {
            const hero =
              product.heroImage && typeof product.heroImage === 'object'
                ? product.heroImage.url
                : null
            return (
              <li
                key={product.id}
                className="group rounded-3xl p-6 ring-1 ring-zinc-200 transition hover:ring-zinc-300 dark:ring-zinc-700 dark:hover:ring-zinc-600"
              >
                <Link href={`/products/${product.slug}`} className="block">
                  {hero && (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img
                      src={hero}
                      alt={product.name}
                      className="mb-5 aspect-video w-full rounded-2xl object-contain"
                    />
                  )}
                  <div className="flex items-center gap-2">
                    <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
                      {product.name}
                    </h2>
                    <span className="rounded-full border border-zinc-200 bg-zinc-50 px-2 py-0.5 text-[11px] font-medium text-zinc-600 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-400">
                      {product.type}
                    </span>
                  </div>
                  {product.tagline && (
                    <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
                      {product.tagline}
                    </p>
                  )}
                  {typeof product.price === 'number' && (
                    <p className="mt-4 text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                      {product.priceLabel ? `${product.priceLabel} ` : ''}
                      {product.currency ?? 'USD'} {product.price.toFixed(2)}
                    </p>
                  )}
                </Link>
              </li>
            )
          })}
        </ul>
      )}
    </Container>
  )
}
```

- [ ] **Step 2: Create `src/app/(site)/products/[slug]/page.tsx`**

```tsx
import { notFound } from 'next/navigation'
import { Container } from '@/components/Container'
import { RichText } from '@/components/site/RichText'
import { getPayloadClient } from '@/lib/getPayloadClient'

export const revalidate = 60

async function getProduct(slug: string) {
  const payload = await getPayloadClient()
  const { docs } = await payload.find({
    collection: 'products',
    where: { slug: { equals: slug }, status: { equals: 'published' } },
    depth: 1,
    limit: 1,
  })
  return docs[0] ?? null
}

export async function generateStaticParams() {
  const payload = await getPayloadClient()
  const { docs } = await payload.find({
    collection: 'products',
    where: { status: { equals: 'published' } },
    depth: 0,
    limit: 1000,
  })
  return docs.map((d) => ({ slug: d.slug as string }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const product = await getProduct(slug)
  if (!product) return {}
  return { title: product.name, description: product.tagline ?? undefined }
}

export default async function ProductPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const product = await getProduct(slug)
  if (!product) notFound()

  const hero =
    product.heroImage && typeof product.heroImage === 'object'
      ? product.heroImage.url
      : null

  return (
    <Container className="mt-16 sm:mt-32">
      <article className="mx-auto max-w-2xl">
        <header>
          <h1 className="text-4xl font-bold tracking-tight text-zinc-800 dark:text-zinc-100 sm:text-5xl">
            {product.name}
          </h1>
          {product.tagline && (
            <p className="mt-6 text-base text-zinc-600 dark:text-zinc-400">
              {product.tagline}
            </p>
          )}
        </header>

        {hero && (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src={hero}
            alt={product.name}
            className="mt-10 w-full rounded-3xl object-contain"
          />
        )}

        <RichText data={product.description} className="mt-10" />

        {Array.isArray(product.features) && product.features.length > 0 && (
          <ul className="mt-10 space-y-2">
            {product.features.map((f, i) => (
              <li key={i} className="text-sm text-zinc-600 dark:text-zinc-400">
                • {f.feature}
              </li>
            ))}
          </ul>
        )}

        {product.demoUrl && (
          <a
            href={product.demoUrl}
            className="mt-10 inline-flex rounded-md bg-zinc-800 px-3 py-2 text-sm font-semibold text-zinc-100 transition hover:bg-zinc-700 dark:bg-zinc-700 dark:hover:bg-zinc-600"
          >
            View demo
          </a>
        )}
      </article>
    </Container>
  )
}
```

> Checkout/"Buy" CTAs are intentionally absent — they arrive in B2 (Creem.io).

- [ ] **Step 3: Create `src/app/(site)/products/[slug]/not-found.tsx`**

```tsx
import Link from 'next/link'
import { Container } from '@/components/Container'

export default function ProductNotFound() {
  return (
    <Container className="mt-16 sm:mt-32">
      <h1 className="text-2xl font-bold text-zinc-800 dark:text-zinc-100">
        Product not found
      </h1>
      <p className="mt-4 text-zinc-600 dark:text-zinc-400">
        That product doesn’t exist or isn’t published yet.{' '}
        <Link href="/products" className="text-teal-500">Back to products</Link>.
      </p>
    </Container>
  )
}
```

- [ ] **Step 4: Type-check**

Run: `npx tsc --noEmit`
Expected: clean. (If `product.heroImage.url` errors because the upload type is a union, the `typeof === 'object'` guard already narrows it; ensure the guard is present.)

- [ ] **Step 5: Commit**

```bash
git add "src/app/(site)/products"
git commit -m "feat: add Products listing and detail pages"
```

---

## Task 10: Courses listing + detail

**Files:**
- Create: `src/app/(site)/courses/page.tsx`
- Create: `src/app/(site)/courses/[slug]/page.tsx`
- Create: `src/app/(site)/courses/[slug]/not-found.tsx`

- [ ] **Step 1: Create `src/app/(site)/courses/page.tsx`**

```tsx
import Link from 'next/link'
import { Container } from '@/components/Container'
import { getPayloadClient } from '@/lib/getPayloadClient'

export const revalidate = 60

export const metadata = {
  title: 'Courses',
  description: 'Courses and learning paths.',
}

export default async function CoursesPage() {
  const payload = await getPayloadClient()
  const { docs } = await payload.find({
    collection: 'courses',
    where: { status: { equals: 'published' } },
    sort: 'order',
    depth: 1,
    limit: 100,
  })

  return (
    <Container className="mt-16 sm:mt-32">
      <header className="max-w-2xl">
        <h1 className="text-4xl font-bold tracking-tight text-zinc-800 dark:text-zinc-100 sm:text-5xl">
          Courses
        </h1>
        <p className="mt-6 text-base text-zinc-600 dark:text-zinc-400">
          Structured, practical courses — learn by building.
        </p>
      </header>

      {docs.length === 0 ? (
        <p className="mt-16 text-zinc-500 dark:text-zinc-400">No courses yet — check back soon.</p>
      ) : (
        <ul className="mt-16 grid grid-cols-1 gap-6 sm:grid-cols-2">
          {docs.map((course) => (
            <li
              key={course.id}
              className="rounded-3xl p-6 ring-1 ring-zinc-200 transition hover:ring-zinc-300 dark:ring-zinc-700 dark:hover:ring-zinc-600"
            >
              <Link href={`/courses/${course.slug}`} className="block">
                <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
                  {course.title}
                </h2>
                {course.summary && (
                  <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
                    {course.summary}
                  </p>
                )}
                {course.level && (
                  <span className="mt-4 inline-block rounded-full border border-zinc-200 bg-zinc-50 px-2 py-0.5 text-[11px] font-medium text-zinc-600 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-400">
                    {course.level}
                  </span>
                )}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </Container>
  )
}
```

- [ ] **Step 2: Create `src/app/(site)/courses/[slug]/page.tsx`**

```tsx
import { notFound } from 'next/navigation'
import { Container } from '@/components/Container'
import { RichText } from '@/components/site/RichText'
import { getPayloadClient } from '@/lib/getPayloadClient'

export const revalidate = 60

async function getCourse(slug: string) {
  const payload = await getPayloadClient()
  const { docs } = await payload.find({
    collection: 'courses',
    where: { slug: { equals: slug }, status: { equals: 'published' } },
    depth: 1,
    limit: 1,
  })
  return docs[0] ?? null
}

export async function generateStaticParams() {
  const payload = await getPayloadClient()
  const { docs } = await payload.find({
    collection: 'courses',
    where: { status: { equals: 'published' } },
    depth: 0,
    limit: 1000,
  })
  return docs.map((d) => ({ slug: d.slug as string }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const course = await getCourse(slug)
  if (!course) return {}
  return { title: course.title, description: course.summary ?? undefined }
}

export default async function CoursePage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const course = await getCourse(slug)
  if (!course) notFound()

  const payload = await getPayloadClient()
  const { docs: lessons } = await payload.find({
    collection: 'lessons',
    where: { course: { equals: course.id }, status: { equals: 'published' } },
    sort: 'order',
    depth: 0,
    limit: 1000,
  })

  // Group lessons by module label, preserving order.
  const groups: { module: string; lessons: typeof lessons }[] = []
  for (const lesson of lessons) {
    const label = (lesson.module as string) || 'Lessons'
    let group = groups.find((g) => g.module === label)
    if (!group) {
      group = { module: label, lessons: [] }
      groups.push(group)
    }
    group.lessons.push(lesson)
  }

  return (
    <Container className="mt-16 sm:mt-32">
      <article className="mx-auto max-w-2xl">
        <header>
          <h1 className="text-4xl font-bold tracking-tight text-zinc-800 dark:text-zinc-100 sm:text-5xl">
            {course.title}
          </h1>
          {course.summary && (
            <p className="mt-6 text-base text-zinc-600 dark:text-zinc-400">
              {course.summary}
            </p>
          )}
        </header>

        <RichText data={course.description} className="mt-10" />

        {groups.map((group) => (
          <section key={group.module} className="mt-12">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
              {group.module}
            </h2>
            <div className="mt-4 space-y-8">
              {group.lessons.map((lesson) => (
                <div key={lesson.id} id={lesson.slug ?? undefined}>
                  <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
                    {lesson.title}
                    {lesson.isPreview && (
                      <span className="ml-2 rounded-full bg-teal-50 px-2 py-0.5 text-[11px] font-medium text-teal-600 dark:bg-teal-500/10 dark:text-teal-400">
                        Preview
                      </span>
                    )}
                  </h3>
                  <RichText data={lesson.content} className="mt-3" />
                </div>
              ))}
            </div>
          </section>
        ))}
      </article>
    </Container>
  )
}
```

> Content-only catalog: every published lesson renders inline. Gating previews behind purchase is a B2 concern (the `isPreview` flag is shown but not enforced).

- [ ] **Step 3: Create `src/app/(site)/courses/[slug]/not-found.tsx`**

```tsx
import Link from 'next/link'
import { Container } from '@/components/Container'

export default function CourseNotFound() {
  return (
    <Container className="mt-16 sm:mt-32">
      <h1 className="text-2xl font-bold text-zinc-800 dark:text-zinc-100">
        Course not found
      </h1>
      <p className="mt-4 text-zinc-600 dark:text-zinc-400">
        That course doesn’t exist or isn’t published yet.{' '}
        <Link href="/courses" className="text-teal-500">Back to courses</Link>.
      </p>
    </Container>
  )
}
```

- [ ] **Step 4: Type-check**

Run: `npx tsc --noEmit`
Expected: clean.

- [ ] **Step 5: Commit**

```bash
git add "src/app/(site)/courses"
git commit -m "feat: add Courses listing and detail (lessons grouped by module)"
```

---

## Task 11: Services listing

**Files:**
- Create: `src/app/(site)/services/page.tsx`

- [ ] **Step 1: Create `src/app/(site)/services/page.tsx`**

```tsx
import { Container } from '@/components/Container'
import { RichText } from '@/components/site/RichText'
import { getPayloadClient } from '@/lib/getPayloadClient'

export const revalidate = 60

export const metadata = {
  title: 'Services',
  description: 'Services and engagements.',
}

export default async function ServicesPage() {
  const payload = await getPayloadClient()
  const { docs } = await payload.find({
    collection: 'services',
    where: { status: { equals: 'published' } },
    sort: 'order',
    depth: 1,
    limit: 100,
  })

  return (
    <Container className="mt-16 sm:mt-32">
      <header className="max-w-2xl">
        <h1 className="text-4xl font-bold tracking-tight text-zinc-800 dark:text-zinc-100 sm:text-5xl">
          Services
        </h1>
        <p className="mt-6 text-base text-zinc-600 dark:text-zinc-400">
          Ways we can work together.
        </p>
      </header>

      {docs.length === 0 ? (
        <p className="mt-16 text-zinc-500 dark:text-zinc-400">No services listed yet.</p>
      ) : (
        <div className="mt-16 grid grid-cols-1 gap-10 sm:grid-cols-2">
          {docs.map((service) => (
            <section
              key={service.id}
              className="rounded-3xl p-6 ring-1 ring-zinc-200 dark:ring-zinc-700"
            >
              <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
                {service.name}
              </h2>
              {service.summary && (
                <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
                  {service.summary}
                </p>
              )}
              <RichText data={service.description} className="mt-4" />
              {typeof service.startingPrice === 'number' && (
                <p className="mt-4 text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                  From USD {service.startingPrice.toFixed(2)}
                </p>
              )}
            </section>
          ))}
        </div>
      )}
    </Container>
  )
}
```

- [ ] **Step 2: Type-check**

Run: `npx tsc --noEmit`
Expected: clean.

- [ ] **Step 3: Commit**

```bash
git add "src/app/(site)/services"
git commit -m "feat: add Services listing page"
```

---

## Task 12: Blog listing + detail (Payload-authored)

**Files:**
- Create: `src/app/(site)/blog/page.tsx`
- Create: `src/app/(site)/blog/[slug]/page.tsx`
- Create: `src/app/(site)/blog/[slug]/not-found.tsx`

> Payload-authored posts = Articles with `status: 'published'` and **no** `mdxSlug` (seeded MDX articles set `mdxSlug`; new CMS posts leave it blank).

- [ ] **Step 1: Create `src/app/(site)/blog/page.tsx`**

```tsx
import Link from 'next/link'
import { Container } from '@/components/Container'
import { getPayloadClient } from '@/lib/getPayloadClient'

export const revalidate = 60

export const metadata = {
  title: 'Blog',
  description: 'Writing published from the CMS.',
}

function formatDate(value?: string | null) {
  if (!value) return ''
  return new Date(value).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

export default async function BlogPage() {
  const payload = await getPayloadClient()
  const { docs } = await payload.find({
    collection: 'articles',
    where: {
      and: [
        { status: { equals: 'published' } },
        { mdxSlug: { exists: false } },
      ],
    },
    sort: '-publishedDate',
    depth: 0,
    limit: 100,
  })

  return (
    <Container className="mt-16 sm:mt-32">
      <header className="max-w-2xl">
        <h1 className="text-4xl font-bold tracking-tight text-zinc-800 dark:text-zinc-100 sm:text-5xl">
          Blog
        </h1>
        <p className="mt-6 text-base text-zinc-600 dark:text-zinc-400">
          Posts authored in the CMS. Looking for the older essays?{' '}
          <Link href="/articles" className="text-teal-500">Read the articles archive</Link>.
        </p>
      </header>

      {docs.length === 0 ? (
        <p className="mt-16 text-zinc-500 dark:text-zinc-400">No posts yet.</p>
      ) : (
        <ul className="mt-16 space-y-12">
          {docs.map((post) => (
            <li key={post.id}>
              <p className="text-sm text-zinc-400 dark:text-zinc-500">
                {formatDate(post.publishedDate)}
              </p>
              <h2 className="mt-1 text-base font-semibold text-zinc-900 dark:text-zinc-100">
                <Link href={`/blog/${post.slug}`}>{post.title}</Link>
              </h2>
              {post.description && (
                <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
                  {post.description}
                </p>
              )}
            </li>
          ))}
        </ul>
      )}
    </Container>
  )
}
```

- [ ] **Step 2: Create `src/app/(site)/blog/[slug]/page.tsx`**

```tsx
import { notFound } from 'next/navigation'
import { Container } from '@/components/Container'
import { RichText } from '@/components/site/RichText'
import { getPayloadClient } from '@/lib/getPayloadClient'

export const revalidate = 60

async function getPost(slug: string) {
  const payload = await getPayloadClient()
  const { docs } = await payload.find({
    collection: 'articles',
    where: {
      and: [
        { slug: { equals: slug } },
        { status: { equals: 'published' } },
        { mdxSlug: { exists: false } },
      ],
    },
    depth: 1,
    limit: 1,
  })
  return docs[0] ?? null
}

export async function generateStaticParams() {
  const payload = await getPayloadClient()
  const { docs } = await payload.find({
    collection: 'articles',
    where: {
      and: [
        { status: { equals: 'published' } },
        { mdxSlug: { exists: false } },
      ],
    },
    depth: 0,
    limit: 1000,
  })
  return docs.map((d) => ({ slug: d.slug as string }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const post = await getPost(slug)
  if (!post) return {}
  return { title: post.title, description: post.description ?? undefined }
}

export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const post = await getPost(slug)
  if (!post) notFound()

  return (
    <Container className="mt-16 sm:mt-32">
      <article className="mx-auto max-w-2xl">
        <header>
          <p className="text-sm text-zinc-400 dark:text-zinc-500">
            {post.publishedDate
              ? new Date(post.publishedDate).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })
              : ''}
          </p>
          <h1 className="mt-2 text-4xl font-bold tracking-tight text-zinc-800 dark:text-zinc-100 sm:text-5xl">
            {post.title}
          </h1>
        </header>
        <RichText data={post.content} className="mt-10" />
      </article>
    </Container>
  )
}
```

- [ ] **Step 3: Create `src/app/(site)/blog/[slug]/not-found.tsx`**

```tsx
import Link from 'next/link'
import { Container } from '@/components/Container'

export default function BlogNotFound() {
  return (
    <Container className="mt-16 sm:mt-32">
      <h1 className="text-2xl font-bold text-zinc-800 dark:text-zinc-100">
        Post not found
      </h1>
      <p className="mt-4 text-zinc-600 dark:text-zinc-400">
        That post doesn’t exist or isn’t published.{' '}
        <Link href="/blog" className="text-teal-500">Back to the blog</Link>.
      </p>
    </Container>
  )
}
```

- [ ] **Step 4: Type-check**

Run: `npx tsc --noEmit`
Expected: clean.

- [ ] **Step 5: Commit**

```bash
git add "src/app/(site)/blog"
git commit -m "feat: add Payload-authored blog listing and detail at /blog"
```

---

## Task 13: Full verification

- [ ] **Step 1: Format all new files**

Run:
```bash
npx prettier --write \
  src/lib/getPayloadClient.ts \
  "src/collections/*.ts" \
  "src/components/site/*.tsx" \
  "src/app/(site)/**/*.tsx"
```
Expected: files formatted.

- [ ] **Step 2: Type-check**

Run: `npx tsc --noEmit`
Expected: clean (no errors).

- [ ] **Step 3: Lint**

Run: `pnpm lint`
Expected: passes. (If the `no-img-element` rule crashes, it is the known stray-`~/package-lock.json` env issue from the foundation phase — resolve that first; it is not a code defect.)

- [ ] **Step 4: Production build**

Run: `pnpm build`
Expected: succeeds; route list includes `/products`, `/products/[slug]`, `/courses`, `/courses/[slug]`, `/services`, `/blog`, `/blog/[slug]`, plus the unchanged Pages routes and `/admin`, `/api/*`.

- [ ] **Step 5: Manual content + parity check (user runs the dev server)**

Start `pnpm dev` (user-run — never auto-start). In `/admin`, create and **publish**: one Product (and one with `type: boilerplate`), one Course with ≥2 Lessons spanning 2 `module` labels, one Service, and one Article with `content` and **no** `mdxSlug`. Then verify:
- `/products`, `/products/<slug>`, `/courses`, `/courses/<slug>` (lessons grouped by module), `/services`, `/blog`, `/blog/<slug>` all render with the `(site)` chrome and correct dark/light theme.
- `/`, `/about`, `/articles` (index + an MDX article), `/projects`, `/uses`, `/contact` render identically to before.
Stop the server.

- [ ] **Step 6: Code quality review**

Run the code quality reviewer agent over all files created/modified in this phase.

- [ ] **Step 7: Commit any review fixes**

```bash
git add -A
git commit -m "chore: address code review for Phase B1 content rendering"
```

---

## Self-Review Notes (spec coverage)

- Products / Courses (+Lessons) / Services collections → Tasks 2, 3, 4 ✓
- Boilerplates as a Product `type`; `githubRepo` reserved for B3 → Task 2 ✓
- Articles extended (coverImage) + Payload-authored blog → Tasks 5, 12 ✓
- App Router server components reading Local API via cached singleton → Tasks 1, 9–12 ✓
- `(site)` second root layout + shared chrome (header/footer/shell/theme) → Tasks 7, 8 ✓
- Lexical rendering via `RichText` → Task 6 ✓
- `/blog` (not `/articles`) to avoid the App/Pages routing conflict → Task 12 ✓
- Published-only filtering, `generateStaticParams`, `generateMetadata`, `not-found` → Tasks 9–12 ✓
- ISR (`revalidate = 60`) → Tasks 9–12 ✓
- Pages Router site + MDX untouched (no edits under `src/pages`) → confirmed by file list ✓
- Payment-agnostic (price display-only, no checkout) → Tasks 2, 9 ✓
- Verification (prettier, tsc, lint, build, manual, review) → Task 13 ✓
- Cross-link `/blog` → `/articles` included (Task 12); reciprocal Pages-side link deferred to keep `src/pages` untouched ✓
