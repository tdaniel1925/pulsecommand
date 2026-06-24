import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { postToAyrshare } from '@/lib/ayrshare';
import { sendPostPublishedEmail } from '@/lib/email';
import { createNotification } from '@/lib/notifications';

// POST — publish a social_post row to all its platforms via Ayrshare
export async function POST(req: NextRequest) {
  try {
    const { postId } = await req.json();
    if (!postId) return NextResponse.json({ error: 'postId required' }, { status: 400 });

    const admin = createAdminClient();

    // Fetch the post
    const { data: post } = await admin
      .from('social_posts')
      .select('id, client_id, content, platforms, image_url, metadata')
      .eq('id', postId)
      .single();

    if (!post) return NextResponse.json({ error: 'Post not found' }, { status: 404 });

    // Fetch client's Ayrshare profile key
    const { data: client } = await admin
      .from('clients')
      .select('ayrshare_profile_key, business_name')
      .eq('id', post.client_id)
      .single();

    if (!client?.ayrshare_profile_key) {
      return NextResponse.json({ error: 'Client has not connected social accounts yet' }, { status: 400 });
    }

    const captions = (post.metadata as { captions?: Record<string, string> } | null)?.captions ?? {};
    const platforms: string[] = Array.isArray(post.platforms) ? post.platforms : [];

    // Map platform names to Ayrshare's expected format
    const platformMap: Record<string, string> = {
      twitter: 'twitter',
      facebook: 'facebook',
      instagram: 'instagram',
      linkedin: 'linkedin',
      tiktok: 'tiktok',
      pinterest: 'pinterest',
    };

    const ayrPlatforms = platforms
      .map((p) => platformMap[p.toLowerCase()])
      .filter(Boolean);

    if (!ayrPlatforms.length) {
      return NextResponse.json({ error: 'No valid platforms' }, { status: 400 });
    }

    // Use platform-specific caption if available, fall back to main content
    // Post to each platform separately so each gets its own caption
    const results: Record<string, Awaited<ReturnType<typeof postToAyrshare>>> = {};
    const errors: Record<string, string> = {};

    for (const platform of ayrPlatforms) {
      const caption = captions[platform] ?? post.content ?? '';
      try {
        const result = await postToAyrshare({
          profileKey: client.ayrshare_profile_key,
          post: caption,
          platforms: [platform],
          mediaUrls: post.image_url ? [post.image_url] : undefined,
        });
        results[platform] = result;
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        errors[platform] = msg;
        console.error(`[ayrshare/publish] ${platform} failed:`, msg);
      }
    }

    // Update post status to published if at least one platform succeeded
    const hasSuccess = Object.keys(results).length > 0;
    if (hasSuccess) {
      await admin
        .from('social_posts')
        .update({
          status: 'published',
          published_at: new Date().toISOString(),
          ayrshare_post_id: results[ayrPlatforms[0]]?.id ?? null,
        })
        .eq('id', postId);

      await admin.from('activities').insert({
        client_id: post.client_id,
        type: 'post',
        title: 'Social post published',
        description: `Published to ${Object.keys(results).join(', ')}.`,
        created_by: 'system',
      } as never);

      await createNotification({
        clientId: post.client_id,
        type: 'post_published',
        title: 'Your post is live!',
        body: `Published to ${Object.keys(results).join(', ')}.`,
        link: '/dashboard/social',
      }).catch(() => {})

      // Send published email
      try {
        const { data: clientData } = await admin
          .from('clients')
          .select('email, business_name')
          .eq('id', post.client_id)
          .single();
        if (clientData?.email) {
          await sendPostPublishedEmail({
            to: clientData.email,
            businessName: clientData.business_name ?? 'Your Business',
            platforms: Object.keys(results),
            imageUrl: post.image_url,
          });
        }
      } catch (emailErr: unknown) {
        const msg = emailErr instanceof Error ? emailErr.message : String(emailErr);
        console.error('[ayrshare/publish] Email failed:', msg);
      }
    }

    return NextResponse.json({ ok: true, results, errors });
  } catch (err: unknown) {
    console.error('[ayrshare/publish]', err);
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
