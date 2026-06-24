/**
 * Kit content schema — the contract the AI fills and the kit renders.
 *
 * The AI never produces layout or styling; it only produces this structured
 * content. Sections read it and render within the design bible, so output is
 * always on-brand and well-composed regardless of what the AI writes.
 *
 * Lengths are intentionally bounded so a too-long headline can't break a layout —
 * the schema itself is part of the "can't make it ugly" guarantee.
 */

export interface KitImage {
  /** Resolved at generation time: brand asset, Gemini image, or null (placeholder). */
  src?: string | null
  alt?: string
}

export interface FeatureItem {
  title: string
  body: string
}

export interface Testimonial {
  quote: string
  author: string
}

export interface KitContent {
  /** Brand/business name shown in the nav + footer. */
  brandName: string

  hero: {
    eyebrow?: string // small label above headline, e.g. "New"
    headline: string
    subhead: string
    ctaPrimary: string
    ctaSecondary?: string
    image: KitImage
  }

  features: {
    heading: string
    subhead?: string
    items: FeatureItem[] // render up to 3 (a clean trio)
  }

  showcase: {
    heading: string
    body: string
    image: KitImage
  }

  testimonials: {
    heading?: string
    items: Testimonial[] // render up to 3
  }

  cta: {
    headline: string
    subhead?: string
    button: string
  }
}

/** Length caps enforced when validating AI output (prevents layout-breaking copy). */
export const KIT_LIMITS = {
  headline: 70,
  subhead: 180,
  eyebrow: 28,
  cta: 28,
  featureTitle: 40,
  featureBody: 120,
  quote: 200,
  author: 48,
  maxFeatures: 3,
  maxTestimonials: 3,
} as const

/** Clamp + shape raw AI JSON into a safe KitContent. Never throws. */
export function normalizeKitContent(raw: unknown, fallbackBrand = 'Your Business'): KitContent {
  const r = (raw ?? {}) as Record<string, unknown>
  const s = (v: unknown, max: number, fallback = ''): string => {
    const str = typeof v === 'string' ? v.trim() : ''
    return (str || fallback).slice(0, max)
  }
  const obj = (v: unknown): Record<string, unknown> => (v && typeof v === 'object' ? (v as Record<string, unknown>) : {})
  // Preserve an already-resolved image URL (e.g. a generated Gemini image) but
  // only if it's a plausible http(s) or data URL — never trust arbitrary strings.
  const imgSrc = (v: unknown): string | null => {
    const o = obj(v)
    const src = typeof o.src === 'string' ? o.src : ''
    return /^(https?:\/\/|data:image\/)/.test(src) ? src : null
  }

  const hero = obj(r.hero)
  const features = obj(r.features)
  const showcase = obj(r.showcase)
  const testimonials = obj(r.testimonials)
  const cta = obj(r.cta)

  const featureItems = Array.isArray(features.items) ? features.items : []
  const testimonialItems = Array.isArray(testimonials.items) ? testimonials.items : []

  return {
    brandName: s(r.brandName, 48, fallbackBrand),
    hero: {
      eyebrow: s(hero.eyebrow, KIT_LIMITS.eyebrow) || undefined,
      headline: s(hero.headline, KIT_LIMITS.headline, 'Welcome'),
      subhead: s(hero.subhead, KIT_LIMITS.subhead),
      ctaPrimary: s(hero.ctaPrimary, KIT_LIMITS.cta, 'Get started'),
      ctaSecondary: s(hero.ctaSecondary, KIT_LIMITS.cta) || undefined,
      image: { src: imgSrc(hero.image), alt: s((obj(hero.image)).alt, 80) },
    },
    features: {
      heading: s(features.heading, KIT_LIMITS.headline, 'What you get'),
      subhead: s(features.subhead, KIT_LIMITS.subhead) || undefined,
      items: featureItems.slice(0, KIT_LIMITS.maxFeatures).map((it) => {
        const o = obj(it)
        return { title: s(o.title, KIT_LIMITS.featureTitle, 'Feature'), body: s(o.body, KIT_LIMITS.featureBody) }
      }),
    },
    showcase: {
      heading: s(showcase.heading, KIT_LIMITS.headline, 'See it in action'),
      body: s(showcase.body, KIT_LIMITS.subhead),
      image: { src: imgSrc(showcase.image), alt: s((obj(showcase.image)).alt, 80) },
    },
    testimonials: {
      heading: s(testimonials.heading, KIT_LIMITS.headline) || undefined,
      items: testimonialItems.slice(0, KIT_LIMITS.maxTestimonials).map((it) => {
        const o = obj(it)
        return { quote: s(o.quote, KIT_LIMITS.quote, ''), author: s(o.author, KIT_LIMITS.author, '') }
      }).filter((t) => t.quote),
    },
    cta: {
      headline: s(cta.headline, KIT_LIMITS.headline, 'Ready to start?'),
      subhead: s(cta.subhead, KIT_LIMITS.subhead) || undefined,
      button: s(cta.button, KIT_LIMITS.cta, 'Get started'),
    },
  }
}
