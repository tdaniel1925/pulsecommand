"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {
  Globe, Loader2, Sparkles, Check, ArrowRight,
  Users, Target, Trophy, Mic, Video, Share2
} from "lucide-react";

type Step = 1 | 2;

export default function DemoPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>(1);

  // Step 1
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [website, setWebsite] = useState("");

  // Step 2
  const [topService, setTopService] = useState("");
  const [idealCustomer, setIdealCustomer] = useState("");
  const [differentiator, setDifferentiator] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  async function handleStep1(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      const res = await fetch("/api/demo/check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (data.existingDemoId) {
        router.push(`/demo/results/${data.existingDemoId}`);
        return;
      }
      setStep(2);
    } catch {
      setStep(2);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleStep2(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      const res = await fetch("/api/demo/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, phone, website, topService, idealCustomer, differentiator }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to start demo");
      router.push(`/demo/generating/${data.demoId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-neutral-50 relative overflow-hidden">
      {/* Subtle dot grid background */}
      <div
        className="absolute inset-0 opacity-40"
        style={{
          backgroundImage: "radial-gradient(#d1d5db 1px, transparent 1px)",
          backgroundSize: "24px 24px",
          maskImage: "radial-gradient(ellipse 80% 80% at 50% 50%, #000 60%, transparent 100%)",
          WebkitMaskImage: "radial-gradient(ellipse 80% 80% at 50% 50%, #000 60%, transparent 100%)",
        }}
      />

      {/* Teal glow top-left */}
      <div className="absolute -top-32 -left-32 w-96 h-96 bg-primary-200 rounded-full blur-3xl opacity-30 pointer-events-none" />
      {/* Orange glow bottom-right */}
      <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-accent-200 rounded-full blur-3xl opacity-30 pointer-events-none" />

      {/* Nav */}
      <nav className="relative z-10 bg-white border-b border-neutral-200 px-4 py-4 shadow-sm">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <Image src="/logo.png" alt="BundledContent" width={160} height={54} className="h-10 w-auto" />
          </Link>
          <Link href="/login" className="text-sm text-neutral-500 hover:text-primary-600 font-medium transition-colors">
            Already a member? Sign in →
          </Link>
        </div>
      </nav>

      <main className="relative z-10 max-w-6xl mx-auto px-4 py-12 lg:py-20">
        <div className="grid lg:grid-cols-2 gap-12 items-center">

          {/* Left — copy */}
          <div className="space-y-6">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary-50 border border-primary-200 text-primary-700 text-sm font-medium">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-primary-500" />
              </span>
              Free · No credit card · Takes 3 minutes
            </div>

            <h1 className="text-4xl lg:text-5xl font-bold leading-tight text-neutral-900">
              See Your Business as an{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-500 to-accent-400">
                AI Marketing Machine
              </span>
            </h1>

            <p className="text-neutral-600 text-lg leading-relaxed">
              Enter your website and answer 3 quick questions. We&apos;ll scan your brand,
              generate real sample content, and notify you the moment it&apos;s ready.
            </p>

            {/* What you get */}
            <div className="space-y-3">
              {[
                { icon: Share2,  label: "5 Social Posts",         sub: "Instagram, Facebook, LinkedIn, X — written for your brand", iconColor: "text-primary-600", iconBg: "bg-primary-50",  border: "border-primary-100" },
                { icon: Mic,     label: "2-Minute Podcast Sample", sub: "AI voice narration of your brand story",                    iconColor: "text-purple-600",  iconBg: "bg-purple-50",   border: "border-purple-100"  },
                { icon: Video,   label: "AI Presenter Video",      sub: "HeyGen avatar delivering your brand message",               iconColor: "text-accent-500",  iconBg: "bg-accent-50",   border: "border-accent-100"  },
              ].map(item => (
                <div key={item.label} className={`flex items-center gap-4 bg-white border ${item.border} rounded-xl px-4 py-3 shadow-sm`}>
                  <div className={`w-9 h-9 ${item.iconBg} rounded-lg flex items-center justify-center flex-shrink-0`}>
                    <item.icon className={`w-5 h-5 ${item.iconColor}`} />
                  </div>
                  <div>
                    <p className="font-semibold text-neutral-900 text-sm">{item.label}</p>
                    <p className="text-neutral-400 text-xs">{item.sub}</p>
                  </div>
                  <div className="ml-auto">
                    <span className="text-xs font-bold text-green-600 bg-green-50 border border-green-200 px-2 py-0.5 rounded-full">FREE</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Social proof */}
            <div className="flex items-center gap-4 pt-2">
              <div className="flex -space-x-2">
                {["JK", "SM", "TR", "AP", "DL"].map(i => (
                  <div key={i} className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 border-2 border-white flex items-center justify-center text-white text-xs font-bold shadow-sm">{i}</div>
                ))}
              </div>
              <p className="text-neutral-500 text-sm"><span className="text-neutral-900 font-semibold">247 businesses</span> generated their demo this week</p>
            </div>

            {/* Discount teaser */}
            <div className="bg-gradient-to-r from-accent-50 to-primary-50 border border-accent-200 rounded-xl px-5 py-4">
              <p className="text-accent-600 font-bold text-sm">⚡ Limited-time offer</p>
              <p className="text-neutral-600 text-sm mt-1">Sign up within 1 hour of seeing your demo and get <span className="text-neutral-900 font-bold">50% off your first month</span>. Discount shrinks every hour.</p>
            </div>
          </div>

          {/* Right — form */}
          <div>
            {/* Step indicator */}
            <div className="flex items-center gap-3 mb-6">
              {[1, 2].map(s => (
                <div key={s} className="flex items-center gap-2">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold border-2 transition-all ${
                    step === s ? "bg-primary-600 border-primary-500 text-white" :
                    s < step  ? "bg-green-500 border-green-400 text-white" :
                    "bg-neutral-100 border-neutral-200 text-neutral-400"
                  }`}>
                    {s < step ? <Check className="w-4 h-4" /> : s}
                  </div>
                  <span className={`text-sm font-medium ${step === s ? "text-neutral-900" : "text-neutral-400"}`}>
                    {s === 1 ? "Your Info" : "Your Brand"}
                  </span>
                  {s < 2 && <div className={`w-8 h-px ${step > s ? "bg-green-400" : "bg-neutral-200"}`} />}
                </div>
              ))}
            </div>

            <div className="bg-white rounded-2xl shadow-xl border border-neutral-200 p-8">
              {step === 1 ? (
                <form onSubmit={handleStep1} className="space-y-5">
                  <div>
                    <h2 className="text-xl font-bold text-neutral-900">Let&apos;s get started</h2>
                    <p className="text-neutral-500 text-sm mt-1">We&apos;ll scan your website and build your brand profile automatically.</p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-neutral-700 mb-1">First Name <span className="text-red-500">*</span></label>
                      <input type="text" required value={name} onChange={e => setName(e.target.value)}
                        placeholder="Jane"
                        className="w-full border border-neutral-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-primary-400" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-neutral-700 mb-1">Email <span className="text-red-500">*</span></label>
                      <input type="email" required value={email} onChange={e => setEmail(e.target.value)}
                        placeholder="jane@example.com"
                        className="w-full border border-neutral-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-primary-400" />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-1">Phone <span className="text-neutral-400 font-normal">(for SMS when ready)</span></label>
                    <input type="tel" value={phone} onChange={e => setPhone(e.target.value)}
                      placeholder="+1 (555) 000-0000"
                      className="w-full border border-neutral-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-primary-400" />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-1">Website <span className="text-red-500">*</span></label>
                    <div className="relative">
                      <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                      <input type="text" required value={website} onChange={e => setWebsite(e.target.value)}
                        placeholder="yourwebsite.com"
                        className="w-full pl-10 border border-neutral-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-primary-400" />
                    </div>
                    <p className="text-xs text-neutral-400 mt-1">We&apos;ll scan it to extract your brand, services, and tone automatically.</p>
                  </div>

                  <button type="submit" disabled={submitting}
                    className="w-full flex items-center justify-center gap-2 py-3.5 bg-accent-400 hover:bg-accent-500 text-white font-bold rounded-xl transition-colors disabled:opacity-50 text-base shadow-md">
                    {submitting ? <><Loader2 className="w-5 h-5 animate-spin" /> Checking…</> : <>Next — Tell Us About Your Business <ArrowRight className="w-5 h-5" /></>}
                  </button>

                  <div className="flex items-center justify-center gap-5">
                    {["No credit card", "100% free", "Real content"].map(t => (
                      <span key={t} className="flex items-center gap-1 text-xs text-neutral-400">
                        <Check className="w-3 h-3 text-green-500" /> {t}
                      </span>
                    ))}
                  </div>
                </form>
              ) : (
                <form onSubmit={handleStep2} className="space-y-5">
                  <div>
                    <h2 className="text-xl font-bold text-neutral-900">3 quick questions</h2>
                    <p className="text-neutral-500 text-sm mt-1">These answers make your sample content 10x more specific to your business.</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-1">
                      <span className="flex items-center gap-1.5"><Trophy className="w-4 h-4 text-amber-500" /> What&apos;s your #1 service or product? <span className="text-red-500">*</span></span>
                    </label>
                    <input type="text" required value={topService} onChange={e => setTopService(e.target.value)}
                      placeholder="e.g. Commercial roofing installations"
                      className="w-full border border-neutral-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-primary-400" />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-1">
                      <span className="flex items-center gap-1.5"><Users className="w-4 h-4 text-primary-500" /> Who is your ideal customer? <span className="text-red-500">*</span></span>
                    </label>
                    <input type="text" required value={idealCustomer} onChange={e => setIdealCustomer(e.target.value)}
                      placeholder="e.g. Property managers of 10+ unit buildings"
                      className="w-full border border-neutral-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-primary-400" />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-1">
                      <span className="flex items-center gap-1.5"><Target className="w-4 h-4 text-green-500" /> What sets you apart from competitors? <span className="text-red-500">*</span></span>
                    </label>
                    <input type="text" required value={differentiator} onChange={e => setDifferentiator(e.target.value)}
                      placeholder="e.g. 48-hour emergency response, 10-year warranty"
                      className="w-full border border-neutral-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-primary-400" />
                  </div>

                  {error && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>}

                  <div className="flex gap-3">
                    <button type="button" onClick={() => setStep(1)}
                      className="px-4 py-3 border border-neutral-200 rounded-xl text-sm font-medium text-neutral-600 hover:bg-neutral-50 transition-colors">
                      Back
                    </button>
                    <button type="submit" disabled={submitting}
                      className="flex-1 flex items-center justify-center gap-2 py-3 bg-accent-400 hover:bg-accent-500 text-white font-bold rounded-xl transition-colors disabled:opacity-50 text-sm shadow-md">
                      {submitting ? <><Loader2 className="w-4 h-4 animate-spin" /> Generating your content…</> : <><Sparkles className="w-4 h-4" /> Generate My Free Sample Content</>}
                    </button>
                  </div>

                  <p className="text-center text-xs text-neutral-400">
                    You&apos;ll get an email + SMS when your content is ready (3–5 min)
                  </p>
                </form>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
