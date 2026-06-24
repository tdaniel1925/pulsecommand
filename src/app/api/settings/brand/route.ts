import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function PATCH(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { brand_colors, brand_voice, logo_url, target_audience } = body;

    const { data: client } = await supabase
      .from('clients')
      .select('id, metadata')
      .eq('user_id', user.id)
      .single();

    if (!client) return NextResponse.json({ error: 'Client not found' }, { status: 404 });

    const updatedMetadata = {
      ...(client.metadata ?? {}),
      ...(brand_colors !== undefined ? { brand_colors } : {}),
      ...(brand_voice !== undefined ? { brand_voice } : {}),
      ...(logo_url !== undefined ? { logo_url } : {}),
      ...(target_audience !== undefined ? { target_audience } : {}),
    };

    await supabase
      .from('clients')
      .update({ metadata: updatedMetadata })
      .eq('id', client.id);

    return NextResponse.json({ ok: true });
  } catch (err: unknown) {
    console.error('[settings/brand]', err);
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
