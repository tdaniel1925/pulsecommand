import { createClient } from "@/lib/supabase/server";
import { AutoApproveToggle } from "@/components/dashboard/AutoApproveToggle";
import { SocialViewToggle } from "@/components/dashboard/SocialViewToggle";

export default async function SocialPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { data: client } = await supabase
    .from("clients")
    .select("id, auto_approve")
    .eq("user_id", user?.id ?? "")
    .single();

  const { data: posts } = await supabase
    .from("social_posts")
    .select("id, content, platforms, status, scheduled_at, published_at, image_url, performance, metadata")
    .eq("client_id", client?.id ?? "")
    .order("created_at", { ascending: false });

  const pending = posts?.filter((p) => p.status === "pending_approval") ?? [];
  const published = posts?.filter((p) => p.status === "published").length ?? 0;
  const scheduled = posts?.filter((p) => p.status === "scheduled").length ?? 0;
  const draft = posts?.filter((p) => p.status === "draft").length ?? 0;
  const failed = posts?.filter((p) => p.status === "failed").length ?? 0;

  const stats = [
    { label: "Needs Approval", value: String(pending.length), className: pending.length > 0 ? "text-amber-600" : "text-neutral-900" },
    { label: "Published", value: String(published), className: "text-green-600" },
    { label: "Scheduled", value: String(scheduled), className: "text-blue-600" },
    { label: "Draft", value: String(draft), className: "text-neutral-500" },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">Social Posts</h1>
          <p className="text-sm text-neutral-500 mt-1">Your AI-generated content across all platforms.</p>
        </div>
        {client && (
          <AutoApproveToggle
            clientId={client.id}
            defaultValue={client.auto_approve ?? true}
          />
        )}
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-4 gap-4">
        {stats.map((s) => (
          <div key={s.label} className={`bg-white rounded-2xl border shadow-sm p-5 ${s.label === "Needs Approval" && pending.length > 0 ? "border-amber-200 bg-amber-50" : "border-neutral-200"}`}>
            <p className="text-sm text-neutral-500">{s.label}</p>
            <p className={`text-3xl font-bold mt-1 ${s.className}`}>{s.value}</p>
          </div>
        ))}
      </div>

      <SocialViewToggle posts={posts ?? []} failed={failed} />
    </div>
  );
}
