import type { SupabaseClient } from '@supabase/supabase-js'
import type { NextRequest } from 'next/server'

/** Best-effort client IP from proxy headers. */
export function getClientIp(request: NextRequest): string {
  return (
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    request.headers.get('x-real-ip') ||
    'unknown'
  )
}

const MAX_DEMOS_PER_IP_PER_DAY = 3

/**
 * Returns true when this IP has hit the demo creation cap in the last 24h.
 * Fails CLOSED on error (treats as limited) so the expensive generate path can't
 * be hammered when the DB is unavailable — callers may surface a soft error.
 */
export async function isDemoRateLimited(
  admin: SupabaseClient,
  ip: string,
): Promise<boolean> {
  if (ip === 'unknown') return false // can't attribute; don't hard-block real users
  try {
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
    const { count, error } = await admin
      .from('demo_requests')
      .select('*', { count: 'exact', head: true })
      .eq('ip_address', ip)
      .gte('created_at', since)
    if (error) {
      console.error('[rate-limit] count query failed, failing closed:', error.message)
      return true
    }
    return (count ?? 0) >= MAX_DEMOS_PER_IP_PER_DAY
  } catch (err) {
    console.error('[rate-limit] unexpected error, failing closed:', err)
    return true
  }
}
