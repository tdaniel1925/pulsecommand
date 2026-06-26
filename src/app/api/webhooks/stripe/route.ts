export const runtime = 'nodejs'

import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createAdminClient } from '@/lib/supabase/admin'
import { getStripe, getPlan } from '@/lib/stripe'

export async function POST(request: NextRequest) {
  try {
    const stripe = getStripe()
    if (!stripe) {
      return NextResponse.json({ error: 'Stripe not configured' }, { status: 503 })
    }

    const body = await request.text()
    const sig = request.headers.get('stripe-signature')

    if (!sig || !process.env.STRIPE_WEBHOOK_SECRET) {
      return NextResponse.json({ error: 'Missing signature or webhook secret' }, { status: 400 })
    }

    let event: Stripe.Event
    try {
      event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET)
    } catch (err) {
      console.error('Stripe webhook signature verification failed:', err)
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
    }

    const admin = createAdminClient()

    // Idempotency: Stripe delivers at-least-once. Record the event id and skip
    // if we've already processed it. Requires a `stripe_events(id text pk,
    // type text, created_at timestamptz default now())` table.
    const { error: dupeError } = await admin
      .from('stripe_events')
      .insert({ id: event.id, type: event.type } as never)
    if (dupeError) {
      // Unique-violation → already processed. Any other error: log but proceed
      // (better to double-process an idempotent update than to drop the event).
      if (dupeError.code === '23505') {
        console.log(`[stripe webhook] duplicate event ${event.id} ignored`)
        return NextResponse.json({ received: true, duplicate: true })
      }
      console.error('[stripe webhook] could not record event id:', dupeError.message)
    }

    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        const clientId = session.metadata?.client_id
        const addonKey = session.metadata?.addon_key

        if (addonKey && clientId) {
          // Addon checkout — activate the addon
          const { data: existing } = await admin
            .from('client_addons')
            .select('id')
            .eq('client_id', clientId)
            .eq('addon_key', addonKey)
            .maybeSingle()

          if (existing) {
            await admin
              .from('client_addons')
              .update({ status: 'active', cancelled_at: null })
              .eq('id', existing.id)
          } else {
            await admin.from('client_addons').insert({
              client_id: clientId,
              addon_key: addonKey,
              status: 'active',
              stripe_subscription_id: typeof session.subscription === 'string' ? session.subscription : null,
            } as never)
          }

          await admin.from('activities').insert({
            client_id: clientId,
            type: 'billing',
            title: `Add-on activated: ${addonKey.replace(/_/g, ' ')}`,
            description: 'Stripe checkout completed and add-on is now active.',
            created_by: 'system',
          } as never)

          console.log(`[stripe webhook] Addon ${addonKey} activated for client ${clientId}`)
        } else if (session.customer) {
          // Main subscription checkout. create-checkout sets metadata
          // { clientId, planId } on both the session and the subscription.
          const sessionClientId = session.metadata?.clientId
          const planId = session.metadata?.planId
          const plan = planId ? getPlan(planId) : null

          const update: Record<string, unknown> = {
            subscription_status: 'active',
            stripe_customer_id: session.customer as string,
            stripe_subscription_id:
              typeof session.subscription === 'string' ? session.subscription : null,
          }
          if (plan) {
            update.plan_name = plan.id
          }

          // Prefer matching by client id (set at checkout) so a brand-new
          // customer with no prior stripe_customer_id row still updates.
          const query = admin.from('clients').update(update as never)
          const { error: updErr } = sessionClientId
            ? await query.eq('id', sessionClientId)
            : await query.eq('stripe_customer_id', session.customer as string)
          if (updErr) console.error('[stripe webhook] client update failed:', updErr.message)

          console.log(`[stripe webhook] Main subscription activated for customer ${session.customer} (plan=${planId ?? 'unknown'})`)
        }
        break
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription
        const addonKey = subscription.metadata?.addon_key
        const clientId = subscription.metadata?.client_id

        if (addonKey && clientId) {
          // Addon subscription updated
          const isActive = subscription.status === 'active' || subscription.status === 'trialing'
          await admin
            .from('client_addons')
            .update({
              status: isActive ? 'active' : 'cancelled',
              cancelled_at: isActive ? null : new Date().toISOString(),
            })
            .eq('client_id', clientId)
            .eq('addon_key', addonKey)
        } else {
          // Main subscription updated
          await admin
            .from('clients')
            .update({ subscription_status: subscription.status })
            .eq('stripe_customer_id', subscription.customer as string)
        }
        break
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription
        const addonKey = subscription.metadata?.addon_key
        const clientId = subscription.metadata?.client_id

        if (addonKey && clientId) {
          await admin
            .from('client_addons')
            .update({ status: 'cancelled', cancelled_at: new Date().toISOString() })
            .eq('client_id', clientId)
            .eq('addon_key', addonKey)

          await admin.from('activities').insert({
            client_id: clientId,
            type: 'billing',
            title: `Add-on cancelled: ${addonKey.replace(/_/g, ' ')}`,
            description: 'Stripe subscription cancelled.',
            created_by: 'system',
          } as never)
        } else {
          await admin
            .from('clients')
            .update({ subscription_status: 'cancelled' })
            .eq('stripe_customer_id', subscription.customer as string)
        }
        break
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice
        await admin
          .from('clients')
          .update({ subscription_status: 'past_due' })
          .eq('stripe_customer_id', invoice.customer as string)

        // Find client for activity log
        const { data: client } = await admin
          .from('clients')
          .select('id')
          .eq('stripe_customer_id', invoice.customer as string)
          .maybeSingle()

        if (client) {
          await admin.from('activities').insert({
            client_id: client.id,
            type: 'billing',
            title: 'Payment failed',
            description: `Invoice payment failed. Please update your payment method.`,
            created_by: 'system',
          } as never)
        }
        break
      }

      case 'invoice.paid':
      case 'invoice.payment_succeeded': {
        // A renewal (or first charge) succeeded → ensure the client is active.
        // Recovers a past_due client and confirms ongoing subscriptions.
        const invoice = event.data.object as Stripe.Invoice
        if (invoice.customer) {
          await admin
            .from('clients')
            .update({ subscription_status: 'active' })
            .eq('stripe_customer_id', invoice.customer as string)
        }
        break
      }

      default:
        console.log('Unhandled Stripe event type:', event.type)
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('Stripe webhook error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
