import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { sendWelcomeEmail } from '@/lib/email'
import { getStripe, getPlan } from '@/lib/stripe'

interface SignUpBody {
  email: string
  password: string
  firstName: string
  lastName: string
  businessName?: string
  phone?: string
  plan?: string // selected plan id (lite | full | premium)
}

export async function POST(request: NextRequest) {
  try {
    const body: SignUpBody = await request.json()
    const { email, password, firstName, lastName, businessName, phone, plan } = body

    // Persist the chosen plan if it's a known one (entitlements/billing use it).
    const selectedPlan = plan ? getPlan(plan) : null

    if (!email || !password || !firstName || !lastName) {
      return NextResponse.json(
        { error: 'Missing required fields: email, password, firstName, lastName' },
        { status: 400 }
      )
    }

    // Use anon client for auth only
    const supabase = await createClient()

    // Create Supabase auth user
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          firstName,
          lastName,
        },
      },
    })

    if (authError || !authData.user) {
      console.error('Auth signup error:', authError)
      return NextResponse.json(
        { error: authError?.message ?? 'Failed to create account' },
        { status: 400 }
      )
    }

    const userId = authData.user.id

    // Use admin client for all DB writes — bypasses RLS since session isn't established yet
    const admin = createAdminClient()

    // Generate 6-digit PIN for VAPI interview
    const pin = String(Math.floor(100000 + Math.random() * 900000))

    // Insert client record first
    const { data: client, error: clientError } = await admin
      .from('clients')
      .insert({
        user_id: userId,
        first_name: firstName,
        last_name: lastName,
        email,
        business_name: businessName ?? '',
        phone: phone ?? null,
        status: 'active',
        subscription_status: 'free',
        plan_name: selectedPlan?.id ?? null,
        onboarding_step: 'welcome',
        onboarding_pin: pin,
      })
      .select('id')
      .single()

    if (clientError || !client) {
      console.error('Error creating client record:', clientError)
      return NextResponse.json({ error: 'Failed to create client profile' }, { status: 500 })
    }

    // Create brand profile linked to client
    await admin
      .from('brand_profiles')
      .insert({ client_id: client.id })

    // Create a Stripe customer up front so checkout/portal have one ready.
    // Guarded by getStripe(): if Stripe isn't configured this is skipped and
    // sign-up still succeeds (customer is created lazily at checkout instead).
    const stripe = getStripe()
    if (stripe) {
      try {
        const customer = await stripe.customers.create({
          email,
          name: `${firstName} ${lastName}`.trim(),
          metadata: { clientId: client.id, plan: selectedPlan?.id ?? '' },
        })
        await admin
          .from('clients')
          .update({ stripe_customer_id: customer.id })
          .eq('id', client.id)
      } catch (err) {
        // Non-fatal: don't block account creation on a Stripe hiccup.
        console.error('Stripe customer creation failed (non-fatal):', err)
      }
    }

    // Fetch generated onboarding_pin and send welcome email
    const { data: newClient } = await admin
      .from('clients')
      .select('id, onboarding_pin')
      .eq('user_id', userId)
      .single()

    if (newClient) {
      await sendWelcomeEmail({
        to: email,
        firstName,
        businessName: businessName ?? '',
        pin: newClient.onboarding_pin,
      }).catch(err => console.error('Welcome email failed:', err))
    }

    return NextResponse.json({ success: true, userId })
  } catch (error) {
    console.error('POST /api/auth/sign-up error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
