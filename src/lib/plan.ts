import { getPlan, type Plan } from '@/lib/stripe'

/**
 * Resolve a client's plan from either the canonical `plan_name` column or the
 * legacy `plan` column. The app standardized on `plan_name`, but some rows /
 * deployments still use `plan`; reading both keeps entitlement checks correct
 * regardless of which is populated.
 */
export function resolveClientPlan(client: { plan_name?: string | null; plan?: string | null }): Plan | null {
  const id = client.plan_name ?? client.plan ?? null
  return id ? getPlan(id) : null
}

/** Columns to select when you need to resolve a plan. */
export const PLAN_SELECT = 'plan_name, plan'
