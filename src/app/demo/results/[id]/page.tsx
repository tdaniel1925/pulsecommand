"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {
  Zap, Clock, ArrowRight, CheckCircle, TrendingUp
} from "lucide-react";

type DemoData = {
  id: string;
  name: string;
  email: string;
  website: string;
  brand_data: {
    businessName: string;
    tagline: string;
    description: string;
    primaryColor: string;
  };
  social_posts: { platform: string; content: string }[];
  audio_script: string;
  audio_url: string | null;
  video_script: string;
  video_url: string | null;
  email_verified: boolean;
  created_at: string;
};

type DiscountTier = {
  label: string;
  percent: number;
  originalPrice: number;
  discountedPrice: number;
  couponCode: string;
  expiresAt: Date;
  nextTierAt: Date | null;
};

function getDiscountTier(createdAt: string): DiscountTier {
  const created = new Date(createdAt).getTime();
  const now = Date.now();
  const hoursElapsed = (now - created) / (1000 * 60 * 60);
  const original = 745;

  const tiers = [
    { maxHours: 1,  percent: 50, label: "50% off — you just saw your demo!", couponCode: "DEMO50" },
    { maxHours: 3,  percent: 40, label: "40% off your first month",           couponCode: "DEMO40" },
    { maxHours: 12, percent: 30, label: "30% off your first month",           couponCode: "DEMO30" },
    { maxHours: 24, percent: 20, label: "20% off your first month",           couponCode: "DEMO20" },
    { maxHours: 48, percent: 10, label: "$50 off your first month",           couponCode: "DEMO10" },
  ];

  for (let i = 0; i < tiers.length; i++) {
    const t = tiers[i];
    if (hoursElapsed < t.maxHours) {
      const expiresAt = new Date(created + t.maxHours * 60 * 60 * 1000);
      const nextTierAt = i + 1 < tiers.length ? new Date(created + tiers[i + 1].maxHours * 60 * 60 * 1000) : null;
      const discountedPrice = Math.round(original * (1 - t.percent / 100));
      return { ...t, originalPrice: original, discountedPrice, expiresAt, nextTierAt };
    }
  }

  const expiresAt = new Date(created + 48 * 60 * 60 * 1000);
  return { percent: 0, label: "Standard pricing", couponCode: "", originalPrice: original, discountedPrice: original, expiresAt, nextTierAt: null };
}

function useCountdown(target: Date) {
  const [timeLeft, setTimeLeft] = useState("");
  useEffect(() => {
    function update() {
      const diff = target.getTime() - Date.now();
      if (diff <= 0) { setTimeLeft("00:00:00"); return; }
      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      setTimeLeft(`${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`);
    }
    update();
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, [target]);
  return timeLeft;
}

const PLATFORM_COLORS: Record<string, string> = {
  Instagram: "bg-pink-100 text-pink-700",
  Facebook:  "bg-blue-100 text-blue-700",
  LinkedIn:  "bg-blue-100 text-blue-800",
  X:         "bg-neutral-100 text-neutral-700",
};

function PlanComparisonTable({ signupUrl, liteUrl }: { signupUrl: string; liteUrl: string }) {
  return (
    <div className="bg-gradient-to-br from-neutral-900 to-neutral-800 rounded-2xl overflow-hidden shadow-2xl">
      <div className="px-6 pt-6 pb-4 text-center">
        <p className="text-xs font-semibold uppercase tracking-widest text-neutral-400 mb-2">Get this every month</p>
        <h3 className="text-2xl font-bold text-white">Pick your plan</h3>
        <p className="text-neutral-400 text-sm mt-1">Same AI onboarding · Cancel anytime · Setup in 24h</p>
      </div>

      <div className="grid grid-cols-3 gap-0 px-6 pb-2 text-xs font-semibold uppercase tracking-wide">
        <div className="text-neutral-500">What you get</div>
        <div className="text-center text-neutral-300">Lite <span className="text-neutral-500 font-normal normal-case">$99/mo</span></div>
        <div className="text-center text-primary-400">Full <span className="text-neutral-400 font-normal normal-case">$745/mo</span></div>
      </div>

      {[
        { feature: "Social posts/month",    lite: "30",   full: "150",  highlight: true },
        { feature: "Landing pages",         lite: "1",    full: "✓",    highlight: true },
        { feature: "Platforms covered",     lite: "3",    full: "5",    highlight: false },
        { feature: "Monthly report",        lite: "—",    full: "✓",    highlight: false },
        { feature: "Priority support",      lite: "—",    full: "✓",    highlight: false },
      ].map((row, i) => (
        <div key={row.feature} className={`grid grid-cols-3 gap-0 px-6 py-3 ${i % 2 === 0 ? "bg-white/5" : ""}`}>
          <span className="text-neutral-400 text-sm">{row.feature}</span>
          <span className="text-center text-neutral-300 text-sm font-medium">{row.lite}</span>
          <span className={`text-center text-sm font-bold ${row.highlight ? "text-primary-400" : "text-white"}`}>{row.full}</span>
        </div>
      ))}

      <div className="grid grid-cols-2 gap-4 p-6 pt-4">
        <Link href={liteUrl}
          className="py-3.5 bg-white/10 hover:bg-white/20 text-white font-bold rounded-xl text-center transition-colors text-sm">
          Start Lite — $99/mo
        </Link>
        <Link href={signupUrl}
          className="py-3.5 bg-primary-600 hover:bg-primary-500 text-white font-bold rounded-xl text-center transition-colors text-sm">
          Go Full — $745/mo →
        </Link>
      </div>

      <div className="flex items-center justify-center gap-6 pb-5">
        {["No contracts", "Cancel anytime", "14-day free trial"].map(t => (
          <span key={t} className="flex items-center gap-1 text-xs text-neutral-500">
            <CheckCircle className="w-3 h-3 text-green-500" /> {t}
          </span>
        ))}
      </div>
    </div>
  );
}

export default function DemoResultsPage() {
  const { id } = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const justVerified = searchParams.get("verified") === "1";

  const [demo, setDemo] = useState<DemoData | null>(null);
  const [loading, setLoading] = useState(true);
  const [showPostsUpsell, setShowPostsUpsell] = useState(false);

  const loadDemo = useCallback(async () => {
    try {
      const res = await fetch(`/api/demo/status/${id}`);
      const data = await res.json();
      if (data.demo) setDemo(data.demo);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { loadDemo(); }, [loadDemo]);

  // Show posts upsell after scrolling through posts
  useEffect(() => {
    const timer = setTimeout(() => setShowPostsUpsell(true), 8000);
    return () => clearTimeout(timer);
  }, []);

  const discount = demo ? getDiscountTier(demo.created_at) : null;
  const countdown = useCountdown(discount?.expiresAt ?? new Date());

  const businessName = demo?.brand_data?.businessName ?? demo?.website ?? "your business";

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-3">
          <Zap className="w-8 h-8 text-primary-600 mx-auto animate-pulse" />
          <p className="text-neutral-500">Loading your results…</p>
        </div>
      </div>
    );
  }

  if (!demo) {
    return (
      <div className="min-h-screen flex items-center justify-center text-center px-4">
        <div>
          <p className="text-neutral-500 mb-4">Demo not found or still generating.</p>
          <Link href="/demo" className="text-primary-600 hover:underline">Start a new demo →</Link>
        </div>
      </div>
    );
  }

  const signupUrl = `/sign-up?plan=full${discount?.couponCode ? `&coupon=${discount.couponCode}` : ""}&email=${encodeURIComponent(demo.email)}`;
  const liteUrl  = `/sign-up?plan=lite&email=${encodeURIComponent(demo.email)}`;

  return (
    <div className="min-h-screen bg-neutral-50 pb-24 sm:pb-0">

      {/* Nav */}
      <nav className="bg-white border-b border-neutral-200 px-4 py-4 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <Image src="/logo.png" alt="BundledContent" width={140} height={47} className="h-9 w-auto" />
          </Link>
          {discount && discount.percent > 0 && (
            <Link href={signupUrl}
              className="hidden sm:flex items-center gap-2 px-5 py-2.5 bg-primary-600 hover:bg-primary-700 text-white font-bold rounded-xl transition-colors text-sm">
              Get {discount.percent}% Off — {countdown} left <ArrowRight className="w-4 h-4" />
            </Link>
          )}
        </div>
      </nav>

      {/* Just verified banner */}
      {justVerified && (
        <div className="bg-green-600 text-white px-4 py-3 text-center text-sm font-semibold">
          ✅ Email verified! You&apos;re all set.
        </div>
      )}

      {/* Discount banner */}
      {discount && discount.percent > 0 && (
        <div className="bg-gradient-to-r from-primary-600 to-primary-700 text-white px-4 py-4">
          <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
            <div>
              <p className="font-bold text-lg">{discount.label}</p>
              <p className="text-primary-100 text-sm">
                First month: <span className="line-through text-primary-300">${discount.originalPrice}</span>{" "}
                <span className="text-white font-bold text-xl">${discount.discountedPrice}</span>
                {discount.nextTierAt && (
                  <span className="ml-2 text-primary-200 text-xs">· drops to next tier in {countdown}</span>
                )}
              </p>
            </div>
            <Link href={signupUrl}
              className="flex-shrink-0 px-6 py-3 bg-white text-primary-700 font-bold rounded-xl hover:bg-primary-50 transition-colors">
              Claim {discount.percent}% Off Now →
            </Link>
          </div>
        </div>
      )}

      <main className="max-w-4xl mx-auto px-4 py-10 space-y-8">

        {/* Header */}
        <div>
          <p className="text-sm text-neutral-500 mb-1">Sample content for</p>
          <h1 className="text-3xl font-bold text-neutral-900">{businessName}</h1>
          {demo.brand_data?.tagline && <p className="text-neutral-500 mt-1">{demo.brand_data.tagline}</p>}
        </div>

        {/* Social Posts */}
        <div className="space-y-4">
          {(demo.social_posts ?? []).map((post, i) => (
            <div key={i} className="bg-white rounded-2xl border border-neutral-200 shadow-sm p-5">
              <div className="flex items-center gap-2 mb-3">
                <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${PLATFORM_COLORS[post.platform] ?? "bg-neutral-100 text-neutral-600"}`}>
                  {post.platform}
                </span>
              </div>
              <p className="text-neutral-700 text-sm leading-relaxed whitespace-pre-wrap">{post.content}</p>
            </div>
          ))}

          {/* Volume upsell — appears after 8s */}
          {showPostsUpsell && (
            <div className="bg-gradient-to-r from-primary-50 to-primary-100 border border-primary-200 rounded-2xl p-5 flex gap-4 items-start">
              <div className="w-10 h-10 bg-primary-100 rounded-xl flex items-center justify-center flex-shrink-0">
                <TrendingUp className="w-5 h-5 text-primary-600" />
              </div>
              <div className="flex-1">
                <p className="font-bold text-neutral-900 text-sm">You just saw 5 sample posts.</p>
                <p className="text-neutral-600 text-sm mt-0.5">
                  Full gives <strong>{businessName}</strong> <strong className="text-primary-700">150 posts every month</strong> — that&apos;s a branded post every single day across every platform.
                </p>
                <Link href={signupUrl}
                  className="inline-flex items-center gap-1.5 mt-3 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white text-sm font-bold rounded-lg transition-colors">
                  Get 150 Posts/Month <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* Personalized upgrade moment */}
        <div className="space-y-3">
          <div className="text-center">
            <p className="text-xs font-semibold uppercase tracking-widest text-neutral-400 mb-1">Imagine this</p>
            <h2 className="text-2xl font-bold text-neutral-900">
              Every month for <span className="text-primary-600">{businessName}</span>
            </h2>
            <p className="text-neutral-500 text-sm mt-1 max-w-md mx-auto">
              This demo was a single sample. A subscription delivers this — and much more — on autopilot every 30 days.
            </p>
          </div>
          <PlanComparisonTable signupUrl={signupUrl} liteUrl={liteUrl} />
        </div>

      </main>

      {/* Sticky mobile discount bar */}
      {discount && discount.percent > 0 && (
        <div className="fixed bottom-0 left-0 right-0 z-50 sm:hidden bg-primary-600 text-white px-4 py-3 flex items-center justify-between shadow-2xl">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-primary-200 flex-shrink-0" />
            <div>
              <p className="text-xs font-bold">{discount.percent}% off expires in {countdown}</p>
              <p className="text-xs text-primary-200">First month: <span className="line-through">${discount.originalPrice}</span> ${discount.discountedPrice}</p>
            </div>
          </div>
          <Link href={signupUrl}
            className="flex-shrink-0 px-4 py-2 bg-white text-primary-700 font-bold rounded-lg text-sm">
            Claim →
          </Link>
        </div>
      )}

    </div>
  );
}
