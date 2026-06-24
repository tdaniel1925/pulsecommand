import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { generateJSON, DEFAULT_MODEL } from '@/lib/openrouter'

async function scanWebsite(website: string) {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'
  try {
    const res = await fetch(`${baseUrl}/api/onboarding/scan-website`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url: website }),
    })
    const text = await res.text()
    if (!res.ok || text.includes('<!DOCTYPE') || text.includes('<html')) {
      console.error('scan-website failed:', text.slice(0, 500))
      return null
    }
    const data = JSON.parse(text)
    return data.data ?? null
  } catch (err) {
    console.error('scanWebsite error:', err)
    return null
  }
}

function buildBrandContext(demo: Record<string, string>, brandData: Record<string, unknown> | null) {
  return `
Business: ${brandData?.businessName ?? demo.name ?? demo.website}
Website: ${demo.website}
Description: ${brandData?.description ?? ''}
Industry: ${brandData?.industry ?? ''}
Tagline: ${brandData?.tagline ?? ''}
Tone of Voice: ${brandData?.toneOfVoice ?? 'professional'}
Target Audience: ${brandData?.targetAudience ?? demo.ideal_customer ?? ''}
Services: ${Array.isArray(brandData?.services) ? (brandData.services as string[]).join(', ') : ''}
Keywords: ${Array.isArray(brandData?.keywords) ? (brandData.keywords as string[]).join(', ') : ''}

DIRECT FROM OWNER:
• #1 Service/Product: ${demo.top_service ?? ''}
• Ideal Customer: ${demo.ideal_customer ?? ''}
• What Sets Them Apart: ${demo.differentiator ?? ''}
`.trim()
}

async function generateSocialPosts(brandContext: string) {
  try {
    return await generateJSON({
      model: DEFAULT_MODEL,
      maxTokens: 2500,
      prompt: `You are an elite social media strategist. Write 5 highly specific, engaging social media posts for this business. Use their actual business name, services, and differentiators — NOT generic marketing language. Each post must feel like it was written by someone who deeply knows this business.

${brandContext}

Return ONLY valid JSON array:
[
  { "platform": "Instagram", "content": "post with emojis, storytelling hook, and 5-8 relevant hashtags" },
  { "platform": "Facebook", "content": "longer conversational post with a question to drive engagement" },
  { "platform": "LinkedIn", "content": "professional thought leadership post with insight and credibility" },
  { "platform": "X", "content": "punchy, scroll-stopping post under 240 chars" },
  { "platform": "General", "content": "versatile post that works across all platforms" }
]`,
    });
  } catch (err) {
    console.error('generateSocialPosts error:', err)
    return []
  }
}

export async function sendDemoNotification(
  name: string,
  email: string,
  phone: string | null,
  demoId: string,
  type: 'ready' | 'followup_1h' | 'followup_24h' | 'followup_47h' = 'ready'
) {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'
  const resultsUrl = `${baseUrl}/demo/results/${demoId}`
  const signupUrl = `${baseUrl}/sign-up?demo=${demoId}&email=${encodeURIComponent(email)}`
  const resendKey = process.env.RESEND_API_KEY
  const twilioSid = process.env.TWILIO_ACCOUNT_SID
  const twilioToken = process.env.TWILIO_AUTH_TOKEN
  const twilioFrom = process.env.TWILIO_PHONE_NUMBER

  const emailTemplates = {
    ready: {
      subject: `🎉 ${name}, your AI marketing sample is ready!`,
      html: `
        <div style="font-family: -apple-system, sans-serif; max-width: 600px; margin: 0 auto; background: #fff; border-radius: 16px; overflow: hidden; border: 1px solid #e5e7eb;">
          <div style="background: linear-gradient(135deg, #4f46e5, #4338ca); padding: 40px 32px; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 28px;">Your content is ready! 🚀</h1>
            <p style="color: #c7d2fe; margin: 12px 0 0;">We built real sample content for your brand</p>
          </div>
          <div style="padding: 32px;">
            <p style="color: #374151; font-size: 16px;">Hi ${name},</p>
            <p style="color: #6b7280;">Your AI-generated sample content is live — social posts, a podcast intro, and an AI presenter video, all built specifically for your business.</p>
            <div style="background: #fef3c7; border: 1px solid #fde68a; border-radius: 12px; padding: 16px; margin: 24px 0;">
              <p style="color: #92400e; font-weight: bold; margin: 0 0 4px;">⚡ 50% off — next 1 hour only</p>
              <p style="color: #b45309; margin: 0; font-size: 14px;">Sign up in the next hour and get your first month for just $372.50 instead of $745.</p>
            </div>
            <a href="${resultsUrl}" style="display: block; background: #4f46e5; color: white; padding: 16px; border-radius: 12px; text-decoration: none; font-weight: bold; text-align: center; font-size: 16px; margin: 0 0 12px;">
              View My Sample Content →
            </a>
            <a href="${signupUrl}" style="display: block; background: #f9fafb; color: #4f46e5; padding: 14px; border-radius: 12px; text-decoration: none; font-weight: bold; text-align: center; font-size: 14px; border: 1px solid #e5e7eb;">
              Claim 50% Off — Sign Up Now
            </a>
            <p style="color: #9ca3af; font-size: 12px; text-align: center; margin-top: 24px;">BundledContent · AI Marketing on Autopilot · <a href="${baseUrl}" style="color: #9ca3af;">bundledcontent.com</a></p>
          </div>
        </div>
      `,
    },
    followup_1h: {
      subject: `⏰ ${name}, your 50% discount expires in 1 hour`,
      html: `
        <div style="font-family: -apple-system, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: #ef4444; padding: 32px; text-align: center; border-radius: 16px 16px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 24px;">⏰ 1 hour left on your 50% discount</h1>
          </div>
          <div style="padding: 32px; background: white; border-radius: 0 0 16px 16px; border: 1px solid #e5e7eb;">
            <p style="color: #374151;">Hi ${name}, your 50% discount on BundledContent is about to expire.</p>
            <p style="color: #6b7280;">After this hour, the discount drops to 40%. Don't miss the best price.</p>
            <a href="${signupUrl}&coupon=DEMO50" style="display: block; background: #ef4444; color: white; padding: 16px; border-radius: 12px; text-decoration: none; font-weight: bold; text-align: center; font-size: 16px; margin: 24px 0;">
              Claim 50% Off Before It Expires →
            </a>
            <p style="color: #9ca3af; font-size: 12px; text-align: center;">BundledContent · <a href="${resultsUrl}" style="color: #9ca3af;">View your sample content</a></p>
          </div>
        </div>
      `,
    },
    followup_24h: {
      subject: `${name}, your sample content is still waiting for you`,
      html: `
        <div style="font-family: -apple-system, sans-serif; max-width: 600px; margin: 0 auto; background: white; border-radius: 16px; border: 1px solid #e5e7eb; overflow: hidden;">
          <div style="padding: 32px;">
            <h1 style="color: #111827; font-size: 22px;">Your content is still there, ${name}</h1>
            <p style="color: #6b7280;">We saved your AI-generated sample content — social posts, podcast, and video — just for you.</p>
            <p style="color: #6b7280;">You still have a <strong style="color: #4f46e5;">20% discount</strong> on your first month if you sign up today.</p>
            <a href="${resultsUrl}" style="display: block; background: #4f46e5; color: white; padding: 14px; border-radius: 12px; text-decoration: none; font-weight: bold; text-align: center; margin: 24px 0;">
              View My Sample Content →
            </a>
            <p style="color: #9ca3af; font-size: 12px; text-align: center;">BundledContent · AI Marketing on Autopilot</p>
          </div>
        </div>
      `,
    },
    followup_47h: {
      subject: `Last chance — your BundledContent discount expires tomorrow, ${name}`,
      html: `
        <div style="font-family: -apple-system, sans-serif; max-width: 600px; margin: 0 auto; background: white; border-radius: 16px; border: 1px solid #e5e7eb; overflow: hidden;">
          <div style="background: #111827; padding: 32px; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 22px;">Last chance, ${name} 🔔</h1>
            <p style="color: #9ca3af; margin: 8px 0 0;">Your discount expires in less than 1 hour</p>
          </div>
          <div style="padding: 32px;">
            <p style="color: #374151;">This is your final reminder — your demo discount expires soon. After this, it's full price.</p>
            <p style="color: #374151;">Your sample content: social posts for every platform, a podcast intro, and an AI video — all built for your business — are ready to see.</p>
            <a href="${signupUrl}" style="display: block; background: #4f46e5; color: white; padding: 16px; border-radius: 12px; text-decoration: none; font-weight: bold; text-align: center; font-size: 16px; margin: 24px 0;">
              Sign Up Before Discount Expires →
            </a>
            <p style="color: #9ca3af; font-size: 12px; text-align: center;">BundledContent · <a href="${resultsUrl}" style="color: #9ca3af;">View sample content</a></p>
          </div>
        </div>
      `,
    },
  }

  const smsTemplates = {
    ready: `Hi ${name}! 🎉 Your BundledContent sample content is ready — social posts, podcast + AI video built for your brand. View it + claim 50% off (1hr only): ${resultsUrl}`,
    followup_1h: `⏰ ${name} — your 50% BundledContent discount expires in 1 hour! After this it drops to 40%. Claim it now: ${signupUrl}&coupon=DEMO50`,
    followup_24h: `Hey ${name}, your BundledContent demo content is still waiting! You still have 20% off today. View it: ${resultsUrl}`,
    followup_47h: `Last chance ${name} — your BundledContent discount expires in 1 hour. Sign up now: ${signupUrl}`,
  }

  const template = emailTemplates[type]

  // Email
  if (resendKey) {
    await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${resendKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: 'BundledContent <hello@bundledcontent.com>',
        to: email,
        subject: template.subject,
        html: template.html,
      }),
    }).catch(() => {})
  }

  // SMS
  if (phone && twilioSid && twilioToken && twilioFrom) {
    await fetch(`https://api.twilio.com/2010-04-01/Accounts/${twilioSid}/Messages.json`, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${Buffer.from(`${twilioSid}:${twilioToken}`).toString('base64')}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        From: twilioFrom,
        To: phone,
        Body: smsTemplates[type],
      }),
    }).catch(() => {})
  }
}

export async function POST(request: NextRequest) {
  const { demoId } = await request.json()
  if (!demoId) return NextResponse.json({ error: 'Missing demoId' }, { status: 400 })

  const admin = createAdminClient()

  try {
    const { data: demo } = await admin.from('demo_requests').select('*').eq('id', demoId).single()
    if (!demo) return NextResponse.json({ error: 'Demo not found' }, { status: 404 })

    await admin.from('demo_requests').update({ status: 'generating' }).eq('id', demoId)

    // 1. Scan website
    const brandData = await scanWebsite(demo.website)

    // 2. Build rich brand context from scan + owner answers
    const brandContext = buildBrandContext(demo, brandData)

    // 3. Generate social posts (POSTS-ONLY demo)
    const socialPosts = await generateSocialPosts(brandContext)

    // 4. Save everything (podcast/video retired — posts only)
    await admin.from('demo_requests').update({
      status: 'done',
      brand_data: brandData,
      social_posts: socialPosts,
      audio_script: null,
      audio_url: null,
      video_script: null,
      video_url: null,
    }).eq('id', demoId)

    // 6. Send immediate notification
    await sendDemoNotification(demo.name, demo.email, demo.phone, demoId, 'ready')

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('demo/generate error:', err)
    await admin.from('demo_requests').update({ status: 'error' }).eq('id', demoId)
    return NextResponse.json({ error: 'Generation failed' }, { status: 500 })
  }
}
