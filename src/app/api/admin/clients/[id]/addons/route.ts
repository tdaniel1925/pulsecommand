export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { requireAdmin } from '@/lib/auth/admin';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const gate = await requireAdmin();
  if (gate.response) return gate.response;

  const { id } = await params;
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from('client_addons')
    .select('*, addons(*)')
    .eq('client_id', id)
    .eq('status', 'active');

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ addons: data });
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const gate = await requireAdmin();
  if (gate.response) return gate.response;

  const { id } = await params;
  const { addonKey } = await req.json();

  if (!addonKey) {
    return NextResponse.json({ error: 'addonKey is required' }, { status: 400 });
  }

  const supabase = createAdminClient();

  // Check if already active
  const { data: existing } = await supabase
    .from('client_addons')
    .select('id')
    .eq('client_id', id)
    .eq('addon_key', addonKey)
    .eq('status', 'active')
    .maybeSingle();

  if (existing) {
    return NextResponse.json({ error: 'Add-on already active for this client' }, { status: 409 });
  }

  const { data, error } = await supabase
    .from('client_addons')
    .upsert(
      { client_id: id, addon_key: addonKey, status: 'active', activated_at: new Date().toISOString(), cancelled_at: null },
      { onConflict: 'client_id,addon_key' }
    )
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ addon: data });
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const gate = await requireAdmin();
  if (gate.response) return gate.response;

  const { id } = await params;
  const { addonKey } = await req.json();

  if (!addonKey) {
    return NextResponse.json({ error: 'addonKey is required' }, { status: 400 });
  }

  const supabase = createAdminClient();

  const { error } = await supabase
    .from('client_addons')
    .update({ status: 'cancelled', cancelled_at: new Date().toISOString() })
    .eq('client_id', id)
    .eq('addon_key', addonKey)
    .eq('status', 'active');

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
