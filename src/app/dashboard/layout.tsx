import Link from "next/link";
import Image from "next/image";
import { LifeBuoy } from "lucide-react";
import DashboardNav from "@/components/dashboard/DashboardNav";
import { LogoutButton } from "@/components/dashboard/LogoutButton";
import NotificationBell from "@/components/dashboard/NotificationBell";
import MobileMenuToggle from "@/components/dashboard/MobileMenuToggle";
import { createClient } from "@/lib/supabase/server";
import { resolveClientPlan, PLAN_SELECT } from "@/lib/plan";
import { PUBLIC_PLAN, formatPrice } from "@/lib/stripe";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: client } = user
    ? await supabase
        .from("clients")
        .select(`id, first_name, last_name, business_name, ${PLAN_SELECT}`)
        .eq("user_id", user.id)
        .single()
    : { data: null };

  const displayName = client?.business_name ?? (`${client?.first_name ?? ""} ${client?.last_name ?? ""}`.trim() || "My Account");
  const initials = (client?.first_name?.[0] ?? client?.business_name?.[0] ?? "?").toUpperCase();
  const plan = (client ? resolveClientPlan(client) : null) ?? PUBLIC_PLAN;
  const planLabel = `${plan.name} · ${formatPrice(plan.price)}/mo`;

  return (
    <div className="flex h-screen bg-neutral-50 overflow-hidden">
      {/* Sidebar — hidden on mobile, visible on lg+ */}
      <aside className="hidden lg:flex w-64 flex-shrink-0 bg-white border-r border-neutral-200 flex-col h-full">
        {/* Logo */}
        <div className="px-4 py-6 border-b border-neutral-100 flex justify-center">
          <Link href="/dashboard">
            <Image src="/logo.png" alt="BundledContent" width={180} height={60} className="h-14 w-auto" />
          </Link>
        </div>

        {/* Nav */}
        <DashboardNav />

        {/* Support */}
        <div className="px-3 pb-2">
          <a
            href="mailto:support@bundledcontent.com"
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900 transition-colors"
          >
            <LifeBuoy className="w-4 h-4 flex-shrink-0 text-neutral-400" />
            Help &amp; Support
          </a>
        </div>

        {/* Bottom client area */}
        <div className="px-3 py-4 border-t border-neutral-100">
          <div className="flex items-center gap-3 px-3 py-2">
            <div className="w-8 h-8 rounded-full bg-primary-600 flex items-center justify-center flex-shrink-0">
              <span className="text-xs font-bold text-white">{initials}</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-neutral-900 truncate">{displayName}</p>
              <p className="text-xs text-neutral-400 truncate">{planLabel}</p>
            </div>
            <LogoutButton />
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar */}
        <header className="bg-white border-b border-neutral-200 px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3 lg:hidden">
            <MobileMenuToggle planLabel={planLabel} displayName={displayName} />
            <h1 className="text-sm sm:text-base font-semibold text-neutral-900">Dashboard</h1>
          </div>
          <h1 className="hidden lg:block text-base font-semibold text-neutral-900">Client Dashboard</h1>
          {client?.id && <NotificationBell clientId={client.id} />}
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
