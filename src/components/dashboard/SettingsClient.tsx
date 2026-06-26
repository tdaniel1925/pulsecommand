"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { ConnectSocialAccounts } from "@/components/dashboard/ConnectSocialAccounts";

// ─── Types ────────────────────────────────────────────────────────────────────

interface NotificationPrefs {
  post_ready?: boolean;
  post_published?: boolean;
  video_ready?: boolean;
  weekly_summary?: boolean;
  monthly_report?: boolean;
}

interface ClientMetadata {
  industry?: string;
  website?: string;
  phone?: string;
  brand_colors?: string[];
  brand_voice?: string;
  target_audience?: string;
  logo_url?: string;
  auto_publish?: boolean;
  post_time?: string;
  notifications?: NotificationPrefs;
  [key: string]: unknown;
}

interface ClientData {
  id: string;
  business_name: string | null;
  email: string | null;
  status: string | null;
  metadata: ClientMetadata | null;
  zernio_profile_id: string | null;
  zernio_connected_platforms: string[] | null;
  plan_name: string | null;
  plan_status: string | null;
  presentations_used: number;
  presentations_limit: number;
}

interface Props {
  client: ClientData;
  userEmail: string;
}

type Tab = "profile" | "brand" | "social" | "notifications" | "account";

type Toast = { message: string; type: "success" | "error" } | null;

// ─── Toast ────────────────────────────────────────────────────────────────────

function ToastNotification({ toast, onDismiss }: { toast: Toast; onDismiss: () => void }) {
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(onDismiss, 3000);
    return () => clearTimeout(t);
  }, [toast, onDismiss]);

  if (!toast) return null;
  return (
    <div
      className={`fixed bottom-6 right-6 z-50 px-5 py-3 rounded-xl shadow-lg text-sm font-medium text-white transition-all ${
        toast.type === "success" ? "bg-green-600" : "bg-red-600"
      }`}
    >
      {toast.message}
    </div>
  );
}

// ─── Toggle ───────────────────────────────────────────────────────────────────

function Toggle({
  checked,
  onChange,
  label,
  description,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
  description?: string;
}) {
  return (
    <div className="flex items-start justify-between gap-4 py-4 border-b border-neutral-100 last:border-0">
      <div>
        <p className="text-sm font-medium text-neutral-800">{label}</p>
        {description && <p className="text-xs text-neutral-400 mt-0.5">{description}</p>}
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors flex-shrink-0 ${
          checked ? "bg-indigo-600" : "bg-neutral-200"
        }`}
      >
        <span
          className={`inline-block h-4 w-4 rounded-full bg-white shadow transition-transform ${
            checked ? "translate-x-6" : "translate-x-1"
          }`}
        />
      </button>
    </div>
  );
}

// ─── Field helpers ────────────────────────────────────────────────────────────

function FieldLabel({ children }: { children: React.ReactNode }) {
  return <label className="text-sm font-medium text-neutral-700">{children}</label>;
}

function InputRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <FieldLabel>{label}</FieldLabel>
      {children}
    </div>
  );
}

const inputCls =
  "w-full px-3 py-2.5 rounded-xl border border-neutral-200 text-sm text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white";

// ─── SaveButton ───────────────────────────────────────────────────────────────

function SaveButton({ onClick, loading }: { onClick: () => void; loading?: boolean }) {
  return (
    <button
      onClick={onClick}
      disabled={loading}
      className="px-5 py-2.5 bg-indigo-600 text-white text-sm font-semibold rounded-xl hover:bg-indigo-700 transition-colors disabled:opacity-60"
    >
      {loading ? "Saving…" : "Save Changes"}
    </button>
  );
}

// ─── Section Card ─────────────────────────────────────────────────────────────

function SectionCard({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-2xl border border-neutral-200 p-8 flex flex-col gap-6">
      <div>
        <h2 className="text-lg font-semibold text-neutral-900">{title}</h2>
        {subtitle && <p className="text-sm text-neutral-500 mt-1">{subtitle}</p>}
      </div>
      {children}
    </div>
  );
}

// ─── TAB: Profile ─────────────────────────────────────────────────────────────

function ProfileTab({
  client,
  userEmail,
  onToast,
}: {
  client: ClientData;
  userEmail: string;
  onToast: (t: Toast) => void;
}) {
  const [businessName, setBusinessName] = useState(client.business_name ?? "");
  const [industry, setIndustry] = useState(client.metadata?.industry ?? "");
  const [website, setWebsite] = useState(client.metadata?.website ?? "");
  const [phone, setPhone] = useState(client.metadata?.phone ?? "");
  const [loading, setLoading] = useState(false);

  async function save() {
    setLoading(true);
    try {
      const res = await fetch("/api/settings/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ business_name: businessName, industry, website, phone }),
      });
      if (!res.ok) throw new Error("Failed");
      onToast({ message: "Profile updated", type: "success" });
    } catch {
      onToast({ message: "Failed to save profile", type: "error" });
    } finally {
      setLoading(false);
    }
  }

  return (
    <SectionCard title="Profile">
      <InputRow label="Business Name">
        <input
          type="text"
          value={businessName}
          onChange={(e) => setBusinessName(e.target.value)}
          placeholder="Your business name"
          className={inputCls}
        />
      </InputRow>
      <InputRow label="Email">
        <input type="email" value={userEmail} readOnly className={`${inputCls} bg-neutral-50 text-neutral-400 cursor-not-allowed`} />
      </InputRow>
      <InputRow label="Industry">
        <select
          value={industry}
          onChange={(e) => setIndustry(e.target.value)}
          className={inputCls}
        >
          <option value="">Select industry</option>
          <option value="Technology">Technology</option>
          <option value="Marketing">Marketing</option>
          <option value="Real Estate">Real Estate</option>
          <option value="Healthcare">Healthcare</option>
          <option value="Finance">Finance</option>
          <option value="Retail">Retail</option>
          <option value="Restaurant">Restaurant</option>
          <option value="Professional Services">Professional Services</option>
          <option value="Other">Other</option>
        </select>
      </InputRow>
      <InputRow label="Website">
        <input
          type="url"
          value={website}
          onChange={(e) => setWebsite(e.target.value)}
          placeholder="https://yoursite.com"
          className={inputCls}
        />
      </InputRow>
      <InputRow label="Phone">
        <input
          type="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="+1 (555) 000-0000"
          className={inputCls}
        />
      </InputRow>
      <div className="pt-2">
        <SaveButton onClick={save} loading={loading} />
      </div>
    </SectionCard>
  );
}

// ─── TAB: Brand Kit ───────────────────────────────────────────────────────────

function BrandTab({
  client,
  onToast,
}: {
  client: ClientData;
  onToast: (t: Toast) => void;
}) {
  const [colors, setColors] = useState<string[]>(client.metadata?.brand_colors ?? []);
  const [brandVoice, setBrandVoice] = useState<string>(client.metadata?.brand_voice ?? "");
  const [targetAudience, setTargetAudience] = useState<string>(client.metadata?.target_audience ?? "");
  const [logoUrl, setLogoUrl] = useState<string>(client.metadata?.logo_url ?? "");
  const [editingColorIdx, setEditingColorIdx] = useState<number | null>(null);
  const [loadingColors, setLoadingColors] = useState(false);
  const [loadingVoice, setLoadingVoice] = useState(false);
  const [loadingAudience, setLoadingAudience] = useState(false);
  const [loadingLogo, setLoadingLogo] = useState(false);
  const colorInputRef = useRef<HTMLInputElement>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);

  function addColor() {
    if (colors.length >= 5) return;
    const newColor = "#6366f1";
    setColors([...colors, newColor]);
    setEditingColorIdx(colors.length);
  }

  function removeColor(idx: number) {
    setColors(colors.filter((_, i) => i !== idx));
  }

  function updateColor(idx: number, val: string) {
    const next = [...colors];
    next[idx] = val;
    setColors(next);
  }

  async function saveColors() {
    setLoadingColors(true);
    try {
      const res = await fetch("/api/settings/brand", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ brand_colors: colors }),
      });
      if (!res.ok) throw new Error("Failed");
      onToast({ message: "Brand colors saved", type: "success" });
    } catch {
      onToast({ message: "Failed to save colors", type: "error" });
    } finally {
      setLoadingColors(false);
      setEditingColorIdx(null);
    }
  }

  async function saveVoice() {
    setLoadingVoice(true);
    try {
      const res = await fetch("/api/settings/brand", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ brand_voice: brandVoice }),
      });
      if (!res.ok) throw new Error("Failed");
      onToast({ message: "Brand voice saved", type: "success" });
    } catch {
      onToast({ message: "Failed to save brand voice", type: "error" });
    } finally {
      setLoadingVoice(false);
    }
  }

  async function saveAudience() {
    setLoadingAudience(true);
    try {
      const res = await fetch("/api/settings/brand", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ target_audience: targetAudience }),
      });
      if (!res.ok) throw new Error("Failed");
      onToast({ message: "Target audience saved", type: "success" });
    } catch {
      onToast({ message: "Failed to save target audience", type: "error" });
    } finally {
      setLoadingAudience(false);
    }
  }

  async function handleLogoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      onToast({ message: "Logo must be under 2MB", type: "error" });
      return;
    }
    setLoadingLogo(true);
    try {
      const supabase = createClient();
      const path = `${client.id}/logo`;
      const { error } = await supabase.storage
        .from("brand-assets")
        .upload(path, file, { upsert: true });
      if (error) throw error;

      const { data: urlData } = supabase.storage.from("brand-assets").getPublicUrl(path);
      const publicUrl = urlData.publicUrl;
      setLogoUrl(publicUrl);

      const res = await fetch("/api/settings/brand", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ logo_url: publicUrl }),
      });
      if (!res.ok) throw new Error("Failed to save logo URL");
      onToast({ message: "Logo uploaded", type: "success" });
    } catch (err: unknown) {
      onToast({ message: err instanceof Error ? err.message : "Failed to upload logo", type: "error" });
    } finally {
      setLoadingLogo(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Brand Colors */}
      <SectionCard
        title="Brand Colors"
        subtitle="Your brand settings are used across all AI-generated content"
      >
        <div className="flex items-center gap-3 flex-wrap">
          {colors.map((color, idx) => (
            <div key={idx} className="relative group">
              <button
                type="button"
                onClick={() => setEditingColorIdx(idx === editingColorIdx ? null : idx)}
                style={{ backgroundColor: color }}
                className="w-10 h-10 rounded-full border-2 border-white shadow ring-1 ring-neutral-200 hover:ring-indigo-400 transition-all"
                title={color}
              />
              <button
                type="button"
                onClick={() => removeColor(idx)}
                className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white rounded-full text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity leading-none"
              >
                ×
              </button>
              {editingColorIdx === idx && (
                <input
                  type="color"
                  value={color}
                  onChange={(e) => updateColor(idx, e.target.value)}
                  className="absolute top-12 left-0 z-10 w-10 h-8 cursor-pointer"
                />
              )}
            </div>
          ))}
          {colors.length < 5 && (
            <button
              type="button"
              onClick={addColor}
              className="w-10 h-10 rounded-full border-2 border-dashed border-neutral-300 text-neutral-400 hover:border-indigo-400 hover:text-indigo-500 transition-colors flex items-center justify-center text-lg"
              title="Add color"
            >
              +
            </button>
          )}
        </div>
        <input ref={colorInputRef} type="color" className="hidden" />
        <div>
          <SaveButton onClick={saveColors} loading={loadingColors} />
        </div>
      </SectionCard>

      {/* Brand Voice */}
      <SectionCard title="Brand Voice">
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between">
            <FieldLabel>Brand Voice</FieldLabel>
            <span className={`text-xs ${brandVoice.length > 500 ? "text-red-500" : "text-neutral-400"}`}>
              {brandVoice.length}/500
            </span>
          </div>
          <textarea
            rows={5}
            maxLength={500}
            value={brandVoice}
            onChange={(e) => setBrandVoice(e.target.value)}
            placeholder="Describe your brand voice... e.g. 'Professional but approachable. We speak plainly and avoid jargon. Our tone is confident but never arrogant.'"
            className={`${inputCls} resize-none`}
          />
        </div>
        <div>
          <SaveButton onClick={saveVoice} loading={loadingVoice} />
        </div>
      </SectionCard>

      {/* Logo Upload */}
      <SectionCard title="Logo">
        <div className="flex items-center gap-6">
          {logoUrl ? (
            <div className="border border-neutral-200 rounded-xl p-3 bg-neutral-50">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={logoUrl} alt="Brand logo" className="max-h-16 object-contain" />
            </div>
          ) : (
            <div className="w-20 h-16 border-2 border-dashed border-neutral-200 rounded-xl flex items-center justify-center text-neutral-300 text-2xl">
              🖼
            </div>
          )}
          <div className="flex flex-col gap-2">
            <input
              ref={logoInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleLogoUpload}
            />
            <button
              type="button"
              onClick={() => logoInputRef.current?.click()}
              disabled={loadingLogo}
              className="px-4 py-2 text-sm font-medium border border-neutral-200 rounded-xl hover:bg-neutral-50 transition-colors disabled:opacity-60"
            >
              {loadingLogo ? "Uploading…" : logoUrl ? "Replace Logo" : "Upload Logo"}
            </button>
            <p className="text-xs text-neutral-400">PNG, JPG or SVG. Max 2MB.</p>
          </div>
        </div>
      </SectionCard>

      {/* Target Audience */}
      <SectionCard title="Target Audience">
        <div className="flex flex-col gap-1.5">
          <FieldLabel>Target Audience</FieldLabel>
          <textarea
            rows={5}
            value={targetAudience}
            onChange={(e) => setTargetAudience(e.target.value)}
            placeholder="Describe your ideal customer... e.g. 'Small business owners aged 30-55 in the US who want to grow their online presence without hiring a full marketing team.'"
            className={`${inputCls} resize-none`}
          />
        </div>
        <div>
          <SaveButton onClick={saveAudience} loading={loadingAudience} />
        </div>
      </SectionCard>
    </div>
  );
}

// ─── TAB: Social Accounts ─────────────────────────────────────────────────────

function SocialTab({
  client,
  onToast,
}: {
  client: ClientData;
  onToast: (t: Toast) => void;
}) {
  const [disconnecting, setDisconnecting] = useState(false);
  const [autoPublish, setAutoPublish] = useState(client.metadata?.auto_publish ?? true);
  const [postTime, setPostTime] = useState(client.metadata?.post_time ?? "morning");
  const [loadingSchedule, setLoadingSchedule] = useState(false);

  async function handleDisconnect() {
    if (!confirm("Disconnect all social accounts?")) return;
    setDisconnecting(true);
    try {
      const res = await fetch("/api/zernio/disconnect", { method: "POST" });
      if (!res.ok) throw new Error("Failed");
      onToast({ message: "Social accounts disconnected", type: "success" });
      window.location.reload();
    } catch {
      onToast({ message: "Failed to disconnect", type: "error" });
    } finally {
      setDisconnecting(false);
    }
  }

  async function saveSchedule() {
    setLoadingSchedule(true);
    try {
      const res = await fetch("/api/settings/brand", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ auto_publish: autoPublish, post_time: postTime }),
      });
      if (!res.ok) throw new Error("Failed");
      onToast({ message: "Publishing schedule saved", type: "success" });
    } catch {
      onToast({ message: "Failed to save schedule", type: "error" });
    } finally {
      setLoadingSchedule(false);
    }
  }

  const connectedPlatforms = client.zernio_connected_platforms ?? [];

  return (
    <div className="flex flex-col gap-6">
      {/* Connect section — per-platform OAuth via Zernio */}
      <SectionCard
        title="Social Accounts"
        subtitle="Connect each account so we can post for you automatically"
      >
        <div className="flex flex-col gap-4">
          <ConnectSocialAccounts connectedPlatforms={connectedPlatforms} />
          {connectedPlatforms.length > 0 && (
            <button
              type="button"
              onClick={handleDisconnect}
              disabled={disconnecting}
              className="self-start px-4 py-2 text-sm font-medium border border-red-300 text-red-600 rounded-xl hover:bg-red-50 transition-colors disabled:opacity-60"
            >
              {disconnecting ? "Disconnecting…" : "Disconnect all"}
            </button>
          )}
        </div>
      </SectionCard>

      {/* Publishing Schedule */}
      <SectionCard title="Publishing Schedule">
        <Toggle
          checked={autoPublish}
          onChange={setAutoPublish}
          label="Auto-publish posts"
          description="We publish your posts automatically on your schedule — no approval needed"
        />
        <InputRow label="Post time preference">
          <select
            value={postTime}
            onChange={(e) => setPostTime(e.target.value)}
            className={inputCls}
          >
            <option value="morning">Morning (9am)</option>
            <option value="afternoon">Afternoon (1pm)</option>
            <option value="evening">Evening (6pm)</option>
          </select>
        </InputRow>
        <div>
          <SaveButton onClick={saveSchedule} loading={loadingSchedule} />
        </div>
      </SectionCard>
    </div>
  );
}

// ─── TAB: Notifications ───────────────────────────────────────────────────────

function NotificationsTab({
  client,
  onToast,
}: {
  client: ClientData;
  onToast: (t: Toast) => void;
}) {
  const saved = client.metadata?.notifications ?? {};
  const [postReady, setPostReady] = useState(saved.post_ready ?? true);
  const [postPublished, setPostPublished] = useState(saved.post_published ?? true);
  const [weeklySummary, setWeeklySummary] = useState(saved.weekly_summary ?? true);
  const [monthlyReport, setMonthlyReport] = useState(saved.monthly_report ?? true);
  const [loading, setLoading] = useState(false);

  async function save() {
    setLoading(true);
    try {
      const res = await fetch("/api/settings/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          notifications: {
            post_ready: postReady,
            post_published: postPublished,
            weekly_summary: weeklySummary,
            monthly_report: monthlyReport,
          },
        }),
      });
      if (!res.ok) throw new Error("Failed");
      onToast({ message: "Notification preferences saved", type: "success" });
    } catch {
      onToast({ message: "Failed to save preferences", type: "error" });
    } finally {
      setLoading(false);
    }
  }

  return (
    <SectionCard title="Notifications" subtitle="Choose what email notifications you receive.">
      <Toggle
        checked={postReady}
        onChange={setPostReady}
        label="Email when new post is ready for review"
        description="Get notified when AI generates a new post for your approval."
      />
      <Toggle
        checked={postPublished}
        onChange={setPostPublished}
        label="Email when post is published"
        description="Confirmation when a post goes live on your social channels."
      />
      <Toggle
        checked={weeklySummary}
        onChange={setWeeklySummary}
        label="Weekly performance summary"
        description="A digest of your content performance every Monday."
      />
      <Toggle
        checked={monthlyReport}
        onChange={setMonthlyReport}
        label="Monthly report email"
        description="Receive your monthly performance report by email."
      />
      <div className="pt-2">
        <SaveButton onClick={save} loading={loading} />
      </div>
    </SectionCard>
  );
}

// ─── TAB: Account ─────────────────────────────────────────────────────────────

function AccountTab({
  client,
  userEmail,
  onToast,
}: {
  client: ClientData;
  userEmail: string;
  onToast: (t: Toast) => void;
}) {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [confirmName, setConfirmName] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [resettingPw, setResettingPw] = useState(false);

  async function handlePasswordReset() {
    setResettingPw(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.resetPasswordForEmail(userEmail, {
        redirectTo: `${window.location.origin}/auth/reset-password`,
      });
      if (error) throw error;
      onToast({ message: "Password reset email sent", type: "success" });
    } catch {
      onToast({ message: "Failed to send reset email", type: "error" });
    } finally {
      setResettingPw(false);
    }
  }

  async function handleDeleteAccount() {
    if (confirmName !== client.business_name) {
      onToast({ message: "Business name does not match", type: "error" });
      return;
    }
    setDeleting(true);
    try {
      const res = await fetch("/api/settings/delete-account", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ confirmName }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "Failed");
      }
      window.location.href = "/";
    } catch (err: unknown) {
      onToast({ message: err instanceof Error ? err.message : "Failed to delete account", type: "error" });
      setDeleting(false);
    }
  }

  function planStatusBadge(status: string | null) {
    switch (status) {
      case "active": return "bg-green-50 text-green-700 border border-green-200";
      case "trialing": return "bg-blue-50 text-blue-700 border border-blue-200";
      case "past_due": return "bg-red-50 text-red-700 border border-red-200";
      case "canceled": return "bg-neutral-100 text-neutral-500 border border-neutral-200";
      default: return "bg-neutral-100 text-neutral-500 border border-neutral-200";
    }
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Plan Info */}
      <SectionCard title="Plan">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-sm font-semibold text-neutral-800">
              {client.plan_name ?? "No active plan"}
            </span>
            {client.plan_status && (
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${planStatusBadge(client.plan_status)}`}>
                {client.plan_status}
              </span>
            )}
          </div>
          <Link
            href="/dashboard/billing"
            className="text-sm font-medium text-indigo-600 hover:text-indigo-700 transition-colors"
          >
            Manage Billing →
          </Link>
        </div>
      </SectionCard>

      {/* Change Password */}
      <SectionCard title="Password">
        <p className="text-sm text-neutral-500">
          We&apos;ll send a password reset link to <strong>{userEmail}</strong>.
        </p>
        <div>
          <button
            type="button"
            onClick={handlePasswordReset}
            disabled={resettingPw}
            className="px-5 py-2.5 border border-neutral-200 text-sm font-medium rounded-xl hover:bg-neutral-50 transition-colors disabled:opacity-60"
          >
            {resettingPw ? "Sending…" : "Send password reset email"}
          </button>
        </div>
      </SectionCard>

      {/* Danger Zone */}
      <div className="bg-white rounded-2xl border border-red-200 p-8 flex flex-col gap-6">
        <div>
          <h2 className="text-lg font-semibold text-red-600">Danger Zone</h2>
          <p className="text-sm text-neutral-500 mt-1">
            These actions are irreversible. Please proceed with caution.
          </p>
        </div>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-neutral-800">Delete Account</p>
            <p className="text-xs text-neutral-400 mt-0.5">
              Permanently delete your account and all associated content.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setShowDeleteDialog(true)}
            className="px-4 py-2 text-sm font-medium border border-red-300 text-red-600 rounded-xl hover:bg-red-50 transition-colors"
          >
            Delete Account
          </button>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      {showDeleteDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl border border-neutral-200 shadow-xl p-8 max-w-md w-full mx-4 flex flex-col gap-5">
            <div>
              <h3 className="text-lg font-bold text-red-600">Delete Account</h3>
              <p className="text-sm text-neutral-600 mt-2">
                Are you sure? This will delete all your content and cannot be undone.
              </p>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-neutral-700">
                Type your business name to confirm:{" "}
                <span className="font-bold text-neutral-900">{client.business_name}</span>
              </label>
              <input
                type="text"
                value={confirmName}
                onChange={(e) => setConfirmName(e.target.value)}
                placeholder={client.business_name ?? ""}
                className={inputCls}
              />
            </div>
            <div className="flex items-center gap-3 justify-end">
              <button
                type="button"
                onClick={() => { setShowDeleteDialog(false); setConfirmName(""); }}
                className="px-4 py-2 text-sm font-medium border border-neutral-200 rounded-xl hover:bg-neutral-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteAccount}
                disabled={deleting || confirmName !== client.business_name}
                className="px-4 py-2 text-sm font-semibold bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors disabled:opacity-50"
              >
                {deleting ? "Deleting…" : "Delete Account"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function SettingsClient({ client, userEmail }: Props) {
  // Deep-link support: /dashboard/settings?tab=social lands on the Social tab
  // (used by the welcome email + dashboard "Connect Accounts" action).
  const [activeTab, setActiveTab] = useState<Tab>(() => {
    if (typeof window === "undefined") return "profile";
    const t = new URLSearchParams(window.location.search).get("tab");
    const valid: Tab[] = ["profile", "brand", "social", "notifications", "account"];
    return valid.includes(t as Tab) ? (t as Tab) : "profile";
  });
  const [toast, setToast] = useState<Toast>(null);
  const dismissToast = useCallback(() => setToast(null), []);

  const tabs: { key: Tab; label: string }[] = [
    { key: "profile", label: "Profile" },
    { key: "brand", label: "Brand Kit" },
    { key: "social", label: "Social Accounts" },
    { key: "notifications", label: "Notifications" },
    { key: "account", label: "Account" },
  ];

  return (
    <div className="max-w-2xl">
      <h2 className="text-2xl font-bold text-neutral-900 mb-6">Settings</h2>

      {/* Tab bar */}
      <div className="flex gap-2 flex-wrap mb-6">
        {tabs.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            className={`px-4 py-2 rounded-lg text-sm transition-colors ${
              activeTab === key
                ? "bg-indigo-100 text-indigo-700 font-medium"
                : "text-neutral-500 hover:text-neutral-700"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === "profile" && (
        <ProfileTab client={client} userEmail={userEmail} onToast={setToast} />
      )}
      {activeTab === "brand" && (
        <BrandTab client={client} onToast={setToast} />
      )}
      {activeTab === "social" && (
        <SocialTab client={client} onToast={setToast} />
      )}
      {activeTab === "notifications" && (
        <NotificationsTab client={client} onToast={setToast} />
      )}
      {activeTab === "account" && (
        <AccountTab client={client} userEmail={userEmail} onToast={setToast} />
      )}

      <ToastNotification toast={toast} onDismiss={dismissToast} />
    </div>
  );
}
