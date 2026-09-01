# Supabase Auth Foundation (Community Phase 1) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Give course learners real identity (Supabase Auth: GitHub OAuth + magic link) with auto-created profiles, and bridge existing email-keyed Creem purchases to accounts via an `entitlements` table — so entitled users see their full course on `/courses/[slug]` without a capability URL.

**Architecture:** Payload CMS stays the source of truth for content + commerce (courses, lessons, purchases). Supabase (the *same* Postgres — `DATABASE_URI` already points at `aws-1-us-east-1.pooler.supabase.com`) owns identity and member data in a dedicated `community` schema that Payload's migrations never touch. Trusted writes (claiming entitlements) happen server-side through a `pg` pool on `DATABASE_URI`; the browser only talks to Supabase Auth. RLS is enabled now (defense in depth + ready for Phase 2 client reads).

**Tech Stack:** Next.js 15 App Router, `@supabase/ssr` + `@supabase/supabase-js` (auth/session), `pg` (server-side community-schema access), Payload Local API (purchases lookup), Vitest (pure-logic tests).

**Key existing facts (verified in repo):**
- Purchases: Payload collection `purchases` — fields `email`, `item` (polymorphic relation; at `depth: 0` it is `{ relationTo, value }` where `value` is the numeric row id), `itemType` (`'product' | 'course' | 'service'`), `status` (`'paid' | 'refunded'`), `creemOrderId` (unique). Written by the Creem webhook with `overrideAccess: true`.
- Capability URLs: `/access/[token]` verified by `verifyAccessToken()` in `src/lib/commerce/accessToken.ts` (HMAC, payload `{ purchaseId, itemType, itemId, jti, exp }`).
- Course page `src/app/(site)/courses/[slug]/page.tsx` currently renders **all published lesson content publicly** via `CourseBody` (`src/components/site/CourseBody.jsx` renders `lesson.content` unconditionally). Task 11 gates this: non-entitled visitors see only `isPreview` lesson content.
- `getPayloadClient()` at `src/lib/getPayloadClient.ts` is the cached Payload Local API client.
- `scripts/reset-user-password.mjs` already establishes the "plain Node + pg + parse .env.local" pattern reused by the migration runner.
- There is no test framework yet; this plan introduces Vitest for pure logic only.
- Known issue: `pnpm lint` currently fails for an unrelated environment reason (stray `/Users/mipi-founder/package-lock.json` crashes an ESLint rule). Verification uses prettier + vitest; do not block on lint.

**Behavior change to be aware of:** after Task 11, anonymous visitors no longer see full lesson content on course pages — only preview lessons. This closes an existing content leak but is a visible change.

---

### Task 1: Manual prerequisites (Supabase dashboard + env)

No code. The human operator (or an agent using the connected Supabase MCP tools) must complete these before Tasks 4+ can be verified end-to-end. Tasks 2–5 can proceed in parallel with this.

- [ ] **Step 1: Collect Supabase project URL and anon key**

From the Supabase dashboard (Project Settings → API), or via the Supabase MCP tools `get_project_url` and `get_publishable_keys`. You need:
- Project URL: `https://<project-ref>.supabase.co`
- Anon (publishable) key

- [ ] **Step 2: Add env vars to `.env.local`**

Append (values from Step 1):

```bash
NEXT_PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon-key>
```

No service-role key is needed — trusted writes go through `DATABASE_URI` (already present).

- [ ] **Step 3: Create a GitHub OAuth app and enable the GitHub provider**

1. GitHub → Settings → Developer settings → OAuth Apps → New OAuth App.
   - Homepage URL: production site URL (or `http://localhost:3000` for now).
   - Authorization callback URL: `https://<project-ref>.supabase.co/auth/v1/callback`
2. Supabase dashboard → Authentication → Providers → GitHub → enable, paste Client ID + Client Secret.

- [ ] **Step 4: Configure auth redirect URLs**

Supabase dashboard → Authentication → URL Configuration:
- Site URL: production URL (e.g. `https://alecmingione.com`)
- Additional Redirect URLs: `http://localhost:3000/auth/callback`, `<production-url>/auth/callback`

- [ ] **Step 5: Confirm email auth is enabled**

Authentication → Providers → Email: enabled (default). Magic links use the default confirmation flow; no template changes required.

---

### Task 2: Dependencies

**Files:**
- Modify: `package.json`

- [ ] **Step 1: Install runtime and dev dependencies**

```bash
pnpm add @supabase/ssr @supabase/supabase-js
pnpm add -D vitest
```

- [ ] **Step 2: Move `pg` from devDependencies to dependencies**

`pg` is currently a devDependency (added for the password-reset script) but Tasks 5+ use it in runtime server code:

```bash
pnpm remove pg && pnpm add pg
```

- [ ] **Step 3: Add the test script**

In `package.json` `"scripts"`, after `"reset:password"`:

```json
    "test": "vitest run",
    "migrate:community": "node scripts/apply-community-migration.mjs"
```

- [ ] **Step 4: Verify install**

Run: `node -e "import('@supabase/ssr').then(() => console.log('ok'))"`
Expected: `ok`

- [ ] **Step 5: Commit**

```bash
git add package.json pnpm-lock.yaml
git commit -m "chore: add supabase ssr/js, vitest; promote pg to runtime dep"
```

---

### Task 3: Community schema migration + runner

**Files:**
- Create: `supabase/migrations/0001_community_foundation.sql`
- Create: `scripts/apply-community-migration.mjs`

- [ ] **Step 1: Write the migration SQL**

Create `supabase/migrations/0001_community_foundation.sql`:

```sql
-- Community Phase 1: identity + entitlements.
-- Lives in its own schema so Payload's drizzle migrations never touch it.

create schema if not exists community;

create table if not exists community.profiles (
  user_id uuid primary key references auth.users (id) on delete cascade,
  username text not null unique,
  avatar_url text,
  github_url text,
  created_at timestamptz not null default now()
);

create table if not exists community.entitlements (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  item_type text not null check (item_type in ('product', 'course', 'service')),
  item_id integer not null,
  purchase_id integer not null,
  source text not null check (source in ('email_match', 'token_redeem')),
  created_at timestamptz not null default now(),
  unique (user_id, purchase_id)
);

create index if not exists entitlements_user_item_idx
  on community.entitlements (user_id, item_type, item_id);

alter table community.profiles enable row level security;
alter table community.entitlements enable row level security;

drop policy if exists "profiles readable by authenticated" on community.profiles;
create policy "profiles readable by authenticated"
  on community.profiles for select to authenticated using (true);

drop policy if exists "users update own profile" on community.profiles;
create policy "users update own profile"
  on community.profiles for update to authenticated
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "users read own entitlements" on community.entitlements;
create policy "users read own entitlements"
  on community.entitlements for select to authenticated
  using (auth.uid() = user_id);

-- No insert/update/delete policies on entitlements: writes are server-side only
-- (pg superuser via DATABASE_URI bypasses RLS).

-- Auto-create a profile when a user signs up.
create or replace function community.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  base text;
  candidate text;
  n int := 0;
begin
  base := coalesce(
    new.raw_user_meta_data ->> 'user_name',
    new.raw_user_meta_data ->> 'preferred_username',
    split_part(new.email, '@', 1),
    'member'
  );
  base := lower(regexp_replace(base, '[^a-zA-Z0-9_-]', '', 'g'));
  if base = '' or base is null then
    base := 'member';
  end if;
  candidate := base;
  while exists (select 1 from community.profiles where username = candidate) loop
    n := n + 1;
    candidate := base || n::text;
  end loop;
  insert into community.profiles (user_id, username, avatar_url, github_url)
  values (
    new.id,
    candidate,
    new.raw_user_meta_data ->> 'avatar_url',
    case
      when new.raw_user_meta_data ->> 'user_name' is not null
        then 'https://github.com/' || (new.raw_user_meta_data ->> 'user_name')
    end
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function community.handle_new_user();
```

- [ ] **Step 2: Write the migration runner**

Create `scripts/apply-community-migration.mjs` (same env-loading pattern as `scripts/reset-user-password.mjs`):

```js
#!/usr/bin/env node
/**
 * Apply a SQL file against DATABASE_URI (Supabase Postgres).
 * Usage: pnpm migrate:community supabase/migrations/0001_community_foundation.sql
 */
import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import pg from 'pg'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')

function loadEnvFile(file) {
  const full = path.join(root, file)
  if (!existsSync(full)) return
  for (const line of readFileSync(full, 'utf8').split('\n')) {
    const match = line.match(
      /^\s*(?:export\s+)?([A-Za-z_][\w.]*)\s*=\s*(.*)\s*$/
    )
    if (!match) continue
    const key = match[1]
    const value = match[2].replace(/^(['"])(.*)\1$/, '$2')
    if (!(key in process.env)) process.env[key] = value
  }
}

loadEnvFile('.env.local')
loadEnvFile('.env')

const fileArg = process.argv[2]
if (!fileArg) {
  console.error('Usage: pnpm migrate:community <path-to-sql-file>')
  process.exit(1)
}
if (!process.env.DATABASE_URI) {
  console.error('DATABASE_URI is not set (checked .env.local and .env).')
  process.exit(1)
}

const sql = readFileSync(path.resolve(root, fileArg), 'utf8')
const client = new pg.Client({ connectionString: process.env.DATABASE_URI })
await client.connect()
try {
  await client.query(sql)
  console.log(`✔ Applied ${fileArg}`)
} finally {
  await client.end()
}
```

- [ ] **Step 3: Apply the migration**

Run: `pnpm migrate:community supabase/migrations/0001_community_foundation.sql`
Expected: `✔ Applied supabase/migrations/0001_community_foundation.sql`

- [ ] **Step 4: Verify the tables exist**

Run:

```bash
node -e "
import('pg').then(async ({ default: pg }) => {
  const { readFileSync } = await import('node:fs');
  for (const line of readFileSync('.env.local','utf8').split('\n')) {
    const m = line.match(/^\s*([A-Za-z_][\w.]*)\s*=\s*(.*)\s*$/);
    if (m && !(m[1] in process.env)) process.env[m[1]] = m[2].replace(/^(['\"])(.*)\1$/, '\$2');
  }
  const c = new pg.Client({ connectionString: process.env.DATABASE_URI });
  await c.connect();
  const r = await c.query(\"select table_name from information_schema.tables where table_schema = 'community' order by 1\");
  console.log(r.rows.map((x) => x.table_name).join(', '));
  await c.end();
})"
```

Expected output: `entitlements, profiles`

- [ ] **Step 5: Commit**

```bash
git add supabase/migrations/0001_community_foundation.sql scripts/apply-community-migration.mjs package.json
git commit -m "feat: community schema — profiles, entitlements, signup trigger"
```

---

### Task 4: Supabase client helpers + session middleware

**Files:**
- Create: `src/lib/supabase/server.ts`
- Create: `src/lib/supabase/client.ts`
- Create: `src/lib/supabase/middleware.ts`
- Create: `src/middleware.ts`

- [ ] **Step 1: Server client (server components, server actions, route handlers)**

Create `src/lib/supabase/server.ts`:

```ts
import { cookies } from 'next/headers'
import { createServerClient } from '@supabase/ssr'

export async function createSupabaseServerClient() {
  const cookieStore = await cookies()
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // Called from a Server Component — safe to ignore when the
            // middleware is refreshing sessions.
          }
        },
      },
    }
  )
}
```

- [ ] **Step 2: Browser client**

Create `src/lib/supabase/client.ts`:

```ts
import { createBrowserClient } from '@supabase/ssr'

export function createSupabaseBrowserClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
```

- [ ] **Step 3: Session-refresh helper**

Create `src/lib/supabase/middleware.ts`:

```ts
import { NextResponse, type NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // Refreshes the auth token if expired; do not run other logic between
  // client creation and getUser().
  await supabase.auth.getUser()

  return supabaseResponse
}
```

- [ ] **Step 4: Mount the middleware**

Create `src/middleware.ts`:

```ts
import { type NextRequest } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'

export async function middleware(request: NextRequest) {
  return await updateSession(request)
}

export const config = {
  matcher: [
    // Run on all paths except static assets, the Payload admin, and Payload's
    // own API routes — none of those use the Supabase session.
    '/((?!_next/static|_next/image|favicon.ico|admin|api/|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|ttf|otf|woff2?)$).*)',
  ],
}
```

- [ ] **Step 5: Format and commit**

```bash
npx prettier --write src/lib/supabase/server.ts src/lib/supabase/client.ts src/lib/supabase/middleware.ts src/middleware.ts
git add src/lib/supabase src/middleware.ts
git commit -m "feat: supabase ssr clients and session-refresh middleware"
```

---

### Task 5: Claims library (TDD) + community db pool

**Files:**
- Create: `src/lib/community/db.ts`
- Create: `src/lib/community/claims.ts`
- Test: `src/lib/community/claims.test.ts`

- [ ] **Step 1: Write the failing tests**

Create `src/lib/community/claims.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import {
  claimPurchasesByEmail,
  insertEntitlements,
  purchaseToEntitlement,
} from './claims'

const USER_ID = '11111111-2222-3333-4444-555555555555'

describe('purchaseToEntitlement', () => {
  it('maps a paid course purchase (depth-0 polymorphic item)', () => {
    const purchase = {
      id: 42,
      status: 'paid',
      itemType: 'course',
      item: { relationTo: 'courses', value: 7 },
    }
    expect(purchaseToEntitlement(purchase, USER_ID, 'email_match')).toEqual({
      userId: USER_ID,
      itemType: 'course',
      itemId: 7,
      purchaseId: 42,
      source: 'email_match',
    })
  })

  it('maps a populated item (depth-1: value is a doc object)', () => {
    const purchase = {
      id: 42,
      status: 'paid',
      itemType: 'product',
      item: { relationTo: 'products', value: { id: 3, name: 'Kit' } },
    }
    expect(purchaseToEntitlement(purchase, USER_ID, 'token_redeem')).toEqual({
      userId: USER_ID,
      itemType: 'product',
      itemId: 3,
      purchaseId: 42,
      source: 'token_redeem',
    })
  })

  it('returns null for refunded purchases', () => {
    const purchase = {
      id: 42,
      status: 'refunded',
      itemType: 'course',
      item: { relationTo: 'courses', value: 7 },
    }
    expect(purchaseToEntitlement(purchase, USER_ID, 'email_match')).toBeNull()
  })

  it('returns null when the item relation is missing', () => {
    const purchase = { id: 42, status: 'paid', itemType: 'course', item: null }
    expect(purchaseToEntitlement(purchase, USER_ID, 'email_match')).toBeNull()
  })

  it('returns null for unknown item types', () => {
    const purchase = {
      id: 42,
      status: 'paid',
      itemType: 'mystery',
      item: { relationTo: 'courses', value: 7 },
    }
    expect(purchaseToEntitlement(purchase, USER_ID, 'email_match')).toBeNull()
  })
})

function fakePool() {
  const queries: { text: string; values: unknown[] }[] = []
  return {
    queries,
    query: async (text: string, values: unknown[]) => {
      queries.push({ text, values })
      return { rows: [], rowCount: 1 }
    },
  }
}

describe('insertEntitlements', () => {
  it('skips empty input without querying', async () => {
    const pool = fakePool()
    await insertEntitlements(pool, [])
    expect(pool.queries).toHaveLength(0)
  })

  it('inserts one row per entitlement with conflict-ignore', async () => {
    const pool = fakePool()
    await insertEntitlements(pool, [
      {
        userId: USER_ID,
        itemType: 'course',
        itemId: 7,
        purchaseId: 42,
        source: 'email_match',
      },
    ])
    expect(pool.queries).toHaveLength(1)
    expect(pool.queries[0].text).toContain('on conflict')
    expect(pool.queries[0].values).toEqual([
      USER_ID,
      'course',
      7,
      42,
      'email_match',
    ])
  })
})

describe('claimPurchasesByEmail', () => {
  it('finds paid purchases for the email and inserts entitlements', async () => {
    const pool = fakePool()
    const payload = {
      find: async ({ where }: { where: Record<string, unknown> }) => {
        expect(where).toMatchObject({
          email: { equals: 'dev@example.com' },
          status: { equals: 'paid' },
        })
        return {
          docs: [
            {
              id: 42,
              status: 'paid',
              itemType: 'course',
              item: { relationTo: 'courses', value: 7 },
            },
            // unmappable row is skipped, not fatal
            { id: 43, status: 'paid', itemType: 'course', item: null },
          ],
        }
      },
    }
    const claimed = await claimPurchasesByEmail({
      pool,
      payload,
      userId: USER_ID,
      email: 'Dev@Example.com',
    })
    expect(claimed).toBe(1)
    expect(pool.queries).toHaveLength(1)
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `pnpm test src/lib/community/claims.test.ts`
Expected: FAIL — `Cannot find module './claims'` (or equivalent).

- [ ] **Step 3: Implement the db pool helper**

Create `src/lib/community/db.ts`:

```ts
import { Pool } from 'pg'

// Cached on globalThis so dev hot-reload doesn't exhaust connections —
// mirrors the getPayloadClient pattern.
const globalForPool = globalThis as unknown as {
  communityPool: Pool | undefined
}

export function getCommunityPool(): Pool {
  if (!globalForPool.communityPool) {
    globalForPool.communityPool = new Pool({
      connectionString: process.env.DATABASE_URI,
      max: 5,
    })
  }
  return globalForPool.communityPool
}
```

- [ ] **Step 4: Implement the claims library**

Create `src/lib/community/claims.ts`. Dependencies are injected (pool, payload) so it is testable and reusable from any server context:

```ts
export type ItemType = 'product' | 'course' | 'service'
export type ClaimSource = 'email_match' | 'token_redeem'

export type EntitlementRow = {
  userId: string
  itemType: ItemType
  itemId: number
  purchaseId: number
  source: ClaimSource
}

type QueryablePool = {
  query: (text: string, values?: unknown[]) => Promise<{ rows: any[] }>
}

const ITEM_TYPES: ItemType[] = ['product', 'course', 'service']

/** Map a Payload purchase doc to an entitlement row; null if not claimable. */
export function purchaseToEntitlement(
  purchase: any,
  userId: string,
  source: ClaimSource
): EntitlementRow | null {
  if (!purchase || purchase.status !== 'paid') return null
  if (!ITEM_TYPES.includes(purchase.itemType)) return null
  const raw =
    purchase.item && typeof purchase.item === 'object'
      ? purchase.item.value
      : purchase.item
  const itemId = Number(raw && typeof raw === 'object' ? raw.id : raw)
  if (!Number.isFinite(itemId)) return null
  const purchaseId = Number(purchase.id)
  if (!Number.isFinite(purchaseId)) return null
  return { userId, itemType: purchase.itemType, itemId, purchaseId, source }
}

export async function insertEntitlements(
  pool: QueryablePool,
  rows: EntitlementRow[]
): Promise<void> {
  for (const r of rows) {
    await pool.query(
      `insert into community.entitlements (user_id, item_type, item_id, purchase_id, source)
       values ($1, $2, $3, $4, $5)
       on conflict (user_id, purchase_id) do nothing`,
      [r.userId, r.itemType, r.itemId, r.purchaseId, r.source]
    )
  }
}

/** Claim every paid purchase matching the user's (verified) email. */
export async function claimPurchasesByEmail({
  pool,
  payload,
  userId,
  email,
}: {
  pool: QueryablePool
  payload: { find: (args: any) => Promise<{ docs: any[] }> }
  userId: string
  email: string
}): Promise<number> {
  const { docs } = await payload.find({
    collection: 'purchases',
    where: {
      email: { equals: email.toLowerCase() },
      status: { equals: 'paid' },
    },
    depth: 0,
    limit: 100,
    overrideAccess: true,
  })
  const rows = docs
    .map((d) => purchaseToEntitlement(d, userId, 'email_match'))
    .filter((r): r is EntitlementRow => r !== null)
  await insertEntitlements(pool, rows)
  return rows.length
}

export type EntitlementListItem = {
  itemType: ItemType
  itemId: number
  purchaseId: number
  source: ClaimSource
  createdAt: string
}

export async function listEntitlements(
  pool: QueryablePool,
  userId: string
): Promise<EntitlementListItem[]> {
  const { rows } = await pool.query(
    `select item_type as "itemType", item_id as "itemId",
            purchase_id as "purchaseId", source, created_at as "createdAt"
     from community.entitlements
     where user_id = $1
     order by created_at desc`,
    [userId]
  )
  return rows
}

export async function hasEntitlement(
  pool: QueryablePool,
  userId: string,
  itemType: ItemType,
  itemId: number
): Promise<boolean> {
  const { rows } = await pool.query(
    `select 1 from community.entitlements
     where user_id = $1 and item_type = $2 and item_id = $3
     limit 1`,
    [userId, itemType, itemId]
  )
  return rows.length > 0
}
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `pnpm test src/lib/community/claims.test.ts`
Expected: PASS (8 tests).

- [ ] **Step 6: Format and commit**

```bash
npx prettier --write src/lib/community/db.ts src/lib/community/claims.ts src/lib/community/claims.test.ts
git add src/lib/community
git commit -m "feat: entitlement claims library with injected deps + tests"
```

---

### Task 6: Auth callback route

**Files:**
- Create: `src/app/auth/callback/route.ts`

- [ ] **Step 1: Implement the callback handler**

Handles both OAuth/PKCE (`?code=`) and OTP verification links (`?token_hash=&type=`). Create `src/app/auth/callback/route.ts`:

```ts
import { NextResponse } from 'next/server'
import type { EmailOtpType } from '@supabase/supabase-js'
import { createSupabaseServerClient } from '@/lib/supabase/server'

export async function GET(request: Request) {
  const url = new URL(request.url)
  const code = url.searchParams.get('code')
  const tokenHash = url.searchParams.get('token_hash')
  const type = url.searchParams.get('type') as EmailOtpType | null
  const next = url.searchParams.get('next') ?? '/account'
  // Only allow same-site relative redirects.
  const safeNext =
    next.startsWith('/') && !next.startsWith('//') ? next : '/account'

  const supabase = await createSupabaseServerClient()

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) return NextResponse.redirect(new URL(safeNext, url.origin))
  } else if (tokenHash && type) {
    const { error } = await supabase.auth.verifyOtp({
      type,
      token_hash: tokenHash,
    })
    if (!error) return NextResponse.redirect(new URL(safeNext, url.origin))
  }

  return NextResponse.redirect(new URL('/signin?error=auth', url.origin))
}
```

- [ ] **Step 2: Format and commit**

```bash
npx prettier --write src/app/auth/callback/route.ts
git add src/app/auth
git commit -m "feat: supabase auth callback route (code exchange + otp verify)"
```

---

### Task 7: Sign-in page

**Files:**
- Create: `src/app/(site)/signin/page.jsx`
- Create: `src/app/(site)/signin/SignInForm.jsx`

- [ ] **Step 1: Build the client form component**

Create `src/app/(site)/signin/SignInForm.jsx`. Styled with the existing AMWare datasheet language (`.amw` tokens are available globally via `storefront.css`):

```jsx
'use client'

import { useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { createSupabaseBrowserClient } from '@/lib/supabase/client'
import { GitHubIcon } from '@/components/SocialIcons'

export function SignInForm() {
  const searchParams = useSearchParams()
  const next = searchParams.get('next') || '/account'
  const hadError = searchParams.get('error') === 'auth'
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState('idle') // idle | sending | sent | error

  const redirectTo = () =>
    `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`

  async function signInWithGitHub() {
    const supabase = createSupabaseBrowserClient()
    await supabase.auth.signInWithOAuth({
      provider: 'github',
      options: { redirectTo: redirectTo() },
    })
  }

  async function sendMagicLink(e) {
    e.preventDefault()
    setStatus('sending')
    const supabase = createSupabaseBrowserClient()
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: redirectTo() },
    })
    setStatus(error ? 'error' : 'sent')
  }

  return (
    <div className="amw-ticks border-[var(--amw-line)] bg-[var(--amw-card)] relative overflow-hidden rounded-2xl border p-6 sm:p-8">
      <div
        className="amw-grid-bg amw-grid-fade absolute inset-0"
        aria-hidden="true"
      />
      <div className="relative">
        <p className="amw-eyebrow">// MEMBER ACCESS</p>
        <h1 className="mt-4 text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
          Sign in
        </h1>
        <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
          Track your course progress and join the discussion. Purchases made
          with this email are linked automatically.
        </p>

        {hadError && (
          <p className="mt-4 text-sm text-red-600 dark:text-red-400">
            That sign-in link was invalid or expired — try again.
          </p>
        )}

        <button
          type="button"
          onClick={signInWithGitHub}
          className="amw-mono mt-6 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-zinc-900 px-5 py-3 text-xs font-semibold uppercase tracking-[0.14em] text-zinc-50 transition hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
        >
          <GitHubIcon className="h-4 w-4 fill-current" />
          continue with github
        </button>

        <div className="border-[var(--amw-line)] mt-6 flex items-center gap-3 border-t border-dashed pt-6">
          <span className="amw-kicker">or via email</span>
        </div>

        {status === 'sent' ? (
          <p className="amw-mono amw-cursor mt-4 text-sm text-zinc-700 dark:text-zinc-300">
            magic link sent — check your inbox
          </p>
        ) : (
          <form onSubmit={sendMagicLink} className="mt-4 flex gap-3">
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              aria-label="Email address"
              className="border-[var(--amw-line-strong)] min-w-0 flex-auto rounded-lg border bg-transparent px-3 py-2.5 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-teal-500 focus:outline-none dark:text-zinc-100"
            />
            <button
              type="submit"
              disabled={status === 'sending'}
              className="amw-mono bg-[var(--amw-accent)] inline-flex items-center rounded-lg px-4 py-2.5 text-xs font-semibold uppercase tracking-[0.14em] text-zinc-950 transition hover:brightness-110 disabled:opacity-60"
            >
              {status === 'sending' ? 'sending…' : 'send link'}
            </button>
          </form>
        )}
        {status === 'error' && (
          <p className="mt-3 text-sm text-red-600 dark:text-red-400">
            Could not send the link — check the address and try again.
          </p>
        )}
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Build the page (Suspense for useSearchParams)**

Create `src/app/(site)/signin/page.jsx`:

```jsx
import { Suspense } from 'react'
import { redirect } from 'next/navigation'
import { Container } from '@/components/Container'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { SignInForm } from './SignInForm'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Sign in' }

export default async function SignInPage() {
  const supabase = await createSupabaseServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (user) redirect('/account')

  return (
    <Container className="mt-16 sm:mt-32">
      <div className="amw mx-auto max-w-md">
        <Suspense fallback={null}>
          <SignInForm />
        </Suspense>
      </div>
    </Container>
  )
}
```

- [ ] **Step 3: Format and commit**

```bash
npx prettier --write "src/app/(site)/signin/page.jsx" "src/app/(site)/signin/SignInForm.jsx"
git add "src/app/(site)/signin"
git commit -m "feat: sign-in page with github oauth and magic link"
```

---

### Task 8: Account page + sign-out + claim-on-view

**Files:**
- Create: `src/app/(site)/account/actions.js`
- Create: `src/app/(site)/account/page.jsx`

- [ ] **Step 1: Sign-out server action**

Create `src/app/(site)/account/actions.js`:

```js
'use server'

import { redirect } from 'next/navigation'
import { createSupabaseServerClient } from '@/lib/supabase/server'

export async function signOutAction() {
  const supabase = await createSupabaseServerClient()
  await supabase.auth.signOut()
  redirect('/')
}
```

- [ ] **Step 2: Account page**

Create `src/app/(site)/account/page.jsx`. On every view it (idempotently) claims paid purchases matching the user's verified email, then lists entitlements with item titles fetched from Payload. Note the empty-array guard before `id: { in: [] }` queries (project convention):

```jsx
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { Container } from '@/components/Container'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { getCommunityPool } from '@/lib/community/db'
import {
  claimPurchasesByEmail,
  listEntitlements,
} from '@/lib/community/claims'
import { getPayloadClient } from '@/lib/getPayloadClient'
import { signOutAction } from './actions'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Account', robots: { index: false } }

const COLLECTION_BY_TYPE = {
  product: 'products',
  course: 'courses',
  service: 'services',
}

const PATH_BY_TYPE = {
  product: (doc) => `/products/${doc.slug}`,
  course: (doc) => `/courses/${doc.slug}`,
  service: () => '/services',
}

async function fetchItemDocs(payload, entitlements) {
  const byType = { product: [], course: [], service: [] }
  for (const e of entitlements) byType[e.itemType]?.push(e.itemId)

  const docs = {}
  for (const [type, ids] of Object.entries(byType)) {
    // Guard: never run `in: []` queries — return empty instead.
    if (ids.length === 0) continue
    const { docs: found } = await payload.find({
      collection: COLLECTION_BY_TYPE[type],
      where: { id: { in: ids } },
      depth: 0,
      limit: ids.length,
      overrideAccess: true,
    })
    for (const doc of found) docs[`${type}:${doc.id}`] = doc
  }
  return docs
}

export default async function AccountPage() {
  const supabase = await createSupabaseServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/signin?next=/account')

  const pool = getCommunityPool()
  const payload = await getPayloadClient()

  // Idempotent: links any paid purchases made with this (verified) email.
  if (user.email) {
    await claimPurchasesByEmail({
      pool,
      payload,
      userId: user.id,
      email: user.email,
    })
  }

  const [profileResult, entitlements] = await Promise.all([
    pool.query(
      'select username, avatar_url as "avatarUrl", github_url as "githubUrl" from community.profiles where user_id = $1',
      [user.id]
    ),
    listEntitlements(pool, user.id),
  ])
  const profile = profileResult.rows[0] ?? null
  const itemDocs = await fetchItemDocs(payload, entitlements)

  return (
    <Container className="mt-16 sm:mt-32">
      <div className="amw mx-auto max-w-2xl">
        <div className="border-[var(--amw-line)] flex items-baseline justify-between gap-4 border-b border-dashed pb-4">
          <p className="amw-eyebrow">// MEMBER CONSOLE</p>
          <form action={signOutAction}>
            <button
              type="submit"
              className="amw-mono text-[var(--amw-mut)] text-xs uppercase tracking-[0.14em] transition hover:text-[var(--amw-accent)]"
            >
              sign out ↗
            </button>
          </form>
        </div>

        <h1 className="mt-8 text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
          {profile?.username ?? user.email}
        </h1>
        <p className="amw-mono mt-2 text-xs text-zinc-500">{user.email}</p>

        <h2 className="amw-kicker mt-12">YOUR LIBRARY</h2>
        {entitlements.length === 0 ? (
          <p className="mt-4 text-sm text-zinc-600 dark:text-zinc-400">
            Nothing here yet. Purchases made with {user.email} are linked
            automatically — bought with a different email? Open your access
            link while signed in to claim it.
          </p>
        ) : (
          <ul className="mt-4 space-y-3">
            {entitlements.map((e) => {
              const doc = itemDocs[`${e.itemType}:${e.itemId}`]
              if (!doc) return null
              return (
                <li key={`${e.itemType}-${e.itemId}`}>
                  <Link
                    href={PATH_BY_TYPE[e.itemType](doc)}
                    className="amw-card amw-ticks group flex items-center justify-between p-4 no-underline"
                  >
                    <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
                      {doc.title ?? doc.name}
                    </span>
                    <span className="amw-chip amw-chip--accent amw-chip--dot">
                      {e.itemType}
                    </span>
                  </Link>
                </li>
              )
            })}
          </ul>
        )}
      </div>
    </Container>
  )
}
```

- [ ] **Step 3: Format and commit**

```bash
npx prettier --write "src/app/(site)/account/page.jsx" "src/app/(site)/account/actions.js"
git add "src/app/(site)/account"
git commit -m "feat: account page with email-match claiming and library list"
```

---

### Task 9: Account button in the header

**Files:**
- Create: `src/components/auth/AccountButton.jsx`
- Modify: `src/components/AppHeader.jsx` (mount next to `ModeToggle`, around lines 332–336 desktop and 326–329 mobile)

- [ ] **Step 1: Build the client button**

Create `src/components/auth/AccountButton.jsx`. Matches the `ModeToggle` pill styling already in `AppHeader.jsx`:

```jsx
'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import clsx from 'clsx'
import { createSupabaseBrowserClient } from '@/lib/supabase/client'

export function AccountButton({ className }) {
  const [user, setUser] = useState(null)

  useEffect(() => {
    const supabase = createSupabaseBrowserClient()
    supabase.auth.getUser().then(({ data }) => setUser(data.user ?? null))
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })
    return () => subscription.unsubscribe()
  }, [])

  const label = user ? 'Account' : 'Sign in'
  const href = user ? '/account' : '/signin'
  const initial = (user?.email ?? '?').slice(0, 1).toUpperCase()

  return (
    <Link
      href={href}
      aria-label={label}
      className={clsx(
        className,
        'group flex items-center gap-2 rounded-full bg-white/90 px-3 py-2 text-sm font-medium text-zinc-700 shadow-lg shadow-zinc-800/5 ring-1 ring-zinc-900/5 backdrop-blur transition hover:text-teal-600 dark:bg-zinc-800/90 dark:text-zinc-200 dark:ring-white/10 dark:hover:text-teal-400 dark:hover:ring-white/20'
      )}
    >
      {user ? (
        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-teal-500/15 text-[11px] font-semibold text-teal-600 dark:text-teal-400">
          {initial}
        </span>
      ) : null}
      {label}
    </Link>
  )
}
```

- [ ] **Step 2: Mount it in `AppHeader.jsx`**

Add the import at the top of `src/components/AppHeader.jsx`:

```js
import { AccountButton } from '@/components/auth/AccountButton'
```

Desktop — replace the right-side block:

```jsx
<div className="hidden justify-end md:flex md:flex-1">
  <div className="pointer-events-auto">
    <ModeToggle />
  </div>
</div>
```

with:

```jsx
<div className="hidden justify-end md:flex md:flex-1">
  <div className="pointer-events-auto flex items-center gap-3">
    <AccountButton />
    <ModeToggle />
  </div>
</div>
```

Mobile — replace the `mobileBottomContent` prop value:

```jsx
mobileBottomContent={
  <div className="flex w-full pb-2 pt-1 md:hidden">
    <ModeToggle className="flex w-full items-center justify-center py-3" />
  </div>
}
```

with:

```jsx
mobileBottomContent={
  <div className="flex w-full gap-2 pb-2 pt-1 md:hidden">
    <AccountButton className="flex flex-1 items-center justify-center py-3" />
    <ModeToggle className="flex flex-1 items-center justify-center py-3" />
  </div>
}
```

- [ ] **Step 3: Format and commit**

```bash
npx prettier --write src/components/auth/AccountButton.jsx src/components/AppHeader.jsx
git add src/components/auth/AccountButton.jsx src/components/AppHeader.jsx
git commit -m "feat: header account button (session-aware)"
```

---

### Task 10: Claim from capability URL

**Files:**
- Create: `src/app/(site)/access/[token]/actions.js`
- Modify: `src/app/(site)/access/[token]/page.jsx` (course branch, lines 79–93)

- [ ] **Step 1: Token-redemption server action**

Create `src/app/(site)/access/[token]/actions.js`. It re-verifies everything server-side — never trust that the page already validated:

```js
'use server'

import { redirect } from 'next/navigation'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { verifyAccessToken } from '@/lib/commerce/accessToken'
import { getPayloadClient } from '@/lib/getPayloadClient'
import { getCommunityPool } from '@/lib/community/db'
import {
  insertEntitlements,
  purchaseToEntitlement,
} from '@/lib/community/claims'

export async function claimTokenAction(token) {
  const supabase = await createSupabaseServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect(`/signin?next=${encodeURIComponent(`/access/${token}`)}`)

  const claims = verifyAccessToken(token)
  if (!claims) redirect(`/access/${token}`)

  const payload = await getPayloadClient()
  const purchase = await payload
    .findByID({
      collection: 'purchases',
      id: claims.purchaseId,
      depth: 0,
      overrideAccess: true,
    })
    .catch(() => null)

  const row = purchaseToEntitlement(purchase, user.id, 'token_redeem')
  // Cross-check the token's item against the purchase, like the page does.
  const storedItemId =
    purchase?.item && typeof purchase.item === 'object'
      ? purchase.item.value
      : purchase?.item
  if (!row || String(storedItemId) !== String(claims.itemId)) {
    redirect(`/access/${token}`)
  }

  await insertEntitlements(getCommunityPool(), [row])
  redirect('/account')
}
```

- [ ] **Step 2: Add the claim panel to the access page**

In `src/app/(site)/access/[token]/page.jsx`:

Add imports at the top:

```js
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { claimTokenAction } from './actions'
```

Inside `AccessPage`, after the `item` fetch succeeds (after line 77 `if (!item) return <InvalidLink />`), add:

```jsx
const supabase = await createSupabaseServerClient()
const {
  data: { user },
} = await supabase.auth.getUser()

const claimPanel = (
  <div className="mt-8 rounded-xl border border-dashed border-zinc-300 p-4 dark:border-zinc-700">
    {user ? (
      <form action={claimTokenAction.bind(null, token)}>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          Signed in as <strong>{user.email}</strong>.
        </p>
        <button
          type="submit"
          className="mt-3 inline-flex rounded-md bg-teal-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-teal-500"
        >
          Save this purchase to my account
        </button>
      </form>
    ) : (
      <p className="text-sm text-zinc-600 dark:text-zinc-400">
        <Link
          href={`/signin?next=${encodeURIComponent(`/access/${token}`)}`}
          className="font-semibold text-teal-500"
        >
          Sign in
        </Link>{' '}
        to save this purchase to an account — then you won&apos;t need this
        link, and you can track your progress.
      </p>
    )}
  </div>
)
```

Then render `{claimPanel}` in both success branches:

In the course branch, change:

```jsx
return (
  <Container className="mt-16 sm:mt-32">
    <CourseBody course={item} lessons={lessons} />
  </Container>
)
```

to:

```jsx
return (
  <Container className="mt-16 sm:mt-32">
    {claimPanel}
    <CourseBody course={item} lessons={lessons} />
  </Container>
)
```

In the product/service branch, add `{claimPanel}` directly after the download/confirmation block, before the closing `</div>`.

- [ ] **Step 3: Format and commit**

```bash
npx prettier --write "src/app/(site)/access/[token]/page.jsx" "src/app/(site)/access/[token]/actions.js"
git add "src/app/(site)/access/[token]"
git commit -m "feat: claim purchase to account from capability URL"
```

---

### Task 11: Entitlement-aware course page (closes the content leak)

**Files:**
- Modify: `src/app/(site)/courses/[slug]/page.tsx`
- Modify: `src/components/site/CourseBody.jsx`

**Note:** this changes public behavior — anonymous visitors currently see *all* lesson content; after this task they see only `isPreview` lessons plus locked placeholders.

- [ ] **Step 1: Lock non-preview lessons in `CourseBody`**

In `src/components/site/CourseBody.jsx`, replace the unconditional content render:

```jsx
<RichText data={lesson.content} className="mt-3" />
```

with:

```jsx
{lesson.locked ? (
  <p className="mt-3 text-sm italic text-zinc-500 dark:text-zinc-400">
    Enroll to unlock this lesson.
  </p>
) : (
  <RichText data={lesson.content} className="mt-3" />
)}
```

(`locked` is set by the course page below; the access page and entitled views never set it, so they are unchanged.)

- [ ] **Step 2: Make the course page session- and entitlement-aware**

Rewrite `src/app/(site)/courses/[slug]/page.tsx`. Reading cookies makes the route dynamic, so `revalidate` and `generateStaticParams` are removed:

```tsx
import { notFound } from 'next/navigation'
import { Container } from '@/components/Container'
import { CourseBody } from '@/components/site/CourseBody'
import { getPayloadClient } from '@/lib/getPayloadClient'
import { BuyButton } from '@/components/commerce/BuyButton'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { getCommunityPool } from '@/lib/community/db'
import { hasEntitlement } from '@/lib/community/claims'

export const dynamic = 'force-dynamic'

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

  const supabase = await createSupabaseServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  let entitled = false
  if (user) {
    entitled = await hasEntitlement(
      getCommunityPool(),
      user.id,
      'course',
      Number(course.id)
    )
  }

  const visibleLessons = entitled
    ? lessons
    : lessons.map((l) =>
        l.isPreview ? l : { ...l, content: null, locked: true }
      )

  return (
    <Container className="mt-16 sm:mt-32">
      <CourseBody
        course={course}
        lessons={visibleLessons}
        cta={
          entitled ? (
            <p className="mt-6 inline-flex rounded-full bg-teal-50 px-3 py-1 text-sm font-medium text-teal-600 dark:bg-teal-500/10 dark:text-teal-400">
              ✓ Enrolled
            </p>
          ) : course.creemProductId ? (
            <BuyButton
              itemType="course"
              slug={course.slug}
              label={
                typeof course.price === 'number'
                  ? `Enroll — USD ${(course.price as number).toFixed(2)}`
                  : 'Enroll now'
              }
            />
          ) : null
        }
      />
    </Container>
  )
}
```

- [ ] **Step 3: Format and commit**

```bash
npx prettier --write "src/app/(site)/courses/[slug]/page.tsx" src/components/site/CourseBody.jsx
git add "src/app/(site)/courses/[slug]/page.tsx" src/components/site/CourseBody.jsx
git commit -m "feat: gate course lessons by entitlement; lock non-preview content"
```

---

### Task 12: Final verification

- [ ] **Step 1: Run the test suite**

Run: `pnpm test`
Expected: all tests pass.

- [ ] **Step 2: Prettier check over everything touched**

```bash
npx prettier --check "src/lib/supabase/**" "src/lib/community/**" "src/app/auth/**" "src/app/(site)/signin/**" "src/app/(site)/account/**" "src/app/(site)/access/**" "src/app/(site)/courses/**" src/components/auth src/components/AppHeader.jsx src/components/site/CourseBody.jsx src/middleware.ts scripts/apply-community-migration.mjs
```

Expected: no diffs. (`pnpm lint` is environmentally broken — see header note; don't block on it.)

- [ ] **Step 3: Production build sanity**

Run: `pnpm build`
Expected: build completes; `/account`, `/signin`, `/courses/[slug]` listed as dynamic routes.

- [ ] **Step 4: Run the code-quality reviewer agent** (project convention from AGENTS.md)

Focus areas: server-action input trust (token re-verification), open-redirect guard in `/auth/callback`, RLS coverage, empty-array query guards.

- [ ] **Step 5: Manual E2E checklist** (requires Task 1 complete; the human runs the dev server — never start one from the agent per project convention)

1. Visit `/signin` → "continue with github" → lands on `/account`, username/avatar from GitHub, profile row exists.
2. Sign out → magic-link sign-in with an email that has a paid purchase → `/account` shows the purchase in "Your library" (email-match claim).
3. Open a valid `/access/[token]` link while signed in with a *different* email → "Save this purchase to my account" → appears in `/account` (token redemption).
4. Visit the purchased course at `/courses/[slug]` while signed in → full lessons + "✓ Enrolled" chip.
5. Open the same course in a private window → only preview lessons render content; others show "Enroll to unlock this lesson."
6. `/auth/callback?next=https://evil.example` → redirects to `/account`, not the external URL.

- [ ] **Step 6: Final commit if any fixes were applied**

```bash
git add -A && git commit -m "fix: phase-1 review follow-ups"
```

---

## Out of scope (later phases)

- **Phase 2:** `lesson_progress` table + course-page progress UI (checkmarks, progress bar, resume). The `community` schema and RLS groundwork from Task 3 carry straight over.
- **Phase 3:** per-lesson comments/Q&A + Supabase Realtime + moderation.
- Exposing the `community` schema over PostgREST (only needed when the browser reads/writes it directly — Phase 2).
- Sunsetting capability URLs — they remain fully functional and double as the claim mechanism.
