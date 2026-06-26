import { notFound } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { AdminClientDetail } from "@/components/admin/AdminClientDetail";

export default async function AdminClientDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = createAdminClient();

  const [
    { data: client },
    { data: posts },
    { data: presentations },
    { data: activities },
  ] = await Promise.all([
    supabase
      .from("clients")
      .select(
        "id, business_name, email, status, created_at, metadata, zernio_profile_id, zernio_connected_platforms, plan_name, subscription_status, trial_end, stripe_customer_id, presentations_used, presentations_limit"
      )
      .eq("id", id)
      .single(),
    supabase
      .from("social_posts")
      .select("id, status, content, platforms, image_url, created_at, published_at")
      .eq("client_id", id)
      .order("created_at", { ascending: false })
      .limit(20),
    supabase
      .from("presentations")
      .select("id, title, status, slide_count, created_at")
      .eq("client_id", id)
      .order("created_at", { ascending: false })
      .limit(10),
    supabase
      .from("activities")
      .select("id, type, title, description, created_at")
      .eq("client_id", id)
      .order("created_at", { ascending: false })
      .limit(20),
  ]);

  if (!client) return notFound();

  // Videos — wrapped in try/catch in case table doesn't exist
  let videos: Array<{ id: string; status: string; title: string | null; thumbnail_url: string | null; created_at: string }> = [];
  try {
    const { data } = await supabase
      .from("videos")
      .select("id, status, title, thumbnail_url, created_at")
      .eq("client_id", id)
      .order("created_at", { ascending: false })
      .limit(10);
    videos = data ?? [];
  } catch {
    // videos table may not exist
  }

  // Post stats: count by status
  const allPosts = posts ?? [];
  const postStats = {
    draft: allPosts.filter((p) => p.status === "draft").length,
    pending_approval: allPosts.filter((p) => p.status === "pending_approval").length,
    scheduled: allPosts.filter((p) => p.status === "scheduled").length,
    published: allPosts.filter((p) => p.status === "published").length,
    failed: allPosts.filter((p) => p.status === "failed").length,
  };

  return (
    <AdminClientDetail
      client={client}
      posts={allPosts}
      videos={videos}
      presentations={presentations ?? []}
      activities={activities ?? []}
      postStats={postStats}
    />
  );
}
