import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { validateUpload } from '@/lib/validation'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const formData = await request.formData()
    const file = formData.get('logo') as File | null
    const invalid = validateUpload(file, {
      maxBytes: 5 * 1024 * 1024, // 5MB
      allowedTypes: ['image/png', 'image/jpeg', 'image/webp', 'image/svg+xml'],
    })
    if (invalid || !file) return NextResponse.json({ error: invalid ?? 'No file provided' }, { status: 400 })

    const ext = file.name.split('.').pop()
    const path = `logos/${user.id}/logo.${ext}`
    const buffer = await file.arrayBuffer()

    const { error } = await supabase.storage
      .from('logos')
      .upload(path, buffer, { contentType: file.type, upsert: true })

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    const { data: { publicUrl } } = supabase.storage.from('logos').getPublicUrl(path)

    return NextResponse.json({ success: true, url: publicUrl })
  } catch (err) {
    console.error('upload-logo error:', err)
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 })
  }
}
