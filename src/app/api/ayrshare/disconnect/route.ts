import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { deleteAyrshareProfile } from '@/lib/ayrshare';

export async function POST() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: client } = await supabase
      .from('clients')
      .select('id, ayrshare_profile_key')
      .eq('user_id', user.id)
      .single();

    if (!client?.ayrshare_profile_key) {
      return NextResponse.json({ error: 'No Ayrshare profile found' }, { status: 404 });
    }

    await deleteAyrshareProfile(client.ayrshare_profile_key);
    
    await supabase
      .from('clients')
      .update({ ayrshare_profile_key: null, ayrshare_connected_platforms: null })
      .eq('id', client.id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[/api/ayrshare/disconnect]', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to disconnect' },
      { status: 500 }
    );
  }
}
