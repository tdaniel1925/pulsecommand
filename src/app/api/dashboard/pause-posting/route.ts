export const runtime = 'nodejs'

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

/**
 * Pause or resume automatic posting for the logged-in client. Stored in the
 * client's metadata.posting_paused (no schema change needed). The generation cron
 * skips paused clients.
 * body: { paused: boolean }
 */
export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const admin = createAdminClient()
    const { data: client } = await admin
      .from('clients')
      .select('id, metadata')
      .eq('user_id', user.id)
      .single()
    if (!client) return NextResponse.json({ error: 'Client not found' }, { status: 404 })

    const { paused } = (await req.json()) as { paused?: boolean }
    const metadata = (client.metadata && typeof client.metadata === 'object'
      ? client.metadata
      : {}) as Record<string, unknown>

    await admin
      .from('clients')
      .update({ metadata: { ...metadata, posting_paused: Boolean(paused) } })
      .eq('id', client.id)

    return NextResponse.json({ ok: true, paused: Boolean(paused) })
  } catch (err) {
    console.error('[dashboard/pause-posting]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
