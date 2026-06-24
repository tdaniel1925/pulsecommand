import Link from "next/link";
import { ExternalLink } from "lucide-react";
import { createAdminClient } from "@/lib/supabase/admin";

// ── Types ──────────────────────────────────────────────────────────────────────

type Client = {
  id: string;
  business_name: string | null;
  email: string | null;
  status: string | null;
  created_at: string | null;
};

type StripeSubscription = {
  id: string;
  status: string;
  start_date: number | null;
  customer: string;
  items: {
    data: Array<{
      price?: { unit_amount: number | null; nickname: string | null } | null;
    }>;
  };
};

type StripeData = {
  activeSubscriptions: StripeSubscription[];
  pastDueSubscriptions: StripeSubscription[];
  mrr: number;
} | null;

// ── Helpers ────────────────────────────────────────────────────────────────────

function formatDate(dateStr: string | null | number): string {
  if (dateStr == null) return "—";
  const d =
    typeof dateStr === "number"
      ? new Date(dateStr * 1000)
      : new Date(dateStr);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function formatMrr(cents: number): string {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(
    cents
  ) + "/mo";
}

function clientStatusBadge(status: string | null) {
  const s = status ?? "unknown";
  const map: Record<string, string> = {
    active: "bg-green-50 text-green-700 border border-green-200",
    pending: "bg-blue-50 text-blue-700 border border-blue-200",
    onboarding: "bg-blue-50 text-blue-700 border border-blue-200",
    churned: "bg-red-50 text-red-700 border border-red-200",
    inactive: "bg-neutral-100 text-neutral-500 border border-neutral-200",
  };
  const cls = map[s] ?? "bg-neutral-100 text-neutral-500 border border-neutral-200";
  return (
    <span className={`inline-flex items-center text-xs font-medium px-2 py-1 rounded-full ${cls}`}>
      {s.charAt(0).toUpperCase() + s.slice(1)}
    </span>
  );
}

function stripeStatusBadge(status: string) {
  const map: Record<string, string> = {
    active: "bg-green-50 text-green-700 border border-green-200",
    past_due: "bg-amber-50 text-amber-700 border border-amber-200",
    canceled: "bg-red-50 text-red-700 border border-red-200",
  };
  const cls = map[status] ?? "bg-neutral-100 text-neutral-500 border border-neutral-200";
  const label = status.replace("_", " ").replace(/\b\w/g, (c) => c.toUpperCase());
  return (
    <span className={`inline-flex items-center text-xs font-medium px-2 py-1 rounded-full ${cls}`}>
      {label}
    </span>
  );
}

// ── Data fetching ──────────────────────────────────────────────────────────────

async function fetchSupabaseClients(): Promise<{ active: Client[]; all: Client[] }> {
  const supabase = createAdminClient();

  const [{ data: active }, { data: all }] = await Promise.all([
    supabase
      .from("clients")
      .select("id, business_name, email, status, created_at")
      .eq("status", "active"),
    supabase
      .from("clients")
      .select("id, business_name, email, status, created_at")
      .order("created_at", { ascending: false }),
  ]);

  return { active: active ?? [], all: all ?? [] };
}

async function fetchStripeData(): Promise<{ data: StripeData; error: boolean }> {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) return { data: null, error: false };

  try {
    const Stripe = (await import("stripe")).default;
    const stripe = new Stripe(key, { apiVersion: "2026-04-22.dahlia" });

    const [activeSubs, pastDueSubs] = await Promise.all([
      stripe.subscriptions.list({ limit: 100, status: "active" }),
      stripe.subscriptions.list({ limit: 20, status: "past_due" }),
    ]);

    const mrr = activeSubs.data.reduce((sum, sub) => {
      return sum + (sub.items.data[0]?.price?.unit_amount ?? 0) / 100;
    }, 0);

    return {
      data: {
        activeSubscriptions: activeSubs.data as unknown as StripeSubscription[],
        pastDueSubscriptions: pastDueSubs.data as unknown as StripeSubscription[],
        mrr,
      },
      error: false,
    };
  } catch {
    return { data: null, error: true };
  }
}

// ── Page ───────────────────────────────────────────────────────────────────────

export default async function BillingPage() {
  const [{ active: activeClients, all: allClients }, { data: stripeData, error: stripeError }] =
    await Promise.all([fetchSupabaseClients(), fetchStripeData()]);

  const stripeKeySet = !!process.env.STRIPE_SECRET_KEY;
  const stripeConnected = stripeKeySet && !stripeError && stripeData !== null;

  // Counts
  const churnedCount = allClients.filter(
    (c) => c.status === "churned" || c.status === "inactive"
  ).length;
  const pendingCount = allClients.filter(
    (c) => c.status === "pending" || c.status === "onboarding"
  ).length;

  const activeSubscriberCount = stripeConnected
    ? stripeData!.activeSubscriptions.length
    : activeClients.length;

  const pastDueCount = stripeConnected ? stripeData!.pastDueSubscriptions.length : null;

  const recentSignups = allClients.slice(0, 10);

  // All subs for the table (active + past_due combined, up to 20)
  const allStripeSubs = stripeConnected
    ? [
        ...stripeData!.activeSubscriptions,
        ...stripeData!.pastDueSubscriptions,
      ].slice(0, 20)
    : [];

  const currentDate = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  return (
    <div className="space-y-6">
      {/* 1. HEADER */}
      <div>
        <h1 className="text-2xl font-bold text-neutral-900">Billing &amp; Revenue</h1>
        <p className="text-sm text-neutral-500 mt-1">{currentDate}</p>
      </div>

      {/* 2. REVENUE STATS ROW */}
      <div className="grid grid-cols-4 gap-4">
        {/* MRR */}
        <div className="bg-white rounded-2xl border border-neutral-200 shadow-sm p-5">
          <p className="text-sm text-neutral-500">MRR</p>
          <p className="text-3xl font-bold text-neutral-900 mt-1">
            {stripeConnected ? formatMrr(stripeData!.mrr) : "—"}
          </p>
        </div>

        {/* Active Subscribers */}
        <div className="bg-white rounded-2xl border border-neutral-200 shadow-sm p-5">
          <p className="text-sm text-neutral-500">Active Subscribers</p>
          <p className="text-3xl font-bold text-neutral-900 mt-1">{activeSubscriberCount}</p>
          {!stripeConnected && (
            <p className="text-xs text-neutral-400 mt-1">from Supabase</p>
          )}
        </div>

        {/* Past Due */}
        <div className="bg-white rounded-2xl border border-neutral-200 shadow-sm p-5">
          <p className="text-sm text-neutral-500">Past Due</p>
          <p
            className={`text-3xl font-bold mt-1 ${
              pastDueCount && pastDueCount > 0 ? "text-amber-600" : "text-neutral-900"
            }`}
          >
            {pastDueCount !== null ? pastDueCount : "—"}
          </p>
        </div>

        {/* Churned / Inactive */}
        <div className="bg-white rounded-2xl border border-neutral-200 shadow-sm p-5">
          <p className="text-sm text-neutral-500">Churned / Inactive</p>
          <p className="text-3xl font-bold text-neutral-900 mt-1">{churnedCount}</p>
        </div>
      </div>

      {/* 3. STRIPE STATUS BANNER */}
      {!stripeKeySet && (
        <div className="flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-2xl px-5 py-4 text-sm text-amber-800">
          ⚠️ Stripe not connected — add{" "}
          <code className="font-mono font-semibold">STRIPE_SECRET_KEY</code> to environment
          variables to see revenue data
        </div>
      )}
      {stripeKeySet && stripeConnected && (
        <div className="flex items-center gap-2 bg-green-50 border border-green-200 rounded-2xl px-5 py-4 text-sm text-green-800">
          ✅ Stripe connected
        </div>
      )}
      {stripeKeySet && stripeError && (
        <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-2xl px-5 py-4 text-sm text-red-800">
          ❌ Stripe error — check API key
        </div>
      )}

      {/* 4. SUBSCRIPTIONS / CLIENT TABLE */}
      <div className="bg-white rounded-2xl border border-neutral-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-neutral-100">
          <h2 className="font-semibold text-neutral-900">
            {stripeConnected ? "Active Subscriptions" : "All Clients"}
          </h2>
        </div>
        <div className="overflow-x-auto">
          {stripeConnected ? (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-neutral-100 bg-neutral-50">
                  <th className="text-left font-medium text-neutral-500 px-6 py-3">Customer Email</th>
                  <th className="text-left font-medium text-neutral-500 px-4 py-3">Plan</th>
                  <th className="text-left font-medium text-neutral-500 px-4 py-3">Amount</th>
                  <th className="text-left font-medium text-neutral-500 px-4 py-3">Status</th>
                  <th className="text-left font-medium text-neutral-500 px-4 py-3">Started</th>
                  <th className="text-left font-medium text-neutral-500 px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {allStripeSubs.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-sm text-neutral-400">
                      No subscriptions found.
                    </td>
                  </tr>
                ) : (
                  allStripeSubs.map((sub, i) => {
                    const price = sub.items.data[0]?.price;
                    const amount =
                      price?.unit_amount != null
                        ? `$${(price.unit_amount / 100).toFixed(2)}/mo`
                        : "—";
                    const plan = price?.nickname ?? "—";
                    return (
                      <tr
                        key={sub.id}
                        className={`border-b border-neutral-100 hover:bg-neutral-50 transition-colors ${
                          i === allStripeSubs.length - 1 ? "border-0" : ""
                        }`}
                      >
                        <td className="px-6 py-4 text-neutral-700">{sub.customer}</td>
                        <td className="px-4 py-4 text-neutral-600">{plan}</td>
                        <td className="px-4 py-4 font-medium text-neutral-900">{amount}</td>
                        <td className="px-4 py-4">{stripeStatusBadge(sub.status)}</td>
                        <td className="px-4 py-4 text-neutral-500">
                          {formatDate(sub.start_date)}
                        </td>
                        <td className="px-4 py-4">
                          <a
                            href={`https://dashboard.stripe.com/customers/${sub.customer}`}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 text-primary-600 hover:text-primary-700 text-xs font-medium"
                          >
                            View in Stripe <ExternalLink className="w-3 h-3" />
                          </a>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-neutral-100 bg-neutral-50">
                  <th className="text-left font-medium text-neutral-500 px-6 py-3">Business Name</th>
                  <th className="text-left font-medium text-neutral-500 px-4 py-3">Email</th>
                  <th className="text-left font-medium text-neutral-500 px-4 py-3">Status</th>
                  <th className="text-left font-medium text-neutral-500 px-4 py-3">Joined</th>
                </tr>
              </thead>
              <tbody>
                {allClients.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-12 text-center text-sm text-neutral-400">
                      No clients found.
                    </td>
                  </tr>
                ) : (
                  allClients.map((client, i) => (
                    <tr
                      key={client.id}
                      className={`border-b border-neutral-100 hover:bg-neutral-50 transition-colors ${
                        i === allClients.length - 1 ? "border-0" : ""
                      }`}
                    >
                      <td className="px-6 py-4 font-medium text-neutral-900">
                        {client.business_name ?? "—"}
                      </td>
                      <td className="px-4 py-4 text-neutral-600">{client.email ?? "—"}</td>
                      <td className="px-4 py-4">{clientStatusBadge(client.status)}</td>
                      <td className="px-4 py-4 text-neutral-500">{formatDate(client.created_at)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* 5. CLIENTS BY STATUS */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl border border-green-200 shadow-sm p-5">
          <p className="text-sm text-neutral-500">Active Clients</p>
          <p className="text-3xl font-bold text-green-700 mt-1">{activeClients.length}</p>
        </div>
        <div className="bg-white rounded-2xl border border-blue-200 shadow-sm p-5">
          <p className="text-sm text-neutral-500">Pending / Onboarding</p>
          <p className="text-3xl font-bold text-blue-700 mt-1">{pendingCount}</p>
        </div>
        <div className="bg-white rounded-2xl border border-red-200 shadow-sm p-5">
          <p className="text-sm text-neutral-500">Churned / Inactive</p>
          <p className="text-3xl font-bold text-red-700 mt-1">{churnedCount}</p>
        </div>
      </div>

      {/* 6. RECENT SIGNUPS */}
      <div className="bg-white rounded-2xl border border-neutral-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-neutral-100">
          <h2 className="font-semibold text-neutral-900">Recent Signups</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-neutral-100 bg-neutral-50">
                <th className="text-left font-medium text-neutral-500 px-6 py-3">Business Name</th>
                <th className="text-left font-medium text-neutral-500 px-4 py-3">Email</th>
                <th className="text-left font-medium text-neutral-500 px-4 py-3">Status</th>
                <th className="text-left font-medium text-neutral-500 px-4 py-3">Joined</th>
              </tr>
            </thead>
            <tbody>
              {recentSignups.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-sm text-neutral-400">
                    No clients yet.
                  </td>
                </tr>
              ) : (
                recentSignups.map((client, i) => (
                  <tr
                    key={client.id}
                    className={`border-b border-neutral-100 hover:bg-neutral-50 transition-colors ${
                      i === recentSignups.length - 1 ? "border-0" : ""
                    }`}
                  >
                    <td className="px-6 py-4 font-medium text-neutral-900">
                      <Link
                        href={`/admin/clients/${client.id}`}
                        className="hover:text-primary-600 transition-colors"
                      >
                        {client.business_name ?? "—"}
                      </Link>
                    </td>
                    <td className="px-4 py-4 text-neutral-600">{client.email ?? "—"}</td>
                    <td className="px-4 py-4">{clientStatusBadge(client.status)}</td>
                    <td className="px-4 py-4 text-neutral-500">{formatDate(client.created_at)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
