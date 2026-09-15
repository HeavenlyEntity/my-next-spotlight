/*
 * Which Whop the site is talking to.
 *
 * Whop's sandbox is a separate world: its own account, keys, plans and
 * webhooks, on sandbox-api.whop.com, with test cards. This site has one
 * database for local and production, so a service carries two plan ids --
 * the live one and the sandbox one -- and this switch decides which the
 * page uses, which API host the setup talks to, and which world a recorded
 * payment belongs to.
 *
 * NEXT_PUBLIC_WHOP_ENV is what a client component can see (inlined at
 * build); WHOP_ENV is the server's. Set both the same. Unset means
 * production, so a forgotten variable can never point real customers at
 * the sandbox.
 */
export type WhopEnvironment = 'production' | 'sandbox'

export function whopEnvironment(): WhopEnvironment {
  const raw = process.env.NEXT_PUBLIC_WHOP_ENV || process.env.WHOP_ENV
  return raw === 'sandbox' ? 'sandbox' : 'production'
}

export function isWhopSandbox(): boolean {
  return whopEnvironment() === 'sandbox'
}

/** The deposit plan a service should charge against in this environment. */
export function depositPlanId(
  service:
    | {
        whopPlanId?: string | null
        whopSandboxPlanId?: string | null
      }
    | null
    | undefined,
  env: WhopEnvironment = whopEnvironment()
): string | null {
  if (!service) return null
  const id = env === 'sandbox' ? service.whopSandboxPlanId : service.whopPlanId
  return id || null
}
