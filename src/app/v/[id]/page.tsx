import { Metadata } from 'next';
import Link from 'next/link';
import { createAdminClient } from '@/lib/supabase/admin';
import { Download, ExternalLink } from 'lucide-react';
import { CopyLinkButton } from '@/components/video/CopyLinkButton';

interface VideoData {
  id: string;
  url: string | null;
  content: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
  clients: {
    business_name: string | null;
    first_name: string | null;
    last_name: string | null;
  } | null;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const supabase = createAdminClient();

  const { data: video } = await supabase
    .from('content_items')
    .select('clients(business_name)')
    .eq('id', id)
    .eq('type', 'short_video')
    .single();

  const client = video?.clients as { business_name?: string } | null;
  const businessName = client?.business_name ?? 'BundledContent';

  return {
    title: `${businessName} — Short Video`,
    description: `Watch a short branded video from ${businessName}, powered by BundledContent.`,
    openGraph: {
      title: `${businessName} — Short Video`,
      description: `AI-powered content for ${businessName}`,
      type: 'video.other',
    },
  };
}

export default async function VideoSharePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = createAdminClient();

  const { data: video } = await supabase
    .from('content_items')
    .select('*, clients(business_name, first_name, last_name)')
    .eq('id', id)
    .eq('type', 'short_video')
    .single() as { data: VideoData | null };

  if (!video) {
    return (
      <div className="min-h-screen bg-neutral-950 flex items-center justify-center">
        <div className="text-center space-y-4">
          <p className="text-5xl">🎬</p>
          <h1 className="text-2xl font-bold text-white">Video Not Found</h1>
          <p className="text-neutral-400">This video link may have expired or been removed.</p>
          <Link
            href="https://bundledcontent.com/demo"
            className="inline-flex items-center gap-2 mt-4 px-6 py-3 bg-primary-600 hover:bg-primary-500 text-white rounded-xl font-medium transition-colors"
          >
            Get AI content for your business
            <ExternalLink className="w-4 h-4" />
          </Link>
        </div>
      </div>
    );
  }

  const client = video.clients;
  const businessName = client?.business_name ?? 'BundledContent';
  const metadata = video.metadata ?? {};
  const heygenVideoId = metadata.heygen_video_id as string | null;
  const videoUrl = video.url;
  const hasVideo = Boolean(videoUrl || heygenVideoId);

  return (
    <div className="min-h-screen bg-neutral-950 flex flex-col">
      {/* Top bar */}
      <header className="flex items-center justify-between px-6 py-4 border-b border-neutral-800">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-primary-600 flex items-center justify-center">
            <span className="text-white text-xs font-bold">BC</span>
          </div>
          <span className="text-white font-semibold text-sm">BundledContent</span>
        </Link>
        <Link
          href={`${process.env.NEXT_PUBLIC_APP_URL ?? 'https://bundledcontent.com'}/demo`}
          target="_blank"
          rel="noreferrer"
          className="text-xs text-neutral-400 hover:text-white transition-colors"
        >
          Get AI content for your business →
        </Link>
      </header>

      {/* Main content */}
      <main className="flex-1 flex flex-col items-center justify-center px-4 py-12">
        {/* Video container — vertical 9:16 aspect ratio */}
        <div className="w-full max-w-sm">
          <div className="relative w-full" style={{ aspectRatio: '9/16' }}>
            {hasVideo && videoUrl ? (
              <video
                src={videoUrl}
                controls
                playsInline
                className="absolute inset-0 w-full h-full object-cover rounded-2xl bg-neutral-900"
                poster=""
              />
            ) : heygenVideoId ? (
              <div className="absolute inset-0 w-full h-full rounded-2xl bg-neutral-900 flex items-center justify-center">
                <div className="text-center space-y-3 px-8">
                  <div className="w-12 h-12 rounded-full border-4 border-primary-500 border-t-transparent animate-spin mx-auto" />
                  <p className="text-neutral-300 text-sm font-medium">Video is being processed</p>
                  <p className="text-neutral-500 text-xs">Check back in a few minutes</p>
                </div>
              </div>
            ) : (
              <div className="absolute inset-0 w-full h-full rounded-2xl bg-neutral-900 flex items-center justify-center">
                <div className="text-center space-y-2 px-8">
                  <p className="text-4xl">🎬</p>
                  <p className="text-neutral-400 text-sm">Video coming soon</p>
                </div>
              </div>
            )}
          </div>

          {/* Video info */}
          <div className="mt-6 space-y-1">
            <h1 className="text-white font-bold text-xl">{businessName}</h1>
            <p className="text-neutral-400 text-sm">
              Short Video · {new Date(video.created_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
            </p>
          </div>

          {/* Action buttons */}
          <div className="mt-5 flex gap-3">
            {videoUrl && (
              <a
                href={videoUrl}
                download
                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-white hover:bg-neutral-100 text-neutral-900 rounded-xl font-medium text-sm transition-colors"
              >
                <Download className="w-4 h-4" />
                Download
              </a>
            )}
            <CopyLinkButton />
          </div>
        </div>

        {/* CTA */}
        <div className="mt-16 text-center space-y-3 max-w-sm">
          <p className="text-neutral-500 text-sm">Want AI-powered content like this for your business?</p>
          <Link
            href={`${process.env.NEXT_PUBLIC_APP_URL ?? 'https://bundledcontent.com'}/demo`}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 px-6 py-3 bg-primary-600 hover:bg-primary-500 text-white rounded-xl font-semibold text-sm transition-colors"
          >
            Get AI content for your business
            <ExternalLink className="w-4 h-4" />
          </Link>
        </div>
      </main>
    </div>
  );
}
