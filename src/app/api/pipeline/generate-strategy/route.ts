import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { transformAnalysisToStrategy, generateStrategyHTML, type BrandAnalysis } from '@/lib/brand-strategy'
import { sendStrategyEmail } from '@/lib/email'

interface GenerateStrategyBody {
  clientId: string
  analysis: BrandAnalysis
}

export async function POST(request: NextRequest) {
  try {
    const body: GenerateStrategyBody = await request.json()
    const { clientId, analysis } = body

    if (!clientId || !analysis) {
      return NextResponse.json(
        { error: 'Missing required fields: clientId and analysis' },
        { status: 400 }
      )
    }

    const admin = createAdminClient()

    // Transform analysis into Brand Strategy Plan
    const strategy = transformAnalysisToStrategy(analysis)

    // Save strategy to brand_profiles as JSON
    const { error: updateError } = await admin
      .from('brand_profiles')
      .update({
        brand_strategy: strategy,
      })
      .eq('client_id', clientId)

    if (updateError) {
      console.error('Error saving brand strategy:', updateError)
      return NextResponse.json({ error: 'Failed to save strategy' }, { status: 500 })
    }

    // Get client email for sending strategy
    const { data: client } = await admin
      .from('clients')
      .select('email, first_name, business_name')
      .eq('id', clientId)
      .single()

    // Generate HTML version
    const strategyHTML = generateStrategyHTML(strategy)

    // Send email with strategy
    if (client?.email) {
      await sendStrategyEmail({
        to: client.email,
        firstName: client.first_name,
        businessName: client.business_name,
        strategyHTML,
        clientId,
      }).catch(err => console.error('Strategy email failed:', err))
    }

    // Log activity
    await admin.from('activities').insert({
      client_id: clientId,
      type: 'strategy',
      title: 'Brand Strategy Plan generated',
      description: 'Personalized strategy based on VAPI interview analysis. Awaiting client review and approval.',
    })

    // Update onboarding step
    await admin
      .from('clients')
      .update({ onboarding_step: 'strategy_ready' })
      .eq('id', clientId)

    return NextResponse.json({
      success: true,
      strategy,
      message: 'Brand strategy generated and email sent',
    })
  } catch (error) {
    console.error('Generate strategy error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
