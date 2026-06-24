import Link from "next/link";
import { FileText, Film, User, Zap } from "lucide-react";
import { createAdminClient } from "@/lib/supabase/admin";
import { TriggerCronButton } from "@/components/admin/TriggerCronButton";

// ── helpers ────────────────────────────────────────────────────────────────

function relativeTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60_000);
  const hours = Math.floor(mins / 60);
  const days = Math.floor(hours / 24);
  if (mins < 2) return "just now";
  if (mins < 60) return `${mins} minutes ago`;
  if (hours < 24) return `${hours} hour${hours === 1 ? "" : "s"} ago`;
  if (days === 1) return "yesterday";
  return `${days} days ago`;
}

function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return "Never";
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

type StatusKey = "lead" | "onboarding" | "active" | "paused" | "churned";

const STATUS_BADGE: Record<StatusKey, string> = {
  lead: "bg-neutral-100 text-neutral-600",
  onboarding: "bg-yellow-100 text-yellow-700",
  active: "bg-green-100 text-green-700",
  paused: "bg-orange-100 text-orange-700",
  churned: "bg-red-100 text-red-700",
};

const ACTIVITY_ICONS: Record<string, React.ElementType> = {
  post: FileText,
  video: Film,
  onboarding: User,
};

// ── page ───────────────────────────────────────────────────────────────────

export default async function AdminDashboardPage() {
  const supabase = createAdminClient();

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
  const todayStr = now.toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" });

  const [
    { count: activeCount },
    { count: postsThisMonth },
    { count: publishedThisMonth },
    { count: noAyrshareCount },
    { count: pendingCount },
    { data: allClients },
    { data: recentActivities },
  ] = await Promise.all([
    supabase.from("clients").select("id", { count: "exact" }).eq("status", "active"),
    supabase.from("social_posts").select("id", { count: "exact" }).gte("created_at", startOfMonth),
    supabase.from("social_posts").select("id", { count: "exact" }).gte("created_at", startOfMonth).eq("status", "published"),
    supabase.from("clients").select("id", { count: "exact" }).eq("status", "active").is("ayrshare_profile_key", null),
    supabase.from("social_posts").select("id", { count: "exact" }).eq("status", "pending_approval"),
    supabase
      .from("clients")
      .select("id, business_name, email, status, created_at, ayrshare_profile_key")
      .order("created_at", { ascending: false })
      .limit(50),
    supabase
      .from("activities")
      .select("id, client_id, type, title, description, created_at")
      .order("created_at", { ascending: false })
      .limit(15),
  ]);

  const clients = allClients ?? [];
  const clientIds = clients.map((c) => c.id);

  // Fetch last post per client for "needs attention" logic
  const { data: recentPosts } = clientIds.length
    ? await supabase
        .from("social_posts")
        .select("client_id, created_at")
        .in("client_id", clientIds)
        .order("created_at", { ascending: false })
    : { data: [] };

  // Build map: clientId → latest post date
  const lastPostMap = new Map<string, string>();
  for (const post of recentPosts ?? []) {
    if (!lastPostMap.has(post.client_id)) {
      lastPostMap.set(post.client_id, post.created_at);
    }
  }

  const fourteenDaysAgo = new Date().getTime() - 14 * 24 * 60 * 60 * 1000;

  const needsAttention = clients
    .filter((c) => {
      if (c.status !== "active") return true;
      if (!c.ayrshare_profile_key) return true;
      const lastPost = lastPostMap.get(c.id);
      if (!lastPost || new Date(lastPost).getTime() < fourteenDaysAgo) return true;
      return false;
    })
    .slice(0, 10);

  // Client name map for activity feed
  const clientNameMap = new Map<string, string>(
    clients.map((c) => [c.id, c.business_name ?? c.email ?? c.id])
  );

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-neutral-900">Admin Dashboard</h2>
          <p className="text-sm text-neutral-500 mt-1">{todayStr}</p>
        </div>
        <TriggerCronButton />
      </div>

      {/* Stats row — responsive 1-2-5 cols */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-white rounded-2xl border border-neutral-200 shadow-sm p-5">
          <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wide mb-2">Active Clients</p>
          <p className="text-3xl font-bold text-green-600">{activeCount ?? 0}</p>
        </div>
        <div className="bg-white rounded-2xl border border-neutral-200 shadow-sm p-5">
          <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wide mb-2">Posts Generated</p>
          <p className="text-3xl font-bold text-blue-600">{postsThisMonth ?? 0}</p>
          <p className="text-xs text-neutral-400 mt-1">this month</p>
        </div>
        <div className="bg-white rounded-2xl border border-neutral-200 shadow-sm p-5">
          <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wide mb-2">Posts Published</p>
          <p className="text-3xl font-bold text-green-600">{publishedThisMonth ?? 0}</p>
          <p className="text-xs text-neutral-400 mt-1">this month</p>
        </div>
        <div className="bg-white rounded-2xl border border-neutral-200 shadow-sm p-5">
          <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wide mb-2">No Social Linked</p>
          <p className={`text-3xl font-bold ${(noAyrshareCount ?? 0) > 0 ? "text-amber-500" : "text-neutral-400"}`}>
            {noAyrshareCount ?? 0}
          </p>
        </div>
        <div className="bg-white rounded-2xl border border-neutral-200 shadow-sm p-5">
          <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wide mb-2">Pending Approval</p>
          <p className={`text-3xl font-bold ${(pendingCount ?? 0) > 0 ? "text-amber-500" : "text-neutral-400"}`}>
            {pendingCount ?? 0}
          </p>
        </div>
      </div>

      {/* Clients needing attention */}
      <div className="bg-white rounded-2xl border border-neutral-200 shadow-sm overflow-hidden">
        <div className="px-4 sm:px-6 py-4 border-b border-neutral-100 flex items-center gap-3">
          <h3 className="text-base font-semibold text-neutral-900">Needs Attention</h3>
          <span className="inline-block px-2.5 py-0.5 bg-amber-100 text-amber-700 text-xs font-semibold rounded-full">
            {needsAttention.length}
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-full">
            <thead>
              <tr className="bg-neutral-50 text-neutral-500 text-xs font-semibold uppercase tracking-wide">
                <th className="text-left px-6 py-3">Business Name</th>
                <th className="text-left px-6 py-3">Status</th>
                <th className="text-left px-6 py-3">Ayrshare</th>
                <th className="text-left px-6 py-3">Last Post</th>
                <th className="text-left px-6 py-3">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {needsAttention.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-sm text-neutral-400">
                    All clients look healthy.
                  </td>
                </tr>
              ) : (
                needsAttention.map((c) => {
                  const statusKey = (c.status ?? "lead") as StatusKey;
                  const lastPost = lastPostMap.get(c.id);
                  return (
                    <tr key={c.id} className="hover:bg-neutral-50 transition-colors">
                      <td className="px-6 py-4 font-medium text-neutral-900 whitespace-nowrap">
                        {c.business_name ?? c.email ?? "—"}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold capitalize ${STATUS_BADGE[statusKey] ?? "bg-neutral-100 text-neutral-600"}`}
                        >
                          {statusKey}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {c.ayrshare_profile_key ? (
                          <span className="inline-block px-2.5 py-0.5 bg-green-100 text-green-700 text-xs font-semibold rounded-full">
                            Connected
                          </span>
                        ) : (
                          <span className="inline-block px-2.5 py-0.5 bg-red-100 text-red-700 text-xs font-semibold rounded-full">
                            Not linked
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-neutral-500 whitespace-nowrap">
                        {formatDate(lastPost)}
                      </td>
                      <td className="px-6 py-4">
                        <Link
                          href={`/admin/clients/${c.id}`}
                          className="text-indigo-600 hover:underline text-xs font-medium"
                        >
                          View →
                        </Link>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Recent activity */}
      <div className="bg-white rounded-2xl border border-neutral-200 shadow-sm p-5">
        <h3 className="text-base font-semibold text-neutral-900 mb-4">Recent Activity</h3>
        {recentActivities && recentActivities.length > 0 ? (
          <ul className="space-y-3">
            {recentActivities.map((item) => {
              const Icon = ACTIVITY_ICONS[item.type ?? ""] ?? Zap;
              const clientName = clientNameMap.get(item.client_id) ?? item.client_id;
              return (
                <li key={item.id}>
                  <Link
                    href={`/admin/clients/${item.client_id}`}
                    className="flex items-start gap-3 hover:bg-neutral-50 rounded-xl px-2 py-1.5 -mx-2 transition-colors"
                  >
                    <div className="w-7 h-7 rounded-lg bg-neutral-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Icon className="w-3.5 h-3.5 text-neutral-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-neutral-900">{item.title}</p>
                      <p className="text-xs text-neutral-500">{clientName}</p>
                      {item.description && (
                        <p className="text-xs text-neutral-400">{item.description}</p>
                      )}
                    </div>
                    <span className="text-xs text-neutral-400 flex-shrink-0 mt-0.5">
                      {relativeTime(item.created_at)}
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        ) : (
          <p className="text-sm text-neutral-400 text-center py-4">No recent activity.</p>
        )}
      </div>
    </div>
  );
}
