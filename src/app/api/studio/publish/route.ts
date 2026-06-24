export const runtime = 'nodejs'

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { resolveClientPlan, PLAN_SELECT } from '@/lib/plan'

function slugify(input: string): string {
  return input.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 60) || 'page'
}

/**
 * Publish a studio page: mark it live and assign a unique slug. The page itself
 * is rendered on demand by the public /p/[slug] Server Component from the stored
 * content + theme — so we never render React-to-HTML here (the App Router blocks
 * react-dom/server in route handlers) and published pages always reflect edits.
 */
export async function POST(request: NextRequest) {
  try {
    const { pageId } = (await request.json()) as { pageId?: string }
    if (!pageId) return NextResponse.json({ error: 'pageId required' }, { status: 400 })

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const admin = createAdminClient()
    const { data: client } = await admin
      .from('clients')
      .select(`id, ${PLAN_SELECT}`)
      .eq('user_id', user.id)
      .single()
    if (!client) return NextResponse.json({ error: 'Client not found' }, { status: 404 })

    const { data: page } = await admin
      .from('studio_pages')
      .select('id, title, slug, status, content')
      .eq('id', pageId)
      .eq('client_id', client.id)
      .single()
    if (!page) return NextResponse.json({ error: 'Page not found' }, { status: 404 })

    // Entitlement gate: enforce landing-page quota when taking a NEW page live.
    if (page.status !== 'live') {
      const plan = resolveClientPlan(client)
      const limit = plan?.entitlements.landingPagesPerMonth ?? 1
      if (limit !== -1) {
        const { count: liveCount } = await admin
          .from('studio_pages')
          .select('id', { count: 'exact', head: true })
          .eq('client_id', client.id)
          .eq('status', 'live')
        if ((liveCount ?? 0) >= limit) {
          return NextResponse.json(
            { error: `Your plan includes ${limit} landing page${limit === 1 ? '' : 's'}. Upgrade to publish more.`, code: 'LANDING_PAGE_LIMIT' },
            { status: 403 },
          )
        }
      }
    }

    // Assign a unique slug (reuse existing; else derive from title).
    const content = (page.content ?? {}) as { brandName?: string }
    let slug: string = page.slug ?? slugify(page.title ?? content.brandName ?? 'page')
    const { data: clash } = await admin
      .from('studio_pages')
      .select('id')
      .eq('slug', slug)
      .neq('id', pageId)
      .maybeSingle()
    if (clash) slug = `${slug}-${pageId.slice(0, 6)}`

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'
    const url = `${baseUrl}/p/${slug}`

    const { error: updateError } = await admin
      .from('studio_pages')
      .update({ slug, status: 'live', published_at: new Date().toISOString(), updated_at: new Date().toISOString() })
      .eq('id', pageId)
    if (updateError) {
      console.error('[studio/publish] update failed:', updateError)
      return NextResponse.json({ error: 'Failed to publish' }, { status: 500 })
    }

    return NextResponse.json({ success: true, slug, url })
  } catch (err) {
    console.error('[studio/publish]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
