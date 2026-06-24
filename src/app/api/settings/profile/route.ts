import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function PATCH(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { business_name, industry, website, phone } = body;

    const { data: client } = await supabase
      .from('clients')
      .select('id, metadata')
      .eq('user_id', user.id)
      .single();

    if (!client) return NextResponse.json({ error: 'Client not found' }, { status: 404 });

    const updatedMetadata = {
      ...(client.metadata ?? {}),
      ...(industry !== undefined ? { industry } : {}),
      ...(website !== undefined ? { website } : {}),
      ...(phone !== undefined ? { phone } : {}),
    };

    const updates: Record<string, unknown> = { metadata: updatedMetadata };
    if (business_name !== undefined) updates.business_name = business_name;

    await supabase
      .from('clients')
      .update(updates)
      .eq('id', client.id);

    return NextResponse.json({ ok: true });
  } catch (err: unknown) {
    console.error('[settings/profile]', err);
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
