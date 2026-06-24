export const runtime = 'nodejs'

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { normalizeKitContent } from '@/lib/studio/kit-schema'

/**
 * Create or update a studio_pages draft. Stores the editable content + theme;
 * publishing (which bakes the HTML) is a separate step.
 */
export async function POST(request: NextRequest) {
  try {
    const { pageId, goal, content, theme, title, kit } = await request.json()

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
    const row = {
      client_id: client.id,
      kit: typeof kit === 'string' ? kit : 'atlas',
      title: typeof title === 'string' ? title.slice(0, 120) : safeContent.brandName,
      goal: typeof goal === 'string' ? goal.slice(0, 500) : null,
      content: safeContent,
      theme: theme ?? {},
      updated_at: new Date().toISOString(),
    }

    if (pageId) {
      // Update existing draft (RLS + client match enforced).
      const { data, error } = await admin
        .from('studio_pages')
        .update(row)
        .eq('id', pageId)
        .eq('client_id', client.id)
        .select('id')
        .single()
      if (error) throw error
      return NextResponse.json({ id: data.id })
    }

    const { data, error } = await admin
      .from('studio_pages')
      .insert(row)
      .select('id')
      .single()
    if (error) throw error
    return NextResponse.json({ id: data.id })
  } catch (err) {
    console.error('[studio/save]', err)
    return NextResponse.json({ error: 'Failed to save' }, { status: 500 })
  }
}
