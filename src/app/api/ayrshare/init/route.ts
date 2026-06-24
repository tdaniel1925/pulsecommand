import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAyrshareProfile } from '@/lib/ayrshare';

export async function POST() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: client } = await supabase
      .from('clients')
      .select('id, ayrshare_profile_key, business_name, email')
      .eq('user_id', user.id)
      .single();

    if (!client) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 });
    }

    if (client.ayrshare_profile_key) {
      return NextResponse.json({ 
        message: 'Ayrshare profile already exists',
        profileKey: client.ayrshare_profile_key 
      });
    }

    const { profileKey } = await createAyrshareProfile({
      title: client.business_name || 'BundledContent Client',
      email: client.email || undefined,
    });

    await supabase
      .from('clients')
      .update({ ayrshare_profile_key: profileKey })
      .eq('id', client.id);

    return NextResponse.json({ 
      message: 'Ayrshare profile created successfully',
      profileKey 
    });
  } catch (error) {
    console.error('[/api/ayrshare/init]', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create Ayrshare profile' },
      { status: 500 }
    );
  }
}
