import { createClient } from "@/lib/supabase/server";
import { WorkflowBoard } from "@/components/dashboard/WorkflowBoard";

export default async function WorkflowPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: client } = await supabase
    .from("clients")
    .select("id")
    .eq("user_id", user?.id ?? "")
    .single();

  const sixtyDaysAgo = new Date(new Date().getTime() - 60 * 24 * 60 * 60 * 1000).toISOString();

  const { data: rawPosts } = await supabase
    .from("social_posts")
    .select("id, content, image_url, platforms, status, created_at, scheduled_at, published_at, metadata")
    .eq("client_id", client?.id ?? "")
    .gte("created_at", sixtyDaysAgo)
    .order("created_at", { ascending: false });

  const posts = rawPosts ?? [];

  return <WorkflowBoard posts={posts} />;
}
