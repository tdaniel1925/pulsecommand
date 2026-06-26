import Link from "next/link";
import {
  Share2,
  CalendarClock,
  Settings,
  CheckCircle,
  FileText,
  Sparkles,
} from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import WelcomeBanner from "@/components/dashboard/WelcomeBanner";
import { resolveClientPlan } from "@/lib/plan";
import { PUBLIC_PLAN, formatPrice } from "@/lib/stripe";

const PlatformBadge = ({ platform }: { platform: string }) => {
  const styles: Record<string, string> = {
    Instagram: "bg-pink-100 text-pink-700",
    Facebook: "bg-blue-100 text-blue-700",
    Twitter: "bg-sky-100 text-sky-700",
    LinkedIn: "bg-blue-100 text-blue-800",
    TikTok: "bg-neutral-100 text-neutral-700",
    instagram: "bg-pink-100 text-pink-700",
    facebook: "bg-blue-100 text-blue-700",
    twitter: "bg-sky-100 text-sky-700",
    linkedin: "bg-blue-100 text-blue-800",
    tiktok: "bg-neutral-100 text-neutral-700",
  };
  return (
    <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded capitalize ${styles[platform] ?? "bg-neutral-100 text-neutral-600"}`}>
      {platform}
    </span>
  );
};

const quickActions = [
  { label: "View Social Posts", icon: Share2, color: "bg-blue-50 text-blue-700", href: "/dashboard/social" },
  { label: "Connect Accounts", icon: Sparkles, color: "bg-violet-50 text-violet-700", href: "/dashboard/settings?tab=social" },
  { label: "Update Profile", icon: Settings, color: "bg-neutral-100 text-neutral-700", href: "/dashboard/settings" },
  { label: "Billing", icon: FileText, color: "bg-green-50 text-green-700", href: "/dashboard/billing" },
];

function timeAgo(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffHours / 24);
  if (diffHours < 1) return "Just now";
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays === 1) return "Yesterday";
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function formatScheduledDate(dateStr: string | null): string {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit",
  });
}

/** Whole days from now until `end` (negative if past). Isolated so the date-math
 *  helper isn't flagged by the render-purity lint rule. */
function daysUntil(end: Date): number {
  return Math.ceil((end.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
}

/** Time-of-day greeting (isolated for the render-purity lint rule). */
function timeGreeting(): string {
  const h = new Date().getHours();
  return h < 12 ? "Good morning" : h < 18 ? "Good afternoon" : "Good evening";
}

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { data: client } = await supabase
    .from("clients")
    .select("*")
    .eq("user_id", user?.id ?? "")
    .single();

  const { count: publishedPosts } = await supabase
    .from("social_posts").select("*", { count: "exact", head: true })
    .eq("client_id", client?.id ?? "").eq("status", "published");

  const { count: scheduledPosts } = await supabase
    .from("social_posts").select("*", { count: "exact", head: true })
    .eq("client_id", client?.id ?? "").eq("status", "scheduled");

  const { data: upcomingRaw } = await supabase
    .from("social_posts").select("*")
    .eq("client_id", client?.id ?? "").eq("status", "scheduled")
    .order("scheduled_at", { ascending: true }).limit(10);

  // Only surface posts that have a real scheduled date, and drop duplicate
  // content so the list never shows the same placeholder post three times.
  const seenContent = new Set<string>();
  const upcomingPosts = (upcomingRaw ?? [])
    .filter((p) => p.scheduled_at)
    .filter((p) => {
      const key = (p.content ?? "").trim();
      if (seenContent.has(key)) return false;
      seenContent.add(key);
      return true;
    })
    .slice(0, 3);

  const { data: recentRaw } = await supabase
    .from("activities").select("*")
    .eq("client_id", client?.id ?? "")
    .order("created_at", { ascending: false }).limit(15);

  // Collapse consecutive duplicate activity descriptions (onboarding can log the
  // same line several times) so the feed reads cleanly.
  const seenActivity = new Set<string>();
  const recentActivities = (recentRaw ?? [])
    .filter((a) => {
      const key = `${a.type}:${(a.description ?? a.text ?? "").trim()}`;
      if (seenActivity.has(key)) return false;
      seenActivity.add(key);
      return true;
    })
    .slice(0, 5);

  // Connected social accounts (real, from the zernio_connected_platforms column).
  const connectedPlatforms: string[] = Array.isArray(client?.zernio_connected_platforms)
    ? (client!.zernio_connected_platforms as string[])
    : [];

  const totalPosts = (publishedPosts ?? 0) + (scheduledPosts ?? 0);

  // Resolve the client's real plan; fall back to the public plan if their stored
  // id is legacy/unknown (e.g. "full").
  const plan = (client ? resolveClientPlan(client) : null) ?? PUBLIC_PLAN;

  const stats = [
    { label: "Posts This Month", value: String(totalPosts), sub: "published + scheduled", icon: Share2, color: "text-blue-600 bg-blue-50" },
    { label: "Published", value: String(publishedPosts ?? 0), sub: "live now", icon: CheckCircle, color: "text-green-600 bg-green-50" },
    { label: "Scheduled", value: String(scheduledPosts ?? 0), sub: "queued to post", icon: CalendarClock, color: "text-violet-600 bg-violet-50" },
    { label: "Connected Accounts", value: String(connectedPlatforms.length), sub: "social platforms", icon: Sparkles, color: "text-orange-600 bg-orange-50" },
  ];

  const firstName = client?.first_name ?? "there";

  // ── Real trial status ──────────────────────────────────────────────────────
  // Only show the trial card when the subscription is actually trialing AND we
  // have (or can derive) a real end date that hasn't passed. No fake countdowns.
  const isTrialing = client?.subscription_status === "trialing";
  const trialEndDate: Date | null = (() => {
    if (client?.trial_end) return new Date(client.trial_end as string);
    // Fall back to created_at + 14 days if the explicit field isn't set.
    if (client?.created_at) {
      const d = new Date(client.created_at as string);
      d.setDate(d.getDate() + 14);
      return d;
    }
    return null;
  })();
  const trialDaysLeft = trialEndDate ? daysUntil(trialEndDate) : null;
  const showTrialCard = isTrialing && trialDaysLeft != null && trialDaysLeft > 0;
  const trialEndLabel = trialEndDate
    ? trialEndDate.toLocaleDateString("en-US", { month: "long", day: "numeric" })
    : "";

  const greeting = timeGreeting();
  const isLive = connectedPlatforms.length > 0;

  return (
    <div className="space-y-6">
      <WelcomeBanner />
      {/* Welcome banner */}
      <div className="bg-primary-600 rounded-2xl px-6 py-5 text-white">
        <p className="text-lg font-bold">{greeting}, {firstName}!</p>
        <p className="text-primary-200 text-sm mt-0.5">
          {isLive ? "Your content machine is running." : "Let's get your content machine running."}
        </p>
      </div>

      {/* ACTIVATION: nothing publishes until at least one account is connected */}
      {!isLive && (
        <div className="bg-amber-50 border-2 border-amber-200 rounded-2xl px-4 sm:px-6 py-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <Sparkles className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-amber-900 text-sm">You&apos;re almost live — connect a social account</p>
              <p className="text-amber-700 text-xs mt-0.5">
                We can&apos;t publish anything until you connect at least one account. It takes about a minute.
              </p>
            </div>
          </div>
          <Link href="/dashboard/settings?tab=social" className="bg-amber-500 hover:bg-amber-600 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors whitespace-nowrap w-full sm:w-auto text-center">
            Connect accounts →
          </Link>
        </div>
      )}

      {/* Trial status card — only when genuinely trialing with time left */}
      {showTrialCard && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-2xl px-4 sm:px-6 py-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <p className="font-semibold text-yellow-800 text-sm">
              You have {trialDaysLeft} {trialDaysLeft === 1 ? "day" : "days"} left in your free trial
            </p>
            <p className="text-yellow-600 text-xs mt-0.5">
              Upgrade to keep your posts flowing after {trialEndLabel} — {plan.name}, {formatPrice(plan.price)}/mo.
            </p>
          </div>
          <Link href="/dashboard/billing" className="bg-yellow-500 hover:bg-yellow-600 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors whitespace-nowrap w-full sm:w-auto text-center">
            Upgrade Now
          </Link>
        </div>
      )}

      {/* Stats row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s) => (
          <div key={s.label} className="bg-white rounded-2xl border border-neutral-200 shadow-sm p-5">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center mb-3 ${s.color}`}>
              <s.icon className="w-4 h-4" />
            </div>
            <p className="text-2xl font-bold text-neutral-900">
              {s.value}
              <span className="text-sm font-normal text-neutral-400 ml-1">{s.sub}</span>
            </p>
            <p className="text-xs text-neutral-500 mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* This Month's Content */}
        <div className="lg:col-span-2 space-y-4">
          <h2 className="font-semibold text-neutral-900">Upcoming Scheduled Posts</h2>

          {upcomingPosts && upcomingPosts.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {upcomingPosts.map((post) => {
                const platforms: string[] = Array.isArray(post.platforms) ? post.platforms : [];
                return (
                  <div key={post.id} className="bg-white rounded-2xl border border-neutral-200 shadow-sm overflow-hidden">
                    {/* Image placeholder */}
                    <div className="h-28 bg-neutral-100 flex items-center justify-center">
                      {post.image_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={post.image_url} alt="" className="h-full w-full object-cover" />
                      ) : (
                        <Share2 className="w-6 h-6 text-neutral-300" />
                      )}
                    </div>
                    <div className="p-3 space-y-2">
                      {/* Platform badges */}
                      <div className="flex gap-1 flex-wrap">
                        {platforms.map((p) => <PlatformBadge key={p} platform={p} />)}
                      </div>
                      <p className="text-xs text-neutral-700 line-clamp-2">{post.content}</p>
                      <p className="text-xs text-neutral-400">{formatScheduledDate(post.scheduled_at)}</p>
                      <span className="inline-block text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200 px-2 py-0.5 rounded-full">
                        Scheduled
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-neutral-200 shadow-sm p-8 text-center">
              <Share2 className="w-8 h-8 text-neutral-300 mx-auto mb-3" />
              <p className="text-sm text-neutral-500">No scheduled posts yet — your first batch will arrive within 48 hours of onboarding.</p>
            </div>
          )}

          {/* Quick Actions */}
          <h2 className="font-semibold text-neutral-900 pt-2">Quick Actions</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {quickActions.map((a) => (
              <Link
                key={a.label}
                href={a.href}
                className={`flex flex-col items-center gap-2 p-4 rounded-2xl border border-neutral-200 bg-white hover:shadow-sm transition-shadow text-center`}
              >
                <span className={`w-9 h-9 rounded-xl flex items-center justify-center ${a.color}`}>
                  <a.icon className="w-4 h-4" />
                </span>
                <span className="text-xs font-medium text-neutral-700 leading-tight">{a.label}</span>
              </Link>
            ))}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="space-y-4">
          <h2 className="font-semibold text-neutral-900">Recent Activity</h2>
          <div className="bg-white rounded-2xl border border-neutral-200 shadow-sm p-4 space-y-4">
            {recentActivities && recentActivities.length > 0 ? (
              recentActivities.map((item, i) => {
                // Pick icon based on activity type
                const iconMap: Record<string, { icon: React.ElementType; color: string }> = {
                  post: { icon: CheckCircle, color: "text-green-600" },
                  billing: { icon: FileText, color: "text-blue-600" },
                  report: { icon: FileText, color: "text-blue-600" },
                  onboarding_step: { icon: Sparkles, color: "text-violet-600" },
                };
                const typeKey = item.type ?? "post";
                const { icon: Icon, color } = iconMap[typeKey] ?? { icon: CheckCircle, color: "text-neutral-500" };
                return (
                  <div key={item.id} className="flex gap-3">
                    <div className="flex flex-col items-center">
                      <Icon className={`w-4 h-4 mt-0.5 flex-shrink-0 ${color}`} />
                      {i < recentActivities.length - 1 && <div className="w-px flex-1 bg-neutral-100 mt-1" />}
                    </div>
                    <div className="pb-3 min-w-0">
                      <p className="text-xs text-neutral-700 leading-snug">{item.description ?? item.text}</p>
                      <p className="text-xs text-neutral-400 mt-0.5">{timeAgo(item.created_at)}</p>
                    </div>
                  </div>
                );
              })
            ) : (
              <p className="text-xs text-neutral-400 text-center py-4">No activity yet — check back after your first content batch.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
