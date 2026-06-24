import { createAdminClient } from '@/lib/supabase/admin'
import { resolveClientPlan, PLAN_SELECT } from '@/lib/plan'
import { generatePostForClient, getTopicByIndex } from '@/lib/generate-post-for-client'

// Default monthly post quota when a client has no recognized plan (e.g. trial).
const DEFAULT_MONTHLY_QUOTA = 8

// Small delay between posts so we don't hammer the AI image/text APIs.
const THROTTLE_MS = 1500

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

/**
 * Generate this month's full social-post quota for one client, based on their
 * plan's `socialPostsPerMonth` entitlement. Idempotent within a month: it counts
 * posts already created in the current `month_batch` and only generates the
 * remainder, so re-running (cron retry, manual trigger) won't over-produce.
 *
 * Each post in the batch uses a different topic so they don't repeat.
 */
export async function generateMonthlyPostsForClient(
  clientId: string,
): Promise<{ ok: boolean; quota: number; existing: number; generated: number; failed: number; error?: string }> {
  const admin = createAdminClient()
  const monthBatch = new Date().toISOString().slice(0, 7)

  // 1. Resolve quota from the client's plan entitlement.
  const { data: client, error: clientError } = await admin
    .from('clients')
    .select(`id, ${PLAN_SELECT}`)
    .eq('id', clientId)
    .single()

  if (clientError || !client) {
    return { ok: false, quota: 0, existing: 0, generated: 0, failed: 0, error: clientError?.message ?? 'Client not found' }
  }

  const plan = resolveClientPlan(client)
  const quota = plan?.entitlements.socialPostsPerMonth ?? DEFAULT_MONTHLY_QUOTA

  // 2. Count posts already created this month (idempotency).
  const { count: existingCount } = await admin
    .from('social_posts')
    .select('id', { count: 'exact', head: true })
    .eq('client_id', clientId)
    .eq('month_batch', monthBatch)

  const existing = existingCount ?? 0
  const remaining = Math.max(0, quota - existing)

  if (remaining === 0) {
    return { ok: true, quota, existing, generated: 0, failed: 0 }
  }

  // 3. Generate the remainder, varying topic per post.
  let generated = 0
  let failed = 0
  for (let i = 0; i < remaining; i++) {
    // Offset topic index by existing count so re-runs continue the rotation.
    const topic = getTopicByIndex(existing + i)
    const result = await generatePostForClient(clientId, { topic })
    if (result.ok) generated++
    else failed++
    if (i < remaining - 1) await sleep(THROTTLE_MS)
  }

  await admin.from('activities').insert({
    client_id: clientId,
    type: 'pipeline',
    title: 'Monthly social posts generated',
    description: `Generated ${generated}/${remaining} posts (quota ${quota}, ${existing} already existed${failed ? `, ${failed} failed` : ''}).`,
    created_by: 'system',
  } as never)

  return { ok: failed === 0, quota, existing, generated, failed }
}
