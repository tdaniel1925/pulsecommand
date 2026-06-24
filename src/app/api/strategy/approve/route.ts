import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createNotification } from '@/lib/notifications'
import { generateMonthlyPostsForClient } from '@/lib/generate-monthly-posts'

export async function POST(request: NextRequest) {
  try {
    const supabase = createAdminClient()

    // Get current user from auth
    const authHeader = request.headers.get('authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const token = authHeader.slice(7)
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get client
    const { data: client, error: clientError } = await supabase
      .from('clients')
      .select('id, email, first_name')
      .eq('user_id', user.id)
      .single()

    if (clientError || !client) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 })
    }

    // Approve strategy
    const { error: updateError } = await supabase
      .from('brand_profiles')
      .update({
        strategy_approved: true,
        strategy_approved_at: new Date().toISOString(),
      })
      .eq('client_id', client.id)

    if (updateError) {
      console.error('Error approving strategy:', updateError)
      return NextResponse.json({ error: 'Failed to approve strategy' }, { status: 500 })
    }

    // Log activity
    await supabase.from('activities').insert({
      client_id: client.id,
      type: 'strategy',
      title: 'Brand Strategy Plan approved',
      description: 'User approved the strategy. Content generation starting now.',
    })

    // Send notification
    await createNotification({
      clientId: client.id,
      type: 'strategy_approved',
      title: 'Strategy Approved!',
      body: 'Your brand strategy has been approved. Content generation will start within the next few hours.',
      link: '/dashboard/social',
    }).catch(() => {})

    // Trigger content generation in-process (fire and forget)
    try {
      void generateMonthlyPostsForClient(client.id).catch(err =>
        console.error('Content generation failed:', err)
      )
    } catch (err) {
      console.error('Content generation trigger failed:', err)
    }

    return NextResponse.json({
      success: true,
      message: 'Strategy approved and content generation started',
    })
  } catch (error) {
    console.error('Strategy approve error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
