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

- Follow plans verbatim; trust files and references; explore only when absolutely necessary
- Implement all proposed file changes first, then review together at the end
- `motion` imported from `motion/react`, never `framer-motion`; only use in client components
- When fixing imports or patterns, apply the change across ALL files in the project
- Never start a dev server
- Loading skeletons cover only the main content area, not the nav sidebar
- Graceful error handling on public pages (loadError prop, fallback UI with refresh); throw on staff pages
- Card UIs should be minimal at rest; show supplementary details (status, expanded info) on hover/interaction only
- Images should display full content without cropping (`object-contain`); avoid fixed aspect ratios that add padding
- Use `.toFixed(2)` for price display (e.g. `$75.00`)
- Guard empty arrays before `.in('id', [])` — return an empty dataset instead of querying
- Prefer atomic DB operations (RPC, single UPDATE) over read-then-write patterns
