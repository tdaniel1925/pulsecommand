import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getStripe } from '@/lib/stripe'

export async function POST(request: NextRequest) {
  try {
    const stripe = getStripe()
    if (!stripe) {
      return NextResponse.json({ error: 'Stripe not configured' }, { status: 503 })
    }

    const { addonKey, stripePriceId } = await request.json()
    if (!addonKey || !stripePriceId) {
      return NextResponse.json({ error: 'addonKey and stripePriceId required' }, { status: 400 })
    }

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const admin = createAdminClient()
    const { data: client } = await admin
      .from('clients')
      .select('id, email, first_name, last_name, business_name, stripe_customer_id')
      .eq('user_id', user.id)
      .single()

    if (!client) return NextResponse.json({ error: 'Client not found' }, { status: 404 })

    // Get or create Stripe customer
    let customerId = client.stripe_customer_id
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: client.email ?? user.email ?? '',
        name: `${client.first_name ?? ''} ${client.last_name ?? ''}`.trim(),
        metadata: { client_id: client.id, business_name: client.business_name ?? '' },
      })
      customerId = customer.id
      await admin.from('clients').update({ stripe_customer_id: customerId }).eq('id', client.id)
    }

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [{ price: stripePriceId, quantity: 1 }],
      metadata: { client_id: client.id, addon_key: addonKey },
      subscription_data: { metadata: { client_id: client.id, addon_key: addonKey } },
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/addons?addon_success=${addonKey}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/addons`,
    })

    return NextResponse.json({ url: session.url })
  } catch (err) {
    console.error('[addon-checkout]', err)
    return NextResponse.json({ error: 'Failed to create checkout session' }, { status: 500 })
  }
}
