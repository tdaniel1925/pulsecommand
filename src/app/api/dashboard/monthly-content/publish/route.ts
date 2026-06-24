import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

interface MonthlyContentShape {
  tweets?: Array<{ tweets: string[] }>
  articles?: Array<{ title: string; content: string }>
  caseStudies?: Array<{ clientName: string; challenge: string; results: Record<string, string> }>
}

export async function POST(request: NextRequest) {
  try {
    const { contentId } = await request.json()

    if (!contentId) {
      return NextResponse.json({ error: 'contentId required' }, { status: 400 })
    }

    const admin = createAdminClient()

    // Get monthly content
    const { data: monthlyContent, error: contentError } = await admin
      .from('monthly_content')
      .select('*, monthly_content!inner(client_id)')
      .eq('id', contentId)
      .single()

    if (contentError || !monthlyContent) {
      console.error('Content not found:', contentError)
      return NextResponse.json({ error: 'Content not found' }, { status: 404 })
    }

    // Get client's Ayrshare profile key and connected platforms
    const { data: brandProfile, error: brandError } = await admin
      .from('brand_profiles')
      .select('ayrshare_profile_id, connected_platforms')
      .eq('client_id', monthlyContent.client_id)
      .single()

    if (brandError || !brandProfile?.ayrshare_profile_id) {
      console.error('Ayrshare profile not found:', brandError)
      return NextResponse.json({ error: 'Ayrshare not connected' }, { status: 400 })
    }

    const content = monthlyContent.content as MonthlyContentShape

    // Publish tweets first (smallest batches)
    if (Array.isArray(content.tweets) && content.tweets.length > 0) {
      for (const thread of content.tweets) {
        try {
          // Post each tweet in the thread
          for (let i = 0; i < thread.tweets.length; i++) {
            const tweetText = thread.tweets[i]
            await publishToAyrshare({
              profileId: brandProfile.ayrshare_profile_id,
              post: tweetText,
              platforms: ['twitter'],
            })
            // Small delay between posts
            await new Promise(resolve => setTimeout(resolve, 1000))
          }
        } catch (err) {
          console.error('Failed to publish tweet thread:', err)
        }
      }
    }

    // Publish LinkedIn articles
    if (Array.isArray(content.articles) && content.articles.length > 0) {
      for (const article of content.articles) {
        try {
          const snippet = article.content.substring(0, 500) + '...'
          await publishToAyrshare({
            profileId: brandProfile.ayrshare_profile_id,
            post: `${article.title}\n\n${snippet}\n\nRead full article on our blog`,
            platforms: ['linkedin'],
          })
        } catch (err) {
          console.error('Failed to publish article:', err)
        }
      }
    }

    // Publish case studies
    if (Array.isArray(content.caseStudies) && content.caseStudies.length > 0) {
      for (const caseStudy of content.caseStudies) {
        try {
          const post = `Case Study: ${caseStudy.clientName}\n\nChallenge: ${caseStudy.challenge}\n\nResult: ${Object.values(caseStudy.results)[0]}`
          await publishToAyrshare({
            profileId: brandProfile.ayrshare_profile_id,
            post,
            platforms: ['linkedin', 'twitter'],
          })
        } catch (err) {
          console.error('Failed to publish case study:', err)
        }
      }
    }

    // Update status to published
    const { error: updateError } = await admin
      .from('monthly_content')
      .update({
        status: 'published',
        published_at: new Date().toISOString(),
      })
      .eq('id', contentId)

    if (updateError) {
      console.error('Failed to update publish status:', updateError)
    }

    return NextResponse.json({
      success: true,
      message: 'Content published to all platforms',
    })
  } catch (error) {
    console.error('Failed to publish content:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

async function publishToAyrshare({
  profileId,
  post,
  platforms,
}: {
  profileId: string
  post: string
  platforms: string[]
}) {
  const response = await fetch('https://app.ayrshare.com/api/post', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${process.env.AYRSHARE_API_KEY}`,
    },
    body: JSON.stringify({
      post,
      platforms,
      profileKey: profileId,
    }),
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Ayrshare API error: ${error}`)
  }

  return response.json()
}
