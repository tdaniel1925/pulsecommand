import { createAdminClient } from '@/lib/supabase/admin'
import AdminPipelineBoard from '@/components/admin/AdminPipelineBoard'

export const dynamic = 'force-dynamic'

export default async function PipelinePage() {
  const admin = createAdminClient()

  const thirtyDaysAgo = new Date(new Date().getTime() - 30 * 24 * 60 * 60 * 1000).toISOString()

  const [{ data: posts }, { data: clients }] = await Promise.all([
    admin
      .from('social_posts')
      .select('id, client_id, content, image_url, platforms, status, created_at, scheduled_at, published_at, metadata')
      .gte('created_at', thirtyDaysAgo)
      .order('created_at', { ascending: false }),
    admin
      .from('clients')
      .select('id, business_name'),
  ])

  const allPosts = posts ?? []
  const allClients = clients ?? []

  const clientMap: Record<string, string> = {}
  for (const c of allClients) {
    clientMap[c.id] = c.business_name ?? c.id
  }

  const generating = allPosts.filter((p) => p.status === 'draft')
  const pending = allPosts.filter((p) => p.status === 'pending_approval')
  const scheduled = allPosts.filter((p) => p.status === 'scheduled')
  const published = allPosts.filter((p) => p.status === 'published').slice(0, 20)
  const failed = allPosts.filter((p) => p.status === 'failed')

  return (
    <AdminPipelineBoard
      generating={generating}
      pending={pending}
      scheduled={scheduled}
      published={published}
      failed={failed}
      clientMap={clientMap}
    />
  )
}
