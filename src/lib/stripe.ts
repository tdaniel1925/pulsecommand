import Stripe from 'stripe'

// Returns null if STRIPE_SECRET_KEY not set — callers must handle null
export function getStripe(): Stripe | null {
  if (!process.env.STRIPE_SECRET_KEY) return null
  return new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: '2026-04-22.dahlia',
  })
}

// ─── SINGLE SOURCE OF TRUTH FOR PRICING ──────────────────────────────────────
// The product is ONE plan: do a one-time interview, and we post to your social
// accounts automatically for $149/month ("Auto Social").
//
// `growth` and `pro` are LEGACY — kept only so any existing subscribers on those
// plans still resolve their entitlements. They are marked `active: false` and
// must NOT be shown anywhere in marketing or sign-up. New customers only ever see
// the active plan. Render marketing/pricing from ACTIVE_PLANS or PUBLIC_PLAN —
// never hardcode a price or feature list in a page.
//
// Set the real Stripe price ID via STRIPE_PRICE_STARTER; the placeholder lets the
// app build without Stripe configured.
export const PLANS = {
  starter: {
    id: 'starter',
    name: 'Auto Social',
    price: 149,
    priceId: process.env.STRIPE_PRICE_STARTER ?? 'price_starter_placeholder',
    description: 'One interview. We post to your socials automatically.',
    tagline: 'Done-for-you social posting',
    features: [
      'A quick one-time interview about your business',
      '30 on-brand social posts every month',
      'A custom AI image with every post',
      'Auto-published to your connected accounts — no approvals needed',
      'Posts to Instagram, Facebook, LinkedIn, X, TikTok & more',
    ],
    // Entitlements consumed by the post-generation loop + app gating.
    entitlements: {
      socialPostsPerMonth: 30,
      landingPagesPerMonth: 0,
    },
    active: true,
    highlight: true,
  },
  // ── Legacy (hidden) — retained for existing subscribers only ──
  growth: {
    id: 'growth',
    name: 'Growth',
    price: 399,
    priceId: process.env.STRIPE_PRICE_GROWTH ?? 'price_growth_placeholder',
    description: 'Legacy plan',
    tagline: '',
    features: [
      '100 social posts/month',
      'AI image with every post',
      'Auto-publish across all platforms',
    ],
    entitlements: {
      socialPostsPerMonth: 100,
      landingPagesPerMonth: 3,
    },
    active: false,
    highlight: false,
  },
  pro: {
    id: 'pro',
    name: 'Pro',
    price: 749,
    priceId: process.env.STRIPE_PRICE_PRO ?? 'price_pro_placeholder',
    description: 'Legacy plan',
    tagline: '',
    features: [
      '300 social posts/month',
      'AI image with every post',
      'Auto-publish across all platforms',
    ],
    entitlements: {
      socialPostsPerMonth: 300,
      landingPagesPerMonth: -1, // unlimited
    },
    active: false,
    highlight: false,
  },
} as const

export type PlanId = keyof typeof PLANS
export type Plan = typeof PLANS[PlanId]

/** Resolve any plan by id (including legacy) — used for entitlement checks. */
export function getPlan(planId: string): Plan | null {
  return PLANS[planId as PlanId] ?? null
}

/** Plans shown to new customers (marketing, pricing, sign-up). */
export const ACTIVE_PLANS: Plan[] = Object.values(PLANS).filter((p) => p.active)

/** The single public plan. The product is one plan, so this is what UIs render. */
export const PUBLIC_PLAN: Plan = PLANS.starter

/** Formatted price string, e.g. "$149". */
export function formatPrice(price: number): string {
  return `$${price}`
}
