import { Globe, ExternalLink, Loader2, CheckCircle, FileEdit, Users, TrendingUp } from "lucide-react";
import { createClient } from "@/lib/supabase/server";

type PageStatus = "live" | "draft" | "deploying";

const statusConfig: Record<string, { label: string; className: string; icon: React.ReactNode }> = {
  live: { label: "Live", className: "bg-green-50 text-green-700 border border-green-200", icon: <CheckCircle className="w-3 h-3" /> },
  deploying: { label: "Deploying", className: "bg-yellow-50 text-yellow-700 border border-yellow-200", icon: <Loader2 className="w-3 h-3 animate-spin" /> },
  draft: { label: "Draft", className: "bg-neutral-100 text-neutral-500 border border-neutral-200", icon: <FileEdit className="w-3 h-3" /> },
};

export default async function PagesPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { data: client } = await supabase
    .from("clients")
    .select("id")
    .eq("user_id", user?.id ?? "")
    .single();

  const { data: pages } = await supabase
    .from("landing_pages")
    .select("id, title, slug, url, status, visits, leads, conversion_rate, created_at")
    .eq("client_id", client?.id ?? "")
    .order("created_at", { ascending: false });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-neutral-900">Landing Pages</h1>
        <p className="text-sm text-neutral-500 mt-1">AI-built landing pages deployed via Vercel.</p>
      </div>

      {/* Pages grid */}
      {pages && pages.length > 0 ? (
        <div className="grid grid-cols-2 gap-4">
          {pages.map((page) => {
            const status = (page.status ?? "draft") as PageStatus;
            const cfg = statusConfig[status] ?? statusConfig.draft;
            const visits = page.visits ?? 0;
            const leads = page.leads ?? 0;
            const cvr = page.conversion_rate != null
              ? `${Number(page.conversion_rate).toFixed(1)}%`
              : "—";
            return (
              <div key={page.id} className="bg-white rounded-2xl border border-neutral-200 shadow-sm p-5 space-y-4">
                {/* Title + status */}
                <div className="flex items-start justify-between gap-3">
                  <div className="w-10 h-10 rounded-xl bg-primary-50 flex items-center justify-center flex-shrink-0">
                    <Globe className="w-5 h-5 text-primary-600" />
                  </div>
                  <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full ${cfg.className}`}>
                    {cfg.icon}
                    {cfg.label}
                  </span>
                </div>

                <div>
                  <p className="font-semibold text-neutral-900">{page.title}</p>
                  <p className="text-xs text-neutral-400 font-mono mt-0.5">{page.slug ?? "—"}</p>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="bg-neutral-50 rounded-xl p-3">
                    <div className="flex items-center gap-1 text-neutral-400 mb-1">
                      <Users className="w-3 h-3" />
                      <span className="text-xs">Visits</span>
                    </div>
                    <p className="font-bold text-neutral-900 text-sm">{visits.toLocaleString()}</p>
                  </div>
                  <div className="bg-neutral-50 rounded-xl p-3">
                    <div className="flex items-center gap-1 text-neutral-400 mb-1">
                      <CheckCircle className="w-3 h-3" />
                      <span className="text-xs">Leads</span>
                    </div>
                    <p className="font-bold text-neutral-900 text-sm">{leads}</p>
                  </div>
                  <div className="bg-neutral-50 rounded-xl p-3">
                    <div className="flex items-center gap-1 text-neutral-400 mb-1">
                      <TrendingUp className="w-3 h-3" />
                      <span className="text-xs">CVR</span>
                    </div>
                    <p className="font-bold text-neutral-900 text-sm">{cvr}</p>
                  </div>
                </div>

                {/* Actions */}
                {status === "live" && (
                  <a
                    href={page.url ?? "#"}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs font-medium text-primary-600 hover:text-primary-700 border border-primary-200 bg-primary-50 hover:bg-primary-100 px-3 py-1.5 rounded-lg transition-colors"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    Preview Page
                  </a>
                )}
                {status === "deploying" && (
                  <p className="text-xs text-yellow-600">Publishing — refresh in a moment.</p>
                )}
                {status === "draft" && (
                  <button className="inline-flex items-center gap-1.5 text-xs font-medium text-neutral-700 border border-neutral-200 hover:bg-neutral-50 px-3 py-1.5 rounded-lg transition-colors">
                    <FileEdit className="w-3.5 h-3.5" />
                    Edit Draft
                  </button>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-neutral-200 shadow-sm p-12 text-center">
          <Globe className="w-10 h-10 text-neutral-200 mx-auto mb-3" />
          <p className="font-medium text-neutral-700">No landing pages yet</p>
          <p className="text-sm text-neutral-400 mt-1">Create a landing page and it publishes instantly to your own link.</p>
        </div>
      )}

      {/* Note */}
      <div className="bg-neutral-50 border border-neutral-200 rounded-2xl px-5 py-4">
        <p className="text-sm text-neutral-600">
          <span className="font-semibold text-neutral-900">Page allocation:</span> You receive 5 landing pages on signup, then 1 new page per month. You currently have <span className="font-semibold">1 page slot</span> available.
        </p>
      </div>
    </div>
  );
}
