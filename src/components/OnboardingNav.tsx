"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import Image from "next/image";

// Retired steps (choose-avatar/choose-voice/interview) are kept in the union so
// any lingering links still typecheck, but they no longer appear in the flow.
type Step = "sign-up" | "schedule" | "welcome" | "brand-assets" | "choose-avatar" | "choose-voice" | "interview" | "complete";

const steps: { key: Step; label: string; href: string }[] = [
  { key: "welcome", label: "Welcome", href: "/onboarding/welcome" },
  { key: "brand-assets", label: "Brand Setup", href: "/onboarding/brand-assets" },
  { key: "complete", label: "Complete", href: "/onboarding/complete" },
];

export default function OnboardingNav({ current }: { current: Step }) {
  const currentIndex = steps.findIndex((s) => s.key === current);
  const [loggedIn, setLoggedIn] = useState<boolean | null>(null);

  useEffect(() => {
    fetch("/api/auth/me")
      .then(async r => {
        if (!r.ok) { setLoggedIn(false); return; }
        const d = await r.json();
        // Logged in if we got any user data back
        setLoggedIn(!!(d?.id || d?.email || d?.first_name));
      })
      .catch(() => setLoggedIn(false));
  }, []);

  return (
    <header className="bg-white border-b border-neutral-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          <Link href="/" className="flex items-center">
            <Image src="/logo.png" alt="BundledContent" width={160} height={54} className="h-11 w-auto" priority />
          </Link>

          <div className="hidden md:flex items-center gap-6">
            {steps.map((step, i) => (
              <span
                key={step.key}
                className={`font-medium text-sm pb-0.5 ${
                  step.key === current
                    ? "text-primary-600 border-b-2 border-primary-600"
                    : i < currentIndex
                    ? "text-neutral-500"
                    : "text-neutral-400"
                }`}
              >
                {step.label}
              </span>
            ))}
          </div>

          <div className="flex items-center gap-3">
            {loggedIn === null ? null : loggedIn ? (
              <Link
                href="/dashboard"
                className="px-4 py-2 text-primary-600 font-medium border border-primary-200 rounded-lg hover:bg-primary-50 transition-colors text-sm"
              >
                ← Back to Dashboard
              </Link>
            ) : (
              <>
                <span className="text-sm text-neutral-500">Already have an account?</span>
                <Link
                  href="/login"
                  className="px-4 py-2 text-primary-600 font-medium border border-primary-200 rounded-lg hover:bg-primary-50 transition-colors text-sm"
                >
                  Sign In
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
