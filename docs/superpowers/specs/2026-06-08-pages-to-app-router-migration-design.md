# Pages Router → App Router Migration — Design Spec

**Date:** 2026-06-08
**Status:** Draft for review
**Author:** Alec M (with Claude)
**Relates to:** B1 (`2026-06-07-payload-content-rendering-b1-design.md`) introduced the `src/app/(site)` group; this migration absorbs the whole Pages Router into it.

## Goal

Unify the stack on the **App Router**: migrate every `src/pages` route into the `src/app/(site)` group **incrementally** (App + Pages coexist during the move; site stays shippable), then **delete the Pages Router** (`_app.jsx`, `_document.jsx`, `src/pages/**`) once everything is migrated and verified. Behavior is preserved — the home-page avatar-morph animation, MDX articles, RSS feeds, dark-mode no-flash, and per-page SEO.

## Locked Decisions

| Decision | Choice | Rationale |
|---|---|---|
| Header / chrome | **Port the full animated `Header`** to App Router; it becomes the single unified shell, retiring B1's slim `SiteShell`/`SiteHeader` | Preserves the signature home avatar-morph + scroll behavior |
| MDX articles | Keep authoring as `.mdx` files, rendered in App Router via **dynamic import from a content dir** wrapped in `ArticleLayout` | Pure router migration; no content migration to Payload (that's a later option) |
| Approach | **Incremental, route-by-route**; Pages removed last | Site stays live and verifiable throughout |
| Root layout | The `(site)/layout.tsx` becomes **the single public-site root layout**; `(payload)` keeps its own | One unified shell; Payload admin stays isolated |
| `/articles` (MDX) vs `/blog` (Payload) | Stay separate for this migration | Merging sources is out of scope here |

## Target Architecture

```
src/app/
  (payload)/         UNCHANGED — admin + REST/GraphQL
  (site)/            THE public site (App Router)
    layout.tsx         root layout: <html><body>, fonts, global CSS, theme script,
                       default + template metadata, RSS <link>, <SiteShell>
    page.tsx           home (was pages/index.jsx) — avatar morph via ported Header
    about/page.tsx     uses/page.tsx  speaking/page.tsx  thank-you/page.tsx
    contact/page.tsx   (native form — already built in foundation; ported to App)
    projects/page.tsx  ('use client' — motion/BorderGlow, was pages/projects.jsx)
    articles/page.tsx          index (globs content meta)
    articles/[slug]/page.tsx   dynamic-imports MDX, wraps ArticleLayout
    rss/feed.xml/route.ts      RSS 2.0 route handler
    rss/feed.json/route.ts     JSON feed route handler
    products|courses|services|blog/…   (B1 — unchanged, already in (site))
    not-found.tsx      site 404 (replaces the Pages default)
  ── deleted at the end ──  src/pages/**, _app.jsx, _document.jsx
src/content/articles/<slug>/index.mdx   MDX moved OUT of the route tree (+ images)
src/components/
  Header.jsx            PORTED to App Router (next/navigation); the unified header
  Footer.jsx            reused as-is
  ArticleLayout.jsx     next/head removed (→ generateMetadata); back-button via next/navigation
  site/SiteShell.tsx    rewritten to compose the ported Header + Footer (drops slim header)
src/mdx-components.tsx   NEW — required by @next/mdx for App Router
src/lib/getAllArticles.js  repointed to glob src/content/articles
next.config.mjs          keep withPayload(withMDX(...)); pageExtensions drop 'mdx'/'md'
```

### Root layout (replaces `_app.jsx` + `_document.jsx`)
`(site)/layout.tsx` renders `<html><body>` and absorbs everything `_app`/`_document` did:
- Fonts (`Inter`, `JetBrains_Mono`) + global CSS imports (`tailwind.css`, `global.css`, `globals.css`).
- The **richer dark-mode script** from `_document.jsx` (`modeScript` — handles system change + `storage` events + transition suppression), inlined in `<head>` for no-flash.
- RSS `<link rel="alternate">` tags + the `impact-site-verification` meta.
- Default `metadata` (title template `%s - Alec Mingione`).
- `Analytics`, `SpeedInsights`, and the dev `stagewise` toolbar init (moved from `_app.jsx`).
- Wraps children in `<SiteShell>` (ported `Header` + `<main>` + `Footer`).

### Header port
`Header.jsx` keeps its avatar-morph + scroll/CSS-var logic but:
- Swaps `next/compat/router` → `next/navigation` (`usePathname()` for `isHomePage = pathname === '/'`).
- Drops the `previousPathname` plumbing (was passed from `_app`); the article back-button uses `useRouter().back()` from `next/navigation`.
- Stays a `'use client'` component. B1's `SiteModeToggle`/`ThemeScript`/`SiteHeader` are removed; the real `ModeToggle` (currently inside `Header.jsx`) is reused.

### MDX articles
- Move the 4 `.mdx` files (and their colocated images) from `src/pages/articles/<slug>/` to **`src/content/articles/<slug>/index.mdx`** (out of the route tree so they aren't auto-routed).
- Add **`src/mdx-components.tsx`** exporting `useMDXComponents()` (maps `img`→`next/image` or styled `<img>`, etc.).
- **`app/(site)/articles/[slug]/page.tsx`**: `const { default: Post, meta } = await import(\`@/content/articles/${slug}/index.mdx\`)`; render `<ArticleLayout meta={meta}><Post /></ArticleLayout>`; `generateMetadata` builds the SEO tags from `meta` (replacing `ArticleLayout`'s `next/head`); `generateStaticParams` lists slugs; `export const dynamicParams = false`.
- **`app/(site)/articles/page.tsx`**: server component using the repointed `getAllArticles()` (globs `src/content/articles`, imports each module's `meta`).
- Relative MDX images: import-based (`![](./img.png)` handled by the loader) or moved to `public/articles/<slug>/`; decided per-file in the plan.
- `next.config.mjs` `pageExtensions` drops `'mdx'`/`'md'` (MDX is now *imported*, not routed); the `withMDX` wrapper stays so imports still compile.

### RSS
Replace the build-time `public/rss` side-effect (currently fired from `index.jsx`'s `getStaticProps`) with two **route handlers**: `app/(site)/rss/feed.xml/route.ts` and `…/feed.json/route.ts`. Each calls `getAllArticles()`, builds the `Feed`, and returns the body with the right `Content-Type` (cached via `revalidate`). `src/lib/generateRssFeed.js` is refactored into a shared `buildFeed()` the handlers call; the filesystem write is removed.

### Per-page SEO
Every page's `next/head` block is replaced by App Router `metadata`/`generateMetadata` (home, about, uses, speaking, projects, thank-you, contact, articles). This removes all 9 `next/head` usages.

## Incremental Migration Order

Each route is migrated by **adding its App route and deleting its Pages file in the same step** (App and Pages must never own the same path simultaneously). Order chosen low-risk → high-risk:

1. **Scaffold (no route moves yet):** add `src/mdx-components.tsx`; create the App-Router-ported `Header` and **import it directly into `(site)/layout.tsx`** (with `Footer`) so it's available across the App Router; enrich `(site)/layout.tsx` (theme script, fonts, CSS, Analytics/SpeedInsights/stagewise, RSS links, metadata). **Confirmed:** the existing `Header.jsx` (on `next/compat/router`) keeps serving the not-yet-migrated **Pages** routes via `_app.jsx` during the transition — a deliberate, temporary two-header window — and is **deleted in the final cleanup** once no Pages route remains. No permanent fork.
2. **Static content pages:** `about`, `uses`, `speaking`, `thank-you`, `contact` → `app/(site)/<route>/page.tsx` (+ `metadata`), delete each `src/pages/<route>.jsx`.
3. **Projects:** `app/(site)/projects/page.tsx` as a `'use client'` component (motion/BorderGlow), delete `src/pages/projects.jsx`.
4. **Articles + RSS:** move MDX to `src/content`, repoint `getAllArticles`, add `articles/[slug]/page.tsx` + `articles/page.tsx`, adapt `ArticleLayout`, add the two RSS route handlers; delete `src/pages/articles/**`.
5. **Home:** `app/(site)/page.tsx` (async server component; `getStaticProps` "recent articles" → direct `getAllArticles()` call; avatar morph already handled by the ported Header); delete `src/pages/index.jsx`.
6. **Cleanup / remove Pages Router:** delete `_app.jsx`, `_document.jsx`, the old `Header.jsx` (if a temporary fork existed), any now-unused B1 slim-chrome files, and the empty `src/pages`; add `app/not-found.tsx`; drop `'mdx'`/`'md'` from `pageExtensions`; confirm no imports reference `src/pages` or `next/compat/router`/`next/head`.

## Coexistence & Conflict Rules

- **No shared path:** for any single URL, exactly one router owns it at a time — enforced by the add+delete-together rule per route.
- **Multiple root layouts during migration:** `(site)` and `(payload)` App roots plus the Pages `_document` coexist; they serve disjoint paths, which Next allows.
- **Global CSS:** imported by both `_app.jsx` and `(site)/layout.tsx` during the transition — scoped to each router's subtree, no bleed.
- **Dark mode:** both the `_document` script and the `(site)` layout script use the same `localStorage.isDarkMode` + `documentElement.dark` contract, so the theme is consistent across not-yet-migrated and migrated routes.

## Error Handling / Risks

- **Header scroll/avatar math in App Router** — the highest-risk port; verify the `--header-*`/`--avatar-*` CSS variables and scroll listeners behave identically; test home scroll on desktop + mobile.
- **MDX relative images** — confirm each article's images resolve after the content-dir move (import vs `public/`).
- **RSS handler rendering MDX** — `generateRssFeed` renders `<article.component isRssFeed />`; ensure the imported MDX modules still expose that shape from the content dir.
- **Missed `next/head`** — a page shipped without its `metadata` equivalent loses SEO; the cleanup step greps for any remaining `next/head`.
- **`getStaticProps` removal** — home + articles index data now fetched in server components; verify identical output and static generation.
- **`previousPathname` back-button** — replaced by `router.back()` (`next/navigation`); **confirmed acceptable** (no SSR-known previous path; moot once all routes are server-component App Router).

## Verification

Per route: `npx tsc --noEmit`, `pnpm lint`, `npx prettier --write`, and (in the user's env) `pnpm build` + a manual visual/parity check that the migrated route matches the old one (layout, dark mode, SEO `<head>`).
Final: `pnpm build` lists all routes under App Router with **no `src/pages` routes remaining**; RSS feeds validate; home animation works; every former `next/head` page has equivalent metadata; `/products`,`/courses`,`/services`,`/blog`,`/admin`,`/api/*` still work; code-quality + security review.

## Non-Goals

- Migrating MDX article content into Payload (separate future effort).
- Merging `/articles` and `/blog`.
- Redesigning any page; this is a router migration, not a visual change.
- Touching the `(payload)` group or the B1 `(site)` content routes beyond chrome unification.

## Future

- Optionally fold `/articles` (MDX) into Payload `/blog` for a single content source.
- Revisit `next/image` `remotePatterns` for Payload/Supabase media (carried over from B1).
