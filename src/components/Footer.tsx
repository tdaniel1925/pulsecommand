import Link from "next/link";
import Image from "next/image";
import { PUBLIC_PLAN, formatPrice } from "@/lib/stripe";

export default function Footer() {
  return (
    <footer className="bg-neutral-900 text-white py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 mb-12">
          {/* Brand */}
          <div className="md:col-span-1">
            <div className="mb-4">
              <Image src="/logo.png" alt="BundledContent" width={160} height={54} className="h-10 w-auto" />
            </div>
            <p className="text-neutral-400 text-sm leading-relaxed">
              AI social media on autopilot — do one interview, and we write, design, and auto-publish your posts across every platform. {formatPrice(PUBLIC_PLAN.price)}/mo, flat.
            </p>
          </div>

          {/* What's Included */}
          <div>
            <h4 className="font-bold text-white mb-6">What&apos;s Included</h4>
            <ul className="space-y-3 text-sm text-neutral-400">
              <li><Link href="/#what-you-get" className="hover:text-primary-400 transition-colors">AI Social Posts</Link></li>
              <li><Link href="/#what-you-get" className="hover:text-primary-400 transition-colors">AI Images</Link></li>
              <li><Link href="/#what-you-get" className="hover:text-primary-400 transition-colors">Auto-Publishing</Link></li>
              <li><Link href="/#how-it-works" className="hover:text-primary-400 transition-colors">How It Works</Link></li>
            </ul>
          </div>

          {/* Company */}
          <div>
            <h4 className="font-bold text-white mb-6">Company</h4>
            <ul className="space-y-3 text-sm text-neutral-400">
              <li><Link href="/#what-you-get" className="hover:text-primary-400 transition-colors">About</Link></li>
              <li><Link href="/#pricing" className="hover:text-primary-400 transition-colors">Pricing</Link></li>
              <li><Link href="/sign-up" className="hover:text-primary-400 transition-colors">Get Started</Link></li>
              <li><a href="mailto:support@bundledcontent.com" className="hover:text-primary-400 transition-colors">Contact</a></li>
            </ul>
          </div>

          {/* Email updates */}
          <div>
            <h4 className="font-bold text-white mb-6">Stay Updated</h4>
            <p className="text-sm text-neutral-400 mb-4">
              AI marketing tips and BundledContent updates, straight to your inbox.
            </p>
            <div className="flex gap-2">
              <input
                type="email"
                placeholder="Enter your email"
                className="bg-neutral-800 border border-neutral-700 text-white px-4 py-2 rounded-lg text-sm w-full focus:outline-none focus:border-primary-500"
              />
              <button className="px-4 py-2 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700 transition-colors whitespace-nowrap">
                Subscribe
              </button>
            </div>
          </div>
        </div>

        <div className="border-t border-neutral-800 pt-8 flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-sm text-neutral-500">
            © {new Date().getFullYear()} BundledContent, a product of Docs2Video. All rights reserved.
          </p>
          <div className="flex gap-5 text-sm text-neutral-500">
            <Link href="/privacy" className="hover:text-neutral-300 transition-colors">Privacy Policy</Link>
            <Link href="/terms" className="hover:text-neutral-300 transition-colors">Terms of Service</Link>
            <a href="mailto:support@bundledcontent.com" className="hover:text-neutral-300 transition-colors">Support</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
