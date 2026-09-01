# Phase B1 — Content Collections + App Router Rendering — Design Spec

**Date:** 2026-06-07
**Status:** Draft for review
**Author:** Alec M (with Claude)
**Builds on:** `2026-06-03-payload-cms-integration-design.md` (foundation: Payload embedded, collections Users/Media/Articles/Projects/ContactSubmissions, admin + REST/GraphQL at `(payload)`)

## Goal

Add CMS-managed content types — **Products** (boilerplates are a Product type), **Courses** (+ Lessons), **Services** — and a **Payload-authored blog** path, and render them into the public site using **App Router server components** that read Payload's **Local API**. The existing Pages-Router site and all MDX articles remain untouched. B1 is **payment-agnostic**: prices display, but no checkout (that is B2 / Creem.io).

## Phase Map (the larger effort, sliced)

- **B1 (this spec):** content collections + public rendering. Usable on its own.
- **B2 (later):** commerce — Creem.io checkout for Products/Courses, entitlement records, "Buy" buttons wired.
- **B3 (later):** GitHub-invite automation — buyer supplies GitHub username at checkout; a GitHub App auto-invites them as a collaborator on the boilerplate repo upon successful payment.

## Non-Goals (this phase)

- Payments / checkout / entitlements (B2).
- GitHub access automation (B3).
- Full LMS: enrollment, student accounts, per-lesson progress, gated/paid lessons.
- Migrating existing MDX articles into Payload (a separate future migration).
- Rewriting the existing Pages-Router `projects.jsx` to read from the `Projects` collection (out of scope; it stays a hardcoded showcase. B1 does not touch it).

## Locked Decisions

| Decision | Choice | Rationale |
|---|---|---|
| Rendering | App Router server components reading Local API | User choice; no HTTP hop, typed, SEO-friendly |
| New route group | `src/app/(site)/` sibling to `(payload)` | Isolates new pages; Pages Router site untouched |
| Courses depth | Content-only catalog (Course → Lessons), no LMS | User choice; LMS deferred |
| Course content model | Separate `Lessons` collection, relationship → `courses` | Scales better than deeply-nested array fields |
| Products model | One generalized `Products` collection with a `type` (digital / boilerplate / service-package) | Boilerplates share 90% of fields with products; `githubRepo` field reserved for B3 |
| Blog routing | New Payload posts render at **`/blog`**; MDX stays at **`/articles`** | App & Pages Router cannot both own `/articles`; `/blog` avoids the conflict with zero risk to MDX |
| Shared chrome | New App-Router `SiteHeader`/`SiteFooter` shell mirroring the inner-page header (avatar + PillNav + ModeToggle) | The Pages `Header` is client-heavy and coupled to the home avatar-morph + scroll math; re-hosting it in App Router is risky. A slim shell gives visual parity safely |
| Caching | Per-route `revalidate` (ISR), published-only filter | Simple, fast; instant-update revalidation hooks noted as a B1 enhancement |
| Payments | None in B1 (price is display-only) | Commerce is B2 |

## Architecture

A continued **hybrid Next.js 15 app**. Three route groups now:

```
src/app/
  (payload)/   admin + REST/GraphQL API            [existing, foundation]
  (site)/      NEW public App-Router pages          [this phase]
    layout.tsx          server layout → <SiteShell> (client header/footer)
    products/page.tsx           listing
    products/[slug]/page.tsx    detail (+ generateMetadata, generateStaticParams)
    courses/page.tsx            listing
    courses/[slug]/page.tsx     detail — lessons grouped by module
    services/page.tsx           listing
    blog/page.tsx               Payload-authored posts listing
    blog/[slug]/page.tsx        Payload post detail (Lexical → React)
src/pages/      UNTOUCHED — home, /about, /articles (MDX), /projects, /uses, /contact
src/components/site/   NEW — SiteShell, SiteHeader, SiteFooter, RichText, content cards
src/lib/
  getPayloadClient.ts  NEW — cached getPayload({config}) singleton (avoids reconnect per request)
src/collections/
  Products.ts  Courses.ts  Lessons.ts  Services.ts   NEW
  Articles.ts  ← extended (coverImage; render path for Payload-authored posts)
```

- Server components import `getPayloadClient()` and call `payload.find(...)` directly — no fetch to `/api`.
- `getPayloadClient.ts` memoizes the Payload instance on `globalThis` so the Postgres pool is reused across requests in Fluid Compute.
- Lexical rich text renders via `@payloadcms/richtext-lexical/react`'s `RichText` component (server-rendered).

## Collections

### Products  (`slug: 'products'`)
Boilerplates are Products with `type: 'boilerplate'`.

| Field | Type | Notes |
|---|---|---|
| `name` | text (required) | |
| `slug` | text (required, unique, index) | route param |
| `type` | select: `digital` / `boilerplate` / `service-package` | drives template + B3 eligibility |
| `tagline` | text | one-liner for cards |
| `description` | richText (Lexical) | full body |
| `features` | array of `{ feature: text }` | bullet list |
| `techStack` | array of `{ tech: text }` | boilerplates |
| `price` | number | **display-only in B1** |
| `currency` | text, default `USD` | |
| `priceLabel` | text | e.g. "one-time", "from" |
| `heroImage` | upload → media | |
| `gallery` | array of `{ image: upload → media }` | |
| `githubRepo` | text | `owner/repo` — **reserved for B3**, unused in B1 |
| `demoUrl` | text | |
| `featured` | checkbox | homepage/sorting |
| `order` | number, default 0 | |
| `status` | select: draft / published (sidebar) | published-only public |

### Courses  (`slug: 'courses'`)
| Field | Type | Notes |
|---|---|---|
| `title` | text (required) | |
| `slug` | text (required, unique, index) | |
| `summary` | textarea | card + meta description |
| `description` | richText | overview body |
| `coverImage` | upload → media | |
| `level` | select: beginner / intermediate / advanced | |
| `price` | number (optional) | display-only |
| `featured` | checkbox | |
| `order` | number | |
| `status` | select: draft / published | |

### Lessons  (`slug: 'lessons'`)
| Field | Type | Notes |
|---|---|---|
| `title` | text (required) | |
| `slug` | text (required, index) | unique within a course (validated in a hook) |
| `course` | relationship → courses (required) | |
| `module` | text | grouping label; detail page groups by this |
| `order` | number, default 0 | ordering within module |
| `content` | richText | lesson body |
| `videoUrl` | text | optional embed |
| `durationMinutes` | number | |
| `isPreview` | checkbox | free preview flag (meaningful once B2 gating exists) |
| `status` | select: draft / published | |

> Course detail page: `payload.find({ collection: 'lessons', where: { course: { equals: id }, status: { equals: 'published' } }, sort: 'order' })`, then group by `module` in the component. No gating/progress in B1.

### Services  (`slug: 'services'`)
| Field | Type | Notes |
|---|---|---|
| `name` | text (required) | |
| `slug` | text (required, unique, index) | |
| `summary` | textarea | |
| `description` | richText | |
| `icon` | upload → media | |
| `startingPrice` | number (optional) | display-only |
| `order` | number | |
| `status` | select: draft / published | |

### Articles (extend existing)
Add `coverImage` (upload → media, optional). No breaking change. Distinguish sources:
- **MDX-backed** entries have `mdxSlug` set + empty `content` → already render from files at `/articles`.
- **Payload-authored** posts have `content` (Lexical) + no `mdxSlug` → render at `/blog/[slug]` (App Router).

All access additions are `read: () => true`; create/update/delete remain admin-only (default).

## Routing & the `/articles` vs `/blog` rule

Next.js forbids App Router and Pages Router owning the same path. Pages Router already owns `/articles` (index + `*.mdx`). Therefore:

- **MDX articles stay at `/articles`** (Pages Router, unchanged).
- **Payload-authored posts render at `/blog`** (App Router): `/blog` listing + `/blog/[slug]` detail.
- The two are cross-linked (a "More writing" link each way). Unifying everything under one route is a **later migration** (MDX → Payload), explicitly out of B1 scope.

## Shared Chrome (`SiteShell`)

The Pages `Header` does home-page avatar morphing + scroll math via CSS custom properties and `next/compat/router`; re-hosting it in App Router is high-risk. Instead:

- `src/components/site/SiteShell.tsx` — a `'use client'` shell rendering a **`SiteHeader`** (avatar link → `/`, the existing `PillNav`, `ModeToggle`) and **`SiteFooter`**, reusing existing presentational pieces (`Container`, `PillNav`, `ModeToggle`, footer markup) so the new pages match the **inner-page** header look (what every non-home page already shows).
- `(site)/layout.tsx` (server) imports global styles and wraps `children` in `<SiteShell>`.
- Dark mode: reuse the existing `documentElement.classList` 'dark' convention; `ModeToggle` already toggles it.

## Data Flow & Caching

```
App Router server component
   └─ getPayloadClient()                  // cached singleton
        └─ payload.find({ collection, where:{status:{equals:'published'}}, sort })
   └─ render (RichText for Lexical bodies)
```

- Listing/detail routes set `export const revalidate = 60` (ISR).
- Detail routes implement `generateStaticParams()` from published slugs and `generateMetadata()` from the doc (title, description/summary, ogImage).
- **Enhancement (noted, optional in B1):** Payload `afterChange`/`afterDelete` hooks on each collection call `revalidatePath()` / `revalidateTag()` for instant updates instead of waiting for ISR.

## Error Handling

- `not-found.tsx` per `(site)` segment; detail pages call `notFound()` when no published doc matches.
- Published-only filter everywhere public; empty-state UI for empty listings.
- Local API runs server-side only — `DATABASE_URI`/`PAYLOAD_SECRET` never reach the client.
- `getPayloadClient` guards against multiple inits in dev (HMR) via the `globalThis` cache.
- Build needs `DATABASE_URI` + `PAYLOAD_SECRET` present (already true for the foundation).

## Verification

1. `pnpm build` succeeds and lists new `(site)` routes (`/products`, `/products/[slug]`, `/courses`, `/courses/[slug]`, `/services`, `/blog`, `/blog/[slug]`) alongside unchanged Pages routes.
2. In `/admin`, create a published Product (incl. one `boilerplate`), Course with ≥2 Lessons across 2 modules, Service, and a Payload-authored Article → each appears on its public route; Lexical content renders.
3. `/`, `/about`, `/articles` (MDX index + an MDX article), `/projects`, `/uses`, `/contact` render identically to before.
4. New pages match the site's inner-page chrome (header/footer/dark mode).
5. `pnpm lint`, `npx prettier --write`, `npx tsc --noEmit` clean.
6. Code quality reviewer agent over new files.

## Open Risks

- **Chrome parity:** the slim `SiteShell` approximates, not byte-matches, the Pages header. Acceptable for B1; revisit if a pixel-perfect match is required.
- **Lexical rendering fidelity:** custom Lexical nodes (if added later) need matching React converters. B1 uses default nodes only.
- **Two blog routes** (`/articles` + `/blog`) is interim UX; resolved by the future MDX→Payload migration.

## Future Phases

- **B2 — Commerce (Creem.io):** checkout sessions for Products/Courses, webhook → `Purchases`/entitlement records, "Buy" CTAs, success/cancel routes.
- **B3 — GitHub automation:** GitHub App; on paid boilerplate purchase, invite the buyer's GitHub username to the repo/team; surface invite status.
- **Later:** MDX→Payload blog migration (unify under one route); full LMS (accounts, progress, gating) layered on B2 entitlements.
