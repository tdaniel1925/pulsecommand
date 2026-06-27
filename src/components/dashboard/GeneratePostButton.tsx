"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Sparkles, Loader2, X, CheckCircle } from "lucide-react";

/**
 * On-demand post generation. Opens a small composer where the user can describe
 * what the post should be about and optionally pick a date to schedule it for.
 * The generated post lands as a DRAFT for review.
 */
export function GeneratePostButton({ defaultDate }: { defaultDate?: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [topic, setTopic] = useState("");
  const [date, setDate] = useState(defaultDate ?? "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  async function generate() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/dashboard/generate-post", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic: topic.trim() || undefined,
          scheduledFor: date ? new Date(date).toISOString() : undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Generation failed");
      // Show a confirmation so the user knows the draft was created and where to
      // find it — then refresh the list behind the success screen.
      setDone(true);
      setTopic("");
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  function closeAll() {
    setOpen(false);
    setDone(false);
    setError(null);
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 text-white text-sm font-semibold rounded-xl hover:bg-primary-700 transition-colors shadow-sm"
      >
        <Sparkles className="w-4 h-4" /> Generate Post
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4" onClick={() => !loading && closeAll()}>
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 space-y-4" onClick={(e) => e.stopPropagation()}>
            {done ? (
              /* Success — the post was created as a draft */
              <div className="text-center py-4 space-y-3">
                <div className="w-12 h-12 rounded-full bg-green-50 flex items-center justify-center mx-auto">
                  <CheckCircle className="w-6 h-6 text-green-600" />
                </div>
                <h3 className="font-bold text-neutral-900">Draft created</h3>
                <p className="text-sm text-neutral-500">
                  Your post is saved as a <strong>draft</strong> and won&apos;t go out until you publish or schedule it.
                  Find it in the list below, click to preview &amp; edit, then publish when you&apos;re happy.
                </p>
                <button
                  onClick={closeAll}
                  className="w-full inline-flex items-center justify-center gap-2 py-3 bg-primary-600 text-white text-sm font-bold rounded-xl hover:bg-primary-700"
                >
                  View my drafts
                </button>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-neutral-900 flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-primary-600" /> Generate a post
                  </h3>
                  <button onClick={() => !loading && closeAll()} className="text-neutral-400 hover:text-neutral-700">
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-neutral-500 mb-1.5">
                    What should it be about? <span className="font-normal text-neutral-400">(optional)</span>
                  </label>
                  <textarea
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    placeholder="e.g. Our spring promotion — 20% off through May"
                    rows={3}
                    disabled={loading}
                    className="w-full px-3 py-2 border border-neutral-200 rounded-xl text-sm text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
                  />
                  <p className="text-xs text-neutral-400 mt-1">Leave blank and we&apos;ll pick an on-brand topic for you.</p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-neutral-500 mb-1.5">
                    Schedule for <span className="font-normal text-neutral-400">(optional — leave blank for a draft)</span>
                  </label>
                  <input
                    type="datetime-local"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    disabled={loading}
                    className="w-full px-3 py-2 border border-neutral-200 rounded-xl text-sm text-neutral-900 focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>

                <p className="text-xs text-neutral-400">
                  We&apos;ll create a draft for you to review — it won&apos;t publish automatically.
                </p>

                {error && <p className="text-sm text-red-600">{error}</p>}

                <button
                  onClick={generate}
                  disabled={loading}
                  className="w-full inline-flex items-center justify-center gap-2 py-3 bg-primary-600 text-white text-sm font-bold rounded-xl hover:bg-primary-700 disabled:opacity-60"
                >
                  {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Generating… (~15s)</> : <>Generate <Sparkles className="w-4 h-4" /></>}
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
