export const runtime = 'nodejs'

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { IMAGE_ENGINE_CONFIG } from '@/lib/image-engine/config'
import { validateUpload } from '@/lib/validation'

/**
 * Let the user upload their OWN image for a slot (hero/showcase/etc) — a real
 * "swap", not an AI regenerate. Validates type/size, stores to the same bucket
 * as generated images, returns a public URL the editor patches into content.
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const admin = createAdminClient()
    const { data: client } = await admin
      .from('clients')
      .select('id')
      .eq('user_id', user.id)
      .single()
    if (!client) return NextResponse.json({ error: 'Client not found' }, { status: 404 })

    const formData = await request.formData()
    const file = formData.get('image') as File | null
    const slot = (formData.get('slot') as string | null) ?? 'image'

    const invalid = validateUpload(file, {
      maxBytes: 8 * 1024 * 1024, // 8MB
      allowedTypes: ['image/png', 'image/jpeg', 'image/webp', 'image/gif'],
    })
    if (invalid || !file) {
      return NextResponse.json({ error: invalid ?? 'No image provided' }, { status: 400 })
    }

    const ext = file.type.includes('png') ? 'png' : file.type.includes('webp') ? 'webp' : file.type.includes('gif') ? 'gif' : 'jpg'
    const safeSlot = slot.replace(/[^a-z0-9-]/gi, '').slice(0, 24) || 'image'
    const path = `studio/${client.id}/upload_${safeSlot}_${Date.now()}.${ext}`
    const bucket = IMAGE_ENGINE_CONFIG.storage.bucket
    const buffer = Buffer.from(await file.arrayBuffer())

    const { error } = await admin.storage.from(bucket).upload(path, buffer, {
      contentType: file.type,
      upsert: true,
    })
    if (error) {
      console.error('[studio/upload-image] storage error:', error)
      return NextResponse.json({ error: 'Upload failed' }, { status: 500 })
    }

    const { data } = admin.storage.from(bucket).getPublicUrl(path)
    return NextResponse.json({ url: data.publicUrl })
  } catch (err) {
    console.error('[studio/upload-image]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
