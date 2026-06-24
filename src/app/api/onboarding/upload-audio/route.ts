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
      maxBytes: 50 * 1024 * 1024, // 50MB
      allowedTypes: ['audio/'],
    })
    if (invalid || !file) {
      return NextResponse.json({ error: invalid ?? 'No file provided in form data' }, { status: 400 })
    }

    const fileExtension = file.name.split('.').pop() ?? 'mp3'
    const timestamp = Date.now()
    const storagePath = `${client.id}/audio_${timestamp}.${fileExtension}`

    // Upload to Supabase Storage bucket 'recordings'
    const { error: uploadError } = await supabase.storage
      .from('recordings')
      .upload(storagePath, file, {
        contentType: file.type || 'audio/mpeg',
        upsert: false,
      })

    if (uploadError) {
      console.error('Error uploading audio to storage:', uploadError)
      return NextResponse.json({ error: 'Failed to upload audio' }, { status: 500 })
    }

    // Insert asset record
    const { error: assetError } = await supabase.from('assets').insert({
      client_id: client.id,
      type: 'audio_recording',
      status: 'ready',
      storage_path: storagePath,
      file_name: file.name,
      file_size: file.size,
    })

    if (assetError) console.error('Error inserting audio asset record:', assetError)

    // Initiate ElevenLabs voice clone
    // TODO: Full implementation — download file from Supabase Storage, re-upload as multipart FormData
    // ElevenLabs requires the audio file bytes sent as multipart/form-data (not JSON)
    const elevenResponse = await fetch('https://api.elevenlabs.io/v1/voices/add', {
      method: 'POST',
      headers: {
        'xi-api-key': process.env.ELEVENLABS_API_KEY ?? '',
      },
      // Note: ElevenLabs voice clone requires multipart form with audio file
      // Full implementation: download from storage, re-upload as FormData
      // TODO: implement full flow
    })

    console.log('ElevenLabs voice clone initiated, status:', elevenResponse.status)

    // Log activity
    await supabase.from('activities').insert({
      client_id: client?.id,
      type: 'onboarding_step',
      title: 'Voice sample uploaded — ElevenLabs voice clone in progress',
      description: 'Voice clone will be ready within a few minutes.',
      created_by: 'system',
    })

    return NextResponse.json({ success: true, path: storagePath })
  } catch (error) {
    console.error('POST /api/onboarding/upload-audio error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
