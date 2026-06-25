"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Sparkles, Loader2, Globe, ArrowRight, Check } from "lucide-react";
import { KIT_LIST, DEFAULT_KIT, type KitId } from "@/components/studio/kits/registry";
import { StudioEditor } from "@/components/studio/StudioEditor";
import { CanvasPage } from "@/components/studio/CanvasPage";
import { LayoutEditor } from "@/components/studio/LayoutEditor";
import { DEFAULT_LAYOUT, normalizeLayout, type BlockType } from "@/components/studio/blocks/registry";
import type { KitContent } from "@/lib/studio/kit-schema";
import type { ThemeProps } from "@/lib/studio/theme";

type Phase = "input" | "generating" | "preview" | "publishing" | "published";

export default function StudioNewPage() {
  const [goal, setGoal] = useState("");
  const [kit, setKit] = useState<KitId>(DEFAULT_KIT);
  const [phase, setPhase] = useState<Phase>("input");
  const [content, setContent] = useState<KitContent | null>(null);
  const [theme, setTheme] = useState<ThemeProps>({});
  const [layout, setLayout] = useState<BlockType[]>(DEFAULT_LAYOUT);
  const [variants, setVariants] = useState<Record<string, string>>({});
  const [pageId, setPageId] = useState<string | null>(null);
  const [liveUrl, setLiveUrl] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [savingDraft, setSavingDraft] = useState(false);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Debounced autosave: persist content/theme/layout/variants edits ~800ms after the last change.
  const scheduleSave = useCallback((c: KitContent, t: ThemeProps, l: BlockType[], vr: Record<string, string>, id: string | null) => {
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(async () => {
      setSavingDraft(true);
      try {
        const res = await fetch("/api/studio/save", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ pageId: id, goal, content: c, theme: t, kit, layout: l, variants: vr }),
        });
        const data = await res.json();
        if (res.ok && data.id && !id) setPageId(data.id);
      } finally {
        setSavingDraft(false);
      }
    }, 800);
  }, [goal, kit]);

  useEffect(() => () => { if (saveTimer.current) clearTimeout(saveTimer.current); }, []);

  // Reopen an existing page when ?page=<id> is present (from the dashboard).
  useEffect(() => {
    const id = new URLSearchParams(window.location.search).get("page");
    if (!id) return;
    let alive = true;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- intentional: show the loader immediately while we fetch the saved page
    setPhase("generating");
    (async () => {
      try {
        const r = await fetch(`/api/studio/page/${id}`);
        const d = await r.json();
        if (!alive) return;
        if (!r.ok || d.error || !d.content) { setError("Could not load that page."); setPhase("input"); return; }
        setContent(d.content);
        setTheme(d.theme ?? {});
        setLayout(normalizeLayout(d.layout));
        setVariants((d.variants && typeof d.variants === "object") ? d.variants : {});
        setKit((d.kit as KitId) ?? DEFAULT_KIT);
        setGoal(d.goal ?? "");
        setPageId(d.id);
        if (d.status === "live" && d.url) setLiveUrl(d.url);
        setPhase(d.status === "live" ? "published" : "preview");
      } catch {
        if (alive) { setError("Could not load that page."); setPhase("input"); }
      }
    })();
    return () => { alive = false; };
  }, []);

  function updateContent(next: KitContent) {
    setContent(next);
    scheduleSave(next, theme, layout, variants, pageId);
  }
  function updateTheme(next: ThemeProps) {
    setTheme(next);
    if (content) scheduleSave(content, next, layout, variants, pageId);
  }
  function updateLayout(next: BlockType[]) {
    const safe = normalizeLayout(next);
    setLayout(safe);
    if (content) scheduleSave(content, theme, safe, variants, pageId);
  }
  function updateVariants(next: Record<string, string>) {
    setVariants(next);
    if (content) scheduleSave(content, theme, layout, next, pageId);
  }

  async function handleGenerate() {
    if (goal.trim().length < 3) {
      setError("Tell us what the page is for.");
      return;
    }
    setError("");
    setPhase("generating");
    // Guard the request: if it hangs (network/cold start), surface an error
    // instead of leaving the user on an endless spinner that looks broken.
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 75_000);
    try {
      const res = await fetch("/api/studio/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ goal }),
        signal: ctrl.signal,
      });
      let data: { content?: KitContent; theme?: ThemeProps; layout?: BlockType[]; variants?: Record<string, string>; error?: string } = {};
      try { data = await res.json(); } catch { /* non-JSON error body */ }
      if (!res.ok || !data.content) {
        throw new Error(data.error ?? `Generation failed (${res.status}). Please try again.`);
      }
      setContent(data.content);
      setTheme(data.theme ?? {});
      const composedLayout = normalizeLayout(data.layout);
      setLayout(composedLayout);
      const composedVariants = (data.variants && typeof data.variants === "object") ? data.variants as Record<string, string> : {};
      setVariants(composedVariants);

      // Save a draft immediately so we have a page id to publish.
      const saveRes = await fetch("/api/studio/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ goal, content: data.content, theme: data.theme, kit, layout: composedLayout, variants: composedVariants }),
      });
      const saved = await saveRes.json();
      if (saveRes.ok) setPageId(saved.id);

      setPhase("preview");

      // Fill images progressively AFTER the preview shows — each Gemini render
      // takes ~10-15s, so doing them here (not in /generate) keeps that request
      // fast and avoids the Vercel function timeout.
      void fillImagesInBackground(data.content);
    } catch (e) {
      const aborted = e instanceof DOMException && e.name === "AbortError";
      setError(aborted
        ? "That took too long and timed out. Please try again."
        : e instanceof Error ? e.message : "Something went wrong");
      setPhase("input");
    } finally {
      clearTimeout(timer);
    }
  }

  // Generate hero + showcase images one at a time and patch them into the live
  // preview as they arrive. Best-effort — a failure just leaves the placeholder.
  async function fillImagesInBackground(c: KitContent) {
    for (const slot of ["hero", "showcase"] as const) {
      try {
        const scene = slot === "hero" ? c.hero.image.alt : c.showcase.image.alt;
        const res = await fetch("/api/studio/regenerate-image", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ slot, scene }),
        });
        const data = await res.json();
        if (res.ok && data.url) {
          setContent((prev) => {
            if (!prev) return prev;
            const next = structuredClone(prev);
            if (slot === "hero") next.hero.image.src = data.url;
            else next.showcase.image.src = data.url;
            return next;
          });
        }
      } catch {
        // ignore — placeholder/logo stays
      }
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
          {/* Editor pane: sections (layout) + design + copy */}
          <aside className="w-80 flex-shrink-0 bg-white border-r border-neutral-200 overflow-y-auto p-5 space-y-6">
            <LayoutEditor content={content} layout={layout} variants={variants} onLayoutChange={updateLayout} onVariantsChange={updateVariants} />
            <div className="border-t border-neutral-100" />
            <StudioEditor content={content} theme={theme} goal={goal} onContentChange={updateContent} onThemeChange={updateTheme} />
          </aside>

          {/* Live preview — the canvas, full-bleed, exactly as it will publish */}
          <main className="flex-1 overflow-y-auto bg-white">
            <CanvasPage content={content} theme={theme} layout={layout} variants={variants} />
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

          {/* Kit picker — choose a design style */}
          <div className="mt-4">
            <p className="text-xs font-semibold text-neutral-500 mb-2">Choose a style</p>
            <div className="grid grid-cols-2 gap-2">
              {KIT_LIST.map((k) => {
                const active = kit === k.id;
                return (
                  <button
                    key={k.id}
                    type="button"
                    onClick={() => setKit(k.id)}
                    disabled={phase === "generating"}
                    className={`text-left p-3 rounded-xl border transition-colors ${
                      active
                        ? "border-primary-500 bg-primary-50 ring-1 ring-primary-400"
                        : "border-neutral-200 hover:bg-neutral-50"
                    }`}
                  >
                    <span className="block text-sm font-semibold text-neutral-900">{k.name}</span>
                    <span className="block text-xs text-neutral-500 mt-0.5 leading-snug">{k.description}</span>
                  </button>
                );
              })}
            </div>
          </div>

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
