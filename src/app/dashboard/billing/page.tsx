import { Check, Download, CreditCard } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { BillingPortalButton } from "@/components/dashboard/BillingPortalButton";
import { resolveClientPlan, PLAN_SELECT } from "@/lib/plan";
import { PUBLIC_PLAN } from "@/lib/stripe";

function formatDate(dateStr: string | null): string {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function statusBadgeClass(status: string | null): string {
  switch (status) {
    case "active": return "bg-green-50 text-green-700 border border-green-200";
    case "trialing": return "bg-blue-50 text-blue-700 border border-blue-200";
    case "past_due": return "bg-red-50 text-red-700 border border-red-200";
    case "canceled": return "bg-neutral-100 text-neutral-500 border border-neutral-200";
    default: return "bg-neutral-100 text-neutral-500 border border-neutral-200";
  }
}

function statusDotClass(status: string | null): string {
  switch (status) {
    case "active": return "bg-green-500";
    case "trialing": return "bg-blue-500";
    case "past_due": return "bg-red-500";
    default: return "bg-neutral-400";
  }
}

function statusLabel(status: string | null): string {
  switch (status) {
    case "active": return "Active";
    case "trialing": return "Trial";
    case "past_due": return "Past Due";
    case "canceled": return "Canceled";
    default: return status ?? "Unknown";
  }
}

export default async function BillingPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  // Billing state lives on the `clients` row (written by the Stripe webhook +
  // provisioning) — the single source of truth.
  const { data: client } = await supabase
    .from("clients")
    .select(`id, subscription_status, trial_end, ${PLAN_SELECT}`)
    .eq("user_id", user?.id ?? "")
    .single();

  const plan = (client ? resolveClientPlan(client) : null) ?? PUBLIC_PLAN;
  const planName = plan.name;
  const planAmount = plan.price;
  const planInterval = "month";
  const subStatus = (client?.subscription_status as string | null) ?? null;
  // We don't store the next billing date locally; trial end is the closest signal.
  const trialEnd = client?.trial_end as string | null;
  const nextBillingDate = formatDate(trialEnd ?? null);
  const deliverables = plan.features;

  return (
    <div className="max-w-2xl flex flex-col gap-6 sm:gap-8">
      <h2 className="text-2xl font-bold text-neutral-900">Billing</h2>

      {/* Current Plan */}
      <div className="bg-white rounded-2xl border border-neutral-200 shadow-sm p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold text-primary-600 uppercase tracking-wide mb-1">Current Plan</p>
            <h3 className="text-xl font-bold text-neutral-900">{planName}</h3>
            <p className="text-3xl font-extrabold text-neutral-900 mt-2">
              ${planAmount}
              <span className="text-base font-medium text-neutral-400">/{planInterval}</span>
            </p>
          </div>
          {subStatus && (
            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${statusBadgeClass(subStatus)}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${statusDotClass(subStatus)}`} />
              {statusLabel(subStatus)}
            </span>
          )}
          {!subStatus && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-neutral-100 text-neutral-500 border border-neutral-200">
              No subscription
            </span>
          )}
        </div>

        <div className="mt-4 pt-4 border-t border-neutral-100 flex items-center justify-between">
          <p className="text-sm text-neutral-500">
            {subStatus === "trialing" && trialEnd
              ? <>Trial ends: <span className="font-semibold text-neutral-700">{nextBillingDate}</span></>
              : subStatus === "active"
              ? <span className="text-neutral-500">Renews monthly · manage in the billing portal</span>
              : <span className="text-neutral-400">No active billing period</span>
            }
          </p>
          <BillingPortalButton />
        </div>
      </div>

      {/* What's included */}
      <div className="bg-white rounded-2xl border border-neutral-200 shadow-sm p-4 sm:p-6">
        <h3 className="text-base font-semibold text-neutral-900 mb-4">What&apos;s Included</h3>
        <ul className="flex flex-col gap-3">
          {deliverables.map((item) => (
            <li key={item} className="flex items-start gap-3 text-sm text-neutral-700">
              <span className="w-5 h-5 rounded-full bg-primary-50 flex items-center justify-center flex-shrink-0 mt-0.5">
                <Check className="w-3 h-3 text-primary-600" strokeWidth={3} />
              </span>
              {item}
            </li>
          ))}
        </ul>
      </div>

      {/* Payment Method */}
      <div className="bg-white rounded-2xl border border-neutral-200 shadow-sm p-6">
        <h3 className="text-base font-semibold text-neutral-900 mb-4">Payment Method</h3>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-7 rounded bg-neutral-100 border border-neutral-200 flex items-center justify-center">
              <CreditCard className="w-4 h-4 text-neutral-500" />
            </div>
            <div>
              <p className="text-sm font-medium text-neutral-800">Managed securely via Stripe</p>
              <p className="text-xs text-neutral-400">Update your card in the billing portal</p>
            </div>
          </div>
          <BillingPortalButton label="Update" />
        </div>
      </div>

      {/* Invoice History — invoices live in Stripe; link out rather than show stale copies */}
      <div className="bg-white rounded-2xl border border-neutral-200 shadow-sm p-4 sm:p-6">
        <h3 className="text-base font-semibold text-neutral-900 mb-2">Invoice History</h3>
        <p className="text-sm text-neutral-500 mb-4">
          Your full invoice and payment history is available in the Stripe billing portal.
        </p>
        <div className="flex items-center gap-2 text-sm text-neutral-400">
          <Download className="w-4 h-4" />
          <BillingPortalButton label="View invoices in billing portal" />
        </div>
      </div>
    </div>
  );
}
