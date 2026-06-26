"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { Menu, X } from "lucide-react";
import DashboardNav from "./DashboardNav";
import { LogoutButton } from "./LogoutButton";

export default function MobileMenuToggle({ planLabel, displayName }: { planLabel?: string; displayName?: string }) {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsOpen(false);
    };
    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
      return () => document.removeEventListener("keydown", handleEscape);
    }
  }, [isOpen]);

  return (
    <>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 hover:bg-neutral-100 rounded-lg transition-colors"
        aria-label="Toggle menu"
      >
        {isOpen ? (
          <X className="w-5 h-5 text-neutral-900" />
        ) : (
          <Menu className="w-5 h-5 text-neutral-900" />
        )}
      </button>

      {/* Mobile menu overlay */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/50 z-40 lg:hidden"
            onClick={() => setIsOpen(false)}
          />

          {/* Sidebar drawer */}
          <div className="fixed left-0 top-0 h-full w-64 bg-white border-r border-neutral-200 flex flex-col z-50 lg:hidden shadow-lg">
            {/* Logo */}
            <div className="px-4 py-6 border-b border-neutral-100 flex justify-center">
              <Link
                href="/dashboard"
                onClick={() => setIsOpen(false)}
              >
                <Image src="/logo.png" alt="BundledContent" width={180} height={60} className="h-14 w-auto" />
              </Link>
            </div>

            {/* Nav */}
            <div onClick={() => setIsOpen(false)}>
              <DashboardNav />
            </div>

            {/* Bottom client area */}
            <div className="px-3 py-4 border-t border-neutral-100 mt-auto">
              <div className="flex items-center gap-3 px-3 py-2">
                <div className="w-8 h-8 rounded-full bg-primary-600 flex items-center justify-center flex-shrink-0">
                  <span className="text-xs font-bold text-white">U</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-neutral-900 truncate">{displayName ?? "Account"}</p>
                  {planLabel && <p className="text-xs text-neutral-400 truncate">{planLabel}</p>}
                </div>
                <LogoutButton />
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
}
