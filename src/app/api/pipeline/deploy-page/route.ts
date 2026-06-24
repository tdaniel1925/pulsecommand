import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { resolveClientPlan, PLAN_SELECT } from '@/lib/plan'

interface PageContent {
  headline?: string
  subheadline?: string
  body?: string
  cta?: string
}

function slugify(input: string): string {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60)
}

/** Escape a value before interpolating into the generated HTML (XSS-safe). */
function esc(input: unknown): string {
  return String(input ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

export async function POST(request: NextRequest) {
  try {
    const { pageId, clientId } = await request.json()

    const supabase = await createClient()

    // Authorization: caller must own this client (RLS also enforces it).
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const { data: owner } = await supabase
      .from('clients')
      .select('id')
      .eq('id', clientId)
      .eq('user_id', user.id)
      .maybeSingle()
    if (!owner) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const { data: page } = await supabase
      .from('landing_pages')
      .select('*')
      .eq('id', pageId)
      .eq('client_id', clientId)
      .single()

    if (!page) {
      return NextResponse.json({ error: 'Page not found' }, { status: 404 })
    }

    // Entitlement gate: enforce the plan's landing-page quota. Publishing an
    // already-live page (re-publish/edit) never counts against the quota; only
    // taking a NEW page live does. -1 = unlimited.
    if (page.status !== 'live') {
      const { data: planClient } = await supabase
        .from('clients')
        .select(PLAN_SELECT)
        .eq('id', clientId)
        .single()
      const plan = planClient ? resolveClientPlan(planClient) : null
      const limit = plan?.entitlements.landingPagesPerMonth ?? 1
      if (limit !== -1) {
        const { count: liveCount } = await supabase
          .from('landing_pages')
          .select('id', { count: 'exact', head: true })
          .eq('client_id', clientId)
          .eq('status', 'live')
        if ((liveCount ?? 0) >= limit) {
          return NextResponse.json(
            {
              error: `Your plan includes ${limit} landing page${limit === 1 ? '' : 's'}. Upgrade to publish more.`,
              code: 'LANDING_PAGE_LIMIT',
            },
            { status: 403 },
          )
        }
      }
    }

    const { data: client } = await supabase
      .from('clients')
      .select('*')
      .eq('id', clientId)
      .single()

    const { data: brandProfile } = await supabase
      .from('brand_profiles')
      .select('*')
      .eq('client_id', clientId)
      .single()

    // Generate HTML content for the landing page
    const pageContent = JSON.stringify(page.content) !== '{}'
      ? page.content
      : {
          headline: `${client?.business_name ?? 'Welcome'}`,
          subheadline: brandProfile?.uniqueValueProp ?? '',
          cta: 'Get Started Today',
          body: brandProfile?.businessDescription ?? '',
        }

    // Simple HTML template
    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${page.title}</title>
  <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-white font-sans">
  <div class="min-h-screen flex flex-col items-center justify-center px-6 py-20 text-center max-w-3xl mx-auto">
    <h1 class="text-5xl font-bold text-gray-900 mb-6">${esc((pageContent as PageContent).headline ?? page.title)}</h1>
    <p class="text-xl text-gray-600 mb-8">${esc((pageContent as PageContent).subheadline ?? '')}</p>
    <p class="text-gray-700 mb-10">${esc((pageContent as PageContent).body ?? '')}</p>
    <a href="#contact" class="bg-blue-600 text-white font-bold px-8 py-4 rounded-xl text-lg hover:bg-blue-700 transition">
      ${esc((pageContent as PageContent).cta ?? 'Get Started')}
    </a>
  </div>
</body>
</html>`

    // Ensure a unique slug. Reuse the page's slug if set, else derive from title.
    let slug: string = page.slug ?? slugify(page.title ?? `page-${pageId.slice(0, 8)}`)
    if (!slug) slug = `page-${pageId.slice(0, 8)}`
    // If another page already owns this slug, suffix with a short id fragment.
    const { data: clash } = await supabase
      .from('landing_pages')
      .select('id')
      .eq('slug', slug)
      .neq('id', pageId)
      .maybeSingle()
    if (clash) slug = `${slug}-${pageId.slice(0, 6)}`

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'
    const publicUrl = `${baseUrl}/p/${slug}`

    // Store the rendered HTML and publish — served in-app from /p/[slug].
    const { error: updateError } = await supabase
      .from('landing_pages')
      .update({
        slug,
        html,
        url: publicUrl,
        status: 'live',
        published_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', pageId)

    if (updateError) {
      console.error('deploy-page update error:', updateError)
      return NextResponse.json({ error: 'Failed to publish page' }, { status: 500 })
    }

    await supabase.from('activities').insert({
      client_id: clientId,
      type: 'content_published',
      title: `Landing page "${page.title}" is live`,
      description: `Published at ${publicUrl}`,
      created_by: 'system',
    })

    return NextResponse.json({ success: true, slug, url: publicUrl })
  } catch (err) {
    console.error('deploy-page error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
