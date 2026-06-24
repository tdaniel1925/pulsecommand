import { createAdminClient } from "@/lib/supabase/admin";
import { generateJSON, DEFAULT_MODEL } from "@/lib/openrouter";
import { generateSocialPostImage } from "@/lib/image-engine/orchestrator";
import type { BrandContext, BrandVibe, ClientTier } from "@/lib/image-engine/types";
import { sendPostReadyEmail } from "@/lib/email";
import { createNotification } from "@/lib/notifications";

// ─── Weekly topics ─────────────────────────────────────────────────────────────

const POST_TOPICS = [
  "Why customers choose us over the competition",
  "A tip your customers need to know this week",
  "Behind the scenes at our business",
  "A common mistake our customers make and how to avoid it",
  "A client success story that shows our results",
  "What makes our service different from everyone else",
  "A question we get asked all the time — answered",
  "The #1 reason businesses like yours need this now",
];

export function getWeekTopic(): string {
  const weekNumber = Math.floor(Date.now() / (7 * 24 * 60 * 60 * 1000));
  return POST_TOPICS[weekNumber % POST_TOPICS.length];
}

/** Pick a topic by index so a batch of posts varies instead of repeating. */
export function getTopicByIndex(index: number): string {
  return POST_TOPICS[index % POST_TOPICS.length];
}

// ─── Claude caption generator ──────────────────────────────────────────────────

type PlatformCaptions = {
  instagram: string;
  linkedin: string;
  facebook: string;
  twitter: string;
};

async function generateCaptions(params: {
  topic: string;
  businessName: string;
  businessDescription: string;
  toneOfVoice: string;
  targetAudience: string;
  website: string;
}): Promise<PlatformCaptions> {
  try {
    return await generateJSON<PlatformCaptions>({
      model: DEFAULT_MODEL,
      maxTokens: 1200,
      prompt: `You are a social media expert. Write platform-specific captions for this business.

BUSINESS: ${params.businessName}
WEBSITE: ${params.website}
DESCRIPTION: ${params.businessDescription}
TONE: ${params.toneOfVoice}
AUDIENCE: ${params.targetAudience}
TOPIC: ${params.topic}

Write 4 captions — one per platform. Each must be tailored to that platform's style and character limits.

INSTAGRAM: Engaging, conversational, 3-5 relevant hashtags, up to 300 chars before hashtags. Emoji ok.
LINKEDIN: Professional, insightful, no hashtags, 150-200 chars. No emoji.
FACEBOOK: Friendly and conversational, 100-150 chars, 1-2 hashtags max.
TWITTER: Punchy and direct, under 240 chars, 1-2 hashtags.

Return ONLY valid JSON:
{
  "instagram": "...",
  "linkedin": "...",
  "facebook": "...",
  "twitter": "..."
}`,
    });
  } catch {
    const fallback = `${params.topic} — ${params.businessName}. ${params.website}`;
    return { instagram: fallback, linkedin: fallback, facebook: fallback, twitter: fallback };
  }
}

// ─── Main exported function ────────────────────────────────────────────────────

export async function generatePostForClient(
  clientId: string,
  opts?: { topic?: string }
): Promise<{ ok: boolean; error?: string }> {
  try {
    const supabase = createAdminClient();
    const weekTopic = opts?.topic ?? getWeekTopic();
    const monthBatch = new Date().toISOString().slice(0, 7);

    // Step 1: Fetch client row
    const { data: client, error: clientError } = await supabase
      .from("clients")
      .select("id, business_name, website, brand_vibe, email, auto_approve, ayrshare_profile_key")
      .eq("id", clientId)
      .single();

    if (clientError || !client) {
      return { ok: false, error: clientError?.message ?? "Client not found" };
    }

    // Step 2: Fetch brand profile
    const { data: bp } = await supabase
      .from("brand_profiles")
      .select("client_id, primary_color, secondary_color, logo_url, priority_channels, business_description, tone_of_voice, target_audience, brand_vibe")
      .eq("client_id", clientId)
      .single();

    const platforms: string[] = (bp?.priority_channels as string[]) ?? ["instagram", "facebook", "linkedin"];
    const primaryPlatform = platforms[0] ?? "instagram";

    const brandVibe = (bp?.brand_vibe ?? client.brand_vibe ?? "professional_warm") as BrandVibe;
    const businessDescription = bp?.business_description ?? "";
    const toneOfVoice = bp?.tone_of_voice ?? "professional";
    const targetAudience = bp?.target_audience ?? "general audience";
    const primaryColor = bp?.primary_color ?? "#1a1a2e";
    const secondaryColor = bp?.secondary_color ?? "#4ade80";

    // Step 3: Generate captions for all platforms
    const captions = await generateCaptions({
      topic: weekTopic,
      businessName: client.business_name ?? "Our Business",
      businessDescription,
      toneOfVoice,
      targetAudience,
      website: client.website ?? "",
    });

    // Step 4: Build brand context for image engine
    const brand: BrandContext = {
      clientId: client.id,
      businessName: client.business_name ?? "Our Business",
      industry: businessDescription.slice(0, 80),
      website: client.website ?? "",
      vibe: brandVibe,
      colors: `primary: ${primaryColor}, secondary: ${secondaryColor}`,
      voice: toneOfVoice,
      audience: targetAudience,
      description: businessDescription,
      logoUrl: bp?.logo_url ?? undefined,
    };

    // Step 5: Generate image for the primary platform
    const imageResult = await generateSocialPostImage({
      post: {
        id: `${client.id}-${Date.now()}`,
        caption: captions[primaryPlatform as keyof PlatformCaptions] ?? captions.instagram,
        hook: weekTopic,
        cta: `Learn more at ${client.website ?? "our website"}`,
        platform: primaryPlatform,
        postType: "weekly_social",
      },
      brand,
      platform: primaryPlatform,
      clientTier: "starter" as ClientTier,
    });

    // Step 6: Determine approval status
    const autoApprove = client.auto_approve ?? true;
    const postStatus = autoApprove ? "scheduled" : "pending_approval";

    // Step 7: Insert social post row
    const { data: insertedPost } = await supabase.from("social_posts").insert({
      client_id: client.id,
      content: captions[primaryPlatform as keyof PlatformCaptions] ?? captions.instagram,
      platforms,
      status: postStatus,
      month_batch: monthBatch,
      image_url: imageResult.imageUrl,
      metadata: {
        topic: weekTopic,
        captions,
        image_type: imageResult.imageType,
        layout: imageResult.layout,
        composition: imageResult.composition,
        photo_style: imageResult.photoStyle,
        infographic_style: imageResult.infographicStyle,
        generation_cost: imageResult.generationCost,
      },
    } as never).select("id").single();

    // Step 8: Auto-publish via Ayrshare if client has profile key and auto_approve is on
    if (autoApprove && insertedPost?.id) {
      if (client.ayrshare_profile_key) {
        try {
          const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
          await fetch(`${baseUrl}/api/ayrshare/publish`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ postId: insertedPost.id }),
          });
        } catch (publishErr: unknown) {
          const msg = publishErr instanceof Error ? publishErr.message : String(publishErr);
          console.error(`[generate-post] Ayrshare publish failed for ${client.business_name}:`, msg);
        }
      }
    }

    // Step 8b: In-app notification
    if (insertedPost?.id && !autoApprove) {
      await createNotification({
        clientId: clientId,
        type: 'post_ready',
        title: 'New post ready for review',
        body: 'Your weekly AI-generated post is ready to approve.',
        link: '/dashboard/social',
      }).catch(() => {})
    }

    // Step 9: Log activity
    await supabase.from("activities").insert({
      client_id: client.id,
      type: "post",
      title: autoApprove ? "Social post scheduled" : "Social post ready for approval",
      description: `Weekly post: "${weekTopic}" — ${imageResult.imageType} image generated.`,
      created_by: "system",
    } as never);

    // Step 10: Email notification
    if (client.email && insertedPost?.id && !autoApprove) {
      try {
        await sendPostReadyEmail({
          to: client.email,
          businessName: client.business_name ?? "Your Business",
          caption: captions[primaryPlatform as keyof PlatformCaptions] ?? captions.instagram,
          imageUrl: imageResult.imageUrl,
          postId: insertedPost.id,
        });
      } catch (emailErr: unknown) {
        const msg = emailErr instanceof Error ? emailErr.message : String(emailErr);
        console.error(`[generate-post] Email failed for ${client.business_name}:`, msg);
      }
    }

    console.log(
      `[generate-post] ✓ ${client.business_name} | ${imageResult.imageType}` +
      (imageResult.photoStyle ? ` (${imageResult.photoStyle})` : "") +
      (imageResult.infographicStyle ? ` (${imageResult.infographicStyle})` : "") +
      ` | $${imageResult.generationCost.toFixed(4)} | ${postStatus}`
    );

    return { ok: true };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(`[generate-post] ✗ clientId=${clientId}:`, message);
    return { ok: false, error: message };
  }
}
