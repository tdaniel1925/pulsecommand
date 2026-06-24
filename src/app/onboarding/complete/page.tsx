"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import OnboardingNav from "@/components/OnboardingNav";

type PageState = "loading" | "success" | "error";

export default function OnboardingCompletePage() {
  const router = useRouter();
  const [state, setState] = useState<PageState>("loading");
  const [businessName, setBusinessName] = useState<string>("");
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [progress, setProgress] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const calledRef = useRef(false);

  // Progress bar: 0 → 95% over 30 seconds
  useEffect(() => {
    const start = Date.now();
    const duration = 30_000;
    intervalRef.current = setInterval(() => {
      const elapsed = Date.now() - start;
      const pct = Math.min(95, (elapsed / duration) * 95);
      setProgress(pct);
      if (pct >= 95) clearInterval(intervalRef.current!);
    }, 200);
    return () => clearInterval(intervalRef.current!);
  }, []);

  const runActivation = async () => {
    setState("loading");
    setProgress(0);
    setErrorMessage("");

    try {
      const res = await fetch("/api/onboarding/complete", { method: "POST" });
      const json = await res.json();
      if (res.ok && json.ok) {
        setProgress(100);
        setBusinessName(json.businessName ?? "");
        setState("success");
      } else {
        setErrorMessage(json.error ?? "Activation failed. Please try again.");
        setState("error");
      }
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : "Network error. Please try again.");
      setState("error");
    }
  };

  // Call on mount (once)
  useEffect(() => {
    if (calledRef.current) return;
    calledRef.current = true;
    runActivation();
  }, []);

  const heading = businessName ? `You're all set, ${businessName.split(" ")[0]}!` : "You're all set!";

  return (
    <div className="min-h-screen bg-neutral-50">
      <OnboardingNav current="complete" />

      <main className="max-w-xl mx-auto px-4 py-16 flex flex-col items-center text-center">
        {/* ── LOADING ── */}
        {state === "loading" && (
          <>
            <svg
              className="animate-spin w-12 h-12 text-indigo-600 mb-6"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
              />
            </svg>
            <h1 className="text-3xl font-extrabold text-neutral-900 mb-2">Activating your account...</h1>
            <p className="text-neutral-500 mb-8">Generating your first post — this takes about 30 seconds</p>

            {/* Progress bar */}
            <div className="w-full bg-neutral-200 rounded-full h-2 overflow-hidden">
              <div
                className="bg-indigo-600 h-2 rounded-full transition-all duration-200 ease-linear"
                style={{ width: `${progress}%` }}
              />
            </div>
          </>
        )}

        {/* ── SUCCESS ── */}
        {state === "success" && (
          <>
            {/* Animated checkmark */}
            <div
              className="w-20 h-20 rounded-full bg-green-100 border-4 border-green-200 flex items-center justify-center mb-6"
              style={{ animation: "scaleIn 300ms ease forwards" }}
            >
              <svg className="w-10 h-10 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <style>{`@keyframes scaleIn { from { transform: scale(0); } to { transform: scale(1); } }`}</style>

            <h1 className="text-4xl font-extrabold text-neutral-900 mb-3">{heading}</h1>
            <p className="text-lg text-neutral-500 mb-10">Your account is active and your first post is being generated.</p>

            {/* Info cards */}
            <div className="grid grid-cols-3 gap-4 w-full mb-10">
              <div className="bg-white rounded-2xl border border-neutral-200 shadow-sm p-5 text-left">
                <div className="text-2xl mb-2">🎨</div>
                <p className="font-semibold text-neutral-800 text-sm mb-1">First Post</p>
                <p className="text-xs text-neutral-500">Being generated now — check Social in a few minutes</p>
              </div>
              <div className="bg-white rounded-2xl border border-neutral-200 shadow-sm p-5 text-left">
                <div className="text-2xl mb-2">📱</div>
                <p className="font-semibold text-neutral-800 text-sm mb-1">Connect Accounts</p>
                <p className="text-xs text-neutral-500">Link Instagram, LinkedIn &amp; more in Settings</p>
              </div>
              <div className="bg-white rounded-2xl border border-neutral-200 shadow-sm p-5 text-left">
                <div className="text-2xl mb-2">📊</div>
                <p className="font-semibold text-neutral-800 text-sm mb-1">Your Dashboard</p>
                <p className="text-xs text-neutral-500">Explore your content hub</p>
              </div>
            </div>

            <button
              onClick={() => router.push("/dashboard?welcome=1")}
              className="inline-flex items-center gap-2 px-8 py-3.5 bg-indigo-600 text-white font-semibold rounded-xl hover:bg-indigo-700 transition-colors text-base mb-4"
            >
              Go to Dashboard →
            </button>
            <a href="/dashboard/settings" className="text-sm text-indigo-600 hover:underline">
              Connect social accounts →
            </a>
          </>
        )}

        {/* ── ERROR ── */}
        {state === "error" && (
          <>
            <div className="w-20 h-20 rounded-full bg-red-100 border-4 border-red-200 flex items-center justify-center mb-6">
              <svg className="w-10 h-10 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h1 className="text-3xl font-extrabold text-neutral-900 mb-3">Something went wrong</h1>
            {errorMessage && (
              <p className="text-sm text-neutral-400 mb-8">{errorMessage}</p>
            )}
            <button
              onClick={() => {
                calledRef.current = false;
                runActivation();
              }}
              className="inline-flex items-center gap-2 px-8 py-3.5 bg-indigo-600 text-white font-semibold rounded-xl hover:bg-indigo-700 transition-colors text-base"
            >
              Try Again
            </button>
          </>
        )}
      </main>
    </div>
  );
}
