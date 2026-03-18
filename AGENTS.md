# Amware Portfolio Website

## Tech Stack

- **Next.js 16** (App Router) + **React 19** + **JavaScript**
- **Supabase** (Postgres, Auth, Storage)
- **Tailwind CSS 4** + Shadcn UI


## Essential Commands

```bash
pnpm dev                          # Start development
pnpm typecheck                    # Type check
pnpm lint:fix                     # Fix linting
pnpm format:fix                   # Format code
```

## Verification

After implementation, always run:
1. `pnpm lint:fix`
2. `pnpm format:fix`
3. Run code quality reviewer agent

## Learned User Preferences

- Follow plans verbatim; trust files and references; explore only when absolutely necessary
- Implement all proposed file changes first, then review together at the end
- `motion` imported from `motion/react`, never `framer-motion`; only use in client components
- Never start a dev server
- Loading skeletons cover only the main content area, not the nav sidebar
- Graceful error handling on public pages (loadError prop, fallback UI with refresh); throw on staff pages
- Use `.toFixed(2)` for price display (e.g. `$75.00`)
- Guard empty arrays before `.in('id', [])` — return an empty dataset instead of querying
- Escape HTML in email templates to prevent XSS
- Implement review/verification comments verbatim; fix section defines scope
- Prefer atomic DB operations (RPC, single UPDATE) over read-then-write patterns
