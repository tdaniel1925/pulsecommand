import { classifyImageType } from './classifier';
import { generateImagePrompt } from './prompt-generator';
import { generateWithGemini, selectGeminiModel, getPlatformSpec } from './gemini-generator';
import { COST_ESTIMATES, CLAUDE_COST_ESTIMATES, IMAGE_ENGINE_CONFIG } from './config';
import { createAdminClient } from '@/lib/supabase/admin';
import type {
  PostContext, BrandContext, ImageGenerationResult,
  ImageType, ClientTier, GeminiModel,
} from './types';

// ─── Supabase Storage Upload ─────────────────────────────────────────────────

async function uploadToSupabaseStorage(
  imageBuffer: Buffer,
  mimeType: string,
  postId: string,
  platform: string
): Promise<string> {
  const admin = createAdminClient();
  const ext = mimeType.includes('png') ? 'png' : 'jpg';
  const path = `posts/${postId}/${platform}_${Date.now()}.${ext}`;

  const { error } = await admin.storage
    .from(IMAGE_ENGINE_CONFIG.storage.bucket)
    .upload(path, imageBuffer, {
      contentType: mimeType,
      upsert: true,
    });

  if (error) throw new Error(`Storage upload failed: ${error.message}`);

  const { data } = admin.storage
    .from(IMAGE_ENGINE_CONFIG.storage.bucket)
    .getPublicUrl(path);

  return data.publicUrl;
}

// ─── Generation Log ──────────────────────────────────────────────────────────

async function logGeneration(params: {
  postId: string;
  clientId: string;
  imageType: ImageType;
  infographicStyle?: string;
  photoStyle?: string;
  classifierReasoning: string;
  geminiModel: GeminiModel;
  promptUsed: string;
  imageUrl: string;
  costUsd: number;
  generationTimeMs: number;
  attempts: number;
}) {
  const admin = createAdminClient();
  await admin.from('image_generations').insert({
    post_id: params.postId || null,
    client_id: params.clientId,
    image_type: params.imageType,
    infographic_style: params.infographicStyle ?? null,
    photo_style: params.photoStyle ?? null,
    classifier_reasoning: params.classifierReasoning,
    gemini_model: params.geminiModel,
    prompt_used: params.promptUsed,
    image_url: params.imageUrl,
    cost_usd: params.costUsd,
    generation_time_ms: params.generationTimeMs,
    attempts: params.attempts,
  } as never);
}

// ─── Main Orchestrator ───────────────────────────────────────────────────────

export async function generateSocialPostImage(input: {
  post: PostContext;
  brand: BrandContext;
  platform: string;
  clientTier: ClientTier;
}): Promise<ImageGenerationResult> {

  const startTime = Date.now();
  let attempts = 1;

  // Step 1: Classify (pass clientId + weekSeed for seeded layout fallback)
  const weekSeed = Math.floor(Date.now() / (7 * 24 * 60 * 60 * 1000));
  const classification = await classifyImageType({
    caption: input.post.caption,
    hook: input.post.hook,
    cta: input.post.cta,
    industry: input.brand.industry,
    brandVibe: input.brand.vibe,
    postType: input.post.postType,
    platform: input.platform,
    clientId: input.brand.clientId,
    weekSeed,
  });

  console.log(
    `[ImageEngine] ${input.brand.businessName} | ${input.platform} | ` +
    `Type: ${classification.primary_type} | Layout: ${classification.layout} | Composition: ${classification.composition}` +
    (classification.infographic_style ? ` | ${classification.infographic_style}` : '') +
    (classification.photo_style ? ` | ${classification.photo_style}` : '')
  );

  // Step 2: Generate prompt
  const subStyle = classification.infographic_style || classification.photo_style;
  let imagePrompt: string;
  let usedType = classification.primary_type;

  try {
    imagePrompt = generateImagePrompt(
      classification.primary_type,
      classification.layout,
      classification.composition,
      input.post,
      input.brand,
      subStyle
    );
  } catch (err) {
    console.error('[ImageEngine] Prompt generation failed:', err);
    throw err;
  }

  // Step 3: Select model
  const geminiModel = selectGeminiModel(
    classification.primary_type,
    input.clientTier
  );

  // Step 4: Get platform dimensions
  const platformSpec = getPlatformSpec(input.platform);

  // Step 5: Generate image (with fallback)
  let imageBuffer: Buffer;
  let mimeType: string;

  try {
    const result = await generateWithGemini(imagePrompt, {
      model: geminiModel,
      aspectRatio: platformSpec.aspect_ratio,
      referenceImages: input.brand.referenceImages,
    });
    imageBuffer = result.imageBuffer;
    mimeType = result.mimeType;
  } catch (primaryError) {
    if (!IMAGE_ENGINE_CONFIG.fallbacks.enabled) throw primaryError;

    console.warn(`[ImageEngine] Primary failed, trying fallback: ${classification.fallback_type}`);
    attempts = 2;
    usedType = classification.fallback_type;

    const fallbackPrompt = generateImagePrompt(
      classification.fallback_type,
      'hero_bottom_bar',
      'single',
      input.post,
      input.brand
    );
    const result = await generateWithGemini(fallbackPrompt, {
      model: geminiModel,
      aspectRatio: platformSpec.aspect_ratio,
    });
    imageBuffer = result.imageBuffer;
    mimeType = result.mimeType;
    imagePrompt = fallbackPrompt;
  }

  // Step 6: Upload to Supabase Storage
  const imageUrl = await uploadToSupabaseStorage(
    imageBuffer,
    mimeType,
    input.post.id,
    input.platform
  );

  const generationTimeMs = Date.now() - startTime;
  const generationCost =
    COST_ESTIMATES[geminiModel] +
    CLAUDE_COST_ESTIMATES.classifier +
    CLAUDE_COST_ESTIMATES.prompt_generator;

  // Step 7: Log
  await logGeneration({
    postId: input.post.id,
    clientId: input.brand.clientId,
    imageType: usedType,
    infographicStyle: classification.infographic_style,
    photoStyle: classification.photo_style,
    classifierReasoning: classification.reasoning,
    geminiModel,
    promptUsed: imagePrompt,
    imageUrl,
    costUsd: generationCost,
    generationTimeMs,
    attempts,
  });

  console.log(`[ImageEngine] Done in ${generationTimeMs}ms | Cost: $${generationCost.toFixed(4)} | ${imageUrl}`);

  return {
    imageUrl,
    imageType: usedType,
    layout: classification.layout,
    composition: classification.composition,
    infographicStyle: classification.infographic_style,
    photoStyle: classification.photo_style,
    classifierReasoning: classification.reasoning,
    geminiModel,
    generationCost,
    generationTimeMs,
  };
}
