"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Plus, Search } from "lucide-react";
import { AddClientModal } from "@/components/admin/AddClientModal";

const statusConfig: Record<string, { label: string; className: string }> = {
  lead: { label: "Lead", className: "bg-neutral-100 text-neutral-600" },
  onboarding: { label: "Onboarding", className: "bg-amber-100 text-amber-700" },
  active: { label: "Active", className: "bg-green-100 text-green-700" },
  paused: { label: "Paused", className: "bg-orange-100 text-orange-700" },
  churned: { label: "Churned", className: "bg-red-100 text-red-700" },
};

const tabs = ["All", "Lead", "Onboarding", "Active", "Paused", "Churned"];

type Client = {
  id: string;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  business_name: string | null;
  status: string | null;
  onboarding_step: string | null;
  subscription_status: string | null;
  assigned_to: string | null;
  created_at: string | null;
};

export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [activeTab, setActiveTab] = useState("All");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  function fetchClients() {
    return fetch("/api/clients")
      .then((r) => r.json())
      .then((data) => {
        setClients(Array.isArray(data) ? data : data.clients ?? []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }

  function loadClients() {
    setLoading(true);
    fetchClients();
  }

  useEffect(() => { fetchClients(); }, []);

  const filtered = clients.filter((c) => {
    const matchesTab = activeTab === "All" || c.status === activeTab.toLowerCase();
    const q = search.toLowerCase();
    const matchesSearch = !q ||
      `${c.first_name ?? ""} ${c.last_name ?? ""}`.toLowerCase().includes(q) ||
      (c.email ?? "").toLowerCase().includes(q) ||
      (c.business_name ?? "").toLowerCase().includes(q);
    return matchesTab && matchesSearch;
  });

  function getCount(tab: string) {
    if (tab === "All") return clients.length;
    return clients.filter((c) => c.status === tab.toLowerCase()).length;
  }

  return (
    <div className="space-y-6">
      {showModal && (
        <AddClientModal
          onClose={() => { setShowModal(false); loadClients(); }}
        />
      )}

      {/* Top bar */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-neutral-900">Clients</h1>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
            <input
              type="text"
              placeholder="Search clients…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 pr-4 py-2 text-sm border border-neutral-200 rounded-xl bg-white text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-primary-600 w-60"
            />
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white text-sm font-medium rounded-xl hover:bg-primary-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add Client
          </button>
        </div>
      </div>

      {/* Filter tabs */}
      <div className="flex items-center gap-1">
        {tabs.map((tab) => {
          const count = getCount(tab);
          const isActive = activeTab === tab;
          return (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                isActive ? "bg-primary-600 text-white" : "text-neutral-600 hover:bg-neutral-100"
              }`}
            >
              {tab}
              {count > 0 && (
                <span className={`text-xs px-1.5 py-0.5 rounded-full leading-none ${isActive ? "bg-white/20 text-white" : "bg-neutral-200 text-neutral-600"}`}>
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-neutral-200 shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-neutral-100 bg-neutral-50">
              <th className="text-left px-6 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wide">Name / Email</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wide">Business</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wide">Status</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wide">Onboarding Step</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wide">Subscription</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wide">Assigned To</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wide">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100">
            {loading ? (
              <tr>
                <td colSpan={7} className="px-6 py-12 text-center text-sm text-neutral-400">Loading…</td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-6 py-12 text-center text-sm text-neutral-400">
                  {search ? `No clients matching "${search}"` : "No clients yet. Click Add Client to get started."}
                </td>
              </tr>
            ) : (
              filtered.map((client) => {
                const statusKey = client.status ?? "lead";
                const status = statusConfig[statusKey] ?? { label: statusKey, className: "bg-neutral-100 text-neutral-600" };
                const subStatus = client.subscription_status as string | null;
                return (
                  <tr key={client.id} className="hover:bg-neutral-50 transition-colors">
                    <td className="px-6 py-4">
                      <p className="font-semibold text-neutral-900">{client.first_name ?? ""} {client.last_name ?? ""}</p>
                      <p className="text-xs text-neutral-500 mt-0.5">{client.email ?? "—"}</p>
                    </td>
                    <td className="px-4 py-4 text-neutral-700">{client.business_name ?? "—"}</td>
                    <td className="px-4 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${status.className}`}>
                        {status.label}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-neutral-500 text-xs">{(client.onboarding_step ?? "—").replace(/_/g, " ")}</td>
                    <td className="px-4 py-4">
                      {!subStatus ? (
                        <span className="text-neutral-400">—</span>
                      ) : (
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${subStatus === "active" ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"}`}>
                          {subStatus.charAt(0).toUpperCase() + subStatus.slice(1)}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-4 text-neutral-600 text-xs">{client.assigned_to ?? "Unassigned"}</td>
                    <td className="px-4 py-4">
                      <Link href={`/admin/clients/${client.id}`} className="text-primary-600 font-medium hover:underline text-xs">
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
  );
}
