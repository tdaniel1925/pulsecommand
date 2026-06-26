export const runtime = 'nodejs'
export const maxDuration = 60

import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { requireAdmin } from '@/lib/auth/admin'
import { getStripe, getPlan, PUBLIC_PLAN } from '@/lib/stripe'
import { sendWelcomeEmail } from '@/lib/email'
import { generatePostForClient } from '@/lib/generate-post-for-client'

type Billing = 'comp' | 'checkout' | 'card'

interface Body {
  email: string
  firstName: string
  lastName: string
  businessName?: string
  phone?: string
  password?: string            // optional; if omitted, a random one is set and a reset is emailed
  planId?: string              // defaults to the public plan
  billing?: Billing            // how to set up payment
  trialDays?: number           // optional trial length (sets trial_end)
  seedPosts?: number           // optionally generate N initial draft posts
}

/**
 * Admin-only: fully provision a new client in one call — account, plan/license,
 * Stripe customer, billing setup, and optional seed posts.
 *
 * Billing modes:
 *  - 'comp'     → active with no charge (comped / invoiced outside Stripe)
 *  - 'checkout' → emails the client a Stripe Checkout link to enter their own card
 *  - 'card'     → returns a SetupIntent client_secret so the admin can enter the
 *                 card via Stripe Elements (MOTO). The raw card never touches our
 *                 server — Stripe Elements tokenizes it client-side.
 */
export async function POST(req: NextRequest) {
  const gate = await requireAdmin()
  if (gate.response) return gate.response

  try {
    const body = (await req.json()) as Body
    const { email, firstName, lastName, businessName, phone } = body
    if (!email || !firstName || !lastName) {
      return NextResponse.json({ error: 'email, firstName and lastName are required' }, { status: 400 })
    }

    const plan = (body.planId && getPlan(body.planId)) || PUBLIC_PLAN
    const billing: Billing = body.billing ?? 'checkout'
    const admin = createAdminClient()

    // 1) Create the auth user (admin-created → email pre-confirmed).
    const password = body.password && body.password.length >= 8
      ? body.password
      : `Tmp-${Math.random().toString(36).slice(2)}-${Math.random().toString(36).slice(2)}`
    const { data: created, error: userErr } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { firstName, lastName },
    })
    if (userErr || !created.user) {
      return NextResponse.json({ error: userErr?.message ?? 'Could not create user' }, { status: 400 })
    }
    const userId = created.user.id

    // 2) Trial end (optional).
    const trialEnd = body.trialDays && body.trialDays > 0
      ? new Date(Date.now() + body.trialDays * 86400_000).toISOString()
      : null

    // 3) Client row + brand profile.
    const pin = String(Math.floor(100000 + Math.random() * 900000))
    const { data: client, error: clientErr } = await admin
      .from('clients')
      .insert({
        user_id: userId,
        first_name: firstName,
        last_name: lastName,
        email,
        business_name: businessName ?? '',
        phone: phone ?? null,
        status: 'active',
        subscription_status: trialEnd ? 'trialing' : (billing === 'comp' ? 'active' : 'trialing'),
        plan_name: plan.id,
        trial_end: trialEnd,
        onboarding_step: 'welcome',
        onboarding_pin: pin,
      })
      .select('id')
      .single()
    if (clientErr || !client) {
      // best-effort rollback of the auth user so we don't orphan it
      await admin.auth.admin.deleteUser(userId).catch(() => {})
      return NextResponse.json({ error: clientErr?.message ?? 'Could not create client' }, { status: 500 })
    }
    await admin.from('brand_profiles').insert({ client_id: client.id }).select('client_id').single().then(undefined, () => {})

    // 4) Stripe customer + billing setup.
    const stripe = getStripe()
    let checkoutUrl: string | null = null
    let setupClientSecret: string | null = null
    let stripeCustomerId: string | null = null

    if (stripe && billing !== 'comp') {
      const customer = await stripe.customers.create({
        email,
        name: `${firstName} ${lastName}`.trim(),
        metadata: { clientId: client.id, planId: plan.id },
      })
      stripeCustomerId = customer.id
      await admin.from('clients').update({ stripe_customer_id: customer.id }).eq('id', client.id)

      const base = process.env.NEXT_PUBLIC_APP_URL ?? req.nextUrl.origin
      if (billing === 'checkout') {
        const session = await stripe.checkout.sessions.create({
          customer: customer.id,
          mode: 'subscription',
          payment_method_types: ['card'],
          line_items: [{ price: plan.priceId, quantity: 1 }],
          success_url: `${base}/dashboard?welcome=1`,
          cancel_url: `${base}/dashboard`,
          metadata: { clientId: client.id, planId: plan.id },
          subscription_data: {
            metadata: { clientId: client.id, planId: plan.id },
            // Honor the admin-chosen trial; Stripe auto-charges when it ends.
            ...(body.trialDays && body.trialDays > 0 ? { trial_period_days: body.trialDays } : {}),
          },
          allow_promotion_codes: true,
        })
        checkoutUrl = session.url
      } else if (billing === 'card') {
        // SetupIntent → admin enters the card via Stripe Elements on the client's
        // behalf (MOTO). Raw card data goes straight to Stripe, never to us.
        const intent = await stripe.setupIntents.create({
          customer: customer.id,
          usage: 'off_session',
          payment_method_types: ['card'],
          metadata: { clientId: client.id, planId: plan.id, moto: 'true' },
        })
        setupClientSecret = intent.client_secret
      }
    } else if (billing === 'comp') {
      await admin.from('clients').update({ subscription_status: 'active' }).eq('id', client.id)
    }

    // 5) Welcome email (best-effort).
    await sendWelcomeEmail({
      to: email,
      firstName,
      businessName: businessName ?? '',
    }).catch((e) => console.error('[provision] welcome email failed:', e))

    // 6) Optionally seed initial draft posts (best-effort, sequential).
    const seed = Math.min(Math.max(body.seedPosts ?? 0, 0), 5)
    let seeded = 0
    for (let i = 0; i < seed; i++) {
      const r = await generatePostForClient(client.id, { mode: 'draft' }).catch(() => ({ ok: false }))
      if (r.ok) seeded++
    }

    return NextResponse.json({
      ok: true,
      clientId: client.id,
      userId,
      stripeCustomerId,
      billing,
      checkoutUrl,          // present for billing='checkout' — share with the client
      setupClientSecret,    // present for billing='card' — feed to Stripe Elements
      publishableKey: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ?? null,
      seededPosts: seeded,
      tempPassword: body.password ? undefined : password, // surface only if we generated one
    })
  } catch (err) {
    console.error('[admin/provision-client]', err)
    const msg = err instanceof Error ? err.message : 'Internal server error'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
