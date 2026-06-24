export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { requireAdmin } from '@/lib/auth/admin';

export async function GET() {
  const gate = await requireAdmin();
  if (gate.response) return gate.response;

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from('addons')
    .select('*')
    .eq('active', true)
    .order('price_cents');

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ addons: data });
}
