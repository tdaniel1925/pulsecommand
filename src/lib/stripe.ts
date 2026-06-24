import Stripe from 'stripe'

// Returns null if STRIPE_SECRET_KEY not set — callers must handle null
export function getStripe(): Stripe | null {
  if (!process.env.STRIPE_SECRET_KEY) return null
  return new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: '2026-04-22.dahlia',
  })
}

// Pricing plans — focused product: AI social posts + landing pages.
// Tiers scale by social posts/month and landing pages. Set real Stripe price IDs
// via env; placeholders let the app build/run without Stripe configured.
// `landingPagesPerMonth: -1` means unlimited.
export const PLANS = {
  starter: {
    id: 'starter',
    name: 'Starter',
    price: 149,
    priceId: process.env.STRIPE_PRICE_STARTER ?? 'price_starter_placeholder',
    description: 'For solo operators getting consistent online',
    features: [
      '30 social posts/month',
      'AI image with every post',
      'Auto-publish to your connected accounts',
      '1 landing page',
    ],
    // Entitlements consumed by the post-generation loop + app gating.
    entitlements: {
      socialPostsPerMonth: 30,
      landingPagesPerMonth: 1,
    },
    highlight: false,
  },
  growth: {
    id: 'growth',
    name: 'Growth',
    price: 399,
    priceId: process.env.STRIPE_PRICE_GROWTH ?? 'price_growth_placeholder',
    description: 'The agency replacement for growing businesses',
    features: [
      '100 social posts/month',
      'AI image with every post',
      'Auto-publish across all platforms',
      '3 landing pages',
      'Priority generation',
    ],
    entitlements: {
      socialPostsPerMonth: 100,
      landingPagesPerMonth: 3,
    },
    highlight: true, // most popular
  },
  pro: {
    id: 'pro',
    name: 'Pro',
    price: 749,
    priceId: process.env.STRIPE_PRICE_PRO ?? 'price_pro_placeholder',
    description: 'High-volume content for established brands',
    features: [
      '300 social posts/month',
      'AI image with every post',
      'Auto-publish across all platforms',
      'Unlimited landing pages',
      'Priority generation',
    ],
    entitlements: {
      socialPostsPerMonth: 300,
      landingPagesPerMonth: -1, // unlimited
    },
    highlight: false,
  },
} as const

export type PlanId = keyof typeof PLANS
export type Plan = typeof PLANS[PlanId]

export function getPlan(planId: string): Plan | null {
  return PLANS[planId as PlanId] ?? null
}
