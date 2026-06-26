export const runtime = 'nodejs'

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

/**
 * Edit the caption of one of the logged-in client's posts (before it publishes).
 * Updates the top-level content and, when an `platform` is given, the per-platform
 * caption in metadata.captions. Published posts cannot be edited.
 * body: { postId: string, content: string, platform?: string }
 */
export async function POST(req: NextRequest) {
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

    const { postId, content, platform } = (await req.json()) as {
      postId?: string; content?: string; platform?: string
    }
    if (!postId || typeof content !== 'string') {
      return NextResponse.json({ error: 'postId and content are required' }, { status: 400 })
    }

    const { data: post } = await admin
      .from('social_posts')
      .select('id, status, content, metadata')
      .eq('id', postId)
      .eq('client_id', client.id)
      .single()
    if (!post) return NextResponse.json({ error: 'Post not found' }, { status: 404 })
    if (post.status === 'published') {
      return NextResponse.json({ error: 'Published posts can\'t be edited.' }, { status: 400 })
    }

    const trimmed = content.slice(0, 3000)
    const metadata = (post.metadata && typeof post.metadata === 'object'
      ? post.metadata
      : {}) as Record<string, unknown>
    const captions = (metadata.captions && typeof metadata.captions === 'object'
      ? metadata.captions
      : {}) as Record<string, string>

    // If a platform tab was being edited, update that caption; always keep the
    // top-level content in sync (it's the fallback used at publish time).
    if (platform) captions[platform] = trimmed
    const nextMetadata = { ...metadata, captions }

    await admin
      .from('social_posts')
      .update({ content: trimmed, metadata: nextMetadata })
      .eq('id', postId)

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[dashboard/edit-post]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
