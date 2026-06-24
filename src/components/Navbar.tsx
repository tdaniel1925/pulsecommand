"use client";

import Link from "next/link";
import { Menu, X } from "lucide-react";
import Image from "next/image";
import { useState } from "react";
import { useRouter } from "next/navigation";

const NAV_LINKS = [
  { label: "What's Included", anchor: "what-you-get" },
  { label: "How It Works", anchor: "how-it-works" },
  { label: "Pricing", anchor: "pricing" },
];

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const router = useRouter();

  function handleAnchor(anchor: string) {
    setOpen(false);
    const el = document.getElementById(anchor);
    if (el) {
      el.scrollIntoView({ behavior: "smooth" });
    } else {
      // Navigate to home first, then scroll after load
      router.push(`/#${anchor}`);
    }
  }

  return (
    <nav className="fixed w-full z-50 bg-white/90 backdrop-blur-md border-b border-neutral-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          {/* Logo */}
          <Link href="/" className="flex items-center">
            <Image src="/logo.png" alt="BundledContent" width={180} height={60} className="h-12 w-auto" priority />
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center space-x-8">
            {NAV_LINKS.map((l) => (
              <button
                key={l.anchor}
                onClick={() => handleAnchor(l.anchor)}
                className="text-neutral-600 hover:text-primary-600 font-medium transition-colors"
              >
                {l.label}
              </button>
            ))}
            <Link
              href="/samples"
              className="text-neutral-600 hover:text-primary-600 font-medium transition-colors"
            >
              See Samples
            </Link>
            <Link
              href="/about"
              className="text-neutral-600 hover:text-primary-600 font-medium transition-colors"
            >
              About Us
            </Link>
<Link
              href="/login"
              className="text-neutral-600 hover:text-primary-600 font-medium transition-colors"
            >
              Sign In
            </Link>
            <Link
              href="/demo"
              className="px-5 py-2.5 bg-white text-primary-700 font-bold rounded-lg border border-primary-200 hover:bg-primary-50 transition-colors shadow-sm"
            >
              Try Demo
            </Link>
            <Link
              href="/sign-up"
              className="px-5 py-2.5 bg-accent-400 text-white font-bold rounded-lg hover:bg-accent-500 transition-colors shadow-sm"
            >
              Get Started
            </Link>
          </div>

          {/* Mobile toggle */}
          <button
            className="md:hidden text-neutral-600 hover:text-neutral-900"
            onClick={() => setOpen(!open)}
          >
            {open ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="md:hidden bg-white border-t border-neutral-200 px-4 py-4 space-y-3">
          {NAV_LINKS.map((l) => (
            <button
              key={l.anchor}
              onClick={() => handleAnchor(l.anchor)}
              className="block w-full text-left text-neutral-700 font-medium py-2"
            >
              {l.label}
            </button>
          ))}
          <Link
            href="/samples"
            className="block text-neutral-700 font-medium py-2"
            onClick={() => setOpen(false)}
          >
            See Samples
          </Link>
          <Link
            href="/about"
            className="block text-neutral-700 font-medium py-2"
            onClick={() => setOpen(false)}
          >
            About Us
          </Link>
          <Link
            href="/login"
            className="block text-neutral-700 font-medium py-2"
            onClick={() => setOpen(false)}
          >
            Sign In
          </Link>
          <Link
            href="/demo"
            className="block w-full text-center px-5 py-2.5 bg-primary-50 text-primary-700 font-bold rounded-lg border border-primary-200 hover:bg-primary-100 transition-colors"
            onClick={() => setOpen(false)}
          >
            Try Free Demo
          </Link>
          <Link
            href="/sign-up"
            className="block w-full text-center px-5 py-2.5 bg-primary-600 text-white font-bold rounded-lg hover:bg-primary-700 transition-colors"
            onClick={() => setOpen(false)}
          >
            Get Started
          </Link>
        </div>
      )}
    </nav>
  );
}
