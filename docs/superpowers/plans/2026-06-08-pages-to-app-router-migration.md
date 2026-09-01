# Pages Router → App Router Migration — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Migrate every `src/pages` route into the `src/app/(site)` App Router group incrementally, then delete the Pages Router (`_app.jsx`, `_document.jsx`, `src/pages/**`) for a unified App Router stack — preserving the home avatar-morph, MDX articles, RSS, dark-mode no-flash, and per-page SEO.

**Architecture:** `(site)/layout.tsx` becomes the single public-site root layout (absorbing `_app`+`_document`) wrapping a ported animated `Header` + the existing `Footer`. Client-heavy pages (home, projects, contact) split into a server `page.tsx` (owns `metadata`) + a `'use client'` content component. MDX moves to a non-routable `src/content/articles/` and renders via a dynamic-import `articles/[slug]/page.tsx` wrapped in `ArticleLayout`. RSS becomes route handlers.

**Tech Stack:** Next.js 15 App Router, React 19, `@next/mdx`, `@payloadcms/*` (unaffected), Tailwind v4, `motion`, `feed`.

**Reference spec:** `docs/superpowers/specs/2026-06-08-pages-to-app-router-migration-design.md`

> **Testing note:** No unit-test framework in this repo (per `AGENTS.md`). Each task verifies with `npx tsc --noEmit`, `npx prettier --write`, `pnpm lint`, and (in the user's env) `pnpm build` + manual parity check. `pnpm dev` is user-run only. **Coexistence rule:** for every route, add the App route and delete the Pages file in the SAME task — App and Pages must never own the same path at once.

---

## File Structure

| File | Responsibility |
|---|---|
| `src/mdx-components.tsx` (create) | Required by `@next/mdx` for App Router; maps MDX elements |
| `src/components/AppHeader.jsx` (create) | App-Router port of `Header.jsx` (avatar morph, `next/navigation`) |
| `src/components/StagewiseInit.jsx` (create) | `'use client'` dev-toolbar init (was in `_app`) |
| `src/app/(site)/layout.tsx` (rewrite) | Root layout: html/body, fonts, CSS, theme script, RSS links, metadata, Analytics, AppHeader+Footer |
| `src/app/(site)/about/page.tsx` etc. (create) | Ported static pages (about, uses, speaking, thank-you) |
| `src/app/(site)/contact/page.tsx` + `ContactForm.tsx` (create) | Server page (metadata) + client form |
| `src/app/(site)/projects/page.tsx` + `ProjectsContent.tsx` (create) | Server page (metadata) + client body |
| `src/content/articles/<slug>/index.mdx` (move) | MDX moved out of the route tree |
| `src/lib/getAllArticles.js` (modify) | Glob `src/content/articles` instead of `src/pages/articles` |
| `src/components/ArticleLayout.jsx` (modify) | Drop `next/head`; back-button via `next/navigation` |
| `src/app/(site)/articles/page.tsx` (create) | Articles index (server) |
| `src/app/(site)/articles/[slug]/page.tsx` (create) | Dynamic MDX import + `ArticleLayout` + metadata |
| `src/lib/buildFeed.js` (create) + `src/lib/generateRssFeed.js` (delete) | Shared feed builder |
| `src/app/(site)/rss/feed.xml/route.ts` + `feed.json/route.ts` (create) | RSS route handlers |
| `src/app/(site)/page.tsx` + `HomeContent.tsx` (create) | Server page (data + metadata) + client body |
| `src/app/not-found.tsx` (create) | App Router 404 |
| `src/pages/**`, `_app.jsx`, `_document.jsx` (delete) | Removed at the end |
| `next.config.mjs` (modify) | Drop `mdx`/`md` from `pageExtensions` |

---

## Task 1: Add `mdx-components.tsx` (required for App Router MDX)

**Files:** Create `src/mdx-components.tsx`

- [ ] **Step 1: Create `src/mdx-components.tsx`**

```tsx
import type { MDXComponents } from 'mdx/types'

// Required by @next/mdx for the App Router. Article typography comes from the
// `Prose`/`prose` wrapper in ArticleLayout, so keep element mapping minimal here.
const components: MDXComponents = {}

export function useMDXComponents(
  inherited: MDXComponents = {}
): MDXComponents {
  return { ...inherited, ...components }
}
```

- [ ] **Step 2: Verify**

Run: `npx tsc --noEmit`
Expected: clean (install `@types/mdx` if tsc reports a missing type: `pnpm add -D @types/mdx`, then re-run).

- [ ] **Step 3: Commit**

```bash
git add src/mdx-components.tsx
git commit -m "feat: add mdx-components for App Router MDX"
```

---

## Task 2: Port `Header` to App Router (`AppHeader.jsx`)

**Files:** Create `src/components/AppHeader.jsx` (copy of `src/components/Header.jsx` with the changes below). Leave `Header.jsx` untouched — it keeps serving Pages routes until cleanup.

- [ ] **Step 1: Copy the file**

Run: `cp src/components/Header.jsx src/components/AppHeader.jsx`

- [ ] **Step 2: Apply these exact edits to `src/components/AppHeader.jsx`**

1. Add `'use client'` as the very first line.
2. Replace the router import:
   - Remove: `import { useRouter } from 'next/compat/router'`
   - Add: `import { usePathname } from 'next/navigation'`
3. In `export function Header()`, rename it to `export function AppHeader()`.
4. Replace the router/home detection. Find:
   ```js
   let router = useRouter()
   let isHomePage = router?.pathname === '/'
   ```
   Replace with:
   ```js
   let pathname = usePathname()
   let isHomePage = pathname === '/'
   ```
5. The component currently uses `useRouter` only for `pathname`. Remove any remaining `router.` references (there are none beyond the above in this file). The `ModeToggle`, `Avatar`, scroll/`--header-*`/`--avatar-*` logic, and all refs stay **unchanged**.

- [ ] **Step 3: Verify**

Run: `npx tsc --noEmit && grep -n "next/compat/router\|useRouter" src/components/AppHeader.jsx || echo "clean: no compat router"`
Expected: tsc clean; grep prints "clean: no compat router".

- [ ] **Step 4: Commit**

```bash
git add src/components/AppHeader.jsx
git commit -m "feat: add App Router port of Header (AppHeader)"
```

---

## Task 3: Rewrite `(site)/layout.tsx` as the unified root layout

**Files:**
- Create: `src/components/StagewiseInit.jsx`
- Rewrite: `src/app/(site)/layout.tsx`

- [ ] **Step 1: Create `src/components/StagewiseInit.jsx`** (moves the `_app` dev-toolbar init)

```jsx
'use client'

import { useEffect } from 'react'
import { initToolbar } from '@21st-extension/toolbar'

export function StagewiseInit() {
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      initToolbar({ plugins: [] })
    }
  }, [])
  return null
}
```

- [ ] **Step 2: Rewrite `src/app/(site)/layout.tsx`**

```tsx
import type { Metadata } from 'next'
import { Inter, JetBrains_Mono } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import { SpeedInsights } from '@vercel/speed-insights/next'

import { AppHeader } from '@/components/AppHeader'
import { Footer } from '@/components/Footer'
import { StagewiseInit } from '@/components/StagewiseInit'

import '@/styles/tailwind.css'
import '@/styles/global.css'
import '@/styles/globals.css'
import 'focus-visible'

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

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL

export const metadata: Metadata = {
  title: { default: 'Alec Mingione', template: '%s - Alec Mingione' },
  alternates: {
    types: {
      'application/rss+xml': `${siteUrl}/rss/feed.xml`,
      'application/feed+json': `${siteUrl}/rss/feed.json`,
    },
  },
  other: { 'impact-site-verification': 'f77f8902-5007-4ccb-8dc0-d58a1ceb6915' },
}

// Pre-paint dark-mode script (ported verbatim from the old _document.jsx).
const modeScript = `
  let darkModeMediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
  updateMode()
  darkModeMediaQuery.addEventListener('change', updateModeWithoutTransitions)
  window.addEventListener('storage', updateModeWithoutTransitions)
  function updateMode() {
    let isSystemDarkMode = darkModeMediaQuery.matches
    let isDarkMode = window.localStorage.isDarkMode === 'true' || (!('isDarkMode' in window.localStorage) && isSystemDarkMode)
    if (isDarkMode) { document.documentElement.classList.add('dark') } else { document.documentElement.classList.remove('dark') }
    if (isDarkMode === isSystemDarkMode) { delete window.localStorage.isDarkMode }
  }
  function disableTransitionsTemporarily() {
    document.documentElement.classList.add('[&_*]:!transition-none')
    window.setTimeout(() => { document.documentElement.classList.remove('[&_*]:!transition-none') }, 0)
  }
  function updateModeWithoutTransitions() { disableTransitionsTemporarily(); updateMode() }
`

export default function SiteLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html
      lang="en"
      className={`h-full antialiased ${inter.variable} ${navCode.variable}`}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: modeScript }} />
      </head>
      <body className="flex h-full flex-col bg-zinc-50 font-sans dark:bg-black">
        <div className="fixed inset-0 flex justify-center sm:px-8">
          <div className="flex w-full max-w-7xl lg:px-8">
            <div className="w-full bg-white ring-1 ring-zinc-100 dark:bg-zinc-900 dark:ring-zinc-300/20" />
          </div>
        </div>
        <div className="relative flex w-full flex-col">
          <AppHeader />
          <main className="flex-auto">{children}</main>
          <Footer />
        </div>
        <Analytics />
        <SpeedInsights />
        <StagewiseInit />
      </body>
    </html>
  )
}
```

> This replaces B1's `SiteShell`/`SiteHeader`/`SiteModeToggle`/`ThemeScript`/`SiteFooter` (deleted in Task 10). The B1 content routes (`/products`,`/courses`,`/services`,`/blog`) now render under this richer layout automatically.

- [ ] **Step 3: Verify**

Run: `npx tsc --noEmit`
Expected: clean. (`@21st-extension/toolbar`, `@vercel/analytics/next`, `@vercel/speed-insights/next` already exist in `package.json`.)

- [ ] **Step 4: Commit**

```bash
git add src/components/StagewiseInit.jsx "src/app/(site)/layout.tsx"
git commit -m "feat: unify (site) root layout (absorbs _app/_document, ported Header)"
```

---

## Task 4: Migrate static pages — about, uses, speaking, thank-you

**Files (per page):** Create `src/app/(site)/<route>/page.tsx`; Delete `src/pages/<route>.jsx`.

For EACH of the four pages below, do: (a) create the App route file, (b) copy the page's JSX **body** (everything the old default-export `return (...)` rendered) from the old Pages file, **removing the `<Head>...</Head>` block**, (c) add the `metadata` export shown, (d) delete the old Pages file.

These four are pure server components (no `useState`/`useRouter`/`motion`). Keep their imports (`Container`, `SimpleLayout`, `Card`, images, etc.) — those resolve identically.

- [ ] **Step 1: about** — Create `src/app/(site)/about/page.tsx`:

```tsx
import type { Metadata } from 'next'
// ...copy the SAME imports the old src/pages/about.jsx used (minus `next/head`)...

export const metadata: Metadata = {
  title: 'About',
  description:
    'I’m Alec Mingione. I live in Phoenix Arizona, where I engineer the future.',
}

export default function About() {
  return (
    // ...paste the JSX returned by the old About component, WITHOUT the <Head> block...
  )
}
```
Then: `git rm src/pages/about.jsx`

- [ ] **Step 2: uses** — Create `src/app/(site)/uses/page.tsx` with:

```tsx
export const metadata = {
  title: 'Uses',
  description: 'Software I use, gadgets I love, and other things I recommend.',
}
```
(plus the copied body + original imports minus `next/head`), then `git rm src/pages/uses.jsx`.

- [ ] **Step 3: speaking** — Create `src/app/(site)/speaking/page.tsx` with:

```tsx
export const metadata = {
  title: 'Speaking',
  description:
    'I’ve spoken at events all around the world and been interviewed for many podcasts.',
}
```
(copied body + imports minus `next/head`; note this fixes the stale "Spencer Sharp" title via the layout template), then `git rm src/pages/speaking.jsx`.

- [ ] **Step 4: thank-you** — Create `src/app/(site)/thank-you/page.tsx` with:

```tsx
export const metadata = {
  title: { absolute: 'You’re subscribed - Alec Mingione' },
  description: 'Thanks for subscribing to my newsletter.',
}
```
(copied body + imports minus `next/head`), then `git rm src/pages/thank-you.jsx`.

- [ ] **Step 5: Verify**

Run: `npx tsc --noEmit && grep -rn "next/head" "src/app/(site)/about" "src/app/(site)/uses" "src/app/(site)/speaking" "src/app/(site)/thank-you" || echo "no next/head"`
Expected: tsc clean; "no next/head".

- [ ] **Step 6: Commit**

```bash
git add "src/app/(site)/about" "src/app/(site)/uses" "src/app/(site)/speaking" "src/app/(site)/thank-you"
git rm src/pages/about.jsx src/pages/uses.jsx src/pages/speaking.jsx src/pages/thank-you.jsx
git commit -m "feat: migrate about/uses/speaking/thank-you to App Router"
```

---

## Task 5: Migrate contact (server page + client form)

**Files:** Create `src/app/(site)/contact/page.tsx` and `src/app/(site)/contact/ContactForm.tsx`; Delete `src/pages/contact.jsx`.

The current `contact.jsx` is a client form (`useState`, `useRouter`). A client component cannot export `metadata`, so split it.

- [ ] **Step 1: Create `src/app/(site)/contact/ContactForm.tsx`**

Add `'use client'` as line 1, then paste the ENTIRE current `src/pages/contact.jsx` content **except** its `<Head>...</Head>` block, and:
- change `import { useRouter } from 'next/router'` → `import { useRouter } from 'next/navigation'` (the `.push('/thank-you')` call is identical in `next/navigation`),
- rename the exported function `Contact` → `ContactForm` and keep it the default export,
- drop the `import Head from 'next/head'` line and the `<Head>` JSX.

- [ ] **Step 2: Create `src/app/(site)/contact/page.tsx`**

```tsx
import type { Metadata } from 'next'
import ContactForm from './ContactForm'

export const metadata: Metadata = {
  title: 'Contact',
  description: 'Have a question or proposal? Use the form to get in touch.',
}

export default function ContactPage() {
  return <ContactForm />
}
```

- [ ] **Step 3: Verify**

Run: `npx tsc --noEmit`
Expected: clean.

- [ ] **Step 4: Commit**

```bash
git add "src/app/(site)/contact"
git rm src/pages/contact.jsx
git commit -m "feat: migrate contact to App Router (server page + client form)"
```

---

## Task 6: Migrate projects (server page + client body)

**Files:** Create `src/app/(site)/projects/page.tsx` and `src/app/(site)/projects/ProjectsContent.tsx`; Delete `src/pages/projects.jsx`.

`projects.jsx` is client-heavy (`useState`, `motion`, `BorderGlow`). Split it.

- [ ] **Step 1: Create `src/app/(site)/projects/ProjectsContent.tsx`**

Add `'use client'` as line 1, then paste the ENTIRE current `src/pages/projects.jsx` **except** its `<Head>...</Head>` block; rename the default-export `Projects` → `ProjectsContent`; remove `import Head from 'next/head'` and the `<Head>` JSX. Keep all other imports (motion, BorderGlow, AgenticBall, image imports, etc.) unchanged.

- [ ] **Step 2: Create `src/app/(site)/projects/page.tsx`**

```tsx
import type { Metadata } from 'next'
import ProjectsContent from './ProjectsContent'

export const metadata: Metadata = {
  title: 'Projects',
  description: "Things I've made trying to put my dent in the universe.",
}

export default function ProjectsPage() {
  return <ProjectsContent />
}
```

- [ ] **Step 3: Verify**

Run: `npx tsc --noEmit`
Expected: clean.

- [ ] **Step 4: Commit**

```bash
git add "src/app/(site)/projects"
git rm src/pages/projects.jsx
git commit -m "feat: migrate projects to App Router (server page + client body)"
```

---

## Task 7: Migrate MDX articles

**Files:**
- Move: `src/pages/articles/<slug>/index.mdx` (+ images) → `src/content/articles/<slug>/index.mdx`
- Modify: `src/lib/getAllArticles.js`, `src/components/ArticleLayout.jsx`
- Create: `src/app/(site)/articles/page.tsx`, `src/app/(site)/articles/[slug]/page.tsx`
- Delete: `src/pages/articles/**`

- [ ] **Step 1: Move the MDX content out of the route tree**

```bash
mkdir -p src/content/articles
git mv src/pages/articles/neatsuite-http src/content/articles/neatsuite-http
git mv src/pages/articles/setting-up-alpinejs-in-suitescript src/content/articles/setting-up-alpinejs-in-suitescript
git mv src/pages/articles/introducing-custom-modules-for-netsuite-suitescript src/content/articles/introducing-custom-modules-for-netsuite-suitescript
git mv src/pages/articles/suitecloud-monorepo-support-pr-865 src/content/articles/suitecloud-monorepo-support-pr-865
```
(The `.png` images colocated in `introducing-custom-modules-...` move with the folder. The MDX references them via relative markdown image syntax, which the `@next/mdx` loader resolves on import.)

- [ ] **Step 2: Repoint `src/lib/getAllArticles.js`**

```js
import glob from 'fast-glob'
import * as path from 'path'

async function importArticle(articleFilename) {
  let { meta, default: component } = await import(
    `../content/articles/${articleFilename}`
  )
  return {
    slug: articleFilename.replace(/(\/index)?\.mdx$/, ''),
    ...meta,
    component,
  }
}

export async function getAllArticles() {
  let articleFilenames = await glob(['*/index.mdx'], {
    cwd: path.join(process.cwd(), 'src/content/articles'),
  })

  let articles = await Promise.all(articleFilenames.map(importArticle))

  return articles.sort((a, z) => new Date(z.date) - new Date(a.date))
}
```

- [ ] **Step 3: Adapt `src/components/ArticleLayout.jsx`** — remove `next/head`, drop SEO `<Head>` (now handled by `generateMetadata`), and replace the back button.

Apply these edits:
1. Replace lines 1–2:
   ```jsx
   import Head from 'next/head'
   import { useRouter } from 'next/compat/router'
   ```
   with:
   ```jsx
   'use client'
   import { useRouter } from 'next/navigation'
   import Link from 'next/link'
   ```
2. Change the signature: drop `isRssFeed`/`previousPathname` handling is kept for RSS (see note), but the back button no longer depends on `previousPathname`. Keep the `isRssFeed` early-return (`if (isRssFeed) return children`) — the RSS builder still uses it.
3. Delete the entire `<Head>...</Head>` block (lines ~56–86) and the SEO variable computations that only fed it (`siteUrl`, `resolveUrl`, `canonicalUrl`, `keywords`, `ogImage`) — those move to `generateMetadata` in the route.
4. Replace the back button: render it always (not gated on `previousPathname`), using `router.back()`:
   ```jsx
   <button
     type="button"
     onClick={() => router.back()}
     aria-label="Go back to articles"
     className="group mb-8 flex h-10 w-10 items-center justify-center rounded-full bg-white shadow-md shadow-zinc-800/5 ring-1 ring-zinc-900/5 transition dark:border dark:border-zinc-700/50 dark:bg-zinc-800 dark:ring-0 dark:ring-white/10 dark:hover:border-zinc-700 dark:hover:ring-white/20 lg:absolute lg:-left-5 lg:top-0 lg:mb-0 xl:top-0 xl:left-0"
   >
     <ArrowLeftIcon className="h-4 w-4 stroke-zinc-500 transition group-hover:stroke-zinc-700 dark:stroke-zinc-500 dark:group-hover:stroke-zinc-400" />
   </button>
   ```
   Keep the `Container`/`Prose`/`<article>`/`<header>`/`formatDate(meta.date)` structure unchanged.

> RSS note: the builder renders `<article.component isRssFeed />`. With `ArticleLayout` now `'use client'`, server-side `renderToStaticMarkup` of a client component still works (it renders its current output). The `isRssFeed` early-return returns raw `children` (the MDX body), which is what RSS wants.

- [ ] **Step 4: Create `src/app/(site)/articles/[slug]/page.tsx`**

```tsx
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { ArticleLayout } from '@/components/ArticleLayout'
import { getAllArticles } from '@/lib/getAllArticles'

export const dynamicParams = false

export async function generateStaticParams() {
  const articles = await getAllArticles()
  return articles.map((a) => ({ slug: a.slug }))
}

async function loadArticle(slug: string) {
  try {
    const mod = await import(`@/content/articles/${slug}/index.mdx`)
    return { meta: mod.meta, Post: mod.default }
  } catch {
    return null
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const loaded = await loadArticle(slug)
  if (!loaded) return {}
  const { meta } = loaded
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, '')
  const canonical = meta.canonical
  const ogImage =
    meta.og_image && siteUrl && meta.og_image.startsWith('/')
      ? `${siteUrl}${meta.og_image}`
      : meta.og_image
  return {
    title: meta.title,
    description: meta.description,
    authors: meta.author ? [{ name: meta.author }] : undefined,
    keywords: Array.isArray(meta.keywords)
      ? meta.keywords
      : meta.keywords
        ? String(meta.keywords).split(',').map((k: string) => k.trim())
        : undefined,
    alternates: canonical ? { canonical } : undefined,
    openGraph: {
      type: 'article',
      title: meta.title,
      description: meta.description,
      url: canonical,
      images: ogImage ? [{ url: ogImage }] : undefined,
      publishedTime: meta.date,
    },
    twitter: {
      card: ogImage ? 'summary_large_image' : 'summary',
      title: meta.title,
      description: meta.description,
      images: ogImage ? [ogImage] : undefined,
    },
  }
}

export default async function ArticlePage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const loaded = await loadArticle(slug)
  if (!loaded) notFound()
  const { meta, Post } = loaded
  return (
    <ArticleLayout meta={meta}>
      <Post />
    </ArticleLayout>
  )
}
```

- [ ] **Step 5: Create `src/app/(site)/articles/page.tsx`**

```tsx
import type { Metadata } from 'next'
import { Card } from '@/components/Card'
import { SimpleLayout } from '@/components/SimpleLayout'
import { getAllArticles } from '@/lib/getAllArticles'
import { formatDate } from '@/lib/formatDate'

export const metadata: Metadata = {
  title: 'Articles',
  description:
    'All of my long-form thoughts on programming, leadership, product design, and more, collected in chronological order.',
}

function Article({ article }: { article: any }) {
  return (
    <article className="md:grid md:grid-cols-4 md:items-baseline">
      <Card className="md:col-span-3">
        <Card.Title href={`/articles/${article.slug}`}>
          {article.title}
        </Card.Title>
        <Card.Eyebrow as="time" dateTime={article.date} className="md:hidden" decorate>
          {formatDate(article.date)}
        </Card.Eyebrow>
        <Card.Description>{article.description}</Card.Description>
        <Card.Cta>Read article</Card.Cta>
      </Card>
      <Card.Eyebrow as="time" dateTime={article.date} className="mt-1 hidden md:block">
        {formatDate(article.date)}
      </Card.Eyebrow>
    </article>
  )
}

export default async function ArticlesIndex() {
  const articles = (await getAllArticles()).map(({ component, ...meta }) => meta)
  return (
    <SimpleLayout
      title="Writing on software design, company building, and the art industry."
      intro="All of my long-form thoughts on programming, leadership, product design, and more, collected in chronological order."
    >
      <div className="md:border-l md:border-zinc-100 md:pl-6 md:dark:border-zinc-700/40">
        <div className="flex max-w-3xl flex-col space-y-16">
          {articles.map((article) => (
            <Article key={article.slug} article={article} />
          ))}
        </div>
      </div>
    </SimpleLayout>
  )
}
```

- [ ] **Step 6: Delete the old Pages article routes**

```bash
git rm -r src/pages/articles
```

- [ ] **Step 7: Verify**

Run: `npx tsc --noEmit && grep -rn "next/head\|next/compat/router" src/components/ArticleLayout.jsx || echo "ArticleLayout clean"`
Expected: tsc clean; "ArticleLayout clean".

- [ ] **Step 8: Commit**

```bash
git add src/content src/lib/getAllArticles.js src/components/ArticleLayout.jsx "src/app/(site)/articles"
git rm -r src/pages/articles 2>/dev/null; true
git commit -m "feat: migrate MDX articles to App Router (content dir + dynamic route)"
```

---

## Task 8: RSS route handlers

**Files:**
- Create: `src/lib/buildFeed.js`
- Create: `src/app/(site)/rss/feed.xml/route.ts`, `src/app/(site)/rss/feed.json/route.ts`
- Delete: `src/lib/generateRssFeed.js`

- [ ] **Step 1: Create `src/lib/buildFeed.js`** (refactor of `generateRssFeed.js` — builds the feed, no filesystem write)

```js
import ReactDOMServer from 'react-dom/server'
import { Feed } from 'feed'

import { getAllArticles } from './getAllArticles'

export async function buildFeed() {
  let articles = await getAllArticles()
  let siteUrl = process.env.NEXT_PUBLIC_SITE_URL
  let author = { name: 'Alec Mingione', email: 'amware.develop@gmail.com' }

  let feed = new Feed({
    title: author.name,
    description: 'Writing on software design, company building, and more.',
    author,
    id: siteUrl,
    link: siteUrl,
    image: `${siteUrl}/favicon.ico`,
    favicon: `${siteUrl}/favicon.ico`,
    copyright: `All rights reserved ${new Date().getFullYear()}`,
    feedLinks: {
      rss2: `${siteUrl}/rss/feed.xml`,
      json: `${siteUrl}/rss/feed.json`,
    },
  })

  for (let article of articles) {
    let url = `${siteUrl}/articles/${article.slug}`
    let html = ReactDOMServer.renderToStaticMarkup(
      <article.component isRssFeed />
    )
    feed.addItem({
      title: article.title,
      id: url,
      link: url,
      description: article.description,
      content: html,
      author: [author],
      contributor: [author],
      date: new Date(article.date),
    })
  }

  return feed
}
```

> Keep the `.js` extension (it contains JSX) so the existing JSX loader handles it, matching the old `generateRssFeed.js`.

- [ ] **Step 2: Create `src/app/(site)/rss/feed.xml/route.ts`**

```ts
import { buildFeed } from '@/lib/buildFeed'

export const revalidate = 3600

export async function GET() {
  const feed = await buildFeed()
  return new Response(feed.rss2(), {
    headers: { 'Content-Type': 'application/rss+xml; charset=utf-8' },
  })
}
```

- [ ] **Step 3: Create `src/app/(site)/rss/feed.json/route.ts`**

```ts
import { buildFeed } from '@/lib/buildFeed'

export const revalidate = 3600

export async function GET() {
  const feed = await buildFeed()
  return new Response(feed.json1(), {
    headers: { 'Content-Type': 'application/feed+json; charset=utf-8' },
  })
}
```

- [ ] **Step 4: Delete the old generator**

```bash
git rm src/lib/generateRssFeed.js
```

- [ ] **Step 5: Verify**

Run: `npx tsc --noEmit`
Expected: clean. (The old `public/rss/feed.xml`/`feed.json` static files, if present, are now superseded by the routes; remove them in Task 10.)

- [ ] **Step 6: Commit**

```bash
git add src/lib/buildFeed.js "src/app/(site)/rss"
git rm src/lib/generateRssFeed.js
git commit -m "feat: serve RSS via App Router route handlers"
```

---

## Task 9: Migrate the home page (server data + client body)

**Files:** Create `src/app/(site)/page.tsx` and `src/app/(site)/HomeContent.tsx`; Delete `src/pages/index.jsx`.

The home page is client-heavy (`motion`, `Typewriter`, `dynamic(..,{ssr:false})`) and needs the 4 most-recent articles.

- [ ] **Step 1: Create `src/app/(site)/HomeContent.tsx`**

Add `'use client'` as line 1, then paste the ENTIRE current `src/pages/index.jsx` **except**:
- remove `import Head from 'next/head'` and the `<Head>...</Head>` block,
- remove `import { generateRssFeed } from '@/lib/generateRssFeed'`,
- remove the `getStaticProps` function at the bottom,
- change the default export from `export default function Home({ articles })` to `export default function HomeContent({ articles })` (it still receives `articles` as a prop),
- keep the `dynamic(() => import('@/components/ui/orbiting-skills'), { ssr: false })` (valid inside a client component) and all `motion`/`Typewriter` usage.

- [ ] **Step 2: Create `src/app/(site)/page.tsx`**

```tsx
import type { Metadata } from 'next'
import HomeContent from './HomeContent'
import { getAllArticles } from '@/lib/getAllArticles'

export const metadata: Metadata = {
  title: {
    absolute: 'Alec Mingione - Fractional CTO, Software Engineer & Founder',
  },
  description:
    "I'm Alec Mingione, a fractional CTO and software engineer based in Phoenix, Arizona. I bridge the gap between business strategy and technical execution — from whiteboard architecture to investor-ready unit economics.",
}

export default async function HomePage() {
  const articles = (await getAllArticles())
    .slice(0, 4)
    .map(({ component, ...meta }) => meta)
  return <HomeContent articles={articles} />
}
```

- [ ] **Step 3: Delete the old home**

```bash
git rm src/pages/index.jsx
```

- [ ] **Step 4: Verify**

Run: `npx tsc --noEmit`
Expected: clean.

- [ ] **Step 5: Commit**

```bash
git add "src/app/(site)/page.tsx" "src/app/(site)/HomeContent.tsx"
git rm src/pages/index.jsx
git commit -m "feat: migrate home page to App Router (server data + client body)"
```

---

## Task 10: Remove the Pages Router and finalize

**Files:**
- Delete: `src/pages/_app.jsx`, `src/pages/_document.jsx`, the now-empty `src/pages/`, `public/rss/*` (stale static feeds), and B1's superseded chrome (`src/components/site/SiteShell.tsx`, `SiteHeader.tsx`, `SiteModeToggle.tsx`, `ThemeScript.tsx`, `SiteFooter.tsx`)
- Modify: `next.config.mjs`
- Create: `src/app/not-found.tsx`

- [ ] **Step 1: Confirm every Pages route is migrated**

Run: `ls src/pages 2>/dev/null; find src/pages -name "*.jsx" -o -name "*.mdx" 2>/dev/null`
Expected: only `_app.jsx` and `_document.jsx` remain (no other routes).

- [ ] **Step 2: Create `src/app/not-found.tsx`**

```tsx
import Link from 'next/link'
import { Container } from '@/components/Container'

export default function NotFound() {
  return (
    <Container className="flex h-full items-center pt-16 sm:pt-32">
      <div className="flex flex-col items-center">
        <p className="text-base font-semibold text-zinc-400 dark:text-zinc-500">
          404
        </p>
        <h1 className="mt-4 text-4xl font-bold tracking-tight text-zinc-800 dark:text-zinc-100 sm:text-5xl">
          Page not found
        </h1>
        <p className="mt-4 text-base text-zinc-600 dark:text-zinc-400">
          Sorry, we couldn’t find the page you’re looking for.
        </p>
        <Link href="/" className="mt-4 text-sm font-medium text-teal-500">
          Go back home
        </Link>
      </div>
    </Container>
  )
}
```

- [ ] **Step 3: Delete the Pages Router + superseded files**

```bash
git rm src/pages/_app.jsx src/pages/_document.jsx
git rm "src/components/site/SiteShell.tsx" "src/components/site/SiteHeader.tsx" "src/components/site/SiteModeToggle.tsx" "src/components/site/ThemeScript.tsx" "src/components/site/SiteFooter.tsx"
rm -rf public/rss 2>/dev/null; true
```

- [ ] **Step 4: Update `next.config.mjs`** — drop MDX from `pageExtensions` (MDX is now imported, not routed). Change the `pageExtensions` line to:

```js
  pageExtensions: ['js', 'jsx', 'ts', 'tsx'],
```
Leave `withPayload(withMDX(nextConfig))` and the `withMDX` block unchanged (it still compiles imported `.mdx`).

- [ ] **Step 5: Confirm no stragglers**

Run:
```bash
grep -rn "next/head\|next/compat/router\|next/document\|getStaticProps\|getServerSideProps\|@/components/site/Site\|generateRssFeed" src --include=*.jsx --include=*.tsx --include=*.js --include=*.ts | grep -v node_modules
```
Expected: no output (every reference removed). Investigate and fix any hit.

- [ ] **Step 6: Verify**

Run: `npx tsc --noEmit && pnpm lint`
Expected: tsc clean; lint passes (if the `no-img-element` crash from the foundation env issue appears, that's the stray `~/package-lock.json`, not this change).

- [ ] **Step 7: Format**

Run:
```bash
npx prettier --write "src/app/(site)/**/*.{ts,tsx}" "src/components/AppHeader.jsx" "src/components/StagewiseInit.jsx" "src/components/ArticleLayout.jsx" "src/lib/getAllArticles.js" "src/lib/buildFeed.js" src/mdx-components.tsx next.config.mjs
```

- [ ] **Step 8: Commit**

```bash
git add -A
git commit -m "feat: remove Pages Router — unified App Router stack"
```

---

## Task 11: Final verification (user environment)

- [ ] **Step 1: Production build**

Run: `pnpm build`
Expected: succeeds; the route list shows home, `/about`, `/uses`, `/speaking`, `/thank-you`, `/contact`, `/projects`, `/articles`, `/articles/[slug]`, `/rss/feed.xml`, `/rss/feed.json`, plus B1's `/products|courses|services|blog` and `/admin`,`/api/*` — and **no Pages routes**.

- [ ] **Step 2: Manual parity (user runs `pnpm dev`)**

Visit each migrated route and confirm parity with the prior site: layout/chrome identical, **home avatar shrinks on scroll**, dark-mode toggles with no flash, each page's `<head>` has the right title/description, MDX articles render (incl. the article with images), `/articles` lists all, `/rss/feed.xml` + `/rss/feed.json` return valid feeds, the back button on an article works, the contact form still posts and redirects to `/thank-you`.

- [ ] **Step 3: Code quality + security review** over all created/modified files; commit any fixes.

---

## Self-Review Notes (spec coverage)

- `(site)/layout.tsx` absorbs `_app`+`_document` (fonts, CSS, theme script, RSS links, metadata, Analytics, stagewise) → Task 3 ✓
- Full `Header` ported (avatar morph, `next/navigation`) and imported into the layout → Tasks 2, 3 ✓
- Static pages + contact + projects migrated, `next/head` → Metadata API → Tasks 4, 5, 6 ✓
- MDX moved to `src/content`, `mdx-components.tsx`, dynamic `[slug]` route, `ArticleLayout` adapted, `getAllArticles` repointed → Tasks 1, 7 ✓
- RSS as route handlers, build side-effect removed → Task 8 ✓
- Home `getStaticProps` → server component data fetch; client body split → Task 9 ✓
- Pages Router removed; `pageExtensions` drops `mdx`; `not-found.tsx`; straggler grep → Task 10 ✓
- Coexistence rule (add App + delete Pages per route together) → every migration task ✓
- `router.back()` back-button (confirmed) → Task 7 ✓
- Verification (tsc/lint/prettier/build/manual/review) → Tasks per-step + 10, 11 ✓
