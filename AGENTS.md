# Amware Portfolio Website

## Tech Stack

- **Next.js 15** (Pages Router) + **React 19** + **JavaScript**
- **Supabase** (Postgres, Auth, Storage)
- **Tailwind CSS 4** + Shadcn UI
- **pnpm** as package manager

## Essential Commands

```bash
pnpm dev                          # Start development (TurboPack)
pnpm build                        # Production build
pnpm lint                         # Lint (no lint:fix script exists)
npx prettier --write <file>       # Format a file (no format:fix script exists)
```

## Verification

After implementation, always run:
1. `pnpm lint`
2. `npx prettier --write` on changed files
3. Run code quality reviewer agent

## Learned User Preferences

- Follow plans verbatim without editing plan files; trust files and references; implement all proposed changes first, then review together; explore only when absolutely necessary
- `motion` imported from `motion/react`, never `framer-motion`; only use in client components
- When fixing imports or patterns, apply the change across ALL files in the project
- Never start a dev server
- Loading skeletons cover only the main content area, not the nav sidebar
- Graceful error handling on public pages (loadError prop, fallback UI with refresh); throw on staff pages
- Card UIs should be minimal at rest; show supplementary details (status, expanded info) on hover/interaction only
- Images should display full content without cropping (`object-contain`); keep media flush (no extra top/bottom padding); clip images and overlays inside card borders
- About/ProfileCard spotlight UIs should shrink on mobile so the interaction stays playable without filling the viewport
- When grouping commits, use the gitmoji.dev convention
- Use `.toFixed(2)` for price display (e.g. `$75.00`)
- Guard empty arrays before `.in('id', [])` — return an empty dataset instead of querying; prefer atomic DB operations (RPC, single UPDATE) over read-then-write patterns

## Learned Workspace Facts

- App Router with route groups `src/app/(site)`, `(payload)`, and `(commerce)` — Pages Router under `src/pages` is gone
- CMS is Payload 3 on Postgres (`@payloadcms/db-postgres`); commerce integrates Creem (`@creem_io/nextjs`)
- Site positioning and meta use a fractional CTO tone; About narrative is engineer → architect → CTO with MBA as the business-technical bridge
- Project cards use `BorderGlow`, sort most-recent-first, and pull cover assets from `src/images/projects/`
