import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { requireAdmin } from '@/lib/auth/admin'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const gate = await requireAdmin()
    if (gate.response) return gate.response

    const { id: clientId } = await params

    const body = await request.json()
    const { type, content, imageUrl, videoUrl, audioUrl, platforms, title } = body

    const admin = createAdminClient()

    if (type === 'post') {
      await admin.from('social_posts').insert({
        client_id: clientId,
        content: content ?? '',
        image_url: imageUrl ?? null,
        platforms: platforms ?? [],
        status: 'pending_approval',
        created_by: 'admin',
      })
    } else if (type === 'video') {
      await admin.from('videos').insert({
        client_id: clientId,
        title: title ?? 'Admin Video',
        video_url: videoUrl ?? null,
        status: 'pending_approval',
      })
    } else if (type === 'audio') {
      await admin.from('audio_episodes').insert({
        client_id: clientId,
        title: title ?? 'Admin Audio',
        audio_url: audioUrl ?? null,
        status: 'pending_approval',
      })
    } else {
      return NextResponse.json({ error: 'Invalid type' }, { status: 400 })
    }

    await admin.from('activities').insert({
      client_id: clientId,
      type,
      title: `Admin added ${type} content`,
      description: `${type === 'post' ? 'Social post' : type === 'video' ? 'Video' : 'Audio episode'} added manually by admin and sent to client approval queue.`,
      created_by: 'admin',
    })

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('add-content error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
