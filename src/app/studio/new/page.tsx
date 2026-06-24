"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Sparkles, Loader2, Globe, ArrowRight, Check } from "lucide-react";
import { AtlasKit } from "@/components/studio/kits/AtlasKit";
import { StudioEditor } from "@/components/studio/StudioEditor";
import type { KitContent } from "@/lib/studio/kit-schema";
import type { ThemeProps } from "@/lib/studio/theme";

type Phase = "input" | "generating" | "preview" | "publishing" | "published";

export default function StudioNewPage() {
  const [goal, setGoal] = useState("");
  const [phase, setPhase] = useState<Phase>("input");
  const [content, setContent] = useState<KitContent | null>(null);
  const [theme, setTheme] = useState<ThemeProps>({});
  const [pageId, setPageId] = useState<string | null>(null);
  const [liveUrl, setLiveUrl] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [savingDraft, setSavingDraft] = useState(false);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Debounced autosave: persist content/theme edits ~800ms after the last change.
  const scheduleSave = useCallback((c: KitContent, t: ThemeProps, id: string | null) => {
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(async () => {
      setSavingDraft(true);
      try {
        const res = await fetch("/api/studio/save", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ pageId: id, goal, content: c, theme: t, kit: "atlas" }),
        });
        const data = await res.json();
        if (res.ok && data.id && !id) setPageId(data.id);
      } finally {
        setSavingDraft(false);
      }
    }, 800);
  }, [goal]);

  useEffect(() => () => { if (saveTimer.current) clearTimeout(saveTimer.current); }, []);

  function updateContent(next: KitContent) {
    setContent(next);
    scheduleSave(next, theme, pageId);
  }
  function updateTheme(next: ThemeProps) {
    setTheme(next);
    if (content) scheduleSave(content, next, pageId);
  }

  async function handleGenerate() {
    if (goal.trim().length < 3) {
      setError("Tell us what the page is for.");
      return;
    }
    setError("");
    setPhase("generating");
    try {
      const res = await fetch("/api/studio/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ goal }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Generation failed");
      setContent(data.content);
      setTheme(data.theme ?? {});

      // Save a draft immediately so we have a page id to publish.
      const saveRes = await fetch("/api/studio/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ goal, content: data.content, theme: data.theme, kit: "atlas" }),
      });
      const saved = await saveRes.json();
      if (saveRes.ok) setPageId(saved.id);

      setPhase("preview");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
      setPhase("input");
    }
  }

  async function handlePublish() {
    if (!pageId) return;
    setPhase("publishing");
    setError("");
    try {
      const res = await fetch("/api/studio/publish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pageId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Publish failed");
      setLiveUrl(data.url);
      setPhase("published");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Publish failed");
      setPhase("preview");
    }
  }

  // ── PREVIEW / PUBLISHED: editor pane + live preview ─────────────────────────
  if ((phase === "preview" || phase === "publishing" || phase === "published") && content) {
    return (
      <div className="h-screen flex flex-col bg-neutral-100">
        {/* Action bar */}
        <div className="flex-shrink-0 bg-white border-b border-neutral-200 px-4 py-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-sm text-neutral-600 min-w-0">
            <Sparkles className="w-4 h-4 text-primary-600 flex-shrink-0" />
            <span className="truncate font-medium">{phase === "published" ? "Your page is live" : "Edit your page"}</span>
            {savingDraft && <span className="text-xs text-neutral-400 flex items-center gap-1"><Loader2 className="w-3 h-3 animate-spin" /> saving</span>}
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            {phase === "published" && liveUrl ? (
              <>
                <a href={liveUrl} target="_blank" rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-green-600 text-white text-sm font-semibold rounded-lg hover:bg-green-700">
                  <Globe className="w-4 h-4" /> View live page
                </a>
                <button onClick={() => setPhase("preview")} className="px-3 py-2 text-sm text-neutral-600 hover:text-neutral-900">
                  Keep editing
                </button>
              </>
            ) : (
              <>
                <button onClick={() => setPhase("input")} className="px-3 py-2 text-sm text-neutral-600 hover:text-neutral-900">
                  Start over
                </button>
                <button onClick={handlePublish} disabled={phase === "publishing"}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-primary-600 text-white text-sm font-semibold rounded-lg hover:bg-primary-700 disabled:opacity-60">
                  {phase === "publishing" ? <><Loader2 className="w-4 h-4 animate-spin" /> Publishing…</> : <><Check className="w-4 h-4" /> Publish</>}
                </button>
              </>
            )}
          </div>
        </div>

        {error && <div className="flex-shrink-0 bg-red-50 text-red-700 text-sm px-4 py-2">{error}</div>}

        <div className="flex-1 flex min-h-0">
          {/* Editor pane */}
          <aside className="w-80 flex-shrink-0 bg-white border-r border-neutral-200 overflow-y-auto p-5">
            <StudioEditor content={content} theme={theme} onContentChange={updateContent} onThemeChange={updateTheme} />
          </aside>

          {/* Live preview */}
          <main className="flex-1 overflow-y-auto p-6">
            <div className="max-w-4xl mx-auto bg-white rounded-xl overflow-hidden shadow-lg border border-neutral-200">
              <AtlasKit content={content} theme={theme} />
            </div>
          </main>
        </div>
      </div>
    );
  }

  // ── INPUT / GENERATING ──────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-neutral-50 flex items-center justify-center px-4">
      <div className="w-full max-w-xl">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary-50 text-primary-700 text-xs font-semibold mb-4">
            <Sparkles className="w-3.5 h-3.5" /> AI Landing Page Builder
          </div>
          <h1 className="text-3xl font-bold text-neutral-900">What&apos;s this page for?</h1>
          <p className="text-neutral-500 mt-2">Describe it in plain words. We&apos;ll design a beautiful, on-brand page — guaranteed to look great.</p>
        </div>

        <div className="bg-white rounded-2xl border border-neutral-200 shadow-sm p-5">
          <textarea
            value={goal}
            onChange={(e) => setGoal(e.target.value)}
            placeholder="e.g. Promote our spring roofing special — free inspection, book by May 31"
            rows={4}
            disabled={phase === "generating"}
            className="w-full px-4 py-3 border border-neutral-200 rounded-xl text-sm text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
          />
          {error && <p className="text-sm text-red-600 mt-2">{error}</p>}
          <button
            onClick={handleGenerate}
            disabled={phase === "generating"}
            className="mt-4 w-full inline-flex items-center justify-center gap-2 py-3 bg-primary-600 text-white text-sm font-bold rounded-xl hover:bg-primary-700 disabled:opacity-60"
          >
            {phase === "generating"
              ? <><Loader2 className="w-4 h-4 animate-spin" /> Designing your page…</>
              : <>Build my page <ArrowRight className="w-4 h-4" /></>}
          </button>
        </div>

        <p className="text-center text-xs text-neutral-400 mt-4">
          Uses your brand colors, logo, and voice automatically.
        </p>
      </div>
    </div>
  );
}
