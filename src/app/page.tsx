import Link from "next/link";
import {
  Check, Share2, Image as ImageIcon, Star, ChevronRight,
  ArrowRight, Layout, Sparkles, Send, Zap
} from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const deliverables = [
  {
    icon: <Share2 className="w-7 h-7 text-primary-600" />,
    iconBg: "bg-primary-50",
    number: "300",
    unit: "Social Posts",
    label: "per month · Starter gets 30 · Growth gets 100",
    headline: "Always-On Social Presence",
    desc: "Branded, platform-specific posts written by AI for every channel — Instagram, Facebook, LinkedIn, X, and Google Business. Each post is tailored to that platform's audience and tone, then auto-published on your schedule.",
    accent: "border-primary-200",
    tag: "5 platforms",
    tagColor: "bg-primary-50 text-primary-700",
  },
  {
    icon: <ImageIcon className="w-7 h-7 text-accent-500" />,
    iconBg: "bg-accent-50",
    number: "1:1",
    unit: "AI Images",
    label: "a fresh, on-brand image with every single post",
    headline: "Scroll-Stopping Visuals, Automatically",
    desc: "Every post ships with a unique AI-generated image built to match the message and your brand. No stock photos, no design tools, no extra cost — the visual is created and attached for you before the post goes live.",
    accent: "border-accent-200",
    tag: "Image per post",
    tagColor: "bg-accent-50 text-accent-700",
  },
  {
    icon: <Send className="w-7 h-7 text-purple-600" />,
    iconBg: "bg-purple-50",
    number: "Auto",
    unit: "Publishing",
    label: "directly to your connected accounts",
    headline: "Set It and Forget It",
    desc: "Connect your accounts once and we publish straight to Instagram, Facebook, LinkedIn, X, and Google Business. No copy-paste, no manual scheduling — your content goes out automatically across every platform on your plan.",
    accent: "border-purple-200",
    tag: "Hands-off",
    tagColor: "bg-purple-50 text-purple-700",
  },
  {
    icon: <Layout className="w-7 h-7 text-primary-600" />,
    iconBg: "bg-primary-50",
    number: "∞",
    unit: "Landing Pages",
    label: "Starter gets 1 · Growth gets 3 · Pro is unlimited",
    headline: "High-Converting Pages, Built by AI",
    desc: "Describe your offer and AI builds a polished, conversion-focused landing page — published live at your own URL, ready to share. Perfect for promotions, lead capture, and campaigns.",
    accent: "border-primary-200",
    tag: "Published to your URL",
    tagColor: "bg-primary-50 text-primary-700",
  },
];

const testimonials = [
  {
    quote: "We went from zero online presence to 100 branded posts a month — every one with a custom image, published automatically. I haven't logged into a scheduler since.",
    name: "James T.",
    role: "Business Owner",
    rating: 5,
  },
  {
    quote: "The AI landing pages are the sleeper feature. I spun up a promo page in minutes and had it live on my own URL the same afternoon.",
    name: "Priya K.",
    role: "Brand Strategist",
    rating: 5,
  },
  {
    quote: "It replaced our whole social workflow. Posts written for each platform, images included, auto-published across all of them. Unreal value.",
    name: "Sarah M.",
    role: "Marketing Director",
    rating: 5,
  },
];

const plans = [
  {
    id: "starter",
    name: "Starter",
    blurb: "Perfect to get consistent online",
    price: "$149",
    highlight: false,
    features: [
      { icon: <Share2 className="w-4 h-4 text-primary-500" />, text: "30 social posts/month" },
      { icon: <ImageIcon className="w-4 h-4 text-accent-400" />, text: "AI image with every post" },
      { icon: <Send className="w-4 h-4 text-purple-500" />, text: "Auto-publish to your connected accounts" },
      { icon: <Layout className="w-4 h-4 text-primary-500" />, text: "1 landing page" },
      { icon: <Check className="w-4 h-4 text-green-500" />, text: "AI onboarding included" },
    ],
  },
  {
    id: "growth",
    name: "Growth",
    blurb: "The agency replacement for growing businesses",
    price: "$399",
    highlight: true,
    features: [
      { icon: <Share2 className="w-4 h-4 text-primary-300" />, text: "100 social posts/month" },
      { icon: <ImageIcon className="w-4 h-4 text-accent-300" />, text: "AI image with every post" },
      { icon: <Send className="w-4 h-4 text-purple-400" />, text: "Auto-publish across all platforms" },
      { icon: <Layout className="w-4 h-4 text-primary-300" />, text: "3 landing pages" },
      { icon: <Zap className="w-4 h-4 text-amber-400" />, text: "Priority generation" },
    ],
  },
  {
    id: "pro",
    name: "Pro",
    blurb: "High-volume content for established brands",
    price: "$749",
    highlight: false,
    features: [
      { icon: <Share2 className="w-4 h-4 text-primary-500" />, text: "300 social posts/month" },
      { icon: <ImageIcon className="w-4 h-4 text-accent-400" />, text: "AI image with every post" },
      { icon: <Send className="w-4 h-4 text-purple-500" />, text: "Auto-publish across all platforms" },
      { icon: <Layout className="w-4 h-4 text-primary-500" />, text: "Unlimited landing pages" },
      { icon: <Zap className="w-4 h-4 text-amber-500" />, text: "Priority generation" },
    ],
  },
];

export default function HomePage() {
  return (
    <>
      <Navbar />

      {/* Hero */}
      <section className="relative pt-32 pb-20 lg:pt-40 lg:pb-28 overflow-hidden">
        <div
          className="absolute inset-0 opacity-50"
          style={{
            backgroundImage: "radial-gradient(#e5e7eb 1px, transparent 1px)",
            backgroundSize: "16px 16px",
            maskImage: "radial-gradient(ellipse 50% 50% at 50% 50%, #000 70%, transparent 100%)",
            WebkitMaskImage: "radial-gradient(ellipse 50% 50% at 50% 50%, #000 70%, transparent 100%)",
          }}
        />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="text-center max-w-4xl mx-auto">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary-50 border border-primary-100 text-primary-700 text-sm font-medium mb-8">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-primary-500" />
              </span>
              AI social posts + landing pages. One subscription.
            </div>
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold text-neutral-900 tracking-tight mb-8">
              Your Social Media,{" "}
              <br className="hidden md:block" />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-500 to-accent-400">
                Written, Designed &amp; Published.
              </span>
            </h1>
            <p className="text-xl text-neutral-600 mb-6 max-w-3xl mx-auto leading-relaxed">
              BundledContent writes your social posts, creates a matching AI image for each one, and auto-publishes them to Instagram, Facebook, LinkedIn, X, and Google Business — plus AI-built landing pages on your own URL. Powered by AI. Starting at $149/mo.
            </p>

            <div className="flex flex-wrap justify-center gap-3 mb-10">
              {["AI Social Posts", "AI Images", "Auto-Publish", "5 Platforms", "AI Landing Pages"].map((item) => (
                <span key={item} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-neutral-200 rounded-full text-sm text-neutral-700 font-medium shadow-sm">
                  <Check className="w-3.5 h-3.5 text-green-500" /> {item}
                </span>
              ))}
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/demo"
                className="px-8 py-4 bg-accent-400 text-white font-bold rounded-lg hover:bg-accent-500 transition-all shadow-lg hover:shadow-xl text-lg">
                Try Free Demo →
              </Link>
              <Link href="#pricing"
                className="px-8 py-4 bg-white text-neutral-700 border border-neutral-200 font-semibold rounded-lg hover:bg-neutral-50 transition-all shadow-sm hover:shadow-md">
                See Plans →
              </Link>
            </div>
            <p className="text-sm text-neutral-400 mt-4">No lock-in contracts. Cancel anytime. Setup in 24 hours.</p>
          </div>

          {/* Hero video */}
          <div className="mt-20 relative mx-auto max-w-5xl">
            <div className="absolute -inset-1 bg-gradient-to-r from-primary-400 to-accent-400 rounded-2xl blur opacity-20" />
            <div className="relative rounded-2xl overflow-hidden shadow-2xl border border-neutral-200 bg-black">
              <div style={{ padding: "56.25% 0 0 0", position: "relative" }}>
                <iframe
                  src="https://player.vimeo.com/video/1187463641?badge=0&autopause=0&player_id=0&app_id=58479&title=0&byline=0&portrait=0&dnt=1"
                  allow="autoplay; fullscreen; picture-in-picture; clipboard-write; encrypted-media"
                  style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%" }}
                  title="BundledContent"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* What You Get */}
      <section id="what-you-get" className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-neutral-900 mb-4">Everything Your Social Presence Needs. On Autopilot.</h2>
            <p className="text-lg text-neutral-600 max-w-2xl mx-auto">
              Two products, fully automated: AI social posts with images that publish themselves, and AI landing pages live on your own URL.
            </p>
          </div>

          <div className="space-y-8">
            {deliverables.map((d, i) => (
              <div key={d.unit} className={`bg-white rounded-2xl border-2 ${d.accent} shadow-sm overflow-hidden`}>
                <div className={`grid grid-cols-1 lg:grid-cols-2 ${i % 2 === 1 ? "lg:flex-row-reverse" : ""}`}>
                  <div className="p-8 lg:p-10 flex flex-col justify-center">
                    <span className={`inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide px-3 py-1 rounded-full w-fit mb-5 ${d.tagColor}`}>
                      {d.tag}
                    </span>
                    <div className="flex items-end gap-2 mb-2">
                      <span className="text-5xl font-bold text-neutral-900">{d.number}</span>
                      <span className="text-2xl font-bold text-neutral-700 pb-1">{d.unit}</span>
                    </div>
                    <p className="text-sm text-neutral-500 mb-4">{d.label}</p>
                    <h3 className="text-xl font-bold text-neutral-900 mb-3">{d.headline}</h3>
                    <p className="text-neutral-600 leading-relaxed">{d.desc}</p>
                  </div>
                  <div className={`${d.iconBg} flex items-center justify-center p-12 lg:p-16`}>
                    <div className="text-center">
                      <div className={`w-24 h-24 ${d.iconBg} border-2 ${d.accent} rounded-3xl flex items-center justify-center mx-auto mb-4 shadow-sm`}>
                        <div className="scale-150">{d.icon}</div>
                      </div>
                      <p className="text-4xl font-bold text-neutral-800">{d.number}</p>
                      <p className="text-neutral-600 font-medium">{d.unit}</p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-24 bg-neutral-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary-50 border border-primary-100 text-primary-700 text-sm font-medium mb-6">
              <Sparkles className="w-4 h-4" /> How It Works
            </div>
            <h2 className="text-4xl font-bold text-neutral-900 mb-4">From Brand to Published in Three Steps</h2>
            <p className="text-lg text-neutral-600 max-w-2xl mx-auto">
              Onboard once. After that, your content writes, designs, and publishes itself.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                icon: <Sparkles className="w-6 h-6 text-primary-600" />,
                step: "1",
                title: "Tell Us About Your Brand",
                desc: "A quick AI onboarding learns your voice, audience, and offers — then connect the social accounts you want us to publish to.",
              },
              {
                icon: <ImageIcon className="w-6 h-6 text-accent-500" />,
                step: "2",
                title: "AI Creates Posts + Images",
                desc: "AI writes platform-specific posts and generates a fresh, on-brand image for each one. Need a landing page? Describe it and AI builds it.",
              },
              {
                icon: <Send className="w-6 h-6 text-purple-600" />,
                step: "3",
                title: "Auto-Published For You",
                desc: "Your posts publish automatically to Instagram, Facebook, LinkedIn, X, and Google Business. Landing pages go live at your own URL.",
              },
            ].map((s) => (
              <div key={s.step} className="bg-white rounded-2xl border border-neutral-200 p-7 shadow-sm">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 bg-neutral-50 border border-neutral-200 rounded-xl flex items-center justify-center">
                    {s.icon}
                  </div>
                  <span className="text-3xl font-bold text-neutral-200">{s.step}</span>
                </div>
                <h3 className="font-bold text-neutral-900 text-lg mb-2">{s.title}</h3>
                <p className="text-neutral-500 text-sm leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-24 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-neutral-900 mb-4">Pick Your Plan</h2>
            <p className="text-lg text-neutral-600">
              Same AI onboarding. Same quality. Upgrade anytime.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-start">
            {plans.map((plan) => (
              <div
                key={plan.id}
                className={
                  plan.highlight
                    ? "bg-neutral-900 rounded-3xl p-8 text-white shadow-2xl relative overflow-hidden border-2 border-primary-500 md:-mt-4"
                    : "bg-white rounded-3xl p-8 border-2 border-neutral-200 shadow-sm"
                }
              >
                {plan.highlight && (
                  <>
                    <div className="absolute top-4 right-4 bg-primary-500 text-white text-xs font-bold px-3 py-1 rounded-full">Most Popular</div>
                    <div className="absolute inset-0 opacity-5" style={{ backgroundImage: "radial-gradient(circle at 80% 20%, white 1px, transparent 1px)", backgroundSize: "24px 24px" }} />
                  </>
                )}
                <div className="relative">
                  <div className="mb-6">
                    <p className={`font-bold text-xl ${plan.highlight ? "text-white" : "text-neutral-900"}`}>BundledContent {plan.name}</p>
                    <p className={`text-sm mt-1 ${plan.highlight ? "text-neutral-400" : "text-neutral-500"}`}>{plan.blurb}</p>
                  </div>
                  <div className="flex items-end gap-2 mb-1">
                    <span className={`text-5xl font-bold ${plan.highlight ? "text-white" : "text-neutral-900"}`}>{plan.price}</span>
                    <span className="text-neutral-400 text-lg pb-1">/month</span>
                  </div>
                  <p className={`text-xs mb-6 ${plan.highlight ? "text-neutral-500" : "text-neutral-400"}`}>14-day free trial · No credit card needed</p>
                  <div className="space-y-3 mb-8">
                    {plan.features.map(({ icon, text }) => (
                      <div key={text} className="flex items-center gap-3">
                        <div className={`w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0 ${plan.highlight ? "bg-neutral-800" : "bg-neutral-50 border border-neutral-100"}`}>{icon}</div>
                        <span className={`text-sm ${plan.highlight ? "text-neutral-300" : "text-neutral-600"}`}>{text}</span>
                      </div>
                    ))}
                  </div>
                  <Link
                    href={`/sign-up?plan=${plan.id}`}
                    className={
                      plan.highlight
                        ? "block w-full py-3.5 bg-white text-neutral-900 font-bold rounded-xl text-center hover:bg-primary-50 transition-colors text-base"
                        : "block w-full py-3.5 bg-neutral-900 text-white font-bold rounded-xl text-center hover:bg-neutral-800 transition-colors text-base"
                    }
                  >
                    Get Started — {plan.price}/mo <ArrowRight className="inline w-4 h-4 ml-1" />
                  </Link>
                  <p className={`text-center text-xs mt-3 ${plan.highlight ? "text-neutral-500" : "text-neutral-400"}`}>Setup begins within 24 hours.</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-24 bg-neutral-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-neutral-900 mb-4">Real Businesses. Real Results.</h2>
            <p className="text-lg text-neutral-600">These businesses stopped wrestling with social tools — and got better output on autopilot.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((t) => (
              <div key={t.name} className="bg-white rounded-2xl p-8 border border-neutral-200 shadow-sm">
                <div className="flex gap-1 mb-4">
                  {Array.from({ length: t.rating }).map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
                <p className="text-neutral-700 leading-relaxed mb-6 italic">&ldquo;{t.quote}&rdquo;</p>
                <div>
                  <p className="font-bold text-neutral-900">{t.name}</p>
                  <p className="text-sm text-neutral-500">{t.role}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Banner */}
      <section className="py-20 bg-gradient-to-br from-primary-700 via-primary-600 to-primary-500">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-bold text-white mb-4">Stop Managing Social Media.<br />Start Publishing on Autopilot.</h2>
          <p className="text-primary-100 text-lg mb-3">
            AI writes your posts, designs the images, and publishes everywhere — plus landing pages on your own URL.
          </p>
          <p className="text-primary-200 text-sm mb-8">Starter $149/mo · Growth $399/mo · Pro $749/mo · No contracts.</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/demo"
              className="inline-flex items-center gap-2 px-8 py-4 bg-accent-400 text-white font-bold rounded-lg hover:bg-accent-500 transition-colors shadow-lg text-lg">
              Try Free Demo <ChevronRight className="w-5 h-5" />
            </Link>
            <Link href="#pricing"
              className="inline-flex items-center gap-2 px-8 py-4 bg-white/15 border border-white/30 text-white font-bold rounded-lg hover:bg-white/25 transition-colors text-lg">
              See Plans →
            </Link>
          </div>
          <p className="text-primary-200 text-xs mt-4">No contracts. Cancel anytime. Setup within 24 hours.</p>
        </div>
      </section>

      <Footer />
    </>
  );
}
