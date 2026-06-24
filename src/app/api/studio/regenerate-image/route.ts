export const maxDuration = 60
export const runtime = 'nodejs'

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { generateSlotImage, type StudioBrand } from '@/lib/studio/images'
import type { SlotShape } from '@/components/studio/Slot'

const SLOT_SHAPE: Record<string, SlotShape> = { hero: '4/3', showcase: '3/2' }

/**
 * Regenerate a single slot image (hero | showcase) on demand from the editor.
 * Returns a fresh public URL. Best-effort: a failure returns 502 and the editor
 * keeps the existing image.
 */
export async function POST(request: NextRequest) {
  try {
    const { slot, scene } = (await request.json()) as { slot?: string; scene?: string }
    if (slot !== 'hero' && slot !== 'showcase') {
      return NextResponse.json({ error: 'slot must be "hero" or "showcase"' }, { status: 400 })
    }

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
      .select('business_description, primary_color, tone_of_voice')
      .eq('client_id', client.id)
      .single()

    const brand: StudioBrand = {
      businessName: client.business_name ?? 'Your Business',
      description: bp?.business_description ?? undefined,
      primaryColor: bp?.primary_color ?? null,
      vibe: bp?.tone_of_voice ?? undefined,
    }

    const url = await generateSlotImage({
      clientId: client.id,
      pageKey: slot,
      scene: (typeof scene === 'string' && scene.trim()) || `${brand.businessName} ${slot} image`,
      shape: SLOT_SHAPE[slot],
      brand,
    })

    if (!url) return NextResponse.json({ error: 'Image generation failed' }, { status: 502 })
    return NextResponse.json({ url })
  } catch (err) {
    console.error('[studio/regenerate-image]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
