# Payload CMS Integration — Design Spec

**Date:** 2026-06-03
**Status:** Approved for planning
**Author:** Alec M (with Claude)

## Goal

Add a Payload CMS backend to the existing Amware portfolio site so content (articles, images, projects) and contact submissions can be managed in an admin panel and scale into structured data collections — **without changing the public-facing site** (one deliberate exception: the contact form). The project gains additive TypeScript support so Payload's TS code can live alongside the existing JavaScript untouched.

## Non-Goals (this phase)

- Wiring article/project **pages** to read from Payload. Articles continue to render from MDX exactly as today.
- Converting MDX rendering to Payload rich text.
- Full TypeScript conversion of existing `.jsx`/`.js` files.
- Custom admin UI components beyond Payload defaults.
- Supabase Database Webhooks (notifications use a Payload hook instead).
- Access control beyond basic admin auth.

## Locked Decisions

| Decision | Choice | Rationale |
|---|---|---|
| Topology | Embed Payload in this repo via App Router routes alongside the existing Pages Router | "Configuration is automatic," Local API access, one repo/deploy, no CORS/auth-between-services |
| Install method | Manual integration (Payload "add to existing Next.js app" docs) | Only path that preserves custom MDX `pageExtensions`, `_app.jsx`, and JS setup |
| TypeScript scope | Additive (`allowJs: true`); existing JSX untouched | Honors "don't modify the current codebase"; Payload requires TS |
| Database | Postgres via Supabase (`@payloadcms/db-postgres`) | Matches stack, relational/typed, scales for data collections |
| Media storage | Supabase Storage (S3-compatible, `@payloadcms/storage-s3`) | Vercel filesystem is ephemeral; one provider for DB + files |
| Collections | Users, Media, Articles, Projects, ContactSubmissions | Covers stated needs (articles, images, contact) + portfolio projects |
| Article rendering | Unchanged — still MDX | Zero front-facing change |
| Contact capture | Native React form → Payload API | User chose to own the form (replaces Deftform iframe) |
| Notification trigger | Payload `afterChange` hook → Resend | Same codebase, type-safe, always fires (all writes go through Payload) |
| Seed | Import the 4 existing MDX `meta` blocks into Articles | CMS demonstrates parity without changing what renders |

## Architecture

A single **hybrid Next.js 15 app** running Pages Router and App Router simultaneously.

```
src/
  pages/            UNTOUCHED — public site renders as today (Pages Router + MDX)
                    EXCEPTION: contact.jsx (native form replaces iframe)
  components/       UNTOUCHED .jsx
  lib/
    getAllArticles.js   UNTOUCHED — still globs MDX
    resend.ts           NEW — Resend email helper
  app/(payload)/    NEW — Payload admin (/admin) + REST/GraphQL API (/api)
  collections/      NEW — Users.ts, Media.ts, Articles.ts, Projects.ts, ContactSubmissions.ts
  payload.config.ts NEW — CMS definition
  payload-types.ts  NEW — generated types
scripts/
  seed-articles.ts  NEW — one-off import of existing MDX meta into Articles
```

- The two routers coexist natively in Next.js. Nothing in `src/pages` imports Payload (except the contact form posting to the API), so the public site is unchanged.
- `next.config.mjs` is composed: `withPayload(withMDX(nextConfig))`; `ts`/`tsx` are added to `pageExtensions` so App Router route files resolve.
- A new `tsconfig.json` (with `allowJs: true`) absorbs the existing `@/*` → `src/*` alias and adds `@payload-config`. `jsconfig.json` is retired (TypeScript's config supersedes it). No `.jsx` file is renamed.
- Data lives in Supabase Postgres; uploaded images go to a Supabase Storage bucket via the S3 adapter.

## Collections

### Users
Payload's built-in auth collection (email/password) gating `/admin`. First user created via the admin signup screen.

### Media
Upload-enabled collection. Files stored in the Supabase bucket via `@payloadcms/storage-s3`. Fields: `alt` (text). Image sizes optional/default.

### Articles
Fields mirror the existing MDX `meta` so the model is a faithful superset:

| Field | Type | Notes |
|---|---|---|
| `title` | text (required) | |
| `slug` | text (required, unique, indexed) | matches MDX folder slug |
| `publishedDate` | date (required) | maps to `meta.date` |
| `author` | text | default "Alec Mingione" |
| `description` | textarea | |
| `keywords` | array of text (`keyword` per row) | managed in the CMS for SEO ranking; seed splits MDX `meta.keywords` into rows |
| `canonical` | text | |
| `ogImage` | relationship → Media | maps to `meta.og_image`; seed leaves it empty since MDX uses string paths |
| `content` | richText (Lexical) | empty for seeded MDX-backed entries |
| `mdxSlug` | text | links a CMS entry to its file-based MDX article |
| `status` | select: draft / published | |

> Article **pages do not read these fields this phase.** The collection exists for management and future rendering.

### Projects
Mirrors `projects.jsx`: `name`, `description`, `link` (group: `url`, `label`), `logo` (relationship → Media), `order` (number). Not yet consumed by the page.

### ContactSubmissions
Captures native-form submissions. Fields: `name`, `email`, `subject`, `message`, `status` (select: new / read / archived, default new). `createdAt` is automatic. Admin-readable in `/admin`. `create` allowed to public (the form), `read/update/delete` restricted to authenticated users.

## Contact Submission Flow

```
Native React form (src/pages/contact.jsx, styled to match current card)
        │  POST (create ContactSubmissions)
        ▼
Payload /api  ──►  ContactSubmissions  ──►  Supabase Postgres
                          │ afterChange hook (operation === 'create')
                          ├──► Resend: notify owner of submission
                          └──► Resend: thank-you email to submitter
        │
        ▼
  client redirects to existing /thank-you page
```

- `contact.jsx` is the **single intentional front-facing change**: the Deftform iframe is replaced with a native React form. The form is built using the **`frontend-design` skill** during implementation, matching the current container styling (`rounded-3xl ring-1 ring-zinc-200 dark:ring-zinc-700`, same `SimpleLayout` title/intro). Fields: name, email, subject, message.
- On submit the form creates a ContactSubmissions document via Payload's REST API, then redirects to `/thank-you` (unchanged page).
- The `afterChange` hook (in `ContactSubmissions.ts`) runs on create and calls the `resend.ts` helper twice: one owner-notification email and one submitter thank-you email. Failures are caught/logged and do not block the write.
- `src/lib/resend.ts` wraps the Resend SDK with `RESEND_API_KEY` and a verified `from` address.

## Configuration & Environment

`next.config.mjs`:
```js
import { withPayload } from '@payloadcms/next/withPayload'
// nextConfig gains 'ts','tsx' in pageExtensions
export default withPayload(withMDX(nextConfig))
```

New env vars (added to `.env.example`, real values in `.env.local`):

| Var | Purpose |
|---|---|
| `DATABASE_URI` | Supabase Postgres connection string |
| `PAYLOAD_SECRET` | Payload encryption/JWT secret |
| `S3_BUCKET` | Supabase Storage bucket name |
| `S3_REGION` | Supabase storage region |
| `S3_ENDPOINT` | Supabase S3-compatible endpoint |
| `S3_ACCESS_KEY_ID` | Supabase storage access key |
| `S3_SECRET_ACCESS_KEY` | Supabase storage secret |
| `RESEND_API_KEY` | Resend API key |
| `RESEND_FROM` | Verified sender address on the `amware.dev` domain (already verified) |
| `CONTACT_NOTIFY_TO` | Owner address to receive submission notices |

Existing `NEXT_PUBLIC_SITE_URL`, `NEXT_PUBLIC_DEFORM_API_KEY`, `REACTBITS_LICENSE_KEY` remain.

## Dependencies

Runtime: `payload`, `@payloadcms/next`, `@payloadcms/db-postgres`, `@payloadcms/richtext-lexical`, `@payloadcms/storage-s3`, `resend`, `sharp`, `graphql`.
Dev: `typescript`, `@types/react`, `@types/node`, `@types/react-dom`.

`package.json` scripts add: `"payload": "payload"`, `"generate:types": "payload generate:types"`.

## Seed Step

`scripts/seed-articles.ts` reads the existing MDX `meta` exports (via the same glob logic as `getAllArticles`) and upserts an Articles document per article (`title`, `slug`, `publishedDate`, `author`, `description`, `keywords`, `canonical`, `ogImage`, `mdxSlug = slug`, `status = published`, `content` left empty). Idempotent on `slug`. Run manually once after the DB is connected.

## Error Handling

- **Router coexistence:** App Router route files use `.tsx`; `pageExtensions` includes `ts`/`tsx`. Payload ships its own admin CSS scoped to the `(payload)` layout, so the site's Tailwind v4 `global.css` (imported only in Pages Router `_app.jsx`) does not leak into admin and vice-versa.
- **Build:** `next build` now builds Payload routes; `DATABASE_URI` and `PAYLOAD_SECRET` must be present at build/runtime.
- **Public site safety:** no existing component or page (other than `contact.jsx`) is edited; verified by visual/structural spot checks.
- **Resend failures:** caught and logged inside the hook; never block the submission write or the user's redirect.
- **Contact create permission:** public `create` only, with field validation; all other operations require auth.

## Verification

1. `pnpm lint` passes.
2. `npx prettier --write` on changed files.
3. `pnpm build` succeeds.
4. Home, About, Articles index, an article page, Projects, Uses, Speaking render identically to before (spot check).
5. `/admin` loads; first user can be created; CRUD works on all 5 collections.
6. A media upload lands in the Supabase bucket and is viewable.
7. `payload generate:types` produces `src/payload-types.ts`.
8. The seed script creates 4 Articles documents matching the MDX metadata.
9. A test contact submission: writes a ContactSubmissions row, sends the owner-notification email, sends the submitter thank-you email, and redirects to `/thank-you`.
10. Code quality reviewer agent run on changed files.

## Future Phases (not now)

- Render Articles/Projects pages from Payload (Local API in `getStaticProps`).
- MDX → Lexical rich-text migration for full content ownership.
- Incremental full TypeScript conversion of existing JSX.
- Optional Supabase Database Webhooks for external integrations.
