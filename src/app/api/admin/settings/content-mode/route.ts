import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { requireAdmin } from '@/lib/auth/admin'

export async function GET() {
  try {
    const gate = await requireAdmin()
    if (gate.response) return gate.response

    const admin = createAdminClient()
    const { data } = await admin
      .from('app_settings')
      .select('value')
      .eq('key', 'content_mode')
      .single()

    return NextResponse.json({ mode: data?.value ?? 'manual' })
  } catch (err) {
    console.error('content-mode GET error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const gate = await requireAdmin()
    if (gate.response) return gate.response

    const { mode } = await request.json()
    if (mode !== 'auto' && mode !== 'manual') {
      return NextResponse.json({ error: 'Invalid mode' }, { status: 400 })
    }

    const admin = createAdminClient()
    await admin
      .from('app_settings')
      .upsert({ key: 'content_mode', value: mode, updated_at: new Date().toISOString() }, { onConflict: 'key' })

    return NextResponse.json({ success: true, mode })
  } catch (err) {
    console.error('content-mode POST error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
