import type { ComponentType } from 'react'
import type { KitContent } from '@/lib/studio/kit-schema'
import type { ThemeProps } from '@/lib/studio/theme'

import { HeaderBlock } from './HeaderBlock'
import { HeroBlock } from './HeroBlock'
import { SocialProofBlock } from './SocialProofBlock'
import { FeaturesBlock } from './FeaturesBlock'
import { StatsBlock } from './StatsBlock'
import { ShowcaseBlock } from './ShowcaseBlock'
import { GalleryBlock } from './GalleryBlock'
import { TestimonialsBlock } from './TestimonialsBlock'
import { PricingBlock } from './PricingBlock'
import { FaqBlock } from './FaqBlock'
import { TeamBlock } from './TeamBlock'
import { NewsletterBlock } from './NewsletterBlock'
import { CtaBlock } from './CtaBlock'
import { FooterBlock } from './FooterBlock'

export type BlockType =
  | 'header'
  | 'hero'
  | 'socialProof'
  | 'features'
  | 'stats'
  | 'showcase'
  | 'gallery'
  | 'testimonials'
  | 'pricing'
  | 'faq'
  | 'team'
  | 'newsletter'
  | 'cta'
  | 'footer'

type BlockComponent = ComponentType<{ content: KitContent; theme: ThemeProps; variant?: string }>

export interface BlockVariant {
  id: string
  label: string
}

export interface BlockMeta {
  type: BlockType
  /** Human label shown in the add/reorder menu. */
  label: string
  Component: BlockComponent
  /** Visual variants the user can switch between (first = default). */
  variants?: BlockVariant[]
  /** Structural blocks are always present and can't be removed/reordered. */
  pinned?: 'top' | 'bottom'
  /**
   * Whether this block needs a specific optional content field to be meaningful.
   * The composer/UI uses this to suggest the block only when the content exists —
   * but blocks ALWAYS render safely (they fall back to their original copy), so an
   * unmet dependency can never break the page. This is the design-bible guarantee.
   */
  needs?: (c: KitContent) => boolean
  /** Short description for the add-block menu. */
  hint?: string
}

/**
 * The block library — the design bible. Every entry is a pre-validated, on-brand
 * section. Any subset, in any order, renders a coherent page (structural blocks
 * are pinned; the rest are interchangeable). Adding a section type = one entry.
 */
export const BLOCKS: Record<BlockType, BlockMeta> = {
  header: { type: 'header', label: 'Header', Component: HeaderBlock, pinned: 'top', hint: 'Logo + navigation' },
  hero: { type: 'hero', label: 'Hero', Component: HeroBlock, hint: 'Headline, subhead, primary call-to-action', variants: [{ id: 'split', label: 'Split' }, { id: 'centered', label: 'Centered' }] },
  socialProof: { type: 'socialProof', label: 'Social proof', Component: SocialProofBlock, hint: 'Trusted-by logos' },
  features: { type: 'features', label: 'Features', Component: FeaturesBlock, hint: 'A trio of key benefits' },
  stats: { type: 'stats', label: 'Stats', Component: StatsBlock, needs: (c) => !!c.stats?.length, hint: 'Headline numbers' },
  showcase: { type: 'showcase', label: 'Showcase', Component: ShowcaseBlock, hint: 'Image + supporting copy' },
  gallery: { type: 'gallery', label: 'Gallery', Component: GalleryBlock, hint: 'Image grid — great for visual brands' },
  testimonials: { type: 'testimonials', label: 'Testimonials', Component: TestimonialsBlock, hint: 'Customer quotes' },
  pricing: { type: 'pricing', label: 'Pricing', Component: PricingBlock, needs: (c) => !!c.pricing?.tiers?.length, hint: 'Plan tiers' },
  faq: { type: 'faq', label: 'FAQ', Component: FaqBlock, needs: (c) => !!c.faq?.items?.length, hint: 'Common questions' },
  team: { type: 'team', label: 'Team', Component: TeamBlock, needs: (c) => !!c.team?.members?.length, hint: 'The people behind it' },
  newsletter: { type: 'newsletter', label: 'Newsletter', Component: NewsletterBlock, hint: 'Email capture' },
  cta: { type: 'cta', label: 'Call to action', Component: CtaBlock, hint: 'Closing conversion band' },
  footer: { type: 'footer', label: 'Footer', Component: FooterBlock, pinned: 'bottom', hint: 'Links + copyright' },
}

export const ALL_BLOCK_TYPES = Object.keys(BLOCKS) as BlockType[]

/** Blocks a user may add/remove/reorder (everything except pinned structure). */
export const MOVABLE_BLOCK_TYPES = ALL_BLOCK_TYPES.filter((t) => !BLOCKS[t].pinned)

/** A sensible, always-valid default page order. */
export const DEFAULT_LAYOUT: BlockType[] = [
  'header', 'hero', 'socialProof', 'features', 'stats', 'showcase',
  'testimonials', 'pricing', 'faq', 'team', 'cta', 'footer',
]

export function isBlockType(v: unknown): v is BlockType {
  return typeof v === 'string' && v in BLOCKS
}

/**
 * Content-driven composition (smart defaults). Builds a page order from what the
 * AI actually generated: the core spine is always present; optional blocks are
 * inserted only when their content exists, so a SaaS with pricing gets a pricing
 * block while a service business without plans doesn't. Different brands → genuinely
 * different — but always valid — pages.
 */
export function composeLayout(content: KitContent): BlockType[] {
  const has = {
    stats: !!content.stats?.length,
    pricing: !!content.pricing?.tiers?.length,
    faq: !!content.faq?.items?.length,
    team: !!content.team?.members?.length,
    testimonials: !!content.testimonials?.items?.length,
  }

  const body: BlockType[] = ['hero', 'socialProof', 'features']
  if (has.stats) body.push('stats')
  body.push('showcase')
  if (has.testimonials) body.push('testimonials')
  if (has.pricing) body.push('pricing')
  if (has.faq) body.push('faq')
  if (has.team) body.push('team')
  body.push('cta')

  return ['header', ...body, 'footer']
}

/**
 * Sanitize an arbitrary layout into a guaranteed-valid one:
 * - drop unknown block types
 * - dedupe
 * - force header first and footer last (structural pins)
 * Never throws; always returns a renderable layout.
 */
export function normalizeLayout(raw: unknown, fallback: BlockType[] = DEFAULT_LAYOUT): BlockType[] {
  const input = Array.isArray(raw) ? raw : fallback
  const seen = new Set<BlockType>()
  const body: BlockType[] = []
  for (const t of input) {
    if (isBlockType(t) && !seen.has(t) && !BLOCKS[t].pinned) {
      seen.add(t)
      body.push(t)
    }
  }
  if (body.length === 0) {
    // Empty/garbage → fall back to the default body.
    for (const t of fallback) if (!BLOCKS[t].pinned && !seen.has(t)) { seen.add(t); body.push(t) }
  }
  return ['header', ...body, 'footer']
}
