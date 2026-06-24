import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

interface RouteParams {
  params: Promise<{ id: string }>
}

export async function GET(_request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params
    const supabase = await createClient()

    const { data: client, error } = await supabase
      .from('clients')
      .select('*, brand_profiles(*)')
      .eq('id', id)
      .single()

    if (error || !client) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 })
    }

    return NextResponse.json(client)
  } catch (error) {
    console.error('GET /api/clients/[id] error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params
    const body = await request.json()

    // Strip read-only fields from update payload
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { id: _id, created_at, user_id, ...updateFields } = body

    if (Object.keys(updateFields).length === 0) {
      return NextResponse.json({ error: 'No fields to update' }, { status: 400 })
    }

    const supabase = await createClient()

    const { data: client, error } = await supabase
      .from('clients')
      .update(updateFields)
      .eq('id', id)
      .select('*')
      .single()

    if (error) {
      console.error('Error updating client:', error)
      return NextResponse.json({ error: 'Failed to update client' }, { status: 500 })
    }

    return NextResponse.json(client)
  } catch (error) {
    console.error('PATCH /api/clients/[id] error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params
    const supabase = await createClient()

    // Soft delete — update status to 'churned'
    const { data: client, error } = await supabase
      .from('clients')
      .update({ subscription_status: 'churned' })
      .eq('id', id)
      .select('id, subscription_status')
      .single()

    if (error) {
      console.error('Error soft-deleting client:', error)
      return NextResponse.json({ error: 'Failed to delete client' }, { status: 500 })
    }

    return NextResponse.json({ success: true, client })
  } catch (error) {
    console.error('DELETE /api/clients/[id] error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
