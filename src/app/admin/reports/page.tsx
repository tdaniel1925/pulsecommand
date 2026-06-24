import { createAdminClient } from "@/lib/supabase/admin";
import { ExportCsvButton } from "@/components/admin/ExportCsvButton";

export default async function ReportsPage() {
  const supabase = createAdminClient();

  const now = new Date().getTime();

  const [{ data: clientsData }, { data: postsData }, { data: activitiesData }] =
    await Promise.all([
      supabase
        .from("clients")
        .select("id, business_name, ayrshare_profile_key, status, created_at"),
      supabase
        .from("social_posts")
        .select("id, client_id, status, platforms, published_at, created_at")
        .gte("created_at", new Date(now - 90 * 86400000).toISOString()),
      supabase
        .from("activities")
        .select("id, client_id, type, created_at")
        .gte("created_at", new Date(now - 30 * 86400000).toISOString()),
    ]);

  const clients = clientsData ?? [];
  const posts = postsData ?? [];
  // activitiesData reserved for future use
  void activitiesData;

  // ── Core metrics ──────────────────────────────────────────────────────────
  const totalPostsGenerated = posts.length;
  const totalPostsPublished = posts.filter((p) => p.status === "published").length;
  const publishRate =
    totalPostsGenerated > 0
      ? Math.round((totalPostsPublished / totalPostsGenerated) * 100)
      : 0;
  const activeClients = clients.filter((c) => c.status === "active");
  const avgPostsPerClient =
    activeClients.length > 0
      ? (totalPostsPublished / activeClients.length).toFixed(1)
      : "0";

  // ── Top clients ───────────────────────────────────────────────────────────
  const topClients = clients
    .map((client) => {
      const clientPosts = posts.filter(
        (p) => p.client_id === client.id && p.status === "published"
      );
      const publishedCount = clientPosts.length;
      const lastPost = clientPosts.sort((a, b) => {
        const aDate = new Date(a.published_at ?? a.created_at).getTime();
        const bDate = new Date(b.published_at ?? b.created_at).getTime();
        return bDate - aDate;
      })[0];
      const lastPostDate: string | null = lastPost
        ? (lastPost.published_at ?? lastPost.created_at)
        : null;
      return {
        id: client.id as string,
        business_name: client.business_name as string,
        ayrshare_profile_key: client.ayrshare_profile_key as string | null,
        publishedCount,
        lastPostDate,
      };
    })
    .sort((a, b) => b.publishedCount - a.publishedCount)
    .slice(0, 5);

  // ── Platform breakdown ────────────────────────────────────────────────────
  const platformBreakdown: Record<string, number> = {};
  for (const post of posts) {
    if (post.status !== "published") continue;
    if (Array.isArray(post.platforms)) {
      for (const platform of post.platforms as string[]) {
        platformBreakdown[platform] = (platformBreakdown[platform] ?? 0) + 1;
      }
    }
  }

  // ── Posts by week (last 8 weeks) ──────────────────────────────────────────
  function getWeekStart(date: Date): Date {
    const d = new Date(date);
    const day = d.getDay(); // 0=Sun … 6=Sat
    const diff = day === 0 ? -6 : 1 - day; // shift to Monday
    d.setDate(d.getDate() + diff);
    d.setHours(0, 0, 0, 0);
    return d;
  }

  const postsByWeek: Array<{ weekLabel: string; count: number }> = [];
  for (let i = 7; i >= 0; i--) {
    const refDate = new Date();
    refDate.setDate(refDate.getDate() - i * 7);
    const weekStart = getWeekStart(refDate);
    const weekEnd = new Date(weekStart.getTime() + 7 * 86400000);
    const count = posts.filter((p) => {
      if (p.status !== "published") return false;
      const d = new Date(p.published_at ?? p.created_at).getTime();
      return d >= weekStart.getTime() && d < weekEnd.getTime();
    }).length;
    postsByWeek.push({
      weekLabel: weekStart.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      count,
    });
  }

  // ── Stale clients (no content in 14 days) ─────────────────────────────────
  const fourteenDaysAgo = now - 14 * 86400000;
  const clientsWithNoPostsIn14Days = activeClients
    .map((client) => {
      const clientPosts = posts
        .filter((p) => p.client_id === client.id)
        .sort(
          (a, b) =>
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
      const lastPostDate: string | null = clientPosts[0]?.created_at ?? null;
      const lastPostTime = lastPostDate ? new Date(lastPostDate).getTime() : 0;
      if (lastPostDate && lastPostTime >= fourteenDaysAgo) return null;
      const daysSince = lastPostDate
        ? Math.floor((now - lastPostTime) / 86400000)
        : 9999;
      return {
        id: client.id as string,
        business_name: client.business_name as string,
        lastPostDate,
        daysSince,
      };
    })
    .filter(Boolean) as Array<{
    id: string;
    business_name: string;
    lastPostDate: string | null;
    daysSince: number;
  }>;

  // ── Derived display helpers ───────────────────────────────────────────────
  const today = new Date().toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  const maxCount = Math.max(...postsByWeek.map((w) => w.count), 1);

  const sortedPlatforms = Object.entries(platformBreakdown).sort(
    (a, b) => b[1] - a[1]
  );
  const maxPlat = Math.max(...sortedPlatforms.map((e) => e[1]), 1);
  const platformColors: Record<string, string> = {
    instagram: "bg-pink-500",
    facebook: "bg-blue-600",
    linkedin: "bg-blue-800",
    twitter: "bg-neutral-800",
    tiktok: "bg-neutral-600",
  };

  const rankLabels = ["🥇", "🥈", "🥉", "4th", "5th"];

  return (
    <div className="space-y-6">
      {/* 1. Header */}
      <div>
        <h1 className="text-2xl font-bold text-neutral-900">Business Reports</h1>
        <p className="text-neutral-500 text-sm">Last 90 days · as of {today}</p>
      </div>

      {/* 2. Top stats row */}
      <div className="grid grid-cols-5 gap-4">
        {/* Posts Generated */}
        <div className="bg-white rounded-xl p-6 border border-neutral-200 shadow-sm">
          <p className="text-xs uppercase text-neutral-400">Posts Generated</p>
          <p className="text-3xl font-bold text-blue-600">{totalPostsGenerated}</p>
        </div>
        {/* Posts Published */}
        <div className="bg-white rounded-xl p-6 border border-neutral-200 shadow-sm">
          <p className="text-xs uppercase text-neutral-400">Posts Published</p>
          <p className="text-3xl font-bold text-green-600">{totalPostsPublished}</p>
        </div>
        {/* Publish Rate */}
        <div className="bg-white rounded-xl p-6 border border-neutral-200 shadow-sm">
          <p className="text-xs uppercase text-neutral-400">Publish Rate</p>
          <p
            className={`text-3xl font-bold ${
              publishRate >= 70 ? "text-green-600" : "text-amber-600"
            }`}
          >
            {publishRate}%
          </p>
        </div>
        {/* Active Clients */}
        <div className="bg-white rounded-xl p-6 border border-neutral-200 shadow-sm">
          <p className="text-xs uppercase text-neutral-400">Active Clients</p>
          <p className="text-3xl font-bold text-blue-600">{activeClients.length}</p>
        </div>
        {/* Avg Posts/Client */}
        <div className="bg-white rounded-xl p-6 border border-neutral-200 shadow-sm">
          <p className="text-xs uppercase text-neutral-400">Avg Posts/Client</p>
          <p className="text-3xl font-bold text-neutral-700">{avgPostsPerClient}</p>
        </div>
      </div>

      {/* 3. Weekly volume chart */}
      <div className="bg-white rounded-xl p-6 border border-neutral-200">
        <h2 className="text-lg font-semibold mb-4">Posts Published — Last 8 Weeks</h2>
        <div className="flex items-end gap-3 h-40">
          {postsByWeek.map((week) => (
            <div
              key={week.weekLabel}
              className="flex flex-col items-center gap-1 flex-1"
            >
              <span className="text-xs text-neutral-500 font-medium">{week.count}</span>
              <div
                className="w-full bg-indigo-500 rounded-t-sm min-h-[2px]"
                style={{ height: `${(week.count / maxCount) * 100}%` }}
              />
              <span className="text-[10px] text-neutral-400">{week.weekLabel}</span>
            </div>
          ))}
        </div>
      </div>

      {/* 4. Top clients table */}
      <div className="bg-white rounded-xl overflow-hidden border border-neutral-200">
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-100">
          <h2 className="text-lg font-semibold">Top Performing Clients</h2>
          <ExportCsvButton
            data={topClients.map((c, i) => ({
              rank: rankLabels[i] ?? String(i + 1),
              client: c.business_name,
              published: c.publishedCount,
              lastPost: c.lastPostDate
                ? new Date(c.lastPostDate).toLocaleDateString()
                : "Never",
            }))}
          />
        </div>
        <table className="w-full text-sm">
          <thead className="bg-neutral-50 text-neutral-500 text-xs uppercase">
            <tr>
              <th className="px-6 py-3 text-left">Rank</th>
              <th className="px-6 py-3 text-left">Client</th>
              <th className="px-6 py-3 text-left">Posts</th>
              <th className="px-6 py-3 text-left">Social</th>
              <th className="px-6 py-3 text-left">Last Post</th>
              <th className="px-6 py-3 text-left">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100">
            {topClients.map((client, i) => (
              <tr key={client.id} className="hover:bg-neutral-50">
                <td className="px-6 py-4">{rankLabels[i] ?? String(i + 1)}</td>
                <td className="px-6 py-4 font-medium">{client.business_name}</td>
                <td className="px-6 py-4">{client.publishedCount}</td>
                <td className="px-6 py-4">
                  {client.ayrshare_profile_key ? (
                    <span className="text-green-600">✓ Connected</span>
                  ) : (
                    <span className="text-red-500">✗ Not set</span>
                  )}
                </td>
                <td className="px-6 py-4">
                  {client.lastPostDate
                    ? new Date(client.lastPostDate).toLocaleDateString()
                    : "Never"}
                </td>
                <td className="px-6 py-4">
                  <a
                    href={`/admin/clients/${client.id}`}
                    className="text-indigo-600 hover:underline text-sm"
                  >
                    View →
                  </a>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* 5. Platform breakdown */}
      <div className="bg-white rounded-xl p-6 border border-neutral-200">
        <h2 className="text-lg font-semibold mb-4">Platform Distribution</h2>
        {sortedPlatforms.length === 0 ? (
          <p className="text-neutral-400 text-sm">No published posts yet</p>
        ) : (
          sortedPlatforms.map(([platform, count]) => (
            <div key={platform} className="mb-3">
              <div className="flex justify-between text-sm mb-1">
                <span className="capitalize font-medium">{platform}</span>
                <span className="text-neutral-500">{count}</span>
              </div>
              <div className="h-2 bg-neutral-100 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full ${platformColors[platform] ?? "bg-indigo-500"}`}
                  style={{ width: `${(count / maxPlat) * 100}%` }}
                />
              </div>
            </div>
          ))
        )}
      </div>

      {/* 6. Stale clients */}
      <div>
        <h2 className="text-lg font-semibold mb-4">
          Stale Clients — No content in 14+ days
        </h2>
        {clientsWithNoPostsIn14Days.length === 0 ? (
          <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-green-700">
            ✅ All clients are generating content regularly
          </div>
        ) : (
          <div className="bg-white rounded-xl overflow-hidden border border-neutral-200">
            <table className="w-full text-sm">
              <thead className="bg-neutral-50 text-neutral-500 text-xs uppercase">
                <tr>
                  <th className="px-6 py-3 text-left">Client</th>
                  <th className="px-6 py-3 text-left">Last Post</th>
                  <th className="px-6 py-3 text-left">Days Since</th>
                  <th className="px-6 py-3 text-left">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {clientsWithNoPostsIn14Days.map((client) => (
                  <tr key={client.id} className="hover:bg-neutral-50">
                    <td className="px-6 py-4 font-medium">{client.business_name}</td>
                    <td className="px-6 py-4">
                      {client.lastPostDate
                        ? new Date(client.lastPostDate).toLocaleDateString()
                        : "Never"}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={
                          client.daysSince > 21
                            ? "text-red-600 font-bold"
                            : "text-amber-600 font-semibold"
                        }
                      >
                        {client.daysSince === 9999 ? "Never" : `${client.daysSince}d`}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <a
                        href={`/admin/clients/${client.id}`}
                        className="text-indigo-600 hover:underline text-sm"
                      >
                        View Client →
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
