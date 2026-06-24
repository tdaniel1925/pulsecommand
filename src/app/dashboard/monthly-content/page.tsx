"use client";

import { useState, useEffect } from "react";
import { Download, CheckCircle, Loader2, AlertCircle, FileText, BookOpen, MessageSquare, Image, Award, Mail, Headphones, Calendar } from "lucide-react";
import Link from "next/link";

interface MonthlyContent {
  id: string;
  month: string;
  status: 'ready_for_review' | 'approved' | 'published';
  content: {
    whitepaper?: unknown;
    articles?: unknown[];
    tweets?: unknown[];
    infographics?: unknown[];
    caseStudies?: unknown[];
    emails?: unknown[];
    podcasts?: unknown[];
  };
  created_at: string;
  published_at?: string;
}

interface ContentStats {
  totalPieces: number;
  whitepaper: number;
  articles: number;
  tweets: number;
  infographics: number;
  caseStudies: number;
  emails: number;
  podcasts: number;
}

export default function MonthlyContentPage() {
  const [content, setContent] = useState<MonthlyContent | null>(null);
  const [stats, setStats] = useState<ContentStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [approving, setApproving] = useState(false);
  const [error, setError] = useState("");
  const [selectedView, setSelectedView] = useState<'overview' | 'whitepaper' | 'articles' | 'tweets' | 'infographics' | 'case_studies' | 'emails' | 'podcasts'>('overview');

  useEffect(() => {
    fetch("/api/dashboard/monthly-content")
      .then(r => r.json())
      .then(data => {
        setContent(data.content);
        setStats(data.stats);
        setLoading(false);
      })
      .catch(err => {
        console.error("Failed to load content:", err);
        setError("Could not load monthly content");
        setLoading(false);
      });
  }, []);

  const handleApproveAll = async () => {
    if (!content) return;
    setApproving(true);
    try {
      const res = await fetch("/api/dashboard/monthly-content/approve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contentId: content.id }),
      });
      if (!res.ok) throw new Error("Failed to approve");
      window.location.reload();
    } catch {
      setError("Failed to approve content");
    } finally {
      setApproving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-primary-600" />
          <p className="text-neutral-600">Loading your monthly content...</p>
        </div>
      </div>
    );
  }

  if (!content) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="bg-neutral-50 rounded-2xl border border-neutral-200 p-8 text-center">
          <Calendar className="w-12 h-12 text-neutral-400 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-neutral-900 mb-2">No Content Yet</h2>
          <p className="text-neutral-600 mb-6">
            Your monthly content is generated automatically after strategy approval. Check back soon!
          </p>
          <Link
            href="/dashboard/strategy"
            className="inline-flex items-center gap-2 px-6 py-3 bg-primary-600 text-white font-bold rounded-xl hover:bg-primary-700 transition-colors"
          >
            Approve Your Strategy
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold text-neutral-900">Monthly Content Suite</h1>
        <p className="text-neutral-600">
          Your {content.month} content is ready for review. Approve to publish across all channels.
        </p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-6 flex items-start gap-4">
          <AlertCircle className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-bold text-red-900">Error</h3>
            <p className="text-red-700 text-sm mt-1">{error}</p>
          </div>
        </div>
      )}

      {/* Status Badge */}
      <div className={`rounded-2xl border p-6 flex items-center justify-between ${
        content.status === 'published' ? 'bg-green-50 border-green-200' :
        content.status === 'approved' ? 'bg-blue-50 border-blue-200' :
        'bg-amber-50 border-amber-200'
      }`}>
        <div className="flex items-center gap-3">
          {content.status === 'published' && <CheckCircle className="w-6 h-6 text-green-600" />}
          {content.status === 'approved' && <CheckCircle className="w-6 h-6 text-blue-600" />}
          {content.status === 'ready_for_review' && <AlertCircle className="w-6 h-6 text-amber-600" />}
          <div>
            <h3 className={`font-bold ${
              content.status === 'published' ? 'text-green-900' :
              content.status === 'approved' ? 'text-blue-900' :
              'text-amber-900'
            }`}>
              {content.status === 'published' && 'Published to All Channels'}
              {content.status === 'approved' && 'Approved - Publishing Now'}
              {content.status === 'ready_for_review' && 'Ready for Review'}
            </h3>
            <p className={`text-sm ${
              content.status === 'published' ? 'text-green-700' :
              content.status === 'approved' ? 'text-blue-700' :
              'text-amber-700'
            }`}>
              {new Date(content.created_at).toLocaleDateString()} • {stats?.totalPieces} pieces of content
            </p>
          </div>
        </div>
      </div>

      {/* Content Stats Grid */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {stats.whitepaper > 0 && (
            <button
              onClick={() => setSelectedView('whitepaper')}
              className={`rounded-xl p-4 border-2 transition-all cursor-pointer ${
                selectedView === 'whitepaper'
                  ? 'border-primary-600 bg-primary-50'
                  : 'border-neutral-200 hover:border-primary-300'
              }`}
            >
              <FileText className="w-6 h-6 text-primary-600 mx-auto mb-2" />
              <div className="font-bold text-sm">{stats.whitepaper}</div>
              <div className="text-xs text-neutral-600">Whitepaper</div>
            </button>
          )}

          {stats.articles > 0 && (
            <button
              onClick={() => setSelectedView('articles')}
              className={`rounded-xl p-4 border-2 transition-all cursor-pointer ${
                selectedView === 'articles'
                  ? 'border-primary-600 bg-primary-50'
                  : 'border-neutral-200 hover:border-primary-300'
              }`}
            >
              <BookOpen className="w-6 h-6 text-primary-600 mx-auto mb-2" />
              <div className="font-bold text-sm">{stats.articles}</div>
              <div className="text-xs text-neutral-600">Articles</div>
            </button>
          )}

          {stats.tweets > 0 && (
            <button
              onClick={() => setSelectedView('tweets')}
              className={`rounded-xl p-4 border-2 transition-all cursor-pointer ${
                selectedView === 'tweets'
                  ? 'border-primary-600 bg-primary-50'
                  : 'border-neutral-200 hover:border-primary-300'
              }`}
            >
              <MessageSquare className="w-6 h-6 text-primary-600 mx-auto mb-2" />
              <div className="font-bold text-sm">{stats.tweets}</div>
              <div className="text-xs text-neutral-600">Threads</div>
            </button>
          )}

          {stats.infographics > 0 && (
            <button
              onClick={() => setSelectedView('infographics')}
              className={`rounded-xl p-4 border-2 transition-all cursor-pointer ${
                selectedView === 'infographics'
                  ? 'border-primary-600 bg-primary-50'
                  : 'border-neutral-200 hover:border-primary-300'
              }`}
            >
              <Image aria-label="Infographics" className="w-6 h-6 text-primary-600 mx-auto mb-2" />
              <div className="font-bold text-sm">{stats.infographics}</div>
              <div className="text-xs text-neutral-600">Infographics</div>
            </button>
          )}

          {stats.caseStudies > 0 && (
            <button
              onClick={() => setSelectedView('case_studies')}
              className={`rounded-xl p-4 border-2 transition-all cursor-pointer ${
                selectedView === 'case_studies'
                  ? 'border-primary-600 bg-primary-50'
                  : 'border-neutral-200 hover:border-primary-300'
              }`}
            >
              <Award className="w-6 h-6 text-primary-600 mx-auto mb-2" />
              <div className="font-bold text-sm">{stats.caseStudies}</div>
              <div className="text-xs text-neutral-600">Case Studies</div>
            </button>
          )}

          {stats.emails > 0 && (
            <button
              onClick={() => setSelectedView('emails')}
              className={`rounded-xl p-4 border-2 transition-all cursor-pointer ${
                selectedView === 'emails'
                  ? 'border-primary-600 bg-primary-50'
                  : 'border-neutral-200 hover:border-primary-300'
              }`}
            >
              <Mail className="w-6 h-6 text-primary-600 mx-auto mb-2" />
              <div className="font-bold text-sm">{stats.emails}</div>
              <div className="text-xs text-neutral-600">Email Seq</div>
            </button>
          )}

          {stats.podcasts > 0 && (
            <button
              onClick={() => setSelectedView('podcasts')}
              className={`rounded-xl p-4 border-2 transition-all cursor-pointer ${
                selectedView === 'podcasts'
                  ? 'border-primary-600 bg-primary-50'
                  : 'border-neutral-200 hover:border-primary-300'
              }`}
            >
              <Headphones className="w-6 h-6 text-primary-600 mx-auto mb-2" />
              <div className="font-bold text-sm">{stats.podcasts}</div>
              <div className="text-xs text-neutral-600">Podcasts</div>
            </button>
          )}
        </div>
      )}

      {/* Content Preview */}
      <div className="bg-white rounded-2xl border border-neutral-200 p-8">
        {selectedView === 'overview' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-neutral-900 mb-4">Your Monthly Suite Includes</h2>
              <ul className="space-y-3">
                {stats?.whitepaper && <li className="flex items-center gap-3"><CheckCircle className="w-5 h-5 text-green-600" /> <span className="text-neutral-900"><strong>{stats.whitepaper}</strong> Professional Whitepaper</span></li>}
                {stats?.articles && <li className="flex items-center gap-3"><CheckCircle className="w-5 h-5 text-green-600" /> <span className="text-neutral-900"><strong>{stats.articles}</strong> LinkedIn Articles (1000-1500 words each)</span></li>}
                {stats?.tweets && <li className="flex items-center gap-3"><CheckCircle className="w-5 h-5 text-green-600" /> <span className="text-neutral-900"><strong>{stats.tweets}</strong> Tweet Threads</span></li>}
                {stats?.infographics && <li className="flex items-center gap-3"><CheckCircle className="w-5 h-5 text-green-600" /> <span className="text-neutral-900"><strong>{stats.infographics}</strong> Infographic Designs</span></li>}
                {stats?.caseStudies && <li className="flex items-center gap-3"><CheckCircle className="w-5 h-5 text-green-600" /> <span className="text-neutral-900"><strong>{stats.caseStudies}</strong> Case Studies</span></li>}
                {stats?.emails && <li className="flex items-center gap-3"><CheckCircle className="w-5 h-5 text-green-600" /> <span className="text-neutral-900"><strong>{stats.emails}</strong> Email Sequences</span></li>}
                {stats?.podcasts && <li className="flex items-center gap-3"><CheckCircle className="w-5 h-5 text-green-600" /> <span className="text-neutral-900"><strong>{stats.podcasts}</strong> Podcast Episodes</span></li>}
              </ul>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
              <p className="text-sm text-blue-900">
                ✨ <strong>All content is already aligned to your Brand Strategy Plan.</strong> Each piece follows your tone, targets your audience, and hits your content pillars.
              </p>
            </div>
          </div>
        )}

        {selectedView !== 'overview' && (
          <div>
            <button
              onClick={() => setSelectedView('overview')}
              className="text-primary-600 hover:text-primary-700 mb-6 text-sm font-medium"
            >
              ← Back to Overview
            </button>
            <div className="text-center py-12">
              <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-neutral-400" />
              <p className="text-neutral-600">Content preview coming soon</p>
            </div>
          </div>
        )}
      </div>

      {/* Actions */}
      {content.status === 'ready_for_review' && (
        <div className="flex gap-4">
          <button
            onClick={handleApproveAll}
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
                Approve All Content
              </>
            )}
          </button>

          <button
            className="flex items-center justify-center gap-2 px-6 py-4 bg-neutral-100 text-neutral-900 font-bold rounded-xl hover:bg-neutral-200 transition-colors"
          >
            <Download className="w-4 h-4" />
            Download Bundle
          </button>
        </div>
      )}

      {content.status === 'approved' && (
        <div className="bg-blue-50 border border-blue-200 rounded-2xl p-6 flex items-start gap-4">
          <Loader2 className="w-6 h-6 text-blue-600 flex-shrink-0 mt-0.5 animate-spin" />
          <div>
            <h3 className="font-bold text-blue-900">Publishing to All Channels</h3>
            <p className="text-blue-700 text-sm mt-1">
              Your content is being published to all your connected social media platforms. Check back in a few minutes to see posts live.
            </p>
          </div>
        </div>
      )}

      {content.status === 'published' && (
        <div className="bg-green-50 border border-green-200 rounded-2xl p-6 flex items-start gap-4">
          <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-bold text-green-900">All Content Published!</h3>
            <p className="text-green-700 text-sm mt-1">
              Your monthly content suite has been published across all your social channels. View performance metrics in your Dashboard.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
