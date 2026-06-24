"use client";

import { useState } from "react";
import { Loader2, RefreshCw, Upload, Palette, Type as TypeIcon, Layout, Square } from "lucide-react";
import type { KitContent } from "@/lib/studio/kit-schema";
import { KIT_LIMITS } from "@/lib/studio/kit-schema";
import type {
  ThemeProps, ThemeName, Density, ButtonStyle, ImageTreatment, FontPair,
} from "@/lib/studio/theme";

/**
 * The taste layer. The user never sees a color picker or a slider — only
 * curated, constrained choices that always map to a valid ThemeProps / a
 * length-capped string. Every interaction lands in a good state by construction.
 */

// ── Curated option sets (only in-bible choices are offered) ──────────────────
const MOODS: { value: ThemeName; label: string }[] = [
  { value: "Sunset", label: "Warm" },
  { value: "Bold", label: "Bold" },
  { value: "Midnight", label: "Dark" },
];
const DENSITIES: { value: Density; label: string }[] = [
  { value: "Compact", label: "Tight" },
  { value: "Cozy", label: "Balanced" },
  { value: "Spacious", label: "Airy" },
];
const BUTTONS: { value: ButtonStyle; label: string }[] = [
  { value: "Solid", label: "Solid" },
  { value: "Pill", label: "Pill" },
  { value: "Outline", label: "Outline" },
  { value: "Hard", label: "Hard" },
];
const IMAGE_TREATMENTS: { value: ImageTreatment; label: string }[] = [
  { value: "Soft", label: "Soft" },
  { value: "Frame", label: "Framed" },
  { value: "Duotone", label: "Duotone" },
  { value: "Clean", label: "Clean" },
];
const FONTS: { value: FontPair; label: string }[] = [
  { value: "Geometric", label: "Geometric" },
  { value: "Grotesque", label: "Grotesque" },
  { value: "Rounded", label: "Rounded" },
];

function Pills<T extends string>({
  options, value, onChange,
}: {
  options: { value: T; label: string }[];
  value: T | undefined;
  onChange: (v: T) => void;
}) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {options.map((o) => {
        const active = value === o.value;
        return (
          <button
            key={o.value}
            onClick={() => onChange(o.value)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              active ? "bg-primary-600 text-white" : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200"
            }`}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

function Group({ icon, title, action, children }: { icon: React.ReactNode; title: string; action?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-1.5 text-xs font-semibold text-neutral-500 uppercase tracking-wide">
        {icon} <span className="flex-1">{title}</span> {action}
      </div>
      {children}
    </div>
  );
}

/** A length-capped inline text field — edits can never exceed the layout's cap. */
function CappedField({
  label, value, max, onChange, multiline,
}: {
  label: string; value: string; max: number; onChange: (v: string) => void; multiline?: boolean;
}) {
  return (
    <label className="block">
      <span className="text-[11px] text-neutral-400">{label}</span>
      {multiline ? (
        <textarea
          value={value} maxLength={max} rows={2}
          onChange={(e) => onChange(e.target.value)}
          className="w-full mt-0.5 px-2.5 py-1.5 border border-neutral-200 rounded-lg text-sm text-neutral-900 focus:outline-none focus:ring-2 focus:ring-primary-400 resize-none"
        />
      ) : (
        <input
          value={value} maxLength={max}
          onChange={(e) => onChange(e.target.value)}
          className="w-full mt-0.5 px-2.5 py-1.5 border border-neutral-200 rounded-lg text-sm text-neutral-900 focus:outline-none focus:ring-2 focus:ring-primary-400"
        />
      )}
    </label>
  );
}

/** Inline "rewrite this section" button shown next to a section's heading. */
function RegenButton({ busy, onClick }: { busy: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={busy}
      title="Rewrite this section with AI"
      className="inline-flex items-center gap-1 text-[11px] font-medium text-primary-600 hover:text-primary-700 disabled:opacity-50"
    >
      {busy ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />}
      Rewrite
    </button>
  );
}

export function StudioEditor({
  content, theme, goal, onContentChange, onThemeChange,
}: {
  content: KitContent;
  theme: ThemeProps;
  goal: string;
  onContentChange: (next: KitContent) => void;
  onThemeChange: (next: ThemeProps) => void;
}) {
  const [regen, setRegen] = useState<"hero" | "showcase" | null>(null);
  const [regenSection, setRegenSection] = useState<string | null>(null);
  const [uploading, setUploading] = useState<"hero" | "showcase" | null>(null);

  const setTheme = (patch: Partial<ThemeProps>) => onThemeChange({ ...theme, ...patch });
  const patchContent = (fn: (c: KitContent) => void) => {
    const next = structuredClone(content);
    fn(next);
    onContentChange(next);
  };

  // Regenerate one section's copy independently ("rewrite just this section").
  async function regenerateSection(section: string) {
    setRegenSection(section);
    try {
      const res = await fetch("/api/studio/regenerate-section", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ section, goal }),
      });
      const data = await res.json();
      if (res.ok && data.value !== undefined) {
        patchContent((c) => {
          // Preserve any already-resolved image src on hero/showcase rewrites.
          if (section === "hero" && data.value) {
            const prevImg = c.hero.image;
            (c as unknown as Record<string, unknown>).hero = { ...data.value, image: prevImg };
          } else if (section === "showcase" && data.value) {
            const prevImg = c.showcase.image;
            (c as unknown as Record<string, unknown>).showcase = { ...data.value, image: prevImg };
          } else {
            (c as unknown as Record<string, unknown>)[section] = data.value;
          }
        });
      }
    } finally {
      setRegenSection(null);
    }
  }

  async function uploadImage(slot: "hero" | "showcase", file: File) {
    setUploading(slot);
    try {
      const fd = new FormData();
      fd.append("image", file);
      fd.append("slot", slot);
      const res = await fetch("/api/studio/upload-image", { method: "POST", body: fd });
      const data = await res.json();
      if (res.ok && data.url) {
        patchContent((c) => {
          if (slot === "hero") c.hero.image.src = data.url;
          else c.showcase.image.src = data.url;
        });
      }
    } finally {
      setUploading(null);
    }
  }

  async function regenerateImage(slot: "hero" | "showcase") {
    setRegen(slot);
    try {
      const scene = slot === "hero" ? content.hero.image.alt : content.showcase.image.alt;
      const res = await fetch("/api/studio/regenerate-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slot, scene }),
      });
      const data = await res.json();
      if (res.ok && data.url) {
        patchContent((c) => {
          if (slot === "hero") c.hero.image.src = data.url;
          else c.showcase.image.src = data.url;
        });
      }
    } finally {
      setRegen(null);
    }
  }

  return (
    <div className="space-y-6">
      {/* ── DESIGN (curated, can't-go-wrong) ─────────────────────────────── */}
      <Group icon={<Palette className="w-3.5 h-3.5" />} title="Mood">
        <Pills options={MOODS} value={theme.theme ?? "Sunset"} onChange={(v) => setTheme({ theme: v })} />
      </Group>
      <Group icon={<Layout className="w-3.5 h-3.5" />} title="Spacing">
        <Pills options={DENSITIES} value={theme.density ?? "Cozy"} onChange={(v) => setTheme({ density: v })} />
      </Group>
      <Group icon={<Square className="w-3.5 h-3.5" />} title="Buttons">
        <Pills options={BUTTONS} value={theme.buttonStyle ?? "Solid"} onChange={(v) => setTheme({ buttonStyle: v })} />
      </Group>
      <Group icon={<Square className="w-3.5 h-3.5" />} title="Images">
        <Pills options={IMAGE_TREATMENTS} value={theme.imageTreatment ?? "Soft"} onChange={(v) => setTheme({ imageTreatment: v })} />
      </Group>
      <Group icon={<TypeIcon className="w-3.5 h-3.5" />} title="Type">
        <Pills options={FONTS} value={theme.fontPair ?? "Geometric"} onChange={(v) => setTheme({ fontPair: v })} />
      </Group>

      <div className="border-t border-neutral-100" />

      {/* ── IMAGES (regenerate with AI or upload your own) ──────────────────── */}
      <Group icon={<RefreshCw className="w-3.5 h-3.5" />} title="Imagery">
        <div className="space-y-2">
          {(["hero", "showcase"] as const).map((slot) => (
            <div key={slot} className="flex items-center gap-1.5">
              <span className="text-xs text-neutral-500 capitalize w-16 flex-shrink-0">{slot}</span>
              <button
                onClick={() => regenerateImage(slot)}
                disabled={regen !== null}
                className="flex-1 inline-flex items-center justify-center gap-1 px-2 py-1.5 bg-neutral-100 text-neutral-700 text-xs font-medium rounded-lg hover:bg-neutral-200 disabled:opacity-60"
              >
                {regen === slot ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />}
                AI
              </button>
              <label className="flex-1 inline-flex items-center justify-center gap-1 px-2 py-1.5 bg-neutral-100 text-neutral-700 text-xs font-medium rounded-lg hover:bg-neutral-200 cursor-pointer">
                {uploading === slot ? <Loader2 className="w-3 h-3 animate-spin" /> : <Upload className="w-3 h-3" />}
                Upload
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp,image/gif"
                  className="hidden"
                  disabled={uploading !== null}
                  onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadImage(slot, f); e.target.value = ""; }}
                />
              </label>
            </div>
          ))}
        </div>
      </Group>

      <div className="border-t border-neutral-100" />

      {/* ── COPY (length-capped, can't break layout) ─────────────────────── */}
      <Group icon={<TypeIcon className="w-3.5 h-3.5" />} title="Headline"
        action={<RegenButton busy={regenSection === "hero"} onClick={() => regenerateSection("hero")} />}>
        <CappedField label="Headline" value={content.hero.headline} max={KIT_LIMITS.headline}
          onChange={(v) => patchContent((c) => { c.hero.headline = v; })} />
        <CappedField label="Subhead" value={content.hero.subhead} max={KIT_LIMITS.subhead} multiline
          onChange={(v) => patchContent((c) => { c.hero.subhead = v; })} />
        <CappedField label="Button" value={content.hero.ctaPrimary} max={KIT_LIMITS.cta}
          onChange={(v) => patchContent((c) => { c.hero.ctaPrimary = v; })} />
      </Group>

      <Group icon={<TypeIcon className="w-3.5 h-3.5" />} title="Call to action"
        action={<RegenButton busy={regenSection === "cta"} onClick={() => regenerateSection("cta")} />}>
        <CappedField label="Headline" value={content.cta.headline} max={KIT_LIMITS.headline}
          onChange={(v) => patchContent((c) => { c.cta.headline = v; })} />
        <CappedField label="Button" value={content.cta.button} max={KIT_LIMITS.cta}
          onChange={(v) => patchContent((c) => { c.cta.button = v; })} />
      </Group>

      <div className="border-t border-neutral-100" />

      {/* ── REWRITE ANY SECTION ──────────────────────────────────────────── */}
      <Group icon={<RefreshCw className="w-3.5 h-3.5" />} title="Rewrite a section">
        <div className="grid grid-cols-2 gap-1.5">
          {([
            ["features", "Features"],
            ["showcase", "Showcase"],
            ["testimonials", "Testimonials"],
            ["pricing", "Pricing"],
            ["faq", "FAQ"],
            ["team", "Team"],
          ] as const)
            .filter(([key]) => {
              // Only offer sections that exist on this page's content.
              if (key === "pricing") return !!content.pricing?.tiers?.length;
              if (key === "faq") return !!content.faq?.items?.length;
              if (key === "team") return !!content.team?.members?.length;
              return true;
            })
            .map(([key, label]) => (
              <button
                key={key}
                type="button"
                onClick={() => regenerateSection(key)}
                disabled={regenSection !== null}
                className="inline-flex items-center justify-center gap-1.5 px-2 py-1.5 bg-neutral-100 text-neutral-700 text-xs font-medium rounded-lg hover:bg-neutral-200 disabled:opacity-60"
              >
                {regenSection === key ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />}
                {label}
              </button>
            ))}
        </div>
      </Group>
    </div>
  );
}
