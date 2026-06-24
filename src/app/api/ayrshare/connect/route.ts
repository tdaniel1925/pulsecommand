import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { generateAyrshareJWT } from '@/lib/ayrshare';

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: client } = await supabase
      .from('clients')
      .select('ayrshare_profile_key')
      .eq('user_id', user.id)
      .single();

    if (!client?.ayrshare_profile_key) {
      return NextResponse.json({ error: 'No Ayrshare profile found. Please set up Ayrshare first.' }, { status: 400 });
    }

    const url = await generateAyrshareJWT(client.ayrshare_profile_key);
    return NextResponse.json({ url });
  } catch (error) {
    console.error('[/api/ayrshare/connect]', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to generate connection URL' },
      { status: 500 }
    );
  }
}
