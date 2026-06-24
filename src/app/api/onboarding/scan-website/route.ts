import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { normalizeWebsiteUrl, assertPublicUrl } from '@/lib/validation'

const getAnthropic = () => {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    throw new Error('ANTHROPIC_API_KEY environment variable is not set')
  }
  return new Anthropic({ apiKey })
}

function resolveUrl(src: string, base: string): string {
  try { return new URL(src, base).href } catch { return src }
}

async function fetchJinaPage(url: string): Promise<string> {
  try {
    const res = await fetch(`https://r.jina.ai/${url}`, {
      headers: { 'Accept': 'text/plain', 'X-Return-Format': 'markdown' },
      signal: AbortSignal.timeout(15000),
    })
    if (!res.ok) return ''
    const text = await res.text()
    return text.slice(0, 6000)
  } catch {
    return ''
  }
}

async function fetchScreenshot(url: string): Promise<string | null> {
  try {
    const res = await fetch(`https://r.jina.ai/${url}`, {
      headers: { 'Accept': 'image/png', 'X-Return-Format': 'screenshot' },
      signal: AbortSignal.timeout(20000),
    })
    if (!res.ok) return null
    const buf = await res.arrayBuffer()
    return Buffer.from(buf).toString('base64')
  } catch {
    return null
  }
}

function extractLogoAndColors(html: string, cleanUrl: string, origin: string): { logoUrl: string; primaryColor: string } {
  let logoUrl = ''
  let primaryColor = ''

  const ogImage = html.match(/<meta[^>]*property=["']og:image["'][^>]*content=["']([^"']+)["']/i)
    ?? html.match(/<meta[^>]*content=["']([^"']+)["'][^>]*property=["']og:image["']/i)
  if (ogImage?.[1]) logoUrl = resolveUrl(ogImage[1], cleanUrl)

  if (!logoUrl) {
    const tw = html.match(/<meta[^>]*name=["']twitter:image["'][^>]*content=["']([^"']+)["']/i)
      ?? html.match(/<meta[^>]*content=["']([^"']+)["'][^>]*name=["']twitter:image["']/i)
    if (tw?.[1]) logoUrl = resolveUrl(tw[1], cleanUrl)
  }

  if (!logoUrl) {
    const apple = html.match(/<link[^>]*rel=["']apple-touch-icon[^"']*["'][^>]*href=["']([^"']+)["']/i)
    if (apple?.[1]) logoUrl = resolveUrl(apple[1], cleanUrl)
  }

  if (!logoUrl) {
    const fav = html.match(/<link[^>]*rel=["'][^"']*icon[^"']*["'][^>]*href=["']([^"']+)["']/i)
    logoUrl = fav?.[1] ? resolveUrl(fav[1], cleanUrl) : `${origin}/favicon.ico`
  }

  const themeColor = html.match(/<meta[^>]*name=["']theme-color["'][^>]*content=["']([^"']+)["']/i)
  if (themeColor?.[1]) primaryColor = themeColor[1]

  // Also try to find inline CSS color variables or background colors
  if (!primaryColor) {
    const cssColor = html.match(/--(?:primary|brand|main|accent)(?:-color)?:\s*(#[0-9a-f]{3,6})/i)
    if (cssColor?.[1]) primaryColor = cssColor[1]
  }

  return { logoUrl, primaryColor }
}

export async function POST(request: NextRequest) {
  try {
    const { url } = await request.json()
    if (!url) return NextResponse.json({ error: 'URL required' }, { status: 400 })

    const parsed = normalizeWebsiteUrl(url)
    if (!parsed) {
      return NextResponse.json({ error: 'Invalid website URL' }, { status: 400 })
    }

    // SSRF guard: refuse to fetch internal/private/metadata addresses.
    const blockReason = await assertPublicUrl(parsed)
    if (blockReason) {
      console.warn('[scan-website] blocked URL:', parsed.href, '-', blockReason)
      return NextResponse.json({ error: 'That website address cannot be scanned' }, { status: 400 })
    }

    const cleanUrl = parsed.href
    const origin = parsed.origin

    // Identify additional pages to scan
    const pagesToScan = [
      cleanUrl,
      `${origin}/about`,
      `${origin}/services`,
      `${origin}/about-us`,
      `${origin}/what-we-do`,
    ]

    // Fetch homepage text + screenshot + additional pages in parallel
    const [homeText, screenshotBase64, ...extraTexts] = await Promise.all([
      fetchJinaPage(cleanUrl),
      fetchScreenshot(cleanUrl),
      ...pagesToScan.slice(1).map(p => fetchJinaPage(p)),
    ])

    // Combine all page content, filtering empty results
    const allPageContent = [homeText, ...extraTexts].filter(Boolean).join('\n\n---\n\n')

    // Extract logo + colors from raw HTML
    let logoUrl = `${origin}/favicon.ico`
    let primaryColor = ''
    try {
      const htmlRes = await fetch(cleanUrl, {
        headers: { 'User-Agent': 'Mozilla/5.0 (compatible; BundledContentBot/1.0)' },
        signal: AbortSignal.timeout(6000),
      })
      const html = await htmlRes.text()
      const extracted = extractLogoAndColors(html, cleanUrl, origin)
      logoUrl = extracted.logoUrl || logoUrl
      primaryColor = extracted.primaryColor
    } catch { /* silent */ }

    // Build vision-enhanced Claude message
    const textPrompt = `You are an expert brand strategist and marketing analyst. Analyze this website content from multiple pages and extract comprehensive brand information.

Website: ${cleanUrl}
Pages scanned: home, about, services

Content from all pages:
${allPageContent}

Return ONLY valid JSON with ALL of these fields (be specific and detailed — avoid generic answers):
{
  "businessName": "exact business name",
  "tagline": "their actual tagline or slogan if visible, else craft one based on their content",
  "description": "2-3 sentences describing exactly what they do and who they serve",
  "industry": "specific industry (e.g. 'Residential Real Estate', not just 'Real Estate')",
  "primaryColor": "dominant brand hex color (e.g. #2563eb) — look for buttons, headers, CTAs",
  "secondaryColor": "secondary brand hex color if identifiable",
  "toneOfVoice": "one of: professional/casual/bold/warm/friendly/authoritative/inspirational/technical",
  "targetAudience": "specific description of their ideal customer",
  "uniqueValueProp": "what makes them different from competitors",
  "contentPillars": ["topic 1", "topic 2", "topic 3", "topic 4", "topic 5"],
  "keywords": ["keyword1", "keyword2", "keyword3", "keyword4", "keyword5"],
  "services": ["service 1", "service 2", "service 3"]
}`

    const userContent: Anthropic.MessageParam['content'] = screenshotBase64
      ? [
          {
            type: 'image',
            source: { type: 'base64', media_type: 'image/png', data: screenshotBase64 },
          },
          {
            type: 'text',
            text: `This is a screenshot of the website homepage. Use it to identify the exact brand colors (look at buttons, headers, navigation), logo style, and overall visual identity.\n\n${textPrompt}`,
          },
        ]
      : [{ type: 'text', text: textPrompt }]

    const message = await getAnthropic().messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 1024,
      messages: [{ role: 'user', content: userContent }],
    })

    const raw = message.content[0].type === 'text' ? message.content[0].text : '{}'
    const jsonStr = raw.replace(/^```json?\s*/i, '').replace(/```\s*$/i, '').trim()
    let extracted
    try {
      extracted = JSON.parse(jsonStr)
    } catch (parseErr) {
      console.error('JSON parse error:', parseErr, 'Raw response:', raw.slice(0, 500))
      throw new Error(`Invalid JSON response from Claude: ${parseErr instanceof Error ? parseErr.message : String(parseErr)}`)
    }

    return NextResponse.json({
      success: true,
      data: {
        ...extracted,
        logoUrl,
        primaryColor: primaryColor || extracted.primaryColor || '',
        secondaryColor: extracted.secondaryColor || '',
        usedScreenshot: !!screenshotBase64,
        pagesScanned: pagesToScan.length,
      },
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.error('scan-website error:', message, err)
    return NextResponse.json({ error: `Scan failed: ${message}` }, { status: 500 })
  }
}
