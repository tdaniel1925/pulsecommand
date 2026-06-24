"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  ExternalLink,
  CheckCircle,
  XCircle,
  FileText,
  Film,
  Activity,
  User,
  CreditCard,
  Zap,
  Mail,
} from "lucide-react";

// ── Types ────────────────────────────────────────────────────────────────────

interface Client {
  id: string;
  business_name: string | null;
  email: string | null;
  status: string | null;
  created_at: string;
  metadata: Record<string, unknown> | null;
  ayrshare_profile_key: string | null;
  ayrshare_connected_platforms: string[] | null;
  plan_name: string | null;
  plan_status: string | null;
  plan_period_end: string | null;
  stripe_customer_id: string | null;
  presentations_used: number | null;
  presentations_limit: number | null;
}

interface Post {
  id: string;
  status: string;
  content: string | null;
  platforms: string[] | null;
  image_url: string | null;
  created_at: string;
  published_at: string | null;
}

interface Video {
  id: string;
  status: string;
  title: string | null;
  thumbnail_url: string | null;
  created_at: string;
}

interface Presentation {
  id: string;
  title: string | null;
  status: string | null;
  slide_count: number | null;
  created_at: string;
}

interface ActivityItem {
  id: string;
  type: string | null;
  title: string | null;
  description: string | null;
  created_at: string;
}

interface PostStats {
  draft: number;
  pending_approval: number;
  scheduled: number;
  published: number;
  failed: number;
}

interface Props {
  client: Client;
  posts: Post[];
  videos: Video[];
  presentations: Presentation[];
  activities: ActivityItem[];
  postStats: PostStats;
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function initials(name: string | null | undefined): string {
  if (!name) return "?";
  return name.charAt(0).toUpperCase();
}

const STATUS_BADGE: Record<string, string> = {
  lead: "bg-neutral-100 text-neutral-600",
  onboarding: "bg-yellow-100 text-yellow-700",
  active: "bg-green-100 text-green-700",
  paused: "bg-orange-100 text-orange-700",
  churned: "bg-red-100 text-red-700",
  pending: "bg-blue-100 text-blue-700",
};

const PLAN_BADGE: Record<string, string> = {
  free: "bg-neutral-100 text-neutral-600",
  lite: "bg-blue-100 text-blue-700",
  full: "bg-indigo-100 text-indigo-700",
  premium: "bg-purple-100 text-purple-700",
};

const POST_STATUS_BADGE: Record<string, string> = {
  draft: "bg-neutral-100 text-neutral-500",
  pending_approval: "bg-amber-100 text-amber-700",
  scheduled: "bg-blue-100 text-blue-700",
  published: "bg-green-100 text-green-700",
  failed: "bg-red-100 text-red-700",
};

const ACTIVITY_COLORS: Record<string, string> = {
  post: "bg-indigo-500",
  video: "bg-purple-500",
  system: "bg-neutral-400",
  billing: "bg-green-500",
};

const PLATFORM_COLORS: Record<string, string> = {
  facebook: "bg-blue-100 text-blue-700",
  instagram: "bg-pink-100 text-pink-700",
  twitter: "bg-sky-100 text-sky-700",
  linkedin: "bg-blue-100 text-blue-800",
  tiktok: "bg-neutral-100 text-neutral-700",
  youtube: "bg-red-100 text-red-700",
};

// ── Sub-components ────────────────────────────────────────────────────────────

function Badge({ label, className }: { label: string; className: string }) {
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold capitalize ${className}`}>
      {label}
    </span>
  );
}

function PostDrawer({ post, onClose }: { post: Post; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="flex-1 bg-black/40" onClick={onClose} />
      <div className="w-[480px] bg-white h-full shadow-2xl flex flex-col overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-neutral-100">
          <h3 className="text-base font-semibold text-neutral-900">Post Detail</h3>
          <button onClick={onClose} className="text-neutral-400 hover:text-neutral-700 text-xl font-bold">×</button>
        </div>
        <div className="p-6 space-y-4 flex-1">
          {post.image_url && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={post.image_url} alt="Post" className="w-full rounded-xl object-cover max-h-64 border border-neutral-100" />
          )}
          <div>
            <p className="text-xs font-semibold text-neutral-400 uppercase tracking-wide mb-1">Caption</p>
            <p className="text-sm text-neutral-800 whitespace-pre-wrap">{post.content ?? "—"}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {(post.platforms ?? []).map((p) => (
              <span key={p} className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${PLATFORM_COLORS[p] ?? "bg-neutral-100 text-neutral-600"}`}>{p}</span>
            ))}
          </div>
          <div className="flex items-center gap-3">
            <Badge label={post.status} className={POST_STATUS_BADGE[post.status] ?? "bg-neutral-100 text-neutral-600"} />
            <span className="text-xs text-neutral-400">{formatDate(post.published_at ?? post.created_at)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────

export function AdminClientDetail({ client, posts, videos, presentations, activities, postStats }: Props) {
  const [activeTab, setActiveTab] = useState<"posts" | "presentations" | "videos" | "activity" | "brand">("posts");
  const [postFilter, setPostFilter] = useState<string>("all");
  const [drawerPost, setDrawerPost] = useState<Post | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [actionResult, setActionResult] = useState<string | null>(null);
  const [statusValue, setStatusValue] = useState(client.status ?? "lead");
  const [notes, setNotes] = useState<string>((client.metadata as Record<string, string> | null)?.admin_notes ?? "");
  const notesTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (notesTimer.current) clearTimeout(notesTimer.current);
    };
  }, []);

  const businessName = client.business_name ?? client.email ?? "Unknown";
  const planName = client.plan_name ?? "free";

  function showResult(msg: string) {
    setActionResult(msg);
    setTimeout(() => setActionResult(null), 4000);
  }

  async function triggerContentGeneration() {
    setActionLoading("cron");
    try {
      const res = await fetch("/api/admin/trigger-cron", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clientId: client.id }),
      });
      const data = await res.json();
      showResult(data.ok ? "Content generation triggered!" : data.error ?? "Failed");
    } catch {
      showResult("Request failed");
    } finally {
      setActionLoading(null);
    }
  }

  async function sendWelcomeEmail() {
    setActionLoading("email");
    try {
      const res = await fetch("/api/admin/send-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clientId: client.id, type: "welcome" }),
      });
      const data = await res.json();
      showResult(data.ok ? "Welcome email sent!" : data.error ?? "Failed");
    } catch {
      showResult("Request failed");
    } finally {
      setActionLoading(null);
    }
  }

  async function updateStatus(newStatus: string) {
    setStatusValue(newStatus);
    try {
      await fetch(`/api/admin/clients/${client.id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      showResult(`Status changed to ${newStatus}`);
    } catch {
      showResult("Status update failed");
    }
  }

  function handleNotesChange(value: string) {
    setNotes(value);
    if (notesTimer.current) clearTimeout(notesTimer.current);
    notesTimer.current = setTimeout(async () => {
      try {
        await fetch(`/api/admin/clients/${client.id}/notes`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ notes: value }),
        });
      } catch {
        // silent
      }
    }, 1000);
  }

  async function approvePost(postId: string) {
    setActionLoading(`approve-${postId}`);
    try {
      const res = await fetch("/api/content/approve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "post", id: postId, action: "approve" }),
      });
      const data = await res.json();
      showResult(data.ok || data.success ? "Post approved!" : data.error ?? "Failed");
    } catch {
      showResult("Approval failed");
    } finally {
      setActionLoading(null);
    }
  }

  const filteredPosts = postFilter === "all" ? posts : posts.filter((p) => p.status === postFilter);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const metadata = (client.metadata ?? {}) as Record<string, any>;
  const connectedPlatforms = client.ayrshare_connected_platforms ?? [];

  const TABS = [
    { key: "posts", label: "Posts", icon: FileText },
    { key: "presentations", label: "Presentations", icon: FileText },
    { key: "videos", label: "Videos", icon: Film },
    { key: "activity", label: "Activity", icon: Activity },
    { key: "brand", label: "Brand Profile", icon: User },
  ] as const;

  return (
    <div className="space-y-4">
      {/* Back nav */}
      <Link
        href="/admin/clients"
        className="inline-flex items-center gap-1.5 text-sm text-neutral-500 hover:text-neutral-800 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        All Clients
      </Link>

      {drawerPost && <PostDrawer post={drawerPost} onClose={() => setDrawerPost(null)} />}

      <div className="flex gap-6 items-start">
        {/* ── LEFT SIDEBAR ────────────────────────────────────────────── */}
        <aside className="w-72 flex-shrink-0 space-y-4 sticky top-4">
          {/* Client Card */}
          <div className="bg-white rounded-2xl border border-neutral-200 shadow-sm p-6">
            <div className="flex flex-col items-center text-center gap-3">
              <div className="w-16 h-16 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-2xl font-bold flex-shrink-0">
                {initials(client.business_name)}
              </div>
              <div>
                <p className="text-xl font-bold text-neutral-900">{businessName}</p>
                <p className="text-sm text-neutral-500 mt-0.5">{client.email ?? "—"}</p>
              </div>
              <div className="flex flex-wrap gap-2 justify-center">
                <Badge
                  label={client.status ?? "lead"}
                  className={STATUS_BADGE[client.status ?? "lead"] ?? STATUS_BADGE.lead}
                />
                <Badge
                  label={planName}
                  className={PLAN_BADGE[planName] ?? PLAN_BADGE.free}
                />
              </div>
              <p className="text-xs text-neutral-400">Member since {formatDate(client.created_at)}</p>
            </div>

            {/* Quick stats 2x2 */}
            <div className="grid grid-cols-2 gap-3 mt-5">
              {[
                { label: "Published", value: postStats.published, color: "text-green-600" },
                {
                  label: "Pending",
                  value: postStats.pending_approval,
                  color: postStats.pending_approval > 0 ? "text-amber-500" : "text-neutral-400",
                },
                { label: "Decks", value: presentations.length, color: "text-indigo-600" },
                { label: "Videos", value: videos.length, color: "text-purple-600" },
              ].map(({ label, value, color }) => (
                <div key={label} className="bg-neutral-50 rounded-xl p-3 text-center border border-neutral-100">
                  <p className={`text-xl font-bold ${color}`}>{value}</p>
                  <p className="text-xs text-neutral-500 mt-0.5">{label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Actions Panel */}
          <div className="bg-white rounded-2xl border border-neutral-200 shadow-sm p-4 space-y-3">
            {actionResult && (
              <div className="text-xs text-green-700 bg-green-50 border border-green-200 rounded-lg px-3 py-2">
                {actionResult}
              </div>
            )}

            <button
              onClick={triggerContentGeneration}
              disabled={!!actionLoading}
              className="w-full flex items-center gap-2 text-sm font-semibold bg-indigo-600 text-white rounded-xl px-4 py-2.5 hover:bg-indigo-700 disabled:opacity-60 transition-colors justify-center"
            >
              <Zap className="w-4 h-4" />
              {actionLoading === "cron" ? "Triggering…" : "Trigger Content Generation"}
            </button>

            <button
              onClick={sendWelcomeEmail}
              disabled={!!actionLoading}
              className="w-full flex items-center gap-2 text-sm font-medium border border-neutral-200 rounded-xl px-4 py-2.5 hover:bg-neutral-50 disabled:opacity-60 transition-colors text-neutral-700 justify-center"
            >
              <Mail className="w-4 h-4" />
              {actionLoading === "email" ? "Sending…" : "Send Welcome Email"}
            </button>

            {client.stripe_customer_id && (
              <a
                href={`https://dashboard.stripe.com/customers/${client.stripe_customer_id}`}
                target="_blank"
                rel="noreferrer"
                className="w-full flex items-center gap-2 text-sm font-medium border border-neutral-200 rounded-xl px-4 py-2.5 hover:bg-neutral-50 transition-colors text-neutral-700 justify-center"
              >
                <CreditCard className="w-4 h-4" />
                View in Stripe
                <ExternalLink className="w-3.5 h-3.5 text-neutral-400" />
              </a>
            )}

            <div>
              <label className="block text-xs font-semibold text-neutral-500 mb-1.5">Change Status</label>
              <select
                value={statusValue}
                onChange={(e) => updateStatus(e.target.value)}
                className="w-full px-3 py-2 border border-neutral-200 rounded-xl text-sm text-neutral-900 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                {["lead", "onboarding", "active", "paused", "churned"].map((s) => (
                  <option key={s} value={s} className="capitalize">
                    {s.charAt(0).toUpperCase() + s.slice(1)}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Admin Notes */}
          <div className="bg-white rounded-2xl border border-neutral-200 shadow-sm p-4">
            <label className="block text-xs font-semibold text-neutral-500 mb-2">Admin Notes</label>
            <textarea
              value={notes}
              onChange={(e) => handleNotesChange(e.target.value)}
              placeholder="Internal notes — auto-saved…"
              rows={4}
              className="w-full text-sm border border-neutral-200 rounded-xl px-3 py-2 resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500 text-neutral-800 placeholder:text-neutral-400"
            />
            <p className="text-xs text-neutral-400 mt-1">Auto-saves after typing stops</p>
          </div>
        </aside>

        {/* ── MAIN CONTENT ────────────────────────────────────────────── */}
        <div className="flex-1 min-w-0 space-y-4">
          {/* Tab nav */}
          <div className="flex gap-1 border-b border-neutral-200">
            {TABS.map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                onClick={() => setActiveTab(key)}
                className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                  activeTab === key
                    ? "border-indigo-600 text-indigo-600"
                    : "border-transparent text-neutral-500 hover:text-neutral-800"
                }`}
              >
                <Icon className="w-4 h-4" />
                {label}
              </button>
            ))}
          </div>

          {/* ── POSTS TAB ───────────────────────────────────────────── */}
          {activeTab === "posts" && (
            <div className="space-y-3">
              {/* Filter row */}
              <div className="flex gap-2 flex-wrap">
                {[
                  { value: "all", label: "All" },
                  { value: "pending_approval", label: "Pending" },
                  { value: "scheduled", label: "Scheduled" },
                  { value: "published", label: "Published" },
                  { value: "failed", label: "Failed" },
                ].map(({ value, label }) => (
                  <button
                    key={value}
                    onClick={() => setPostFilter(value)}
                    className={`px-3 py-1 rounded-full text-xs font-semibold transition-colors ${
                      postFilter === value
                        ? "bg-indigo-600 text-white"
                        : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>

              {filteredPosts.length === 0 ? (
                <div className="bg-white rounded-2xl border border-neutral-200 p-10 text-center text-sm text-neutral-400">
                  No posts in this filter.
                </div>
              ) : (
                <div className="bg-white rounded-2xl border border-neutral-200 shadow-sm overflow-hidden">
                  <div className="divide-y divide-neutral-100">
                    {filteredPosts.map((post) => (
                      <div key={post.id} className="flex items-center gap-3 px-4 py-3 hover:bg-neutral-50 transition-colors">
                        {/* Thumbnail */}
                        <div className="w-10 h-10 rounded-lg bg-neutral-100 flex-shrink-0 overflow-hidden">
                          {post.image_url ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={post.image_url} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <FileText className="w-4 h-4 text-neutral-400" />
                            </div>
                          )}
                        </div>

                        {/* Caption */}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-neutral-800 truncate">
                            {post.content?.slice(0, 100) ?? "No content"}
                          </p>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {(post.platforms ?? []).map((p) => (
                              <span
                                key={p}
                                className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${PLATFORM_COLORS[p] ?? "bg-neutral-100 text-neutral-600"}`}
                              >
                                {p}
                              </span>
                            ))}
                          </div>
                        </div>

                        {/* Status + date */}
                        <div className="flex-shrink-0 flex flex-col items-end gap-1">
                          <Badge
                            label={post.status.replace("_", " ")}
                            className={POST_STATUS_BADGE[post.status] ?? "bg-neutral-100 text-neutral-600"}
                          />
                          <span className="text-xs text-neutral-400">{formatDate(post.published_at ?? post.created_at)}</span>
                        </div>

                        {/* Actions */}
                        <div className="flex-shrink-0 flex items-center gap-2">
                          {post.status === "pending_approval" && (
                            <button
                              onClick={() => approvePost(post.id)}
                              disabled={actionLoading === `approve-${post.id}`}
                              className="text-xs font-semibold bg-green-100 text-green-700 hover:bg-green-200 px-3 py-1.5 rounded-lg disabled:opacity-60 transition-colors flex items-center gap-1"
                            >
                              <CheckCircle className="w-3.5 h-3.5" />
                              {actionLoading === `approve-${post.id}` ? "…" : "Approve"}
                            </button>
                          )}
                          <button
                            onClick={() => setDrawerPost(post)}
                            className="text-xs font-medium text-indigo-600 hover:underline"
                          >
                            View
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── PRESENTATIONS TAB ───────────────────────────────────── */}
          {activeTab === "presentations" && (
            <div>
              {presentations.length === 0 ? (
                <div className="bg-white rounded-2xl border border-neutral-200 p-10 text-center text-sm text-neutral-400">
                  No presentations yet.
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-4">
                  {presentations.map((pres) => (
                    <div key={pres.id} className="bg-white rounded-2xl border border-neutral-200 shadow-sm p-5 space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-sm font-semibold text-neutral-900 leading-snug">
                          {pres.title ?? "Untitled"}
                        </p>
                        <Badge
                          label={pres.status ?? "draft"}
                          className={POST_STATUS_BADGE[pres.status ?? "draft"] ?? "bg-neutral-100 text-neutral-600"}
                        />
                      </div>
                      <p className="text-xs text-neutral-400">
                        {pres.slide_count != null ? `${pres.slide_count} slides · ` : ""}{formatDate(pres.created_at)}
                      </p>
                      <Link
                        href={`/dashboard/presentations/${pres.id}`}
                        target="_blank"
                        className="inline-flex items-center gap-1 text-xs font-medium text-indigo-600 hover:underline"
                      >
                        View →
                        <ExternalLink className="w-3 h-3" />
                      </Link>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── VIDEOS TAB ──────────────────────────────────────────── */}
          {activeTab === "videos" && (
            <div>
              {videos.length === 0 ? (
                <div className="bg-white rounded-2xl border border-neutral-200 p-10 text-center text-sm text-neutral-400">
                  No videos yet.
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-4">
                  {videos.map((video) => (
                    <div key={video.id} className="bg-white rounded-2xl border border-neutral-200 shadow-sm overflow-hidden">
                      <div className="w-full h-36 bg-neutral-100 flex items-center justify-center relative">
                        {video.thumbnail_url ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={video.thumbnail_url} alt={video.title ?? ""} className="w-full h-full object-cover" />
                        ) : (
                          <Film className="w-8 h-8 text-neutral-300" />
                        )}
                      </div>
                      <div className="p-4 space-y-2">
                        <p className="text-sm font-semibold text-neutral-900 truncate">{video.title ?? "Untitled"}</p>
                        <div className="flex items-center justify-between">
                          <Badge
                            label={video.status}
                            className={POST_STATUS_BADGE[video.status] ?? "bg-neutral-100 text-neutral-600"}
                          />
                          <span className="text-xs text-neutral-400">{formatDate(video.created_at)}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── ACTIVITY TAB ────────────────────────────────────────── */}
          {activeTab === "activity" && (
            <div className="bg-white rounded-2xl border border-neutral-200 shadow-sm p-6">
              {activities.length === 0 ? (
                <p className="text-sm text-neutral-400 text-center py-4">No activity yet.</p>
              ) : (
                <div className="relative">
                  {/* Vertical line */}
                  <div className="absolute left-3 top-3 bottom-3 w-0.5 bg-neutral-100" />
                  <ul className="space-y-5">
                    {activities.map((act) => {
                      const dotColor = ACTIVITY_COLORS[act.type ?? "system"] ?? "bg-neutral-400";
                      return (
                        <li key={act.id} className="flex items-start gap-4 relative">
                          <div className={`w-6 h-6 rounded-full ${dotColor} flex-shrink-0 flex items-center justify-center z-10`}>
                            <span className="w-2 h-2 rounded-full bg-white block" />
                          </div>
                          <div className="flex-1 min-w-0 pt-0.5">
                            <p className="text-sm font-medium text-neutral-900">{act.title ?? "Activity"}</p>
                            {act.description && (
                              <p className="text-xs text-neutral-500 mt-0.5">{act.description}</p>
                            )}
                            <p className="text-xs text-neutral-400 mt-1">{formatDate(act.created_at)}</p>
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              )}
            </div>
          )}

          {/* ── BRAND PROFILE TAB ───────────────────────────────────── */}
          {activeTab === "brand" && (
            <div className="bg-white rounded-2xl border border-neutral-200 shadow-sm p-6 space-y-6">
              {/* Brand Colors */}
              {!!(Array.isArray(metadata.brand_colors) && (metadata.brand_colors as string[]).length > 0) && (
                <div>
                  <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wide mb-2">Brand Colors</p>
                  <div className="flex gap-2 flex-wrap">
                    {(metadata.brand_colors as string[]).map((color: string) => (
                      <div key={color} className="flex items-center gap-2">
                        <div
                          className="w-8 h-8 rounded-lg border border-neutral-200 shadow-sm"
                          style={{ backgroundColor: color }}
                        />
                        <span className="text-xs font-mono text-neutral-600">{color}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Brand Voice */}
              {!!metadata.brand_voice ? (
                <div>
                  <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wide mb-2">Brand Voice</p>
                  <p className="text-sm text-neutral-800">{String(metadata.brand_voice)}</p>
                </div>
              ) : null}

              {/* Industry / Website / Phone */}
              <div className="grid grid-cols-3 gap-4">
                {[
                  { label: "Industry", value: metadata.industry as string },
                  { label: "Website", value: metadata.website as string },
                  { label: "Phone", value: metadata.phone as string },
                ].map(({ label, value }) => value ? (
                  <div key={label}>
                    <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wide mb-1">{label}</p>
                    <p className="text-sm text-neutral-800">{value}</p>
                  </div>
                ) : null)}
              </div>

              {/* Target Audience */}
              {metadata.target_audience && (
                <div>
                  <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wide mb-2">Target Audience</p>
                  <p className="text-sm text-neutral-800">{String(metadata.target_audience)}</p>
                </div>
              )}

              {/* Ayrshare */}
              <div>
                <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wide mb-2">Ayrshare Status</p>
                {client.ayrshare_profile_key ? (
                  <div className="space-y-2">
                    <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-green-700 bg-green-50 border border-green-200 px-3 py-1 rounded-full">
                      <span className="w-2 h-2 rounded-full bg-green-500 block" />
                      Connected
                    </span>
                    {connectedPlatforms.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-2">
                        {connectedPlatforms.map((p) => (
                          <span key={p} className={`text-xs font-medium px-2.5 py-1 rounded-full capitalize ${PLATFORM_COLORS[p] ?? "bg-neutral-100 text-neutral-600"}`}>
                            {p}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-red-700 bg-red-50 border border-red-200 px-3 py-1 rounded-full">
                    <XCircle className="w-3.5 h-3.5" />
                    Not connected
                  </span>
                )}
              </div>

              {/* Misc metadata */}
              {Object.keys(metadata).filter(k => !["brand_colors","brand_voice","industry","website","phone","target_audience","admin_notes"].includes(k)).length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wide mb-2">Other Metadata</p>
                  <pre className="text-xs text-neutral-600 bg-neutral-50 rounded-xl p-4 overflow-x-auto border border-neutral-100">
                    {JSON.stringify(
                      Object.fromEntries(
                        Object.entries(metadata).filter(([k]) => !["brand_colors","brand_voice","industry","website","phone","target_audience","admin_notes"].includes(k))
                      ),
                      null, 2
                    )}
                  </pre>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
