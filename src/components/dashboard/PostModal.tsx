"use client";

import { useEffect, useState } from "react";
import { X, Monitor } from "lucide-react";

// ─── Platform config ──────────────────────────────────────────────────────────

const PLATFORMS = [
  { id: "instagram", label: "Instagram", short: "IG", color: "bg-pink-100 text-pink-700", border: "border-pink-300", accent: "#E1306C" },
  { id: "facebook",  label: "Facebook",  short: "FB", color: "bg-blue-100 text-blue-700",  border: "border-blue-300",  accent: "#1877F2" },
  { id: "linkedin",  label: "LinkedIn",  short: "LI", color: "bg-sky-100 text-sky-800",    border: "border-sky-300",   accent: "#0A66C2" },
  { id: "twitter",   label: "X / Twitter", short: "X", color: "bg-neutral-100 text-neutral-700", border: "border-neutral-300", accent: "#000000" },
  { id: "tiktok",    label: "TikTok",    short: "TK", color: "bg-neutral-100 text-neutral-700", border: "border-neutral-300", accent: "#010101" },
];

// ─── Platform mock frames ─────────────────────────────────────────────────────

function InstagramFrame({ imageUrl, caption }: { imageUrl: string | null; caption: string }) {
  return (
    <div className="bg-white border border-neutral-200 rounded-xl overflow-hidden max-w-sm mx-auto shadow-sm">
      {/* Header */}
      <div className="flex items-center gap-2.5 px-3 py-2.5 border-b border-neutral-100">
        <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-pink-500 via-red-500 to-yellow-400 flex items-center justify-center">
          <span className="text-white text-[10px] font-bold">YB</span>
        </div>
        <div>
          <p className="text-xs font-semibold text-neutral-900 leading-none">your_business</p>
          <p className="text-[10px] text-neutral-400 mt-0.5">Sponsored</p>
        </div>
        <span className="ml-auto text-neutral-400 text-lg leading-none">···</span>
      </div>
      {/* Image — square 1:1 */}
      <div className="w-full aspect-square bg-neutral-100 overflow-hidden">
        {imageUrl
          ? <img src={imageUrl} alt="" className="w-full h-full object-cover" /> // eslint-disable-line
          : <div className="w-full h-full flex items-center justify-center text-xs text-neutral-400">No image</div>}
      </div>
      {/* Actions */}
      <div className="px-3 py-2 flex gap-3 text-neutral-700">
        <span className="text-xl">♡</span>
        <span className="text-xl">💬</span>
        <span className="text-xl">↗</span>
        <span className="ml-auto text-xl">🔖</span>
      </div>
      {/* Caption */}
      <div className="px-3 pb-3">
        <p className="text-xs text-neutral-800 line-clamp-4 leading-relaxed">
          <span className="font-semibold">your_business </span>{caption}
        </p>
      </div>
    </div>
  );
}

function FacebookFrame({ imageUrl, caption }: { imageUrl: string | null; caption: string }) {
  return (
    <div className="bg-white border border-neutral-200 rounded-xl overflow-hidden max-w-sm mx-auto shadow-sm">
      {/* Header */}
      <div className="flex items-center gap-2.5 px-3 py-2.5">
        <div className="w-9 h-9 rounded-full bg-blue-600 flex items-center justify-center">
          <span className="text-white text-xs font-bold">YB</span>
        </div>
        <div>
          <p className="text-xs font-semibold text-neutral-900 leading-none">Your Business Page</p>
          <p className="text-[10px] text-neutral-400 mt-0.5">Just now · 🌐</p>
        </div>
        <span className="ml-auto text-neutral-400 text-lg">···</span>
      </div>
      {/* Caption above image (FB style) */}
      <div className="px-3 pb-2">
        <p className="text-xs text-neutral-800 leading-relaxed line-clamp-3">{caption}</p>
      </div>
      {/* Image — 1.91:1 landscape on FB */}
      <div className="w-full aspect-[1.91/1] bg-neutral-100 overflow-hidden">
        {imageUrl
          ? <img src={imageUrl} alt="" className="w-full h-full object-cover" /> // eslint-disable-line
          : <div className="w-full h-full flex items-center justify-center text-xs text-neutral-400">No image</div>}
      </div>
      {/* Reactions */}
      <div className="px-3 py-2 flex gap-3 text-xs text-neutral-500 border-t border-neutral-100">
        <span>👍 Like</span>
        <span>💬 Comment</span>
        <span>↗ Share</span>
      </div>
    </div>
  );
}

function LinkedInFrame({ imageUrl, caption }: { imageUrl: string | null; caption: string }) {
  return (
    <div className="bg-white border border-neutral-200 rounded-xl overflow-hidden max-w-sm mx-auto shadow-sm">
      {/* Header */}
      <div className="flex items-center gap-2.5 px-3 py-2.5">
        <div className="w-10 h-10 rounded-full bg-blue-700 flex items-center justify-center">
          <span className="text-white text-xs font-bold">YB</span>
        </div>
        <div>
          <p className="text-xs font-semibold text-neutral-900 leading-none">Your Business</p>
          <p className="text-[10px] text-neutral-400 mt-0.5">Company · 1st</p>
          <p className="text-[10px] text-neutral-400">Just now · 🌐</p>
        </div>
        <button className="ml-auto text-blue-600 text-xs font-semibold border border-blue-600 px-2 py-0.5 rounded-full">+ Follow</button>
      </div>
      {/* Caption */}
      <div className="px-3 pb-2">
        <p className="text-xs text-neutral-800 leading-relaxed line-clamp-4">{caption}</p>
      </div>
      {/* Image — 1.91:1 */}
      <div className="w-full aspect-[1.91/1] bg-neutral-100 overflow-hidden">
        {imageUrl
          ? <img src={imageUrl} alt="" className="w-full h-full object-cover" /> // eslint-disable-line
          : <div className="w-full h-full flex items-center justify-center text-xs text-neutral-400">No image</div>}
      </div>
      {/* Reactions */}
      <div className="px-3 py-2 flex gap-4 text-xs text-neutral-500 border-t border-neutral-100">
        <span>👍 Like</span>
        <span>💬 Comment</span>
        <span>🔁 Repost</span>
        <span>↗ Send</span>
      </div>
    </div>
  );
}

function TwitterFrame({ imageUrl, caption }: { imageUrl: string | null; caption: string }) {
  return (
    <div className="bg-white border border-neutral-200 rounded-xl overflow-hidden max-w-sm mx-auto shadow-sm">
      <div className="flex gap-2.5 px-3 py-3">
        <div className="w-9 h-9 rounded-full bg-neutral-900 flex-shrink-0 flex items-center justify-center">
          <span className="text-white text-xs font-bold">YB</span>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-bold text-neutral-900">Your Business</span>
            <span className="text-[10px] text-neutral-400">@yourbiz · now</span>
          </div>
          <p className="text-xs text-neutral-800 leading-relaxed mt-1 line-clamp-4">{caption}</p>
          {imageUrl && (
            <div className="mt-2 rounded-xl overflow-hidden aspect-video bg-neutral-100">
              <img src={imageUrl} alt="" className="w-full h-full object-cover" /> {/* eslint-disable-line */}
            </div>
          )}
          <div className="flex gap-5 mt-2 text-xs text-neutral-400">
            <span>💬 0</span>
            <span>🔁 0</span>
            <span>♡ 0</span>
            <span>↗</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function DefaultFrame({ imageUrl, caption, platform }: { imageUrl: string | null; caption: string; platform: string }) {
  return (
    <div className="bg-white border border-neutral-200 rounded-xl overflow-hidden max-w-sm mx-auto shadow-sm">
      <div className="px-3 py-2.5 border-b border-neutral-100">
        <span className="text-xs font-semibold text-neutral-500 capitalize">{platform} Preview</span>
      </div>
      <div className="w-full aspect-square bg-neutral-100 overflow-hidden">
        {imageUrl
          ? <img src={imageUrl} alt="" className="w-full h-full object-cover" /> // eslint-disable-line
          : <div className="w-full h-full flex items-center justify-center text-xs text-neutral-400">No image</div>}
      </div>
      <div className="px-3 py-3">
        <p className="text-xs text-neutral-800 line-clamp-4 leading-relaxed">{caption}</p>
      </div>
    </div>
  );
}

// ─── Status config ────────────────────────────────────────────────────────────

const statusConfig: Record<string, { label: string; className: string }> = {
  pending_approval: { label: "Needs Approval", className: "bg-amber-50 text-amber-700 border border-amber-200" },
  published:        { label: "Published",       className: "bg-green-50 text-green-700 border border-green-200" },
  scheduled:        { label: "Scheduled",       className: "bg-blue-50 text-blue-700 border border-blue-200" },
  draft:            { label: "Draft",           className: "bg-neutral-100 text-neutral-500 border border-neutral-200" },
  failed:           { label: "Failed",          className: "bg-red-50 text-red-600 border border-red-200" },
  rejected:         { label: "Rejected",        className: "bg-neutral-100 text-neutral-400 border border-neutral-200" },
};

// ─── Types ────────────────────────────────────────────────────────────────────

export type PostModalData = {
  id: string;
  content: string;
  image_url: string | null;
  platforms: string[];
  status: string;
  scheduled_at: string | null;
  published_at: string | null;
  metadata?: { captions?: Record<string, string> } | null;
};

interface PostModalProps {
  post: PostModalData | null;
  onClose: () => void;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function PostModal({ post, onClose }: PostModalProps) {
  const [activeTab, setActiveTab] = useState<string>("");

  // Reset the active tab to the first platform whenever the post changes.
  // Adjusting state during render avoids the extra render an effect would cause.
  const [lastPostId, setLastPostId] = useState<string | null>(null);
  if (post && post.id !== lastPostId) {
    setLastPostId(post.id);
    setActiveTab(post.platforms?.length ? post.platforms[0] : "");
  }

  useEffect(() => {
    if (!post) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [post, onClose]);

  if (!post) return null;

  const cfg = statusConfig[post.status] ?? statusConfig.draft;
  const dateStr = post.published_at ?? post.scheduled_at;
  const dateLabel = dateStr
    ? new Date(dateStr).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })
    : null;

  const platforms = Array.isArray(post.platforms) ? post.platforms : [];
  const captions: Record<string, string> = post.metadata?.captions ?? {};
  const activeCaption = captions[activeTab] || post.content || "";

  function renderFrame() {
    switch (activeTab) {
      case "instagram": return <InstagramFrame imageUrl={post!.image_url} caption={activeCaption} />;
      case "facebook":  return <FacebookFrame  imageUrl={post!.image_url} caption={activeCaption} />;
      case "linkedin":  return <LinkedInFrame  imageUrl={post!.image_url} caption={activeCaption} />;
      case "twitter":   return <TwitterFrame   imageUrl={post!.image_url} caption={activeCaption} />;
      default:          return <DefaultFrame   imageUrl={post!.image_url} caption={activeCaption} platform={activeTab} />;
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-neutral-100 flex-shrink-0">
          <div className="flex items-center gap-2 flex-wrap">
            <Monitor className="w-4 h-4 text-neutral-400" />
            <span className="text-sm font-semibold text-neutral-700">Platform Preview</span>
            <span className={`inline-flex items-center text-xs font-semibold px-2.5 py-1 rounded-full ${cfg.className}`}>
              {cfg.label}
            </span>
            {dateLabel && (
              <span className="text-xs text-neutral-400">
                {post.status === "published" ? "· Published" : post.status === "scheduled" ? "· Scheduled for" : ""} {dateLabel}
              </span>
            )}
          </div>
          <button onClick={onClose} className="text-neutral-400 hover:text-neutral-600 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Platform tabs */}
        {platforms.length > 1 && (
          <div className="flex gap-1 px-5 pt-3 pb-0 border-b border-neutral-100 flex-shrink-0 overflow-x-auto">
            {platforms.map((pid) => {
              const p = PLATFORMS.find((x) => x.id === pid);
              if (!p) return null;
              const isActive = activeTab === pid;
              return (
                <button
                  key={pid}
                  onClick={() => setActiveTab(pid)}
                  className={`flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-t-lg border-b-2 transition-colors whitespace-nowrap ${
                    isActive
                      ? `border-b-2 text-neutral-900 bg-neutral-50 border-neutral-900`
                      : `border-transparent text-neutral-400 hover:text-neutral-600`
                  }`}
                >
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${p.color}`}>{p.short}</span>
                  {p.label}
                </button>
              );
            })}
          </div>
        )}

        {/* Preview frame */}
        <div className="flex-1 overflow-y-auto bg-neutral-50 p-5">
          {renderFrame()}

          {/* Raw caption below frame */}
          <div className="mt-4 max-w-sm mx-auto">
            <p className="text-[10px] font-semibold text-neutral-400 uppercase tracking-wide mb-1.5">Caption text</p>
            <p className="text-xs text-neutral-600 leading-relaxed bg-white border border-neutral-200 rounded-xl p-3 whitespace-pre-wrap">
              {activeCaption}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
