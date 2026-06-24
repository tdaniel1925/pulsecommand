import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { sendPostApprovedEmail } from '@/lib/email'

// POST /api/content/approve
// Body: { type: 'post' | 'video', id: string, action: 'approve' | 'reject' }
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { type, id, action } = await request.json()
    if (!type || !id || !action) {
      return NextResponse.json({ error: 'type, id, and action are required' }, { status: 400 })
    }

    const admin = createAdminClient()

    const { data: client } = await admin
      .from('clients')
      .select('id')
      .eq('user_id', user.id)
      .single()

    if (!client) return NextResponse.json({ error: 'Client not found' }, { status: 404 })

    if (type === 'post') {
      const newStatus = action === 'approve' ? 'scheduled' : 'rejected'
      const { error } = await admin
        .from('social_posts')
        .update({ status: newStatus })
        .eq('id', id)
        .eq('client_id', client.id)

      if (error) return NextResponse.json({ error: error.message }, { status: 500 })

      await admin.from('activities').insert({
        client_id: client.id,
        type: 'post',
        title: action === 'approve' ? 'Post approved — sending to Ayrshare' : 'Post rejected',
        description: action === 'approve'
          ? 'Social post approved and being submitted for publishing.'
          : 'Social post rejected and removed from queue.',
        created_by: user.id,
      })

      if (action === 'approve') {
        // Fetch post + client details for email
        try {
          const { data: post } = await admin
            .from('social_posts')
            .select('platforms, image_url')
            .eq('id', id)
            .single()
          const { data: clientData } = await admin
            .from('clients')
            .select('email, business_name')
            .eq('id', client.id)
            .single()
          if (clientData?.email && post) {
            await sendPostApprovedEmail({
              to: clientData.email,
              businessName: clientData.business_name ?? 'Your Business',
              platforms: Array.isArray(post.platforms) ? post.platforms : [],
            }).catch((e: Error) => console.error('[approve] email failed:', e.message))
          }
        } catch (emailErr: unknown) {
          const msg = emailErr instanceof Error ? emailErr.message : String(emailErr)
          console.error('[approve] email lookup failed:', msg)
        }

        // Publish to Ayrshare (fire and forget)
        const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://pulse-command1.vercel.app'
        fetch(`${baseUrl}/api/ayrshare/publish`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ postId: id }),
        }).catch((err: Error) => console.error('ayrshare publish trigger failed:', err))
      }

    } else if (type === 'video') {
      const newStatus = action === 'approve' ? 'approved' : 'rejected'
      const { error } = await admin
        .from('videos')
        .update({ status: newStatus })
        .eq('id', id)
        .eq('client_id', client.id)

      if (error) return NextResponse.json({ error: error.message }, { status: 500 })

      await admin.from('activities').insert({
        client_id: client.id,
        type: 'video',
        title: action === 'approve' ? 'Video approved' : 'Video rejected',
        description: action === 'approve'
          ? 'AI video approved for publishing.'
          : 'AI video rejected.',
        created_by: user.id,
      })
    } else {
      return NextResponse.json({ error: 'Invalid type' }, { status: 400 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('approve error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
