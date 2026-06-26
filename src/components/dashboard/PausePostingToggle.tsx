"use client";

import { useState } from "react";
import { Pause, Play, Loader2 } from "lucide-react";

/**
 * Lets a client pause/resume automatic posting. When paused, the generation cron
 * skips them — nothing new is written or published until they resume.
 */
export function PausePostingToggle({ defaultPaused }: { defaultPaused: boolean }) {
  const [paused, setPaused] = useState(defaultPaused);
  const [loading, setLoading] = useState(false);

  async function toggle() {
    const next = !paused;
    setLoading(true);
    try {
      const res = await fetch("/api/dashboard/pause-posting", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paused: next }),
      });
      if (res.ok) setPaused(next);
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={toggle}
      disabled={loading}
      title={paused ? "Resume automatic posting" : "Pause automatic posting"}
      className={`inline-flex items-center gap-1.5 px-3 py-2 text-sm font-semibold rounded-xl border transition-colors disabled:opacity-60 ${
        paused
          ? "bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100"
          : "bg-white text-neutral-600 border-neutral-200 hover:bg-neutral-50"
      }`}
    >
      {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : paused ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
      {paused ? "Posting paused — Resume" : "Pause posting"}
    </button>
  );
}
