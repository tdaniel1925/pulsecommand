"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Check, Zap, Star, ArrowRight, Share2, Image as ImageIcon, Loader2 } from "lucide-react";
import OnboardingNav from "@/components/OnboardingNav";

const included = [
  { icon: <Share2 className="w-4 h-4 text-primary-600" />, text: "AI social posts across your connected channels" },
  { icon: <ImageIcon className="w-4 h-4 text-purple-600" />, text: "On-brand AI images for every post" },
];

// New focused flow: account → brand setup (with website scan) → live.
const STEP_ORDER = ["signed_up", "brand_assets_saved", "active"];

function stepComplete(currentStep: string, targetStep: string) {
  const ci = STEP_ORDER.indexOf(currentStep);
  const ti = STEP_ORDER.indexOf(targetStep);
  // Legacy steps (avatar/voice/call) all imply brand assets were saved.
  const legacyDone = ["avatar_selected", "voice_selected", "call_done", "profile_built"];
  if (targetStep === "brand_assets_saved" && legacyDone.includes(currentStep)) return true;
  return ci >= ti && ci >= 0 && ti >= 0;
}

export default function WelcomePage() {
  const [onboardingStep, setOnboardingStep] = useState<string>("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/auth/me")
      .then(r => r.json())
      .then(d => {
        setOnboardingStep(d.onboarding_step ?? "signed_up");
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const hasBrandAssets = stepComplete(onboardingStep, "brand_assets_saved");

  // Next unlocked step
  const nextHref = !hasBrandAssets ? "/onboarding/brand-assets" : "/dashboard";
  const nextLabel = !hasBrandAssets ? "Start: Set Up Your Brand →" : "Go to Dashboard →";

  const steps = [
    {
      num: 1,
      title: "Create Your Account",
      desc: "Account created and plan activated successfully.",
      done: true,
      href: null as string | null,
      cta: null as string | null,
      locked: false,
    },
    {
      num: 2,
      title: "Set Up Your Brand",
      desc: "Enter your website — we'll scan it to auto-fill your business details, colors, logo, and content topics. Review, tweak, and save.",
      done: hasBrandAssets,
      href: "/onboarding/brand-assets",
      cta: hasBrandAssets ? null : "Set Up Brand",
      locked: false,
    },
    {
      num: 3,
      title: "You're Live",
      desc: "We connect your social accounts and start generating on-brand posts automatically.",
      done: hasBrandAssets,
      href: hasBrandAssets ? "/dashboard" : null,
      cta: hasBrandAssets ? "Go to Dashboard" : null,
      locked: !hasBrandAssets,
    },
  ];

  return (
    <>
      <OnboardingNav current="welcome" />

      <main className="min-h-screen bg-neutral-50">
        {/* Hero */}
        <div className="bg-gradient-to-r from-primary-700 via-primary-600 to-primary-500 py-14 px-4 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/15 border border-white/25 text-white text-sm font-medium mb-5">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-white" />
            </span>
            Account Active — 14-Day Free Trial Started
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-3">
            Welcome to BundledContent!
          </h1>
          <p className="text-primary-100 text-base max-w-xl mx-auto">
            Your AI marketing engine is ready. Complete the steps below to launch your full content pipeline.
          </p>
        </div>

        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

            {/* Left: Steps */}
            <div className="lg:col-span-2 space-y-4">
              <h2 className="text-xl font-bold text-neutral-900">Your Setup Checklist</h2>
              <p className="text-sm text-neutral-500 mb-2">Complete these steps to start generating content.</p>

              {loading ? (
                <div className="flex items-center justify-center py-12 text-neutral-400">
                  <Loader2 className="w-5 h-5 animate-spin mr-2" /> Loading…
                </div>
              ) : (
                steps.map((step) => {
                  const isActive = !step.done && !step.locked && !!step.href;
                  return (
                    <div
                      key={step.num}
                      className={`flex items-start gap-4 p-4 rounded-2xl border transition-all ${
                        step.done
                          ? "bg-green-50 border-green-200"
                          : isActive
                          ? "bg-primary-50 border-2 border-primary-300 relative overflow-hidden"
                          : "bg-white border-neutral-200 opacity-50"
                      }`}
                    >
                      {isActive && (
                        <div className="absolute top-0 right-0 bg-primary-600 text-white text-xs font-bold px-3 py-1 rounded-bl-lg">
                          NEXT STEP
                        </div>
                      )}

                      <div className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${
                        step.done ? "bg-green-500" : isActive ? "bg-primary-600" : "bg-neutral-200"
                      }`}>
                        {step.done
                          ? <Check className="w-5 h-5 text-white" />
                          : <span className={`font-bold text-sm ${isActive ? "text-white" : "text-neutral-500"}`}>{step.num}</span>
                        }
                      </div>

                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <p className={`text-sm font-semibold ${step.done ? "text-green-900" : isActive ? "text-primary-900" : "text-neutral-700"}`}>
                            {step.title}
                          </p>
                          {step.done && <span className="text-xs text-green-700 bg-green-100 px-2 py-0.5 rounded-full">Done ✓</span>}
                          {step.locked && <span className="text-xs text-neutral-400 bg-neutral-100 px-2 py-0.5 rounded-full">Locked</span>}
                        </div>
                        <p className={`text-xs mb-3 ${step.done ? "text-green-700" : isActive ? "text-primary-700" : "text-neutral-500"}`}>
                          {step.desc}
                        </p>
                        {step.href && step.cta && (
                          <Link
                            href={step.href}
                            className="inline-flex items-center gap-1.5 px-4 py-2 bg-primary-600 text-white text-xs font-bold rounded-lg hover:bg-primary-700 transition-colors"
                          >
                            {step.cta} <ArrowRight className="w-3.5 h-3.5" />
                          </Link>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Right: Sidebar */}
            <div className="space-y-5">
              {/* Plan */}
              <div className="bg-neutral-900 rounded-2xl p-6 text-white">
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-9 h-9 bg-primary-600 rounded-lg flex items-center justify-center">
                    <Zap className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="font-bold text-sm">BundledContent</p>
                    <p className="text-neutral-400 text-xs">AI Social Posts on Autopilot</p>
                  </div>
                </div>

                <div className="mb-4 pb-4 border-b border-neutral-800">
                  <div className="flex items-end justify-between">
                    <span className="text-sm font-semibold text-white">Your plan is active</span>
                    <span className="text-xs text-green-400 font-medium bg-green-400/10 px-2 py-1 rounded-full">No lock-in</span>
                  </div>
                  <p className="text-neutral-500 text-xs mt-1">First charge after 14-day free trial</p>
                </div>

                <div className="space-y-3">
                  {included.map(({ icon, text }) => (
                    <div key={text} className="flex items-start gap-3">
                      <div className="w-6 h-6 bg-neutral-800 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                        {icon}
                      </div>
                      <span className="text-neutral-300 text-xs leading-relaxed">{text}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Trial */}
              <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl border border-green-200 p-6">
                <div className="flex items-center gap-2 mb-3">
                  <Star className="w-4 h-4 text-green-600" />
                  <p className="text-sm font-bold text-green-900">Free Trial Active</p>
                </div>
                <p className="text-xs text-green-700 mb-3">14 days remaining. No charge until your trial ends.</p>
                <div className="w-full bg-green-200 rounded-full h-1.5">
                  <div className="bg-green-500 h-1.5 rounded-full" style={{ width: "100%" }} />
                </div>
                <p className="text-xs text-green-600 mt-2">Trial ends in 14 days</p>
              </div>

              {/* Next step CTA */}
              {!loading && (
                <Link
                  href={nextHref}
                  className="block w-full py-3 bg-primary-600 text-white text-sm font-bold rounded-xl text-center hover:bg-primary-700 transition-colors shadow-md"
                >
                  {nextLabel}
                </Link>
              )}
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
