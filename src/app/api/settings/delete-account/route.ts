import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { confirmName } = body;

    const { data: client } = await supabase
      .from('clients')
      .select('id, business_name')
      .eq('user_id', user.id)
      .single();

    if (!client) return NextResponse.json({ error: 'Client not found' }, { status: 404 });

    if (confirmName !== client.business_name) {
      return NextResponse.json({ error: 'Business name does not match' }, { status: 400 });
    }

    // Delete client row (cascade deletes associated records)
    await supabase
      .from('clients')
      .delete()
      .eq('id', client.id);

    // Delete auth user via admin client
    const admin = createAdminClient();
    await admin.auth.admin.deleteUser(user.id);

    return NextResponse.json({ ok: true });
  } catch (err: unknown) {
    console.error('[settings/delete-account]', err);
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
