"use client";

import { useState } from "react";
import { Loader2, RefreshCw, Palette, Type as TypeIcon, Layout, Square } from "lucide-react";
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

function Group({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-1.5 text-xs font-semibold text-neutral-500 uppercase tracking-wide">
        {icon} {title}
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

export function StudioEditor({
  content, theme, onContentChange, onThemeChange,
}: {
  content: KitContent;
  theme: ThemeProps;
  onContentChange: (next: KitContent) => void;
  onThemeChange: (next: ThemeProps) => void;
}) {
  const [regen, setRegen] = useState<"hero" | "showcase" | null>(null);

  const setTheme = (patch: Partial<ThemeProps>) => onThemeChange({ ...theme, ...patch });
  const patchContent = (fn: (c: KitContent) => void) => {
    const next = structuredClone(content);
    fn(next);
    onContentChange(next);
  };

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

      {/* ── IMAGES (regenerate) ──────────────────────────────────────────── */}
      <Group icon={<RefreshCw className="w-3.5 h-3.5" />} title="Imagery">
        <div className="flex gap-2">
          {(["hero", "showcase"] as const).map((slot) => (
            <button
              key={slot}
              onClick={() => regenerateImage(slot)}
              disabled={regen !== null}
              className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-neutral-100 text-neutral-700 text-xs font-medium rounded-lg hover:bg-neutral-200 disabled:opacity-60 capitalize"
            >
              {regen === slot ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
              {slot} image
            </button>
          ))}
        </div>
      </Group>

      <div className="border-t border-neutral-100" />

      {/* ── COPY (length-capped, can't break layout) ─────────────────────── */}
      <Group icon={<TypeIcon className="w-3.5 h-3.5" />} title="Headline">
        <CappedField label="Headline" value={content.hero.headline} max={KIT_LIMITS.headline}
          onChange={(v) => patchContent((c) => { c.hero.headline = v; })} />
        <CappedField label="Subhead" value={content.hero.subhead} max={KIT_LIMITS.subhead} multiline
          onChange={(v) => patchContent((c) => { c.hero.subhead = v; })} />
        <CappedField label="Button" value={content.hero.ctaPrimary} max={KIT_LIMITS.cta}
          onChange={(v) => patchContent((c) => { c.hero.ctaPrimary = v; })} />
      </Group>

      <Group icon={<TypeIcon className="w-3.5 h-3.5" />} title="Call to action">
        <CappedField label="Headline" value={content.cta.headline} max={KIT_LIMITS.headline}
          onChange={(v) => patchContent((c) => { c.cta.headline = v; })} />
        <CappedField label="Button" value={content.cta.button} max={KIT_LIMITS.cta}
          onChange={(v) => patchContent((c) => { c.cta.button = v; })} />
      </Group>
    </div>
  );
}
