import { notFound } from 'next/navigation'
import { createAdminClient } from '@/lib/supabase/admin'
import { CanvasPage } from '@/components/studio/CanvasPage'
import { normalizeKitContent } from '@/lib/studio/kit-schema'
import type { ThemeProps } from '@/lib/studio/theme'
import type { Metadata } from 'next'

// Public landing pages are dynamic (per-slug DB read + visit counter).
export const dynamic = 'force-dynamic'

interface StudioPage {
  source: 'studio'
  id: string
  title: string | null
  content: unknown
  theme: ThemeProps
  kit: string | null
  layout: unknown
  variants: unknown
}
interface LegacyPage {
  source: 'legacy'
  id: string
  title: string | null
  html: string | null
}
type PageRow = StudioPage | LegacyPage

async function getPage(slug: string): Promise<PageRow | null> {
  const admin = createAdminClient()

  // Prefer studio_pages (the AI builder); fall back to legacy landing_pages.
  // Select * so it works whether or not the `layout` column migration has run.
  const { data: studio } = await admin
    .from('studio_pages')
    .select('*')
    .eq('slug', slug)
    .eq('status', 'live')
    .maybeSingle()
  if (studio) {
    const sp = studio as Record<string, unknown>
    return {
      source: 'studio',
      id: sp.id as string,
      title: (sp.title as string | null) ?? null,
      content: sp.content,
      theme: (sp.theme ?? {}) as ThemeProps,
      kit: (sp.kit as string | null) ?? null,
      layout: sp.layout ?? null,
      variants: sp.variants ?? null,
    }
  }

  const { data: legacy } = await admin
    .from('landing_pages')
    .select('id, title, html, status')
    .eq('slug', slug)
    .eq('status', 'live')
    .maybeSingle()
  if (legacy) return { source: 'legacy', id: legacy.id, title: legacy.title, html: legacy.html }

  return null
}

// Google Fonts the theme engine references (Sora / Space Grotesk / Outfit / Manrope).
const FONTS_HREF =
  'https://fonts.googleapis.com/css2?family=Sora:wght@400;500;600;700;800&family=Space+Grotesk:wght@400;500;600;700&family=Outfit:wght@400;500;600;700;800&family=Manrope:wght@400;500;600;700&display=swap'

export async function generateMetadata(
  { params }: { params: Promise<{ slug: string }> },
): Promise<Metadata> {
  const { slug } = await params
  const page = await getPage(slug)
  return { title: page?.title ?? 'Landing Page' }
}

export default async function PublicLandingPage(
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params
  const page = await getPage(slug)
  if (!page) notFound()

  // Best-effort visit counter — never block render on it.
  try {
    const admin = createAdminClient()
    const rpc = page.source === 'studio' ? 'increment_studio_page_visits' : 'increment_landing_page_visits'
    await admin.rpc(rpc, { page_id: page.id })
  } catch {
    // RPC may not exist yet; ignore. Visits are non-critical.
  }

  if (page.source === 'studio') {
    // Render the page's chosen kit directly — Server Components may render React
    // (no react-dom/server, which the route handlers can't import).
    const content = normalizeKitContent(page.content, page.title ?? 'Your Business')
    return (
      <>
        <link rel="stylesheet" href={FONTS_HREF} />
        <CanvasPage content={content} theme={page.theme} layout={page.layout} variants={page.variants as Record<string, string> | null} />
      </>
    )
  }

  // Legacy landing_pages serve stored HTML.
  if (!page.html) notFound()
  return <div dangerouslySetInnerHTML={{ __html: page.html }} />
}
