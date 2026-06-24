import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { requireAdmin } from '@/lib/auth/admin'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const gate = await requireAdmin()
    if (gate.response) return gate.response

    const { id } = await params
    const body = await request.json()
    const { status, onboarding_step } = body

    const admin = createAdminClient()
    const { error } = await admin
      .from('clients')
      .update({
        ...(status ? { status } : {}),
        ...(onboarding_step ? { onboarding_step } : {}),
      })
      .eq('id', id)

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    // Log activity if status changed
    if (status) {
      await admin.from("activities").insert({
        client_id: id,
        type: "system",
        title: `Status changed to ${status}`,
        description: `Admin updated client status to ${status}`,
      });
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[admin/clients/status]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
