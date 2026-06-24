export const maxDuration = 300
export const runtime = 'nodejs'

import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { generateMonthlyPostsForClient } from '@/lib/generate-monthly-posts'

/**
 * Monthly content orchestrator (social posts).
 *
 * For each active client it generates the full monthly social-post quota defined
 * by the client's plan entitlement (see generate-monthly-posts.ts), then notifies
 * the client via the deliver-client route. Post generation runs in-process (real
 * Gemini image + OpenRouter caption + Ayrshare publish path); it is idempotent
 * within a month, so cron retries won't over-produce.
 *
 * Auth: cron secret only (Vercel Cron / admin trigger-cron forwards it).
 */

const NOTIFY_STEP = { key: 'deliver-client', path: '/api/pipeline/deliver-client', body: (id: string) => ({ clientId: id }) }

type StepResult = { step: string; ok: boolean; status: number; error?: string }

interface ClientRun {
  clientId: string
  business: string
  steps: StepResult[]
  ok: boolean
}

function baseUrl(request: NextRequest): string {
  // Prefer the request's own origin so internal calls hit the same deployment.
  const host = request.headers.get('host')
  if (host) {
    const proto = request.headers.get('x-forwarded-proto') ?? (host.startsWith('localhost') ? 'http' : 'https')
    return `${proto}://${host}`
  }
  return process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'
}

async function runStep(
  origin: string,
  path: string,
  body: Record<string, unknown>,
): Promise<StepResult> {
  const step = path.split('/').pop() as string
  try {
    const res = await fetch(`${origin}${path}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // Forward the cron secret so steps that require it accept the call.
        Authorization: `Bearer ${process.env.CRON_SECRET ?? ''}`,
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(120_000),
    })
    if (!res.ok) {
      const text = await res.text().catch(() => '')
      return { step, ok: false, status: res.status, error: text.slice(0, 300) }
    }
    return { step, ok: true, status: res.status }
  } catch (err) {
    return { step, ok: false, status: 0, error: err instanceof Error ? err.message : String(err) }
  }
}

export async function POST(request: NextRequest) {
  // Cron auth — same scheme as the other cron/pipeline routes.
  const authHeader = request.headers.get('authorization')
  if (!process.env.CRON_SECRET || authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const admin = createAdminClient()

  // Allow targeting a single client (used by the admin trigger-cron flow); else
  // process every active client.
  let targetClientId: string | null = null
  try {
    const body = await request.json()
    if (body && typeof body.clientId === 'string') targetClientId = body.clientId
  } catch {
    // No/!JSON body → run for all active clients.
  }

  let query = admin
    .from('clients')
    .select('id, first_name, business_name')
    .eq('subscription_status', 'active')
  if (targetClientId) query = query.eq('id', targetClientId)

  const { data: clients, error: clientsError } = await query
  if (clientsError) {
    console.error('[pipeline/monthly] failed to fetch clients:', clientsError)
    return NextResponse.json({ error: 'Failed to fetch clients' }, { status: 500 })
  }
  if (!clients || clients.length === 0) {
    return NextResponse.json({ success: true, clientsProcessed: 0, runs: [] })
  }

  const origin = baseUrl(request)
  const runs: ClientRun[] = []

  // Process clients sequentially to avoid hammering downstream AI APIs and to
  // keep within the function's compute envelope.
  for (const client of clients) {
    const label = client.business_name ?? client.first_name ?? client.id
    const steps: StepResult[] = []

    // Step 1: generate the client's full monthly post quota (in-process).
    let postsOk = false
    try {
      const r = await generateMonthlyPostsForClient(client.id)
      postsOk = r.ok
      steps.push({
        step: 'generate-posts',
        ok: r.ok,
        status: r.ok ? 200 : 500,
        error: r.ok ? undefined : `generated ${r.generated}/${r.quota - r.existing}, ${r.failed} failed`,
      })
    } catch (err) {
      steps.push({ step: 'generate-posts', ok: false, status: 500, error: err instanceof Error ? err.message : String(err) })
    }

    // Step 2: notify the client (only if posts were produced).
    if (postsOk) {
      steps.push(await runStep(origin, NOTIFY_STEP.path, NOTIFY_STEP.body(client.id)))
    }

    const ok = steps.every((s) => s.ok)
    runs.push({ clientId: client.id, business: label, steps, ok })

    await admin.from('activities').insert({
      client_id: client.id,
      type: 'pipeline',
      title: ok ? 'Monthly content pipeline completed' : 'Monthly content pipeline ran with errors',
      description: ok
        ? `Generated and delivered monthly social posts for ${label}.`
        : `Pipeline for ${label} had errors at: ${steps.find((s) => !s.ok)?.step ?? 'unknown'}.`,
      created_by: 'system',
    } as never)
  }

  const succeeded = runs.filter((r) => r.ok).length
  return NextResponse.json({
    success: true,
    clientsProcessed: clients.length,
    succeeded,
    failed: clients.length - succeeded,
    runs,
  })
}
