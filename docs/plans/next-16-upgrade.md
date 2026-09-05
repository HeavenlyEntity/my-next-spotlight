# Scope: Next.js 15.4.11 → 16

Scoped 2026-09-04. **No code changed.** Read the official version-16 guide, then inventoried this repo against every breaking change in it.

Branch: `feat/payload-cms-integration` · Source: https://nextjs.org/docs/app/guides/upgrading/version-16

## Verdict

**Smaller than it looks, and worth doing.** The headline v16 break is the removal of synchronous Request APIs, and this repo already did that migration properly during v15: every `params` is typed `Promise<…>` and awaited, and `cookies()` / `headers()` / `draftMode()` appear nowhere. Almost the entire breaking-change list is a no-op here.

The real work is three things, none of them in application code: **the lint toolchain**, **the production build switching to Turbopack**, and **the dependency bumps**. Estimated **~half a day human / ~1.5h CC**.

The one genuinely risky surface is the **Payload admin**, which is coupled to Next internals more deeply than anything we wrote. It has to be exercised by hand.

## Target version

Payload 3.85 allows `>=16.2.6 <17.0.0`.

| Option              | Call                                                                                   |
| ------------------- | -------------------------------------------------------------------------------------- |
| **16.3.4** (latest) | **Recommended.** Inside Payload's range, newest fixes.                                 |
| 16.2.12             | Fallback. The floor Payload's range was written against; drop here if 16.3 misbehaves. |

## Compatibility — all green

| Requirement             | Needed                                | Have                    |                    |
| ----------------------- | ------------------------------------- | ----------------------- | ------------------ |
| Node.js                 | ≥ 20.9                                | 26.8.1                  | ok                 |
| TypeScript              | ≥ 5.1                                 | 5.9.3                   | ok                 |
| React / React DOM       | `^19.0.0` (Next), `^19.2.1` (Payload) | 19.2.4                  | ok, no bump needed |
| `@payloadcms/*` 3.85    | `>=16.2.6 <17.0.0`                    | —                       | ok at 16.2.6+      |
| `@next/mdx`             | 16.3.4 published, peers unchanged     | 15.5.13                 | straight bump      |
| `@creem_io/nextjs`      | `next >=13.0.0`                       | 0.5.0                   | ok                 |
| `eslint-config-next@16` | `eslint >=9.0.0`                      | **eslint 8.57.1 (EOL)** | **needs ESLint 9** |

`withPayload.cjs` already branches on `process.env.TURBOPACK === "auto"`, which is the Next 16 signal — Payload 3.85 is Next-16-aware, not merely tolerated.

## Inventory — every v16 breaking change vs this repo

### Already satisfied (no work)

| Breaking change                                                                  | This repo                                                                                        |
| -------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| **Async Request APIs** (the big one)                                             | All 7 `params` sites already `Promise<…>` + awaited. Zero `cookies()`/`headers()`/`draftMode()`. |
| Async `params`/`id` for `opengraph-image`, `twitter-image`, `icon`, `apple-icon` | No such routes exist.                                                                            |
| Async `id` for `sitemap` / `generateSitemaps`                                    | No sitemap route.                                                                                |
| `middleware` → `proxy` rename                                                    | No middleware file.                                                                              |
| Parallel route slots need `default.js`                                           | No `@slot` directories.                                                                          |
| `revalidateTag` second argument                                                  | Not used.                                                                                        |
| `unstable_cacheLife` / `unstable_cacheTag` / `unstable_rootParams`               | Not used.                                                                                        |
| `experimental_ppr`, `experimental.ppr`, `dynamicIO`, `useCache`                  | Not used.                                                                                        |
| **AMP removal** (`next/amp`, `amp` config)                                       | Not used.                                                                                        |
| `next/legacy/image`                                                              | Not used.                                                                                        |
| `serverRuntimeConfig` / `publicRuntimeConfig` / `next/config`                    | Not used.                                                                                        |
| `images.domains`                                                                 | Not set.                                                                                         |
| Local images with query strings need `localPatterns.search`                      | None.                                                                                            |
| `devIndicators` sub-options removed                                              | Not set.                                                                                         |
| Scroll-behavior override → `data-scroll-behavior`                                | No global `scroll-behavior: smooth`.                                                             |
| `process.argv.includes('dev')` in next.config                                    | Not used.                                                                                        |

### Real work

**1. Lint toolchain — the largest piece.** `next lint` is _removed_ in 16, and `@next/eslint-plugin-next` defaults to flat config.

- `package.json` `"lint": "next lint"` → ESLint CLI.
- `.eslintrc.json` (extends `next/core-web-vitals`) → `eslint.config.mjs` flat config.
- ESLint **8.57.1 → 9+**, because `eslint-config-next@16` requires `>=9.0.0`. 8.57.1 is EOL anyway.
- Codemod exists: `pnpm dlx @next/codemod@canary next-lint-to-eslint-cli .`
- **Touches our own verification workflow**, which is the part that will bite quietly: `AGENTS.md` and both founders plan docs prescribe "per-file `next lint`", and that is the command used to verify every change in this repo. It becomes `npx eslint <path>`.
- Unknown: ESLint 9 may surface new violations across the codebase. Budget for it.

**2. Production build moves to Turbopack.** Next 16 makes Turbopack the default for `next build`, and **fails the build if a webpack config is present**. Both plugins inject one:

- `@next/mdx` sets a `webpack()` key unconditionally (`node_modules/@next/mdx/index.js:30`).
- `withPayload` also touches webpack.

Neither is ours, which is exactly the case the guide's "Good to know" covers. Both also ship real Turbopack paths, and `dev` already runs `--turbopack` today, so MDX and Payload are _already_ compiling under Turbopack in development. Decision at implementation time: `next build --turbopack` (recommended, matches dev) or `next build --webpack` (conservative). Also drop the now-redundant `--turbopack` flag from the `dev` script.

**3. Dependency bumps.** `next` `~15.4.11` → `~16.3.4`; `eslint-config-next` to match; `@next/mdx` 15.5.13 → 16.3.4; `eslint` 8 → 9.

### Behaviour changes to verify, not fix

| Change                                           | Relevance here                                                                 |
| ------------------------------------------------ | ------------------------------------------------------------------------------ |
| `images.minimumCacheTTL` 60s → 4h                | 14 files use `next/image`. Cache-only; no code change.                         |
| `images.qualities` → `[75]` only                 | We never set a `quality` prop, and 75 was already the default. No-op.          |
| `images.imageSizes` drops `16`                   | Smaller `srcset`. No-op.                                                       |
| `images.maximumRedirects` → 3                    | No redirecting image sources.                                                  |
| Local-IP image optimisation blocked              | Not used in production.                                                        |
| Routing/prefetch overhaul                        | More requests, smaller total transfer. Watch the network panel.                |
| `size` / First Load JS dropped from build output | Cosmetic.                                                                      |
| `experimental.scrollRestoration`                 | **Unverified** — we set it. Confirm it is still a valid key in 16, or move it. |

### A constraint this upgrade removes

`next dev` now writes to `.next/dev`, separate from `next build`, with a lockfile preventing duplicate instances. **That retires the standing "never `pnpm build` while the dev server is running" rule** recorded in `AGENTS.md` and in memory. Worth updating both once we are on 16.

## Risks

1. **Payload admin (high).** Ships its own route handlers, RSC boundaries and server actions against Next internals. Peer range says 16.2.6+ is supported, but this must be exercised by hand: load `/admin`, log in, edit a collection, upload media.
2. **First Turbopack production build (medium).** Turbopack is proven in dev here, never in build.
3. **ESLint 9 fallout (medium, unknown size).** New rule defaults may light up existing files.
4. **MDX articles (low but real).** Four live articles imported dynamically at `articles/[slug]/page.jsx:13`; the loader path changes under a Turbopack build.

## Verification plan

1. `pnpm test` — 344 tests must stay green.
2. `npx tsc --noEmit`.
3. New ESLint CLI across `src/`, plus prettier on touched files.
4. `next build --turbopack` — now safe alongside a running dev server, which is itself part of what we are checking.
5. Browser pass: `/`, `/founders`, `/founders/equity`, `/founders/job-offer`, `/articles/[slug]` (MDX), `/blog`, `/products`.
6. **Payload admin by hand**: load, log in, edit a collection, upload to S3 storage.
7. Console clean on every route — we just fixed the only hydration mismatch, so any new one is from this upgrade.

## Task list

- [x] **U1** — DONE — bump `next`, `eslint-config-next`, `@next/mdx`, `eslint`; run `pnpm dlx @next/codemod@canary upgrade latest`; inspect the diff
- [x] **U2** — DONE — lint migration: flat config, `package.json` script, `AGENTS.md` + plan docs, fix new violations
- [x] **U3** — DONE — build strategy: pick `--turbopack`, drop the redundant `dev --turbopack`, confirm a clean production build
- [x] **U4** — DONE (still a valid key; no change needed) — verify `experimental.scrollRestoration` is still valid; adjust `next.config.mjs`
- [ ] **U5** — full verification pass incl. the manual Payload admin exercise
- [x] **U6** — DONE — retire the "no build while dev server runs" rule in `AGENTS.md` and memory

## Not in scope

Opt-in features this upgrade makes available but does not require: `cacheComponents` (PPR), `reactCompiler`, `updateTag`/`refresh` cache APIs, React 19.2 View Transitions / `useEffectEvent` / `Activity`. All are separate decisions.

## What actually happened (2026-09-04)

Landed on **16.3.4**. Two things the scope did not predict, both caught by the
first production build rather than by tests or lint:

1. **The RSS feed could not be prerendered.** `buildFeed.js` renders each
   article with `renderToStaticMarkup`, and every article's default export wraps
   `ArticleLayout`, which was a `'use client'` module. From the server that is a
   client _reference_, not a function, so calling it throws. Next 16 enforces
   this during prerender. Fixed by splitting the page chrome into
   `ArticleLayoutFull.jsx` and leaving `ArticleLayout` server-callable — it
   already had an `isRssFeed` branch that needs no client features.
2. **Two archived articles imported `next/image` directly**, which cannot be
   server-rendered for the feed either. Swapped for a plain `<img>` off the
   static import's `.src`, which keeps the feed shipping full article HTML.

Also fixed while here: a latent `tsc` error in `catalog-cards.jsx` where
`description = null` made TypeScript infer the prop type as `null`. It had gone
unnoticed because the earlier verification loop pointed `tsc` at a
non-existent `jsconfig.json` and silently passed.

The ESLint migration surfaced 21 errors from the React Compiler rule set that
`eslint-config-next@16` enables. All fixed rather than downgraded: `useMounted`
/ `useMediaQuery` / `useRootTheme` in `src/hooks/use-client-value.js` replace
six hand-rolled mount-and-subscribe effects, four "reset state when a prop
changes" effects became render-time comparisons, one redundant effect was
deleted outright, and the WebGL crown carries a file-scoped exemption because
react-three-fiber mutates by design.
