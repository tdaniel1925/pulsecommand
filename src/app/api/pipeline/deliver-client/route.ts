export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import { generate, DEFAULT_MODEL } from '@/lib/openrouter';
import { createAdminClient } from '@/lib/supabase/admin';
import { resolveClientPlan } from '@/lib/plan';

async function generateWithAI(prompt: string): Promise<string> {
  return generate({
    system: 'You are an expert content marketer. Generate high-quality, engaging content exactly as requested. Return only the content itself with no preamble.',
    prompt,
    model: DEFAULT_MODEL,
    maxTokens: 4096,
  });
}

export async function POST(req: NextRequest) {
  const { clientId } = await req.json();
  if (!clientId) {
    return NextResponse.json({ error: 'clientId is required' }, { status: 400 });
  }

  const supabase = createAdminClient();

  // Fetch client + brand profile
  const { data: client, error: clientError } = await supabase
    .from('clients')
    .select('*')
    .eq('id', clientId)
    .single();

  if (clientError || !client) {
    return NextResponse.json({ error: 'Client not found' }, { status: 404 });
  }

  const { data: brandProfile } = await supabase
    .from('brand_profiles')
    .select('*')
    .eq('client_id', clientId)
    .single();

  const planRecord = resolveClientPlan(client);
  const socialPostCount = planRecord?.entitlements.socialPostsPerMonth ?? 30;

  const businessName: string = client.business_name ?? 'the business';
  const industry: string = client.industry ?? 'general';
  const description: string = brandProfile?.business_description ?? '';
  const audience: string = brandProfile?.target_audience ?? '';
  const tone: string = brandProfile?.tone_of_voice ?? 'professional and friendly';
  const pillars: string[] = brandProfile?.content_pillars ?? [];

  const contentItems: Array<{
    client_id: string;
    type: string;
    content: string | null;
    url: string | null;
    metadata: Record<string, unknown>;
  }> = [];

  // --- Social Posts (batches of 10) ---
  const batchCount = Math.ceil(socialPostCount / 10);
  const platforms = ['Instagram', 'Facebook', 'LinkedIn', 'Twitter/X', 'TikTok'];

  for (let batch = 0; batch < batchCount; batch++) {
    const batchSize = Math.min(10, socialPostCount - batch * 10);
    const platform = platforms[batch % platforms.length];
    const postsText = await generateWithAI(
      `Create ${batchSize} unique social media posts for ${businessName}, a ${industry} business.
Business description: ${description}
Target audience: ${audience}
Tone: ${tone}
Content pillars: ${pillars.join(', ')}
Platform: ${platform}

Format each post as:
POST [number]:
[post content with relevant hashtags]
---`
    );

    // Split by "POST" separator and save each
    const postChunks = postsText.split(/POST \d+:/).filter((p) => p.trim().length > 20);
    for (const chunk of postChunks) {
      contentItems.push({
        client_id: clientId,
        type: 'social_post',
        content: chunk.replace(/^---+/gm, '').trim(),
        url: null,
        metadata: { platform, batch: batch + 1 },
      });
    }
  }

  // Social-only product: delivery generates social posts (above) plus the
  // notification below. No podcast/video scripts are produced.

  // --- Save all content items ---
  if (contentItems.length > 0) {
    const { error: insertError } = await supabase.from('content_items').insert(contentItems);
    if (insertError) {
      console.error('[deliver-client] Insert error:', insertError);
    }
  }

  // --- Update client delivery timestamps ---
  const now = new Date();
  const nextDelivery = new Date(now);
  nextDelivery.setDate(nextDelivery.getDate() + 30);

  await supabase
    .from('clients')
    .update({
      last_delivered_at: now.toISOString(),
      next_delivery_at: nextDelivery.toISOString(),
    })
    .eq('id', clientId);

  // --- Notify client via email ---
  if (client.email) {
    await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'BundledContent <noreply@bundledcontent.com>',
        to: client.email,
        subject: 'Your monthly content is ready! 🎉',
        html: `<h2>Hi ${client.first_name ?? 'there'},</h2>
<p>Your monthly content batch for <strong>${businessName}</strong> is ready in your dashboard.</p>
<p>This month we created:</p>
<ul>
  <li>${socialPostCount} social media posts</li>
</ul>
<p><a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard">View your content →</a></p>
<p>— The BundledContent Team</p>`,
      }),
    }).catch((err) => console.error('[deliver-client] Email error:', err));
  }

  // --- Notify client via SMS ---
  if (client.phone) {
    const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${process.env.TWILIO_ACCOUNT_SID}/Messages.json`;
    const credentials = Buffer.from(`${process.env.TWILIO_ACCOUNT_SID}:${process.env.TWILIO_AUTH_TOKEN}`).toString('base64');
    fetch(twilioUrl, {
      method: 'POST',
      headers: {
        Authorization: `Basic ${credentials}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        From: process.env.TWILIO_PHONE_NUMBER!,
        To: client.phone,
        Body: `Hi ${client.first_name ?? 'there'}! Your monthly content for ${businessName} is ready. Log in to view: ${process.env.NEXT_PUBLIC_APP_URL}/dashboard`,
      }),
    }).catch((err) => console.error('[deliver-client] SMS error:', err));
  }

  return NextResponse.json({
    success: true,
    clientId,
    contentCreated: contentItems.length,
    socialPosts: socialPostCount,
  });
}
