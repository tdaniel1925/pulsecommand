"use client";

import { useState, useEffect } from "react";
import { Edit2, Check, X, UserPlus, Loader2 } from "lucide-react";

type Tab = "general" | "integrations" | "notifications" | "team" | "pipeline";

// ─── Integrations ────────────────────────────────────────────────────────────
type Integration = {
  name: string;
  initial: string;
  color: string;
  connected: boolean;
};

const integrations: Integration[] = [
  { name: "Supabase", initial: "S", color: "bg-emerald-500", connected: true },
  { name: "Stripe", initial: "S", color: "bg-primary-600", connected: true },
  { name: "VAPI", initial: "V", color: "bg-violet-500", connected: true },
  { name: "Twilio", initial: "T", color: "bg-red-500", connected: true },
  { name: "OpenAI", initial: "O", color: "bg-neutral-800", connected: true },
  { name: "Predis", initial: "P", color: "bg-pink-500", connected: false },
  { name: "Ayrshare", initial: "A", color: "bg-blue-500", connected: true },
  { name: "AutoContent", initial: "A", color: "bg-cyan-500", connected: true },
  { name: "Headliner", initial: "H", color: "bg-purple-500", connected: false },
  { name: "GitHub", initial: "G", color: "bg-neutral-700", connected: true },
  { name: "Vercel", initial: "V", color: "bg-neutral-900", connected: true },
  { name: "Resend", initial: "R", color: "bg-teal-500", connected: true },
];

// ─── Notifications ───────────────────────────────────────────────────────────
type NotifSetting = { label: string; email: boolean; sms: boolean };

const defaultNotifs: NotifSetting[] = [
  { label: "New client signup", email: true, sms: true },
  { label: "Report generated", email: true, sms: false },
  { label: "Report sent to client", email: true, sms: false },
  { label: "Payment received", email: true, sms: true },
  { label: "Payment failed / past due", email: true, sms: true },
  { label: "Trial ending in 3 days", email: true, sms: false },
  { label: "Content published", email: false, sms: false },
  { label: "Video render complete", email: true, sms: false },
  { label: "System error / alert", email: true, sms: true },
];

// ─── Team ─────────────────────────────────────────────────────────────────────
const teamMembers = [
  { name: "Trent Daniel", email: "trenttdaniel@gmail.com", role: "Super Admin", initials: "TD" },
  { name: "Sarah Mitchell", email: "sarah@bundledcontent.com", role: "Admin", initials: "SM" },
  { name: "James Reeves", email: "james@bundledcontent.com", role: "Support", initials: "JR" },
];

const roleColors: Record<string, string> = {
  "Super Admin": "bg-primary-50 text-primary-700 border border-primary-200",
  Admin: "bg-neutral-100 text-neutral-700 border border-neutral-200",
  Support: "bg-yellow-50 text-yellow-700 border border-yellow-200",
};

// ─── Component ───────────────────────────────────────────────────────────────
export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<Tab>("general");
  const [notifs, setNotifs] = useState<NotifSetting[]>(defaultNotifs);
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  // Pipeline tab state
  const [contentMode, setContentMode] = useState<"auto" | "manual" | null>(null);
  const [modeLoading, setModeLoading] = useState(false);
  const [modeSaving, setModeSaving] = useState(false);

  useEffect(() => {
    if (activeTab === "pipeline" && contentMode === null) {
      void (async () => {
        setModeLoading(true);
        try {
          const r = await fetch("/api/admin/settings/content-mode");
          const d = await r.json();
          setContentMode(d.mode ?? "manual");
        } catch {
          setContentMode("manual");
        } finally {
          setModeLoading(false);
        }
      })();
    }
  }, [activeTab, contentMode]);

  async function toggleMode() {
    if (!contentMode || modeSaving) return;
    const next = contentMode === "auto" ? "manual" : "auto";
    setModeSaving(true);
    try {
      await fetch("/api/admin/settings/content-mode", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode: next }),
      });
      setContentMode(next);
    } finally {
      setModeSaving(false);
    }
  }

  function handleSave() {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  const tabs: { key: Tab; label: string }[] = [
    { key: "general", label: "General" },
    { key: "integrations", label: "Integrations" },
    { key: "notifications", label: "Notifications" },
    { key: "team", label: "Team" },
    { key: "pipeline", label: "Pipeline" },
  ];

  const toggleNotif = (idx: number, field: "email" | "sms") => {
    setNotifs((prev) =>
      prev.map((n, i) => (i === idx ? { ...n, [field]: !n[field] } : n))
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-neutral-900">Settings</h1>
        <p className="text-sm text-neutral-500 mt-1">Configure your BundledContent instance.</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-neutral-100 rounded-xl p-1 w-fit">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setActiveTab(t.key)}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
              activeTab === t.key
                ? "bg-white text-neutral-900 shadow-sm"
                : "text-neutral-500 hover:text-neutral-700"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* ── General ── */}
      {activeTab === "general" && (
        <div className="bg-white rounded-2xl border border-neutral-200 shadow-sm p-6 space-y-5 max-w-xl">
          <h2 className="font-semibold text-neutral-900">General Settings</h2>

          {[
            { label: "App Name", value: "BundledContent", readOnly: false },
            { label: "Support Email", value: "support@bundledcontent.com", readOnly: false },
            { label: "VAPI Phone Number", value: "+1 (555) 800-1234", readOnly: true },
            { label: "Twilio Number", value: "+1 (555) 900-5678", readOnly: true },
          ].map((field) => (
            <div key={field.label}>
              <label className="block text-sm font-medium text-neutral-700 mb-1">{field.label}</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  defaultValue={field.value}
                  readOnly={field.readOnly}
                  className={`flex-1 border border-neutral-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-600 ${
                    field.readOnly ? "bg-neutral-50 text-neutral-500 cursor-not-allowed" : "bg-white text-neutral-900"
                  }`}
                />
              </div>
              {field.readOnly && (
                <p className="text-xs text-neutral-400 mt-1">Read-only — managed by integration.</p>
              )}
            </div>
          ))}

          <div className="flex items-center gap-3">
            <button onClick={handleSave} className="bg-primary-600 hover:bg-primary-700 text-white text-sm font-medium px-5 py-2 rounded-lg transition-colors">
              Save Changes
            </button>
            {saved && <span className="text-sm text-green-600 font-medium">Saved!</span>}
          </div>
        </div>
      )}

      {/* ── Integrations ── */}
      {activeTab === "integrations" && (
        <div>
          <div className="grid grid-cols-3 gap-4">
            {integrations.map((int) => (
              <div key={int.name} className="bg-white rounded-2xl border border-neutral-200 shadow-sm p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-9 h-9 rounded-lg ${int.color} flex items-center justify-center text-white font-bold text-sm`}>
                      {int.initial}
                    </div>
                    <span className="font-medium text-neutral-900 text-sm">{int.name}</span>
                  </div>
                  <span
                    className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${int.connected ? "bg-green-500" : "bg-neutral-300"}`}
                    title={int.connected ? "Connected" : "Not configured"}
                  />
                </div>

                {/* API key field */}
                <div className="flex gap-2">
                  <input
                    type={editingKey === int.name ? "text" : "password"}
                    value={int.connected ? "sk-••••••••••••••••" : ""}
                    placeholder={int.connected ? undefined : "Not configured"}
                    readOnly={editingKey !== int.name}
                    className="flex-1 border border-neutral-200 rounded-lg px-3 py-1.5 text-xs bg-neutral-50 text-neutral-500 focus:outline-none focus:ring-2 focus:ring-primary-600 min-w-0"
                  />
                  {editingKey === int.name ? (
                    <div className="flex gap-1">
                      <button onClick={() => setEditingKey(null)} className="p-1.5 rounded-lg bg-primary-600 text-white hover:bg-primary-700">
                        <Check className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => setEditingKey(null)} className="p-1.5 rounded-lg border border-neutral-200 text-neutral-500 hover:bg-neutral-50">
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : (
                    <button onClick={() => setEditingKey(int.name)} className="p-1.5 rounded-lg border border-neutral-200 text-neutral-500 hover:bg-neutral-50">
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                <p className="text-xs text-neutral-400">{int.connected ? "Connected" : "Not configured"}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Notifications ── */}
      {activeTab === "notifications" && (
        <div className="bg-white rounded-2xl border border-neutral-200 shadow-sm overflow-hidden max-w-2xl">
          <div className="px-6 py-4 border-b border-neutral-100">
            <h2 className="font-semibold text-neutral-900">Notification Preferences</h2>
            <p className="text-sm text-neutral-500 mt-0.5">Choose how you are notified about key events.</p>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-neutral-100 bg-neutral-50">
                <th className="text-left font-medium text-neutral-500 px-6 py-3 w-full">Event</th>
                <th className="font-medium text-neutral-500 px-6 py-3 text-center whitespace-nowrap">Email</th>
                <th className="font-medium text-neutral-500 px-6 py-3 text-center whitespace-nowrap">SMS</th>
              </tr>
            </thead>
            <tbody>
              {notifs.map((n, i) => (
                <tr key={n.label} className={`border-b border-neutral-100 hover:bg-neutral-50 transition-colors ${i === notifs.length - 1 ? "border-0" : ""}`}>
                  <td className="px-6 py-3 text-neutral-700">{n.label}</td>
                  <td className="px-6 py-3 text-center">
                    <button
                      onClick={() => toggleNotif(i, "email")}
                      className={`w-10 h-6 rounded-full transition-colors relative ${n.email ? "bg-primary-600" : "bg-neutral-200"}`}
                    >
                      <span className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${n.email ? "translate-x-5" : "translate-x-1"}`} />
                    </button>
                  </td>
                  <td className="px-6 py-3 text-center">
                    <button
                      onClick={() => toggleNotif(i, "sms")}
                      className={`w-10 h-6 rounded-full transition-colors relative ${n.sms ? "bg-primary-600" : "bg-neutral-200"}`}
                    >
                      <span className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${n.sms ? "translate-x-5" : "translate-x-1"}`} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ── Pipeline ── */}
      {activeTab === "pipeline" && (
        <div className="space-y-4 max-w-xl">
          <div className="bg-white rounded-2xl border border-neutral-200 shadow-sm p-6 space-y-5">
            <div>
              <h2 className="font-semibold text-neutral-900">Content Pipeline Mode</h2>
              <p className="text-sm text-neutral-500 mt-1">
                Controls what happens automatically after a client completes their brand interview call.
              </p>
            </div>

            {modeLoading ? (
              <div className="flex items-center gap-2 text-neutral-400">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span className="text-sm">Loading…</span>
              </div>
            ) : (
              <div className="flex items-center justify-between p-4 bg-neutral-50 rounded-xl border border-neutral-200">
                <div>
                  <p className="font-semibold text-neutral-900 text-sm">
                    {contentMode === "auto" ? "Auto Mode" : "Manual Mode"}
                  </p>
                  <p className="text-xs text-neutral-500 mt-0.5">
                    {contentMode === "auto"
                      ? "Full pipeline fires automatically — social posts, video, and audio are generated and sent to client queue."
                      : "Claude analyzes the transcript and creates a content brief only. Admin reviews and creates content manually."}
                  </p>
                </div>
                <button
                  onClick={toggleMode}
                  disabled={modeSaving}
                  className={`relative w-12 h-6 rounded-full transition-colors flex-shrink-0 ml-4 ${
                    contentMode === "auto" ? "bg-primary-600" : "bg-neutral-300"
                  } disabled:opacity-50`}
                >
                  {modeSaving ? (
                    <Loader2 className="w-3 h-3 animate-spin text-white absolute top-1.5 left-1/2 -translate-x-1/2" />
                  ) : (
                    <span className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${
                      contentMode === "auto" ? "translate-x-7" : "translate-x-1"
                    }`} />
                  )}
                </button>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3 pt-1">
              <div className={`p-4 rounded-xl border-2 transition-colors ${contentMode === "manual" ? "border-primary-600 bg-primary-50" : "border-neutral-100 bg-neutral-50"}`}>
                <p className="font-semibold text-sm text-neutral-900 mb-1">Manual Mode</p>
                <ul className="text-xs text-neutral-600 space-y-1 list-disc list-inside">
                  <li>VAPI call analyzed by Claude</li>
                  <li>Content brief generated (admin-only)</li>
                  <li>Admin creates posts manually</li>
                  <li>No auto Predis/AutoContent calls</li>
                  <li>Client sees 48-hour message</li>
                </ul>
              </div>
              <div className={`p-4 rounded-xl border-2 transition-colors ${contentMode === "auto" ? "border-primary-600 bg-primary-50" : "border-neutral-100 bg-neutral-50"}`}>
                <p className="font-semibold text-sm text-neutral-900 mb-1">Auto Mode</p>
                <ul className="text-xs text-neutral-600 space-y-1 list-disc list-inside">
                  <li>VAPI call analyzed by Claude</li>
                  <li>Social posts auto-generated via Predis</li>
                  <li>Video auto-rendered via AutoContent</li>
                  <li>Audio auto-rendered via AutoContent</li>
                  <li>Content goes to client approval queue</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Team ── */}
      {activeTab === "team" && (
        <div className="space-y-4 max-w-2xl">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-neutral-900">Team Members</h2>
            <button className="flex items-center gap-2 text-sm font-medium bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg transition-colors">
              <UserPlus className="w-4 h-4" />
              Invite Admin
            </button>
          </div>

          <div className="bg-white rounded-2xl border border-neutral-200 shadow-sm overflow-hidden">
            {teamMembers.map((member, i) => (
              <div
                key={member.email}
                className={`flex items-center gap-4 px-6 py-4 ${i < teamMembers.length - 1 ? "border-b border-neutral-100" : ""}`}
              >
                <div className="w-10 h-10 rounded-full bg-primary-600 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                  {member.initials}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-neutral-900 text-sm">{member.name}</p>
                  <p className="text-xs text-neutral-500 truncate">{member.email}</p>
                </div>
                <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${roleColors[member.role]}`}>
                  {member.role}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
