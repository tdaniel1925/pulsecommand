import { createClient } from '@/lib/supabase/server';
import { SettingsClient } from '@/components/dashboard/SettingsClient';

export default async function SettingsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const { data: client } = await supabase
    .from('clients')
    .select('*')
    .eq('user_id', user.id)
    .single();

  if (!client) {
    return null;
  }

  return (
    <SettingsClient
      client={{
        id: client.id,
        business_name: client.business_name ?? null,
        email: client.email ?? null,
        status: client.status ?? null,
        metadata: client.metadata ?? {},
        zernio_profile_id: client.zernio_profile_id ?? null,
        zernio_connected_platforms: client.zernio_connected_platforms ?? null,
        plan_name: client.plan_name ?? null,
        // plan_status column is unused; surface the real subscription_status.
        plan_status: client.subscription_status ?? null,
        presentations_used: client.presentations_used ?? 0,
        presentations_limit: client.presentations_limit ?? 0,
      }}
      userEmail={user.email ?? ''}
    />
  );
}
