export const maxDuration = 30
export const runtime = 'nodejs'

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { generateJSON, DEFAULT_MODEL } from '@/lib/openrouter'
import { normalizeKitContent, KIT_LIMITS } from '@/lib/studio/kit-schema'

/**
 * Regenerate ONE section's copy independently ("rewrite just this section").
 * Returns only that slice of KitContent so the editor can patch it in place
 * without touching the rest of the page. Re-runs through normalizeKitContent so
 * the result is always length-clamped and safe.
 */

type Section = 'hero' | 'features' | 'showcase' | 'testimonials' | 'cta' | 'stats' | 'pricing' | 'faq' | 'team'

const SECTION_SHAPES: Record<Section, string> = {
  hero: `"hero": { "eyebrow": "short label", "headline": "<=${KIT_LIMITS.headline} chars", "subhead": "<=${KIT_LIMITS.subhead} chars", "ctaPrimary": "<=${KIT_LIMITS.cta} chars", "ctaSecondary": "<=${KIT_LIMITS.cta} chars" }`,
  features: `"features": { "heading": "string", "subhead": "string", "items": [ { "title": "<=${KIT_LIMITS.featureTitle}", "body": "<=${KIT_LIMITS.featureBody}" } ] } (exactly 3 items)`,
  showcase: `"showcase": { "heading": "string", "body": "string" }`,
  testimonials: `"testimonials": { "heading": "string", "items": [ { "quote": "<=${KIT_LIMITS.quote}", "author": "First L." } ] } (3 items)`,
  cta: `"cta": { "headline": "string", "subhead": "string", "button": "<=${KIT_LIMITS.cta}" }`,
  stats: `"stats": [ { "value": "e.g. 500+", "label": "string" } ] (3-4 items)`,
  pricing: `"pricing": { "heading": "string", "subhead": "string", "tiers": [ { "name": "string", "price": "string", "blurb": "string", "features": ["string"], "cta": "string", "highlighted": false } ] } (3 tiers, mark the middle highlighted)`,
  faq: `"faq": { "heading": "string", "items": [ { "q": "string", "a": "<=${KIT_LIMITS.faqA}" } ] } (4-5 items)`,
  team: `"team": { "heading": "string", "members": [ { "name": "string", "role": "string" } ] } (3-4 members)`,
}

export async function POST(request: NextRequest) {
  try {
    const { section, goal } = (await request.json()) as { section?: string; goal?: string }
    if (!section || !(section in SECTION_SHAPES)) {
      return NextResponse.json({ error: 'Invalid section' }, { status: 400 })
    }
    const sec = section as Section

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

    const { data: bp } = await admin
      .from('brand_profiles')
      .select('business_description, target_audience, tone_of_voice')
      .eq('client_id', client.id)
      .single()

    const businessName = client.business_name ?? 'Your Business'

    let raw: unknown = {}
    try {
      raw = await generateJSON({
        model: DEFAULT_MODEL,
        maxTokens: 1200,
        prompt: `You are an expert conversion copywriter. Rewrite ONE section of a landing page
for this business with a FRESH, different take. Return ONLY JSON with that one key.

BUSINESS: ${businessName}
WHAT THEY DO: ${bp?.business_description ?? ''}
AUDIENCE: ${bp?.target_audience ?? 'small businesses'}
TONE: ${bp?.tone_of_voice ?? 'professional and friendly'}
PAGE GOAL: ${goal?.trim() ?? 'promote this business'}

Write specifically for THIS business — no lorem, no placeholders. Vary the angle from a
typical version so it feels genuinely new.

JSON shape (return ONLY this key):
{ ${SECTION_SHAPES[sec]} }`,
      })
    } catch (err) {
      console.error('[studio/regenerate-section] AI failed:', err)
      return NextResponse.json({ error: 'Regeneration failed. Please try again.' }, { status: 502 })
    }

    // Normalize the full content (with just this section provided) and return only
    // the requested slice — guarantees length clamps + shape safety.
    const normalized = normalizeKitContent(raw, businessName)
    const slice = (normalized as unknown as Record<string, unknown>)[sec]

    return NextResponse.json({ section: sec, value: slice })
  } catch (err) {
    console.error('[studio/regenerate-section]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
