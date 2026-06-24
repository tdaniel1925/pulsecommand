"use client";

import { useState } from "react";
import { Share2, ExternalLink, Loader2, CheckCircle } from "lucide-react";

const PLATFORMS = [
  { id: "instagram", label: "Instagram", color: "bg-pink-100 text-pink-700" },
  { id: "facebook", label: "Facebook", color: "bg-blue-100 text-blue-700" },
  { id: "linkedin", label: "LinkedIn", color: "bg-blue-100 text-blue-800" },
  { id: "twitter", label: "Twitter / X", color: "bg-sky-100 text-sky-700" },
  { id: "tiktok", label: "TikTok", color: "bg-neutral-100 text-neutral-700" },
];

interface ConnectSocialAccountsProps {
  connectedPlatforms: string[];
}

export function ConnectSocialAccounts({ connectedPlatforms }: ConnectSocialAccountsProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleConnect() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/ayrshare/connect");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to generate link");
      window.open(data.url, "_blank", "width=600,height=700");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="bg-white rounded-2xl border border-neutral-200 shadow-sm p-6 space-y-5">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-primary-50 rounded-xl flex items-center justify-center">
          <Share2 className="w-5 h-5 text-primary-600" />
        </div>
        <div>
          <h3 className="font-semibold text-neutral-900">Social Accounts</h3>
          <p className="text-xs text-neutral-500">Connect your accounts so we can post on your behalf</p>
        </div>
      </div>

      {/* Platform status */}
      <div className="flex flex-wrap gap-2">
        {PLATFORMS.map((p) => {
          const connected = connectedPlatforms.includes(p.id);
          return (
            <span
              key={p.id}
              className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full ${
                connected ? p.color : "bg-neutral-100 text-neutral-400"
              }`}
            >
              {connected && <CheckCircle className="w-3 h-3" />}
              {p.label}
            </span>
          );
        })}
      </div>

      {error && <p className="text-xs text-red-500">{error}</p>}

      <button
        onClick={handleConnect}
        disabled={loading}
        className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-primary-600 text-white text-sm font-semibold rounded-xl hover:bg-primary-700 transition-colors disabled:opacity-60"
      >
        {loading ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <ExternalLink className="w-4 h-4" />
        )}
        {connectedPlatforms.length > 0 ? "Manage Connected Accounts" : "Connect Social Accounts"}
      </button>

      <p className="text-xs text-neutral-400 text-center">
        A secure window will open to connect your accounts. We never store your passwords.
      </p>
    </div>
  );
}
