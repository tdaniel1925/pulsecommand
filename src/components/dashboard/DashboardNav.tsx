"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Share2,
  Video,
  Mic,
  BarChart2,
  Kanban,
  Settings,
  CreditCard,
  Upload,
  Sparkles,
  Magnet,
  Mail,
  Globe,
  Layers,
} from "lucide-react";

// The app is focused on two products: SOCIAL POSTING and LANDING PAGES.
// `enabled: false` hides an item from the nav without removing the route, so a
// feature can be revived later by flipping the flag.
// Hidden (out of current product scope — audio/video/newsletter/etc.):
//   Presentations, Videos, Newsletter, Lead Magnets, Reports, Workflow, Audio, Add-ons
const navItems: {
  label: string
  href: string
  icon: typeof LayoutDashboard
  exact?: boolean
  enabled?: boolean
}[] = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard, exact: true },
  { label: "Social Posts", href: "/dashboard/social", icon: Share2 },
  { label: "Landing Pages", href: "/dashboard/pages", icon: Globe },
  { label: "Page Builder", href: "/studio/new", icon: Sparkles },
  { label: "Upload Content", href: "/dashboard/upload", icon: Upload },
  { label: "Settings", href: "/dashboard/settings", icon: Settings },
  { label: "Billing", href: "/dashboard/billing", icon: CreditCard },
  // ── Out of scope (hidden) ───────────────────────────────────────────────
  { label: "Presentations", href: "/dashboard/presentations", icon: Layers, enabled: false },
  { label: "Videos", href: "/dashboard/videos", icon: Video, enabled: false },
  { label: "Newsletter", href: "/dashboard/newsletter", icon: Mail, enabled: false },
  { label: "Lead Magnets", href: "/dashboard/lead-magnet", icon: Magnet, enabled: false },
  { label: "Reports", href: "/dashboard/report", icon: BarChart2, enabled: false },
  { label: "Workflow", href: "/dashboard/workflow", icon: Kanban, enabled: false },
  { label: "Audio", href: "/dashboard/audio", icon: Mic, enabled: false },
  { label: "Add-ons", href: "/dashboard/addons", icon: Sparkles, enabled: false },
];

export default function DashboardNav() {
  const pathname = usePathname();

  const isActive = (href: string, exact?: boolean) => {
    if (exact) return pathname === href;
    return pathname.startsWith(href);
  };

  return (
    <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
      {navItems.filter((item) => item.enabled !== false).map(({ label, href, icon: Icon, exact }) => {
        const active = isActive(href, exact);
        return (
          <Link
            key={href}
            href={href}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
              active
                ? "bg-primary-50 text-primary-700"
                : "text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900"
            }`}
          >
            <Icon className={`w-4 h-4 flex-shrink-0 ${active ? "text-primary-600" : "text-neutral-400"}`} />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
