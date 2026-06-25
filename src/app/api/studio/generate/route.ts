export const maxDuration = 60
export const runtime = 'nodejs'

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { generateJSON } from '@/lib/openrouter'
import { normalizeKitContent, KIT_LIMITS, type KitContent } from '@/lib/studio/kit-schema'
import { deriveThemeFromBrand, type ThemeProps } from '@/lib/studio/theme'
import { composeLayout, composeVariants } from '@/components/studio/blocks/registry'

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
        system: 'You are a senior conversion copywriter for high-end brands. You write specific, confident, benefit-led copy — never generic SaaS filler. Return ONLY valid JSON, no prose, no markdown.',
        // Haiku 4.5 (the default fast path) — the detailed prompt below already
        // enforces the quality bar, and Haiku returns in ~6-10s vs ~28s for Sonnet,
        // which keeps the request well under the Vercel function limit and stops
        // the builder from feeling broken while the user waits.
        maxTokens: 4096,
        prompt: `Write the CONTENT for one landing page. Return ONLY JSON in the exact shape below — text only, no design, no HTML.

BUSINESS: ${businessName}
WHAT THEY DO: ${bp?.business_description ?? ''}
AUDIENCE: ${bp?.target_audience ?? 'small businesses'}
TONE: ${tone}
PAGE GOAL (from the user): ${goal.trim()}

COPY PRINCIPLES (these matter most):
- Lead with the customer OUTCOME, not the feature. Say what they get, then how.
- Be specific and concrete. Name the real thing this business does; avoid vague abstractions.
- Address ${bp?.target_audience ?? 'the reader'} directly with "you/your".
- One clear promise per headline. Confident, not hypey.
- BANNED clichés — never use these words/phrases: "unlock", "unleash", "elevate", "empower", "seamless", "seamlessly", "take your X to the next level", "game-changer", "revolutionize", "supercharge", "world-class", "cutting-edge", "best-in-class", "one-stop shop", "and more", "the future of".
- Vary sentence shape. No two features should start the same way.

EXAMPLE of the QUALITY bar (for a different business — do NOT copy, just match the SPECIFICITY and tone):
{ "hero": { "headline": "Your roof, inspected free before storm season", "subhead": "We climb up, check every flashing and valley, and send you photos and a clear written report — no obligation, no sales pitch." } }
(Note: concrete actions, a real promise, plain language — not "Elevate your home's protection".)

LENGTH + STRUCTURE RULES:
- Headlines <= ${KIT_LIMITS.headline} chars. Subheads <= ${KIT_LIMITS.subhead} chars.
- Exactly 3 features, each title <= ${KIT_LIMITS.featureTitle} chars, body <= ${KIT_LIMITS.featureBody} chars.
- 3 testimonials (realistic, first-name + last-initial author). Quote <= ${KIT_LIMITS.quote} chars. Make them sound like real customers, specific to this business.
- Punchy CTA button labels <= ${KIT_LIMITS.cta} chars (verbs: "Start free", "Book a call", "Get a quote").
- 3-4 stats: a short value + label. IMPORTANT: only use stats that are plausible and generic enough to be true (e.g. "Same-day", "Local", "5★ rated") OR clearly illustrative — do NOT fabricate precise numbers that imply verified data unless they're obviously round/illustrative.
- 3 pricing tiers ONLY if this business plausibly sells tiered plans (omit entirely otherwise). name, price, short blurb, 3-5 feature bullets, cta. Mark the middle/best tier "highlighted": true.
- 4-5 FAQ items: a real question THIS business's customers ask + a concise answer (<= ${KIT_LIMITS.faqA} chars).
- 3-4 team members (omit if not relevant to this business type).
- Image alt fields: describe a real, on-brand scene a photographer would shoot for THIS business (not abstract).
- Omit any optional section that genuinely doesn't fit (null or leave out).

JSON shape (optional sections may be omitted/null when they don't fit the business):
{
  "brandName": "string",
  "hero": { "eyebrow": "short label", "headline": "string", "subhead": "string", "ctaPrimary": "string", "ctaSecondary": "string", "image": { "alt": "describe an ideal hero image" } },
  "features": { "heading": "string", "subhead": "string", "items": [ { "title": "string", "body": "string" } ] },
  "showcase": { "heading": "string", "body": "string", "image": { "alt": "describe an ideal showcase image" } },
  "testimonials": { "heading": "string", "items": [ { "quote": "string", "author": "string" } ] },
  "cta": { "headline": "string", "subhead": "string", "button": "string" },
  "stats": [ { "value": "string", "label": "string" } ],
  "pricing": { "heading": "string", "subhead": "string", "tiers": [ { "name": "string", "price": "string", "blurb": "string", "features": ["string"], "cta": "string", "highlighted": false } ] },
  "faq": { "heading": "string", "items": [ { "q": "string", "a": "string" } ] },
  "team": { "heading": "string", "members": [ { "name": "string", "role": "string" } ] }
}`,
      })
    } catch (err) {
      console.error('[studio/generate] AI generation failed:', err)
      return NextResponse.json({ error: 'Content generation failed. Please try again.' }, { status: 502 })
    }

    const content: KitContent = normalizeKitContent(raw, businessName)

    // 2. Do NOT generate Gemini images inline — each takes ~10-15s and would push
    //    this request past Vercel's function timeout (10s Hobby / 60s Pro) → 502.
    //    Seed the hero with the brand logo so the page is renderable immediately,
    //    and let the client fill images progressively via /api/studio/regenerate-image
    //    after the preview shows. (The slot `alt` text drives those calls.)
    content.hero.image.src = bp?.logo_url ?? null
    content.showcase.image.src = null

    // 3. Derive the theme deterministically from the brand color (always valid).
    const theme: ThemeProps = deriveThemeFromBrand({ accent: bp?.primary_color ?? null })

    // 4. Compose the page layout from the content the AI actually produced —
    //    different brands get different (but always valid) block orders.
    const layout = composeLayout(content)
    const variants = composeVariants(content)

    return NextResponse.json({ content, theme, layout, variants })
  } catch (err) {
    console.error('[studio/generate]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
