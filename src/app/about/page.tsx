import Link from "next/link";
import { ArrowRight, Zap, Heart, BarChart3, Users, Star, Quote } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const stats = [
  { value: "12+", label: "Years in Marketing" },
  { value: "500+", label: "Businesses Served" },
  { value: "2M+", label: "Pieces of Content Delivered" },
  { value: "98%", label: "Client Retention Rate" },
];

const timeline = [
  {
    year: "The Beginning",
    title: "Broadcast Roots & Brand Expertise",
    desc: "Trent spent years as a motion picture executive, radio host, and television and film producer — developing online and broadcast content for CBS, Clear Channel Media, Fox News, CNN, and more. Sella built her career as a marketing manager for major online brands and a sales executive at Greystar, one of the world's largest real estate firms. Two different industries. One shared obsession: how great content moves people.",
  },
  {
    year: "The Problem",
    title: "Great Agencies Were Out of Reach",
    desc: "Together, Trent and Sella watched thousands of small and mid-sized businesses get left behind — not because they lacked great products, but because real agency-quality content was priced for Fortune 500 budgets. DIY tools existed, but the strategy, consistency, and production value weren't there. There was nothing in between.",
  },
  {
    year: "The System",
    title: "AI Changes Everything",
    desc: "When AI content tools matured, Trent and Sella saw a once-in-a-generation opportunity. They combined Trent's broadcast production expertise with Sella's brand and sales strategy — and spent 18 months building a repeatable AI content system that delivers agency-grade output at a fraction of the cost.",
  },
  {
    year: "Today",
    title: "BundledContent is Born",
    desc: "The result is BundledContent — AI that writes your social posts, designs a custom image for each one, and auto-publishes across every platform. One monthly subscription. Every channel covered. Real strategy behind every post.",
  },
];

const values = [
  {
    icon: <Zap className="w-5 h-5 text-accent-500" />,
    bg: "bg-accent-50",
    title: "Speed Without Sacrifice",
    desc: "We built systems that deliver content at scale without cutting corners on quality. Every post and image is crafted for your brand before it goes out.",
  },
  {
    icon: <BarChart3 className="w-5 h-5 text-primary-600" />,
    bg: "bg-primary-50",
    title: "Built to Convert",
    desc: "We're obsessed with output that performs. Posts written for each platform, and images that stop the scroll.",
  },
  {
    icon: <Heart className="w-5 h-5 text-rose-500" />,
    bg: "bg-rose-50",
    title: "Built for Small Business",
    desc: "We've worked with Fortune 500 brands and a two-person roofing company. Our system was designed for the small business owner who needs big-brand marketing without big-brand overhead.",
  },
  {
    icon: <Users className="w-5 h-5 text-purple-600" />,
    bg: "bg-purple-50",
    title: "Real Humans Behind Every Campaign",
    desc: "AI does the heavy lifting — but Trent and Sella review every client's onboarding and strategy. You're not just a subscription. You're a brand we care about.",
  },
];

export default function AboutPage() {
  return (
    <>
      <Navbar />

      {/* ── Hero ── */}
      <section className="pt-32 pb-20 bg-white relative overflow-hidden">
        <div
          className="absolute inset-0 opacity-30"
          style={{
            backgroundImage: "radial-gradient(#e5e7eb 1px, transparent 1px)",
            backgroundSize: "20px 20px",
            maskImage: "radial-gradient(ellipse 80% 80% at 50% 50%, #000 60%, transparent 100%)",
            WebkitMaskImage: "radial-gradient(ellipse 80% 80% at 50% 50%, #000 60%, transparent 100%)",
          }}
        />
        <div className="absolute -top-32 -right-32 w-96 h-96 bg-primary-100 rounded-full blur-3xl opacity-50 pointer-events-none" />
        <div className="absolute -bottom-32 -left-32 w-96 h-96 bg-accent-100 rounded-full blur-3xl opacity-50 pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary-50 border border-primary-200 text-primary-700 text-sm font-medium mb-6">
              <Heart className="w-4 h-4 fill-primary-300 text-primary-500" /> Husband & Wife · Broadcast & Brand Veterans · AI Pioneers
            </div>
            <h1 className="text-5xl md:text-6xl font-bold text-neutral-900 tracking-tight mb-6">
              Agency Quality.<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-500 to-accent-400">
                Without the Agency Price.
              </span>
            </h1>
            <p className="text-xl text-neutral-600 max-w-3xl mx-auto leading-relaxed">
              BundledContent is AI social media on autopilot — posts, custom images, and auto-publishing across every platform. Behind it is a husband and wife team with decades of broadcast, brand, and marketing experience who figured out how to make AI content creation work at real scale.
            </p>
          </div>

          {/* ── Founder Photos ── */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">

            {/* Trent */}
            <div className="group relative bg-white rounded-3xl border border-neutral-200 shadow-lg overflow-hidden">
              <div className="relative overflow-hidden h-80">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/trent.png"
                  alt="Trent Daniel"
                  className="w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-neutral-900/70 via-transparent to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-6">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-primary-500 text-white text-xs font-bold rounded-full mb-2">
                    Co-Founder
                  </div>
                  <h2 className="text-2xl font-bold text-white">Trent Daniel</h2>
                  <p className="text-white/80 text-sm">Paid Media · AI Systems · Growth Strategy</p>
                </div>
              </div>
              <div className="p-6">
                <p className="text-neutral-600 text-sm leading-relaxed">
                  A former motion picture executive, radio host, and television and film producer, Trent has developed online and broadcast content for <span className="font-semibold text-neutral-800">CBS, Clear Channel Media, Fox News, CNN,</span> and more. He brings decades of storytelling craft and production expertise to the AI systems that power BundledContent.
                </p>
                <div className="flex flex-wrap gap-2 mt-4">
                  {["Motion Picture", "Broadcast Media", "AI Systems", "Content Production"].map(tag => (
                    <span key={tag} className="text-xs font-semibold px-2.5 py-1 bg-primary-50 text-primary-700 rounded-full border border-primary-100">{tag}</span>
                  ))}
                </div>
              </div>
            </div>

            {/* Stella */}
            <div className="group relative bg-white rounded-3xl border border-neutral-200 shadow-lg overflow-hidden">
              <div className="relative overflow-hidden h-80">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/stella.png"
                  alt="Sella Daniel"
                  className="w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-neutral-900/70 via-transparent to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-6">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-accent-400 text-white text-xs font-bold rounded-full mb-2">
                    Co-Founder
                  </div>
                  <h2 className="text-2xl font-bold text-white">Sella Daniel</h2>
                  <p className="text-white/80 text-sm">Brand Strategy · Content · Voice & Narrative</p>
                </div>
              </div>
              <div className="p-6">
                <p className="text-neutral-600 text-sm leading-relaxed">
                  A former marketing manager for several major online brands and a sales executive at <span className="font-semibold text-neutral-800">Greystar</span> — one of the world&apos;s largest real estate companies — Sella brings elite-level brand strategy and sales intelligence to every BundledContent campaign. She ensures the content doesn&apos;t just look good. It converts.
                </p>
                <div className="flex flex-wrap gap-2 mt-4">
                  {["Brand Strategy", "Sales Leadership", "Online Marketing", "Client Growth"].map(tag => (
                    <span key={tag} className="text-xs font-semibold px-2.5 py-1 bg-accent-50 text-accent-700 rounded-full border border-accent-100">{tag}</span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Stats ── */}
      <section className="py-16 bg-gradient-to-br from-primary-700 via-primary-600 to-primary-500">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {stats.map((s) => (
              <div key={s.label}>
                <p className="text-4xl font-bold text-white mb-1">{s.value}</p>
                <p className="text-primary-200 text-sm font-medium">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Our Story ── */}
      <section className="py-24 bg-neutral-50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-neutral-900 mb-4">The Story Behind the System</h2>
            <p className="text-neutral-500 text-lg max-w-2xl mx-auto">From broadcast networks to boardrooms to AI labs — how two industry veterans built the content machine that levels the playing field for every business.</p>
          </div>

          <div className="relative">
            {/* Vertical line */}
            <div className="absolute left-8 top-0 bottom-0 w-px bg-neutral-200 hidden md:block" />

            <div className="space-y-10">
              {timeline.map((item) => (
                <div key={item.year} className="relative md:pl-24">
                  {/* Year bubble */}
                  <div className="hidden md:flex absolute left-0 w-16 h-16 rounded-2xl bg-white border-2 border-primary-200 items-center justify-center shadow-sm">
                    <span className="text-xs font-bold text-primary-600 leading-tight text-center">{item.year}</span>
                  </div>
                  <div className="bg-white rounded-2xl border border-neutral-200 p-7 shadow-sm">
                    <div className="flex items-center gap-3 mb-3">
                      <span className="md:hidden text-xs font-bold text-primary-600 bg-primary-50 px-2.5 py-1 rounded-full border border-primary-100">{item.year}</span>
                      <h3 className="text-lg font-bold text-neutral-900">{item.title}</h3>
                    </div>
                    <p className="text-neutral-600 leading-relaxed">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Quote ── */}
      <section className="py-20 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-gradient-to-br from-neutral-900 to-neutral-800 rounded-3xl p-10 md:p-14 relative overflow-hidden">
            <div className="absolute top-6 left-8 opacity-10">
              <Quote className="w-24 h-24 text-white" />
            </div>
            <div className="absolute -bottom-8 -right-8 w-40 h-40 bg-primary-500 rounded-full blur-3xl opacity-20" />
            <div className="relative">
              <p className="text-white text-2xl md:text-3xl font-semibold leading-relaxed mb-8">
                &ldquo;We&apos;ve worked inside the biggest media companies in the world and inside lean startups. The gap between what big brands spend on content and what small businesses can afford is massive. BundledContent closes that gap — permanently.&rdquo;
              </p>
              <div className="flex items-center gap-4">
                <div className="flex -space-x-3">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src="/trent.png"
                    alt="Trent" className="w-12 h-12 rounded-full border-2 border-neutral-700 object-cover object-top" />
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src="/stella.png"
                    alt="Sella" className="w-12 h-12 rounded-full border-2 border-neutral-700 object-cover object-top" />
                </div>
                <div>
                  <p className="text-white font-bold">Trent & Sella Daniel</p>
                  <p className="text-neutral-400 text-sm">Co-Founders, BundledContent</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Values ── */}
      <section className="py-24 bg-neutral-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <h2 className="text-4xl font-bold text-neutral-900 mb-4">What We Believe</h2>
            <p className="text-neutral-500 text-lg max-w-xl mx-auto">The principles we built BundledContent around — and the ones we run every client campaign by.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {values.map((v) => (
              <div key={v.title} className="bg-white rounded-2xl border border-neutral-200 p-6 shadow-sm">
                <div className={`w-10 h-10 ${v.bg} rounded-xl flex items-center justify-center mb-4`}>
                  {v.icon}
                </div>
                <h3 className="font-bold text-neutral-900 mb-2">{v.title}</h3>
                <p className="text-neutral-500 text-sm leading-relaxed">{v.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Testimonial strip ── */}
      <section className="py-16 bg-white border-t border-neutral-100">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="flex justify-center gap-1 mb-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star key={i} className="w-5 h-5 fill-yellow-400 text-yellow-400" />
            ))}
          </div>
          <p className="text-2xl font-semibold text-neutral-800 italic max-w-2xl mx-auto mb-6">
            &ldquo;Working with Trent and Sella feels like having a full marketing team in your corner — at a fraction of the cost. They actually care about your brand.&rdquo;
          </p>
          <p className="text-neutral-500 font-medium">— James T., Business Owner · client since 2024</p>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="py-20 bg-gradient-to-br from-primary-700 via-primary-600 to-primary-500">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-bold text-white mb-4">Ready to Work With Us?</h2>
          <p className="text-primary-100 text-lg mb-8">Start with a free demo — see exactly what we&apos;d build for your brand before spending a dollar.</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/demo"
              className="inline-flex items-center gap-2 px-8 py-4 bg-accent-400 hover:bg-accent-500 text-white font-bold rounded-xl transition-colors shadow-lg text-lg">
              Try Free Demo <ArrowRight className="w-5 h-5" />
            </Link>
            <Link href="/#pricing"
              className="inline-flex items-center gap-2 px-8 py-4 bg-white/15 border border-white/30 text-white font-bold rounded-xl hover:bg-white/25 transition-colors text-lg">
              See Plans →
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </>
  );
}
