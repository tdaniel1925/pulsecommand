export const runtime = 'nodejs'

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { normalizeKitContent } from '@/lib/studio/kit-schema'
import { normalizeLayout } from '@/components/studio/blocks/registry'

/**
 * Create or update a studio_pages draft. Stores the editable content + theme;
 * publishing (which bakes the HTML) is a separate step.
 */
export async function POST(request: NextRequest) {
  try {
    const { pageId, goal, content, theme, title, kit, layout, variants } = await request.json()

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const admin = createAdminClient()
    const { data: client } = await admin
      .from('clients')
      .select('id, business_name')
      .eq('user_id', user.id)
      .single()
    if (!client) return NextResponse.json({ error: 'Client not found' }, { status: 404 })

    const safeContent = normalizeKitContent(content, client.business_name ?? 'Your Business')
    const row: Record<string, unknown> = {
      client_id: client.id,
      kit: typeof kit === 'string' ? kit : 'atlas',
      title: typeof title === 'string' ? title.slice(0, 120) : safeContent.brandName,
      goal: typeof goal === 'string' ? goal.slice(0, 500) : null,
      content: safeContent,
      theme: theme ?? {},
      layout: Array.isArray(layout) ? normalizeLayout(layout) : null,
      variants: variants && typeof variants === 'object' ? variants : null,
      updated_at: new Date().toISOString(),
    }

    // The layout/variants columns may not exist yet (migrations not run). PostgREST
    // reports a missing column as PGRST204; raw PG as 42703. Drop whichever column
    // is missing and retry, so saving still works pre-migration.
    const missingCol = (e: { code?: string; message?: string } | null, col: string) =>
      !!e && (
        e.code === '42703' ||
        e.code === 'PGRST204' ||
        new RegExp(`(column|find).*['"]?${col}['"]?.* (does not exist|in the schema cache)`, 'i').test(e.message ?? '')
      )

    const write = async (r: Record<string, unknown>) =>
      pageId
        ? admin.from('studio_pages').update(r).eq('id', pageId).eq('client_id', client.id).select('id').single()
        : admin.from('studio_pages').insert(r).select('id').single()

    const attempt: Record<string, unknown> = { ...row }
    let res = await write(attempt)
    for (const col of ['layout', 'variants']) {
      if (res.error && missingCol(res.error, col)) {
        delete attempt[col]
        res = await write(attempt)
      }
    }
    if (res.error) throw res.error
    return NextResponse.json({ id: res.data!.id })
  } catch (err) {
    console.error('[studio/save]', err)
    return NextResponse.json({ error: 'Failed to save' }, { status: 500 })
  }
}
