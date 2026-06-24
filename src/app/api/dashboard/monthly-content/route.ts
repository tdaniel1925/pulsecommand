import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

interface ContentStats {
  totalPieces: number
  whitepaper: number
  articles: number
  tweets: number
  infographics: number
  caseStudies: number
  emails: number
  podcasts: number
}

export async function GET(request: NextRequest) {
  try {
    const admin = createAdminClient()

    // Get current user from auth header
    const authHeader = request.headers.get('authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const token = authHeader.slice(7)
    const { data: { user }, error: authError } = await admin.auth.getUser(token)

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get client ID from user
    const { data: client, error: clientError } = await admin
      .from('clients')
      .select('id')
      .eq('user_id', user.id)
      .single()

    if (clientError || !client) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 })
    }

    // Get current month's content
    const currentMonth = new Date().toISOString().slice(0, 7) // YYYY-MM format
    const { data: monthlyContent, error: contentError } = await admin
      .from('monthly_content')
      .select('*')
      .eq('client_id', client.id)
      .eq('month', currentMonth)
      .single()

    if (contentError || !monthlyContent) {
      // No content generated yet
      return NextResponse.json({
        content: null,
        stats: null,
      })
    }

    // Calculate stats from content object
    const content = monthlyContent.content as Record<string, unknown>
    const stats: ContentStats = {
      totalPieces: 0,
      whitepaper: content.whitepaper ? 1 : 0,
      articles: Array.isArray(content.articles) ? content.articles.length : 0,
      tweets: Array.isArray(content.tweets) ? content.tweets.length : 0,
      infographics: Array.isArray(content.infographics) ? content.infographics.length : 0,
      caseStudies: Array.isArray(content.caseStudies) ? content.caseStudies.length : 0,
      emails: Array.isArray(content.emails) ? content.emails.length : 0,
      podcasts: Array.isArray(content.podcasts) ? content.podcasts.length : 0,
    }

    stats.totalPieces =
      stats.whitepaper +
      stats.articles +
      stats.tweets +
      stats.infographics +
      stats.caseStudies +
      stats.emails +
      stats.podcasts

    return NextResponse.json({
      content: {
        id: monthlyContent.id,
        month: monthlyContent.month,
        status: monthlyContent.status,
        content: monthlyContent.content,
        created_at: monthlyContent.created_at,
        published_at: monthlyContent.published_at,
      },
      stats,
    })
  } catch (error) {
    console.error('Failed to fetch monthly content:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
