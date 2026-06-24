"use client";

import { useState } from "react";
import { ChevronUp, ChevronDown, X, Plus, Layers } from "lucide-react";
import type { KitContent } from "@/lib/studio/kit-schema";
import {
  BLOCKS,
  MOVABLE_BLOCK_TYPES,
  type BlockType,
} from "@/components/studio/blocks/registry";

/**
 * Curated layout editor — the "can never break" control surface.
 *
 * The user adds, removes, and moves whole BLOCKS (never freeform drag/resize).
 * Pinned structural blocks (header/footer) are shown but locked. Every action
 * produces a new ordered list that the parent runs through normalizeLayout, so
 * the page always stays valid. Blocks that need optional content the page doesn't
 * have are still offerable — they fall back to on-brand placeholder copy.
 */
export function LayoutEditor({
  content,
  layout,
  variants,
  onLayoutChange,
  onVariantsChange,
}: {
  content: KitContent;
  layout: BlockType[];
  variants: Record<string, string>;
  onLayoutChange: (next: BlockType[]) => void;
  onVariantsChange: (next: Record<string, string>) => void;
}) {
  const [adding, setAdding] = useState(false);

  // Body = movable blocks only (header/footer are pinned by normalizeLayout).
  const body = layout.filter((t) => !BLOCKS[t].pinned);

  const move = (i: number, dir: -1 | 1) => {
    const j = i + dir;
    if (j < 0 || j >= body.length) return;
    const next = [...body];
    [next[i], next[j]] = [next[j], next[i]];
    onLayoutChange(next);
  };
  const remove = (i: number) => onLayoutChange(body.filter((_, k) => k !== i));
  const add = (type: BlockType) => {
    setAdding(false);
    onLayoutChange([...body, type]);
  };

  // Blocks not currently in the page, offered in the add menu.
  const present = new Set(body);
  const available = MOVABLE_BLOCK_TYPES.filter((t) => !present.has(t));

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-1.5 text-xs font-semibold text-neutral-500 uppercase tracking-wide">
        <Layers className="w-3.5 h-3.5" /> Sections
      </div>

      <ul className="space-y-1">
        {body.map((type, i) => {
          const meta = BLOCKS[type];
          const unmet = meta.needs && !meta.needs(content);
          const activeVariant = variants[type] ?? meta.variants?.[0]?.id;
          return (
            <li
              key={`${type}-${i}`}
              className="px-2.5 py-2 rounded-lg border border-neutral-200 bg-white"
            >
            <div className="flex items-center gap-2">
              <span className="flex-1 min-w-0">
                <span className="block text-sm font-medium text-neutral-800 truncate">{meta.label}</span>
                {unmet && (
                  <span className="block text-[11px] text-amber-600">Shows sample content</span>
                )}
              </span>
              <div className="flex items-center gap-0.5 flex-shrink-0">
                <button
                  onClick={() => move(i, -1)}
                  disabled={i === 0}
                  className="p-1 text-neutral-400 hover:text-neutral-700 disabled:opacity-30"
                  aria-label="Move up"
                >
                  <ChevronUp className="w-4 h-4" />
                </button>
                <button
                  onClick={() => move(i, 1)}
                  disabled={i === body.length - 1}
                  className="p-1 text-neutral-400 hover:text-neutral-700 disabled:opacity-30"
                  aria-label="Move down"
                >
                  <ChevronDown className="w-4 h-4" />
                </button>
                <button
                  onClick={() => remove(i)}
                  className="p-1 text-neutral-400 hover:text-red-600"
                  aria-label="Remove section"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
            {meta.variants && meta.variants.length > 1 && (
              <div className="flex gap-1 mt-2">
                {meta.variants.map((vr) => {
                  const on = activeVariant === vr.id;
                  return (
                    <button
                      key={vr.id}
                      onClick={() => onVariantsChange({ ...variants, [type]: vr.id })}
                      className={`px-2 py-0.5 rounded text-[11px] font-medium ${
                        on ? "bg-primary-600 text-white" : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200"
                      }`}
                    >
                      {vr.label}
                    </button>
                  );
                })}
              </div>
            )}
            </li>
          );
        })}
      </ul>

      {/* Add block */}
      {available.length > 0 && (
        <div>
          {adding ? (
            <div className="border border-neutral-200 rounded-lg p-1.5 space-y-0.5 max-h-56 overflow-y-auto">
              {available.map((type) => (
                <button
                  key={type}
                  onClick={() => add(type)}
                  className="w-full text-left px-2.5 py-1.5 rounded-md hover:bg-neutral-100"
                >
                  <span className="block text-sm font-medium text-neutral-800">{BLOCKS[type].label}</span>
                  {BLOCKS[type].hint && (
                    <span className="block text-[11px] text-neutral-500">{BLOCKS[type].hint}</span>
                  )}
                </button>
              ))}
              <button
                onClick={() => setAdding(false)}
                className="w-full text-center px-2.5 py-1.5 text-xs text-neutral-400 hover:text-neutral-600"
              >
                Cancel
              </button>
            </div>
          ) : (
            <button
              onClick={() => setAdding(true)}
              className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium text-primary-700 border border-dashed border-primary-300 rounded-lg hover:bg-primary-50"
            >
              <Plus className="w-3.5 h-3.5" /> Add a section
            </button>
          )}
        </div>
      )}

      <p className="text-[11px] text-neutral-400">Header and footer are always present.</p>
    </div>
  );
}
