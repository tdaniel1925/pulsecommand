export const maxDuration = 60
export const runtime = 'nodejs'

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { generateJSON, DEFAULT_MODEL } from '@/lib/openrouter'
import { normalizeKitContent, KIT_LIMITS, type KitContent } from '@/lib/studio/kit-schema'
import { deriveThemeFromBrand, type ThemeProps } from '@/lib/studio/theme'
import { generateSlotImage, type StudioBrand } from '@/lib/studio/images'

/**
 * Studio AI fill — turns a plain-language goal + the client's brand into a fully
 * populated KitContent and a derived theme. The AI only produces CONTENT; the
 * theme is derived deterministically from the brand color, and lengths are
 * clamped by normalizeKitContent — so the result is always renderable and good.
 */
export async function POST(request: NextRequest) {
  try {
    const { goal } = (await request.json()) as { goal?: string }
    if (!goal || typeof goal !== 'string' || goal.trim().length < 3) {
      return NextResponse.json({ error: 'Please describe the page goal.' }, { status: 400 })
    }

    // Auth + resolve the caller's client + brand profile.
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
      .select('primary_color, secondary_color, business_description, target_audience, tone_of_voice, logo_url')
      .eq('client_id', client.id)
      .single()

    const businessName = client.business_name ?? 'Your Business'
    const tone = bp?.tone_of_voice ?? 'professional and friendly'

    // 1. Generate the page CONTENT (not design) as structured JSON.
    let raw: unknown = {}
    try {
      raw = await generateJSON({
        model: DEFAULT_MODEL,
        maxTokens: 1600,
        prompt: `You are an expert conversion copywriter. Write the CONTENT for a single
landing page. Return ONLY JSON matching this exact shape — no design, no HTML, just text.

BUSINESS: ${businessName}
WHAT THEY DO: ${bp?.business_description ?? ''}
AUDIENCE: ${bp?.target_audience ?? 'small businesses'}
TONE: ${tone}
PAGE GOAL (from the user): ${goal.trim()}

Rules:
- Headlines <= ${KIT_LIMITS.headline} chars. Subheads <= ${KIT_LIMITS.subhead} chars.
- Exactly 3 features, each title <= ${KIT_LIMITS.featureTitle} chars, body <= ${KIT_LIMITS.featureBody} chars.
- 3 short testimonials (realistic, first-name + last-initial author). Quote <= ${KIT_LIMITS.quote} chars.
- Punchy CTA button labels <= ${KIT_LIMITS.cta} chars.
- Write specifically for THIS business and goal — no lorem, no placeholders.

JSON shape:
{
  "brandName": "string",
  "hero": { "eyebrow": "short label", "headline": "string", "subhead": "string", "ctaPrimary": "string", "ctaSecondary": "string", "image": { "alt": "describe an ideal hero image" } },
  "features": { "heading": "string", "subhead": "string", "items": [ { "title": "string", "body": "string" } ] },
  "showcase": { "heading": "string", "body": "string", "image": { "alt": "describe an ideal showcase image" } },
  "testimonials": { "heading": "string", "items": [ { "quote": "string", "author": "string" } ] },
  "cta": { "headline": "string", "subhead": "string", "button": "string" }
}`,
      })
    } catch (err) {
      console.error('[studio/generate] AI generation failed:', err)
      return NextResponse.json({ error: 'Content generation failed. Please try again.' }, { status: 502 })
    }

    const content: KitContent = normalizeKitContent(raw, businessName)

    // 2. Generate on-brand images for the hero + showcase slots with Gemini.
    //    Uses each slot's AI-written `alt` as the scene. Best-effort and parallel;
    //    on failure the hero falls back to the logo and the showcase to a
    //    themed placeholder, so the page is always renderable.
    const brand: StudioBrand = {
      businessName,
      description: bp?.business_description ?? undefined,
      primaryColor: bp?.primary_color ?? null,
      vibe: bp?.tone_of_voice ?? undefined,
    }
    const [heroImg, showcaseImg] = await Promise.all([
      generateSlotImage({ clientId: client.id, pageKey: 'hero', scene: content.hero.image.alt || `${businessName} hero scene`, shape: '4/3', brand }),
      generateSlotImage({ clientId: client.id, pageKey: 'showcase', scene: content.showcase.image.alt || `${businessName} in action`, shape: '3/2', brand }),
    ])
    content.hero.image.src = heroImg ?? bp?.logo_url ?? null
    content.showcase.image.src = showcaseImg ?? null

    // 3. Derive the theme deterministically from the brand color (always valid).
    const theme: ThemeProps = deriveThemeFromBrand({ accent: bp?.primary_color ?? null })

    return NextResponse.json({ content, theme })
  } catch (err) {
    console.error('[studio/generate]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
