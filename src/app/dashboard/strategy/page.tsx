"use client";

import { useState, useEffect } from "react";
import { ArrowRight, CheckCircle, Loader2, AlertCircle } from "lucide-react";
import Link from "next/link";

interface StrategyPlan {
  businessOverview: {
    whatYouDo: string;
    whoYouServe: string;
    uniqueValueProp: string;
  };
  targetAudience: {
    demographics: string;
    painPoints: string[];
    goals: string[];
  };
  contentStrategy: {
    pillars: string[];
    pillarDescriptions: Record<string, string>;
    rationale: string;
  };
  channelStrategy: {
    channels: string[];
    channelRationale: Record<string, string>;
    postingFrequency: string;
    bestTimes: string;
  };
  toneAndVoice: {
    personality: string;
    voiceGuidance: string;
    doList: string[];
    dontList: string[];
    examplePhrases: string[];
  };
  successMetrics: {
    engagementTargets: string;
    timelineExpectations: string;
    keyIndicators: string[];
  };
}

export default function StrategyPage() {
  const [strategy, setStrategy] = useState<StrategyPlan | null>(null);
  const [approved, setApproved] = useState(false);
  const [loading, setLoading] = useState(true);
  const [approving, setApproving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/auth/me")
      .then(r => r.json())
      .then(user => {
        if (user.brand_profiles?.brand_strategy) {
          setStrategy(user.brand_profiles.brand_strategy);
          setApproved(user.brand_profiles.strategy_approved ?? false);
        }
        setLoading(false);
      })
      .catch(err => {
        console.error("Failed to load strategy:", err);
        setError("Could not load your strategy");
        setLoading(false);
      });
  }, []);

  async function handleApprove() {
    setApproving(true);
    try {
      const res = await fetch("/api/strategy/approve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      if (!res.ok) throw new Error("Failed to approve");
      setApproved(true);
    } catch {
      setError("Failed to approve strategy");
    } finally {
      setApproving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-primary-600" />
          <p className="text-neutral-600">Loading your strategy...</p>
        </div>
      </div>
    );
  }

  if (!strategy) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="bg-neutral-50 rounded-2xl border border-neutral-200 p-8 text-center">
          <AlertCircle className="w-12 h-12 text-neutral-400 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-neutral-900 mb-2">No Strategy Yet</h2>
          <p className="text-neutral-600 mb-6">
            Complete your brand interview to generate your personalized strategy.
          </p>
          <Link
            href="/onboarding/interview"
            className="inline-flex items-center gap-2 px-6 py-3 bg-primary-600 text-white font-bold rounded-xl hover:bg-primary-700 transition-colors"
          >
            Start Interview <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-8">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold text-neutral-900">Brand Strategy Plan</h1>
        <p className="text-neutral-600">
          Your personalized strategy based on your brand interview. Review and approve to start content generation.
        </p>
      </div>

      {/* Status */}
      {approved && (
        <div className="bg-green-50 border border-green-200 rounded-2xl p-6 flex items-start gap-4">
          <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-bold text-green-900">Strategy Approved! ✅</h3>
            <p className="text-green-700 text-sm mt-1">
              Your content generation will start within the next few hours based on this strategy.
            </p>
          </div>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-6 flex items-start gap-4">
          <AlertCircle className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-bold text-red-900">Error</h3>
            <p className="text-red-700 text-sm mt-1">{error}</p>
          </div>
        </div>
      )}

      {/* Business Overview */}
      <div className="bg-white rounded-2xl border border-neutral-200 p-8 space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-neutral-900 mb-6">Business Overview</h2>

          <div className="space-y-6">
            <div>
              <h3 className="text-sm font-semibold text-neutral-500 uppercase tracking-wide mb-2">What You Do</h3>
              <p className="text-base text-neutral-900">{strategy.businessOverview.whatYouDo}</p>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-neutral-500 uppercase tracking-wide mb-2">Who You Serve</h3>
              <p className="text-base text-neutral-900">{strategy.businessOverview.whoYouServe}</p>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-neutral-500 uppercase tracking-wide mb-2">Unique Value Proposition</h3>
              <p className="text-base text-neutral-900 font-semibold text-primary-600">{strategy.businessOverview.uniqueValueProp}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Target Audience */}
      <div className="bg-white rounded-2xl border border-neutral-200 p-8 space-y-6">
        <h2 className="text-2xl font-bold text-neutral-900">Target Audience</h2>

        <div>
          <h3 className="text-sm font-semibold text-neutral-500 uppercase tracking-wide mb-2">Demographics</h3>
          <p className="text-base text-neutral-900">{strategy.targetAudience.demographics}</p>
        </div>

        <div>
          <h3 className="text-sm font-semibold text-neutral-500 uppercase tracking-wide mb-3">Pain Points</h3>
          <ul className="space-y-2">
            {strategy.targetAudience.painPoints.map((point, i) => (
              <li key={i} className="flex items-start gap-3">
                <span className="text-primary-600 font-bold">•</span>
                <span className="text-neutral-900">{point}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Content Strategy */}
      <div className="bg-white rounded-2xl border border-neutral-200 p-8 space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-neutral-900 mb-4">Content Strategy: 5 Pillars</h2>
          <p className="text-neutral-600 mb-6">{strategy.contentStrategy.rationale}</p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {strategy.contentStrategy.pillars.map((pillar, i) => (
              <div key={i} className="bg-primary-50 border border-primary-200 rounded-xl p-4">
                <h4 className="font-bold text-primary-900 mb-2">{pillar}</h4>
                <p className="text-sm text-primary-700">{strategy.contentStrategy.pillarDescriptions[pillar]}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Channel Strategy */}
      <div className="bg-white rounded-2xl border border-neutral-200 p-8 space-y-6">
        <h2 className="text-2xl font-bold text-neutral-900 mb-6">Channel Strategy</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="text-sm font-semibold text-neutral-500 uppercase tracking-wide mb-3">Channels</h3>
            <div className="space-y-2">
              {strategy.channelStrategy.channels.map((channel, i) => (
                <div key={i} className="flex items-center gap-3 p-3 bg-neutral-50 rounded-lg">
                  <span className="w-2 h-2 bg-primary-600 rounded-full"></span>
                  <span className="font-medium text-neutral-900">{channel}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-semibold text-neutral-500 uppercase tracking-wide mb-2">Posting Frequency</h3>
              <p className="text-base text-neutral-900 font-semibold">{strategy.channelStrategy.postingFrequency}</p>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-neutral-500 uppercase tracking-wide mb-2">Best Times to Post</h3>
              <p className="text-base text-neutral-900 font-semibold">{strategy.channelStrategy.bestTimes}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tone & Voice */}
      <div className="bg-white rounded-2xl border border-neutral-200 p-8 space-y-6">
        <h2 className="text-2xl font-bold text-neutral-900 mb-6">Tone & Voice Guide</h2>

        <div>
          <h3 className="text-sm font-semibold text-neutral-500 uppercase tracking-wide mb-3">Brand Personality</h3>
          <p className="text-base text-neutral-900 font-semibold italic text-primary-600">&ldquo;{strategy.toneAndVoice.personality}&rdquo;</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="font-bold text-green-900 mb-3">✓ Do&apos;s</h4>
            <ul className="space-y-2">
              {strategy.toneAndVoice.doList.map((item, i) => (
                <li key={i} className="flex items-start gap-3">
                  <span className="text-green-600 font-bold text-lg">✓</span>
                  <span className="text-neutral-700">{item}</span>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-bold text-red-900 mb-3">✗ Don&apos;ts</h4>
            <ul className="space-y-2">
              {strategy.toneAndVoice.dontList.map((item, i) => (
                <li key={i} className="flex items-start gap-3">
                  <span className="text-red-600 font-bold text-lg">✗</span>
                  <span className="text-neutral-700">{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div>
          <h4 className="font-bold text-neutral-900 mb-3">Example Phrases</h4>
          <div className="space-y-2">
            {strategy.toneAndVoice.examplePhrases.map((phrase, i) => (
              <div key={i} className="p-3 bg-neutral-50 rounded-lg italic text-neutral-700">&ldquo;{phrase}&rdquo;</div>
            ))}
          </div>
        </div>
      </div>

      {/* Success Metrics */}
      <div className="bg-white rounded-2xl border border-neutral-200 p-8 space-y-6">
        <h2 className="text-2xl font-bold text-neutral-900 mb-6">Success Metrics</h2>

        <div>
          <h3 className="text-sm font-semibold text-neutral-500 uppercase tracking-wide mb-3">Engagement Targets</h3>
          <p className="text-base text-neutral-900">{strategy.successMetrics.engagementTargets}</p>
        </div>

        <div>
          <h3 className="text-sm font-semibold text-neutral-500 uppercase tracking-wide mb-3">Timeline</h3>
          <p className="text-base text-neutral-900">{strategy.successMetrics.timelineExpectations}</p>
        </div>

        <div>
          <h3 className="text-sm font-semibold text-neutral-500 uppercase tracking-wide mb-3">Key Indicators</h3>
          <ul className="space-y-2">
            {strategy.successMetrics.keyIndicators.map((indicator, i) => (
              <li key={i} className="flex items-start gap-3">
                <span className="text-primary-600 font-bold">→</span>
                <span className="text-neutral-900">{indicator}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Actions */}
      {!approved && (
        <div className="space-y-4">
          <div className="flex gap-4">
            <button
              onClick={handleApprove}
              disabled={approving}
              className="flex-1 flex items-center justify-center gap-2 px-6 py-4 bg-primary-600 text-white font-bold rounded-xl hover:bg-primary-700 disabled:opacity-50 transition-colors"
            >
              {approving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Approving...
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4" />
                  Approve & Start Content Generation
                </>
              )}
            </button>
          </div>
          <p className="text-center text-sm text-neutral-600">
            Once approved, we&apos;ll generate your first batch of content within 24 hours based on this strategy.
          </p>
        </div>
      )}
    </div>
  );
}
