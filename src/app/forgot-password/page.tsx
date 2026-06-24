"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Mail, CheckCircle } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) throw error;
      setSubmitted(true);
    } catch (err: unknown) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-neutral-50 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 mb-6">
            <Image src="/logo.png" alt="BundledContent" width={140} height={47} className="h-9 w-auto" />
          </Link>
          <h1 className="text-2xl font-bold text-neutral-900">Reset your password</h1>
          <p className="text-neutral-500 text-sm mt-1">
            Enter your email and we&apos;ll send you a reset link
          </p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl border border-neutral-200 shadow-sm p-8">
          {submitted ? (
            <div className="text-center py-4">
              <div className="flex items-center justify-center mb-4">
                <div className="w-14 h-14 bg-green-50 rounded-full flex items-center justify-center">
                  <CheckCircle className="w-8 h-8 text-green-500" />
                </div>
              </div>
              <h2 className="text-lg font-bold text-neutral-900 mb-2">Check your inbox</h2>
              <p className="text-sm text-neutral-500 mb-6">
                We&apos;ve sent a password reset link to{" "}
                <span className="font-semibold text-neutral-700">{email}</span>. Check your spam
                folder if you don&apos;t see it.
              </p>
              <Link
                href="/login"
                className="inline-block w-full py-3 bg-primary-600 text-white font-bold rounded-xl hover:bg-primary-700 transition-colors shadow-sm text-center text-sm"
              >
                Back to Login
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-semibold text-neutral-700 mb-1.5">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="jane@company.com"
                    required
                    className="w-full pl-11 pr-4 py-3 bg-neutral-50 border border-neutral-200 rounded-lg text-neutral-900 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all text-sm"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-primary-600 text-white font-bold rounded-xl hover:bg-primary-700 transition-colors shadow-sm disabled:opacity-60 disabled:cursor-not-allowed text-sm"
              >
                {loading ? "Sending..." : "Send Reset Link"}
              </button>

              <div className="text-center">
                <Link
                  href="/login"
                  className="text-sm text-primary-600 hover:underline font-medium"
                >
                  ← Back to login
                </Link>
              </div>
            </form>
          )}
        </div>

        <p className="text-center text-xs text-neutral-400 mt-6">
          © {new Date().getFullYear()} BundledContent. All rights reserved.
        </p>
      </div>
    </div>
  );
}
