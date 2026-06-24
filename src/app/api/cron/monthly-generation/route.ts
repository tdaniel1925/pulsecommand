import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { generateJSON, DEFAULT_MODEL } from '@/lib/openrouter'
import type { BrandStrategyPlan } from '@/lib/brand-strategy'

type Strategy = Omit<BrandStrategyPlan, 'clientId'>

interface ContentGenRequest {
  clientId: string
  businessName: string
  strategy: Strategy
  type: 'all' | 'whitepaper' | 'articles' | 'tweets' | 'infographics' | 'case_studies' | 'emails' | 'podcasts'
}

/**
 * Monthly content generation cron job
 * Triggered by Vercel Cron or external service
 * Generates all content types for clients with approved strategies
 */
export async function POST(request: NextRequest) {
  try {
    // Verify cron secret
    const cronSecret = request.headers.get('authorization')
    if (cronSecret !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const admin = createAdminClient()

    // Get all clients with approved strategies
    const { data: clients, error: clientsError } = await admin
      .from('clients')
      .select('id, business_name, brand_profiles(*)')
      .eq('subscription_status', 'active')
      .not('brand_profiles', 'is', null)

    if (clientsError || !clients) {
      return NextResponse.json({ error: 'Failed to fetch clients' }, { status: 500 })
    }

    const approvedClients = clients.filter(c => {
      const bp = Array.isArray(c.brand_profiles) ? c.brand_profiles[0] : c.brand_profiles
      return bp?.strategy_approved
    })

    console.log(`[Cron] Found ${approvedClients.length} clients with approved strategies`)

    const results = []

    // Generate content for each client
    for (const client of approvedClients) {
      const bp = Array.isArray(client.brand_profiles) ? client.brand_profiles[0] : client.brand_profiles

      try {
        const contentSet = await generateMonthlyContent({
          clientId: client.id,
          businessName: client.business_name,
          strategy: bp.brand_strategy as unknown as Strategy,
          type: 'all',
        })

        // Save to database
        const { error: insertError } = await admin
          .from('monthly_content')
          .insert({
            client_id: client.id,
            month: new Date().toISOString().slice(0, 7),
            content: contentSet,
            status: 'ready_for_review',
            created_at: new Date().toISOString(),
          })

        if (insertError) {
          console.error(`[Cron] Failed to save content for ${client.id}:`, insertError)
          results.push({ clientId: client.id, status: 'error', error: insertError.message })
        } else {
          console.log(`[Cron] Generated monthly content for ${client.business_name}`)
          results.push({ clientId: client.id, status: 'success', contentCount: Object.keys(contentSet).length })
        }
      } catch (err) {
        console.error(`[Cron] Generation failed for ${client.id}:`, err)
        results.push({ clientId: client.id, status: 'error', error: String(err) })
      }
    }

    return NextResponse.json({
      success: true,
      clientsProcessed: approvedClients.length,
      results,
    })
  } catch (error) {
    console.error('[Cron] Monthly generation failed:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

/**
 * Generate all content types for a client
 */
async function generateMonthlyContent(req: ContentGenRequest): Promise<Record<string, unknown>> {
  const { businessName, strategy, type } = req

  const contentSet: Record<string, unknown> = {}

  // Parallel generation for efficiency
  const promises = []

  if (type === 'all' || type === 'whitepaper') {
    promises.push(
      generateWhitepaper(businessName, strategy).then(wp => {
        contentSet.whitepaper = wp
      })
    )
  }

  if (type === 'all' || type === 'articles') {
    promises.push(
      generateArticles(businessName, strategy).then(articles => {
        contentSet.articles = articles
      })
    )
  }

  if (type === 'all' || type === 'tweets') {
    promises.push(
      generateTweets(businessName, strategy).then(tweets => {
        contentSet.tweets = tweets
      })
    )
  }

  if (type === 'all' || type === 'infographics') {
    promises.push(
      generateInfographicPrompts(businessName, strategy).then(infos => {
        contentSet.infographics = infos
      })
    )
  }

  if (type === 'all' || type === 'case_studies') {
    promises.push(
      generateCaseStudies(businessName, strategy).then(cases => {
        contentSet.caseStudies = cases
      })
    )
  }

  if (type === 'all' || type === 'emails') {
    promises.push(
      generateEmailSequences(businessName, strategy).then(emails => {
        contentSet.emails = emails
      })
    )
  }

  if (type === 'all' || type === 'podcasts') {
    promises.push(
      generatePodcastScripts(businessName, strategy).then(podcasts => {
        contentSet.podcasts = podcasts
      })
    )
  }

  await Promise.all(promises)
  return contentSet
}

// ─── Content Generation Functions ────────────────────────────────────────────

async function generateWhitepaper(businessName: string, strategy: Strategy): Promise<unknown> {
  const prompt = `You are a professional business writer. Create an 8-10 page industry whitepaper for ${businessName}.

Business: ${strategy.businessOverview.whatYouDo}
Target Audience: ${strategy.targetAudience.demographics}
Content Pillars: ${strategy.contentStrategy.pillars.join(', ')}

The whitepaper should include:
1. Executive Summary (1 page)
2. The Problem (1-2 pages) - Industry pain points
3. Current Solutions & Gaps (1 page)
4. The Solution/Approach (2 pages) - How ${businessName} solves it
5. Implementation Framework (1-2 pages)
6. ROI & Metrics (1 page)
7. Conclusion & Next Steps (0.5 page)

Return JSON:
{
  "title": "string",
  "subtitle": "string",
  "sections": [{"heading": "string", "content": "string"}, ...],
  "keyTakeaways": ["string"],
  "callToAction": "string"
}`

  return generateJSON({
    model: DEFAULT_MODEL,
    maxTokens: 4000,
    prompt,
  })
}

async function generateArticles(businessName: string, strategy: Strategy): Promise<unknown[]> {
  const prompt = `Create 5 LinkedIn articles for ${businessName}. Each should be 1000-1500 words.

Content Pillars: ${strategy.contentStrategy.pillars.join(', ')}
Tone: ${strategy.toneAndVoice.personality}
Target Audience: ${strategy.targetAudience.demographics}

For each article, return:
{
  "title": "string",
  "subtitle": "string",
  "content": "string (full article)",
  "keyPoints": ["string"],
  "cta": "string"
}

Return a JSON array of 5 articles.`

  return generateJSON({
    model: DEFAULT_MODEL,
    maxTokens: 6000,
    prompt,
  })
}

async function generateTweets(businessName: string, strategy: Strategy): Promise<unknown[]> {
  const prompt = `Create 20 tweet threads for ${businessName}. Each thread should have 5-10 connected tweets.

Topics: ${strategy.contentStrategy.pillars.join(', ')}
Tone: ${strategy.toneAndVoice.personality}
Do's: ${strategy.toneAndVoice.doList.join(', ')}

Return JSON array where each item is:
{
  "topic": "string",
  "tweets": ["tweet 1", "tweet 2", ...],
  "engagementHook": "string (first tweet to hook readers)"
}`

  return generateJSON({
    model: DEFAULT_MODEL,
    maxTokens: 4000,
    prompt,
  })
}

async function generateInfographicPrompts(businessName: string, strategy: Strategy): Promise<unknown[]> {
  const prompt = `Create 8 infographic/data visualization prompts for ${businessName}.

Each should be a detailed prompt for Gemini image generation that creates professional data visualizations, charts, or infographics.

Topics: ${strategy.contentStrategy.pillars.join(', ')}
Industry context: ${strategy.businessOverview.whatYouDo}

Return JSON array:
[
  {
    "title": "string (infographic title)",
    "description": "string (what it shows)",
    "prompt": "detailed Gemini image prompt for professional data viz",
    "dataPoints": ["stat 1", "stat 2", ...]
  }
]`

  return generateJSON({
    model: DEFAULT_MODEL,
    maxTokens: 3000,
    prompt,
  })
}

async function generateCaseStudies(businessName: string, strategy: Strategy): Promise<unknown[]> {
  const prompt = `Create 4 case studies for ${businessName}. These should be fictional but realistic examples.

Company: ${businessName}
Industry: ${strategy.businessOverview.whatYouDo}
Results focus: ${strategy.successMetrics.keyIndicators.join(', ')}

Each case study:
{
  "clientName": "string (fictional)",
  "industry": "string",
  "challenge": "string (their problem)",
  "solution": "string (how ${businessName} helped)",
  "results": {
    "metric1": "string (before → after)",
    "metric2": "string"
  },
  "quote": "string (testimonial)",
  "nextSteps": "string"
}`

  return generateJSON({
    model: DEFAULT_MODEL,
    maxTokens: 2000,
    prompt,
  })
}

async function generateEmailSequences(businessName: string, strategy: Strategy): Promise<unknown[]> {
  const prompt = `Create 3 email sequences for ${businessName}. Each sequence has 5 emails.

Topics: ${strategy.contentStrategy.pillars.join(', ')}
Audience: ${strategy.targetAudience.demographics}

Return:
[
  {
    "name": "string (sequence name)",
    "purpose": "string",
    "emails": [
      {
        "day": 0,
        "subject": "string",
        "preview": "string (email preview text)",
        "body": "string (email content in markdown)"
      }
    ]
  }
]`

  return generateJSON({
    model: DEFAULT_MODEL,
    maxTokens: 3000,
    prompt,
  })
}

async function generatePodcastScripts(businessName: string, strategy: Strategy): Promise<unknown[]> {
  const prompt = `Create 2 podcast episode scripts for ${businessName}. Each 45-60 minutes.

Topics: ${strategy.contentStrategy.pillars.join(', ')}
Tone: ${strategy.toneAndVoice.personality}

Return:
[
  {
    "episodeTitle": "string",
    "guestOrTopic": "string",
    "duration": "45-60 min",
    "outline": [
      {
        "segment": "string (Intro, Main Topic, Q&A, CTA)",
        "duration": "mins",
        "script": "string (conversational script)"
      }
    ],
    "showNotes": "string (markdown)"
  }
]`

  return generateJSON({
    model: DEFAULT_MODEL,
    maxTokens: 3000,
    prompt,
  })
}
