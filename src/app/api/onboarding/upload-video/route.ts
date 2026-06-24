import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { validateUpload } from '@/lib/validation'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Fetch client record
    const { data: client, error: clientError } = await supabase
      .from('clients')
      .select('id')
      .eq('user_id', user.id)
      .single()

    if (clientError || !client) {
      return NextResponse.json({ error: 'Client profile not found' }, { status: 404 })
    }

    // Parse multipart form data
    const formData = await request.formData()
    const file = formData.get('file') as File | null

    const invalid = validateUpload(file, {
      maxBytes: 200 * 1024 * 1024, // 200MB
      allowedTypes: ['video/'],
    })
    if (invalid || !file) {
      return NextResponse.json({ error: invalid ?? 'No file provided in form data' }, { status: 400 })
    }

    const fileExtension = file.name.split('.').pop() ?? 'mp4'
    const timestamp = Date.now()
    const storagePath = `${client.id}/video_${timestamp}.${fileExtension}`

    // Upload to Supabase Storage bucket 'recordings'
    const { error: uploadError } = await supabase.storage
      .from('recordings')
      .upload(storagePath, file, {
        contentType: file.type || 'video/mp4',
        upsert: false,
      })

    if (uploadError) {
      console.error('Error uploading video to storage:', uploadError)
      return NextResponse.json({ error: 'Failed to upload video' }, { status: 500 })
    }

    // Insert asset record
    const { error: assetError } = await supabase.from('assets').insert({
      client_id: client.id,
      type: 'video_recording',
      status: 'ready',
      storage_path: storagePath,
      file_name: file.name,
      file_size: file.size,
    })

    if (assetError) console.error('Error inserting asset record:', assetError)

    // TODO: Submit to HeyGen for avatar training
    // HeyGen requires manual verification step — this is the ONLY manual step in the pipeline.
    // After upload, admin must approve the video in the HeyGen dashboard before AI videos can be generated.
    // HeyGen API reference: https://docs.heygen.com/reference/upload-talking-photo
    // Full implementation: POST to https://upload.heygen.com/v1/talking_photo with the video file

    // Notify admin via activity log that manual HeyGen verification is needed
    await supabase.from('activities').insert({
      client_id: client.id,
      type: 'onboarding_step',
      title: 'Avatar video uploaded — pending HeyGen verification',
      description: 'Admin must manually approve the avatar video in HeyGen dashboard before AI videos can be generated.',
      created_by: 'system',
    })

    // Update onboarding step
    await supabase
      .from('clients')
      .update({ onboarding_step: 'assets_recorded' })
      .eq('id', client.id)

    return NextResponse.json({ success: true, path: storagePath })
  } catch (error) {
    console.error('POST /api/onboarding/upload-video error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
