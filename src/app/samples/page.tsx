"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Share2, ArrowRight, Star, Eye, Heart, MessageCircle,
  Loader2, Sparkles, Layout, ExternalLink
} from "lucide-react";

// Brand icons not in this version of lucide-react
function IconInstagram({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
    </svg>
  );
}
function IconLinkedin({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
    </svg>
  );
}
function IconFacebook({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
    </svg>
  );
}
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

/* ─── Sample data ─────────────────────────────────────── */

const FALLBACK_IMAGES: Record<string, string> = {
  instagram_roofing: "/samples/set1-instagram.jpg",
  linkedin_commercial: "/samples/set1-linkedin.jpg",
  facebook_inspection: "/samples/set1-facebook.jpg",
};

const socialPostsData = [
  {
    platform: "Instagram",
    handle: "@oakridge_roofing",
    Icon: IconInstagram,
    iconColor: "text-pink-500",
    gradient: "from-pink-500 via-rose-500 to-orange-400",
    time: "2h ago",
    imageKey: "instagram_roofing",
    imageAlt: "Residential roof being replaced",
    content: "Your roof is working harder than you think. Extreme heat, heavy rain, and UV exposure take a toll year-round. Our 48-hour inspection service gives you peace of mind — before small issues become expensive problems. 🏠✅",
    hashtags: "#roofing #homemaintenance #protectyourhome #commercialroofing #OakRidgeRoofing",
    likes: 142,
    comments: 18,
    reach: "4.2K",
  },
  {
    platform: "LinkedIn",
    handle: "Oakridge Roofing Solutions",
    Icon: IconLinkedin,
    iconColor: "text-blue-600",
    gradient: "from-blue-600 to-blue-700",
    time: "1d ago",
    imageKey: "linkedin_commercial",
    imageAlt: "Construction crew on a commercial roof",
    content: "We recently completed a 22,000 sq ft commercial re-roof for a regional distribution center in under 6 days — without interrupting operations. How? Pre-fabricated sections, night crews, and 20 years of commercial experience. If your facility needs a roof upgrade, let's talk.",
    hashtags: "#commercialroofing #facilitymanagement #constructionmanagement #B2B",
    likes: 87,
    comments: 24,
    reach: "3.1K",
  },
  {
    platform: "Facebook",
    handle: "Oakridge Roofing",
    Icon: IconFacebook,
    iconColor: "text-blue-500",
    gradient: "from-blue-500 to-blue-600",
    time: "3d ago",
    imageKey: "facebook_inspection",
    imageAlt: "Beautiful home exterior",
    content: "Did you know most roof leaks start 6–12 months before they're visible inside your home? Our thermal imaging inspection finds moisture intrusion before water damage begins. Book a free inspection this week — spots are limited! 👇",
    hashtags: "#roofrepair #homeowners #freeInspection #roofingexperts",
    likes: 213,
    comments: 41,
    reach: "8.7K",
  },
];

/* ─── Page ────────────────────────────────────────────── */

const SESSION_LIMIT = 2;

// All 4 image sets — images swap instantly, no API call needed
const IMAGE_SETS: Record<string, string>[] = [
  { instagram_roofing: '/samples/set1-instagram.jpg', linkedin_commercial: '/samples/set1-linkedin.jpg', facebook_inspection: '/samples/set1-facebook.jpg' },
  { instagram_roofing: '/samples/set2-instagram.jpg', linkedin_commercial: '/samples/set2-linkedin.jpg', facebook_inspection: '/samples/set2-facebook.jpg' },
  { instagram_roofing: '/samples/set3-instagram.jpg', linkedin_commercial: '/samples/set3-linkedin.jpg', facebook_inspection: '/samples/set3-facebook.jpg' },
  { instagram_roofing: '/samples/set4-instagram.jpg', linkedin_commercial: '/samples/set4-linkedin.jpg', facebook_inspection: '/samples/set4-facebook.jpg' },
];

export default function SamplesPage() {
  const [currentSet, setCurrentSet] = useState(0);
  const [generatedImages, setGeneratedImages] = useState<Record<string, string>>(IMAGE_SETS[0]);
  const [generatedContent, setGeneratedContent] = useState<{
    posts?: Record<string, { content: string; hashtags: string }>;
  } | null>(null);
  const [generatingText, setGeneratingText] = useState(false);
  const [genError, setGenError] = useState("");
  const [sessionCount, setSessionCount] = useState(0);

  // Check for cached data on mount
  useEffect(() => {
    void Promise.resolve().then(() => {
      const cached = localStorage.getItem("sample_data");
      if (!cached) return;
      let parsed: { setIndex?: number; content?: unknown };
      try {
        parsed = JSON.parse(cached);
      } catch {
        return;
      }
      if (parsed.setIndex != null) {
        setCurrentSet(parsed.setIndex);
        setGeneratedImages(IMAGE_SETS[parsed.setIndex] ?? IMAGE_SETS[0]);
      }
      if (parsed.content) setGeneratedContent(parsed.content);
    });
  }, []);

  async function handleGenerate() {
    if (sessionCount >= SESSION_LIMIT) {
      setGenError("You've used both generations for this session. Refresh the page to reset.");
      return;
    }
    setGenError("");

    // 1. Instantly swap to next image set (no API call)
    const nextSet = (currentSet + 1) % IMAGE_SETS.length;
    setCurrentSet(nextSet);
    setGeneratedImages(IMAGE_SETS[nextSet]);

    // 2. Clear old text and show skeleton while AI generates new text
    setGeneratedContent(null);
    setGeneratingText(true);
    setSessionCount(prev => prev + 1);

    // 3. Fetch fresh text in background
    try {
      const res = await fetch("/api/samples/generate-images", { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Generation failed");
      if (data.content) setGeneratedContent(data.content);
      localStorage.setItem("sample_data", JSON.stringify({
        setIndex: nextSet,
        content: data.content ?? null,
      }));
    } catch (err) {
      setGenError(err instanceof Error ? err.message : "Failed to generate captions");
    } finally {
      setGeneratingText(false);
    }
  }

  function getImageUrl(key: string): string {
    return generatedImages[key] || FALLBACK_IMAGES[key] || "";
  }

  function getPostContent(platform: string): { content: string; hashtags: string } | null {
    return generatedContent?.posts?.[platform.toLowerCase()] ?? null;
  }

  const remaining = SESSION_LIMIT - sessionCount;

  return (
    <>
      <Navbar />

      {/* Hero */}
      <section className="pt-32 pb-16 bg-white relative overflow-hidden">
        <div
          className="absolute inset-0 opacity-40"
          style={{
            backgroundImage: "radial-gradient(#e5e7eb 1px, transparent 1px)",
            backgroundSize: "20px 20px",
            maskImage: "radial-gradient(ellipse 70% 70% at 50% 50%, #000 60%, transparent 100%)",
            WebkitMaskImage: "radial-gradient(ellipse 70% 70% at 50% 50%, #000 60%, transparent 100%)",
          }}
        />
        <div className="absolute -top-24 -right-24 w-80 h-80 bg-primary-100 rounded-full blur-3xl opacity-60 pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-80 h-80 bg-accent-100 rounded-full blur-3xl opacity-60 pointer-events-none" />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary-50 border border-primary-200 text-primary-700 text-sm font-medium mb-6">
            <Star className="w-4 h-4 fill-primary-400 text-primary-400" /> Real output. Real brands. Just like yours.
          </div>
          <h1 className="text-5xl font-bold text-neutral-900 mb-5 tracking-tight">
            See What We{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-500 to-accent-400">
              Actually Deliver
            </span>
          </h1>
          <p className="text-xl text-neutral-600 max-w-2xl mx-auto leading-relaxed">
            Every post below was written and designed by AI — tailored to a real roofing business. Your brand gets the same treatment, built around your voice and your customers.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center mt-8">
            <Link href="/demo"
              className="px-7 py-3.5 bg-accent-400 hover:bg-accent-500 text-white font-bold rounded-xl transition-all shadow-lg text-base">
              Get My Free Sample →
            </Link>
            <Link href="/#pricing"
              className="px-7 py-3.5 bg-white border border-neutral-200 text-neutral-700 font-semibold rounded-xl hover:bg-neutral-50 transition-all shadow-sm">
              See Plans
            </Link>
          </div>
        </div>
      </section>

      {/* ── Section: Social Content ── */}
      <section className="py-20 bg-neutral-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <SectionHeader
            icon={<Share2 className="w-5 h-5 text-primary-600" />}
            iconBg="bg-primary-100"
            label="AI-Generated Social Content"
            title="Platform-Perfect Posts, Every Month"
            desc="We write differently for every platform — LinkedIn sounds professional, Instagram is visual and punchy, Facebook drives local engagement. Each post ships with a matching AI-generated image and auto-publishes to your accounts."
            count="Up to 300 posts/mo"
            countColor="bg-primary-50 text-primary-700 border-primary-200"
          />

          {/* Generate button */}
          <div className="flex flex-col items-center mt-8 gap-2">
            <button
              onClick={handleGenerate}
              disabled={generatingText || sessionCount >= SESSION_LIMIT}
              className="inline-flex items-center gap-2 px-8 py-3.5 bg-primary-600 text-white font-bold rounded-xl hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-lg text-base"
            >
              {generatingText ? (
                <><Loader2 className="w-5 h-5 animate-spin" /> Generating New Content…</>
              ) : (
                <><Sparkles className="w-5 h-5" /> Generate New Social Content</>
              )}
            </button>
            {remaining > 0 && !generatingText && (
              <p className="text-neutral-400 text-xs">{remaining} generation{remaining !== 1 ? 's' : ''} remaining this session</p>
            )}
            {sessionCount >= SESSION_LIMIT && !generatingText && (
              <p className="text-amber-600 text-xs font-medium">Session limit reached (2 per session)</p>
            )}
            {genError && <p className="text-red-500 text-sm font-medium">{genError}</p>}
          </div>

          <style>{`
            @keyframes shimmer {
              0% { background-position: -200% 0; }
              100% { background-position: 200% 0; }
            }
            .skeleton {
              background: linear-gradient(90deg, #f3f4f6 25%, #e5e7eb 50%, #f3f4f6 75%);
              background-size: 200% 100%;
              animation: shimmer 1.5s ease-in-out infinite;
            }
          `}</style>

          {/* Social Posts */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-10">
            {socialPostsData.map((post) => {
              const dynamic = getPostContent(post.platform);
              return (
              <div key={post.platform} className="bg-white rounded-2xl border border-neutral-200 shadow-sm overflow-hidden flex flex-col">
                <div className={`h-1.5 bg-gradient-to-r ${post.gradient}`} />
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={getImageUrl(post.imageKey)} alt={post.imageAlt} className="w-full h-48 object-cover" />
                <div className="p-5 flex-1 flex flex-col">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-full bg-neutral-100 flex items-center justify-center">
                      <post.Icon className={`w-5 h-5 ${post.iconColor}`} />
                    </div>
                    <div>
                      <p className="font-bold text-neutral-900 text-sm">{post.handle}</p>
                      <p className="text-xs text-neutral-400">{post.time}</p>
                    </div>
                    <span className={`ml-auto text-xs font-semibold px-2 py-0.5 rounded-full border ${post.iconColor} bg-neutral-50 border-neutral-200`}>{post.platform}</span>
                  </div>
                  {/* Text or skeleton */}
                  {generatingText ? (
                    <div className="flex-1 space-y-2">
                      <div className="h-3.5 skeleton rounded w-full" />
                      <div className="h-3.5 skeleton rounded w-11/12" />
                      <div className="h-3.5 skeleton rounded w-9/12" />
                      <div className="mt-3 h-3 skeleton rounded w-7/12" />
                    </div>
                  ) : (
                    <>
                      <p className="text-neutral-700 text-sm leading-relaxed flex-1">{dynamic?.content ?? post.content}</p>
                      <p className="text-primary-500 text-xs mt-3 leading-relaxed">{dynamic?.hashtags ?? post.hashtags}</p>
                    </>
                  )}
                  <div className="flex items-center gap-4 mt-4 pt-4 border-t border-neutral-100 text-xs text-neutral-400">
                    <span className="flex items-center gap-1"><Heart className="w-3.5 h-3.5" /> {post.likes}</span>
                    <span className="flex items-center gap-1"><MessageCircle className="w-3.5 h-3.5" /> {post.comments}</span>
                    <span className="flex items-center gap-1 ml-auto"><Eye className="w-3.5 h-3.5" /> {post.reach} reach</span>
                  </div>
                </div>
              </div>
              );
            })}
          </div>

          <p className="text-center text-neutral-400 text-sm mt-10">
            Every post is written for its platform, paired with a custom AI image, and auto-published to your connected accounts.
          </p>
        </div>
      </section>

      {/* ── Section: Landing Pages ── */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <SectionHeader
            icon={<Layout className="w-5 h-5 text-primary-600" />}
            iconBg="bg-primary-100"
            label="AI Landing Pages"
            title="High-Converting Pages, Built by AI"
            desc="Describe your offer and AI builds a polished, conversion-focused landing page — published live at your own URL, ready to share for promotions, lead capture, and campaigns."
            count="Up to unlimited"
            countColor="bg-primary-50 text-primary-700 border-primary-200"
          />

          <div className="mt-12 max-w-2xl mx-auto">
            <div className="bg-white rounded-2xl border border-neutral-200 shadow-lg overflow-hidden">
              {/* Browser chrome */}
              <div className="bg-neutral-100 border-b border-neutral-200 px-4 py-3 flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-red-400" />
                <span className="w-3 h-3 rounded-full bg-yellow-400" />
                <span className="w-3 h-3 rounded-full bg-green-400" />
                <span className="ml-3 text-xs text-neutral-500 bg-white border border-neutral-200 rounded-md px-3 py-1 flex-1 truncate">
                  yourbrand.com/p/spring-roof-special
                </span>
              </div>
              {/* Landing page mock */}
              <div className="bg-gradient-to-br from-primary-600 via-primary-500 to-accent-400 px-8 py-12 text-white text-center">
                <p className="text-primary-100 text-xs font-bold uppercase tracking-widest mb-4">Oakridge Roofing · Limited Spring Offer</p>
                <h3 className="text-3xl font-bold leading-tight mb-3">Free Roof Inspection — This Month Only</h3>
                <p className="text-primary-100 text-sm leading-relaxed max-w-md mx-auto mb-6">Book before May 31st and we&apos;ll waive the $199 inspection fee. Thermal imaging included — catch problems before they cost you.</p>
                <div className="inline-block px-6 py-3 bg-white text-primary-700 font-bold rounded-lg text-sm">Claim My Free Inspection →</div>
              </div>
              <div className="px-8 py-5 grid grid-cols-3 gap-4 text-center">
                {[
                  { v: "20+ yrs", l: "Experience" },
                  { v: "48 hrs", l: "Turnaround" },
                  { v: "5,000+", l: "Roofs Done" },
                ].map((s) => (
                  <div key={s.l}>
                    <p className="text-2xl font-bold text-neutral-900">{s.v}</p>
                    <p className="text-xs text-neutral-500">{s.l}</p>
                  </div>
                ))}
              </div>
            </div>
            <p className="text-center text-neutral-400 text-sm mt-6 flex items-center justify-center gap-1.5">
              <ExternalLink className="w-3.5 h-3.5" /> Published live at your own /p/ URL — ready to share instantly.
            </p>
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="py-20 bg-gradient-to-br from-primary-700 via-primary-600 to-primary-500">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-bold text-white mb-4">Ready to See This for Your Business?</h2>
          <p className="text-primary-100 text-lg mb-8">Enter your website and we&apos;ll generate real sample content for your brand — free, in minutes.</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/demo"
              className="inline-flex items-center gap-2 px-8 py-4 bg-accent-400 hover:bg-accent-500 text-white font-bold rounded-xl transition-colors shadow-lg text-lg">
              Try My Free Demo <ArrowRight className="w-5 h-5" />
            </Link>
            <Link href="/sign-up"
              className="inline-flex items-center gap-2 px-8 py-4 bg-white/15 border border-white/30 text-white font-bold rounded-xl hover:bg-white/25 transition-colors text-lg">
              View Plans →
            </Link>
          </div>
          <p className="text-primary-200 text-xs mt-4">No credit card. No obligation. Real AI-generated output.</p>
        </div>
      </section>

      <Footer />
    </>
  );
}

/* ─── Reusable section header ─────────────────────────── */

function SectionHeader({
  icon, iconBg, label, title, desc, count, countColor,
}: {
  icon: React.ReactNode;
  iconBg: string;
  label: string;
  title: string;
  desc: string;
  count: string;
  countColor: string;
}) {
  return (
    <div className="text-center max-w-2xl mx-auto">
      <div className={`inline-flex items-center gap-2 w-10 h-10 ${iconBg} rounded-xl justify-center mb-4`}>
        {icon}
      </div>
      <div className="flex items-center justify-center gap-3 mb-4">
        <span className="text-sm font-bold text-neutral-500 uppercase tracking-wide">{label}</span>
        <span className={`text-xs font-bold px-3 py-1 rounded-full border ${countColor}`}>{count}</span>
      </div>
      <h2 className="text-3xl font-bold text-neutral-900 mb-4">{title}</h2>
      <p className="text-neutral-500 text-lg leading-relaxed">{desc}</p>
    </div>
  );
}
