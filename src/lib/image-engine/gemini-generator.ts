import { GoogleGenerativeAI } from '@google/generative-ai';
import { GEMINI_MODELS, IMAGE_ENGINE_CONFIG, PLATFORM_SPECS } from './config';
import type { GeminiModel, ImageType, PlatformSpec, ClientTier } from './types';
import { PRO_REQUIRED_TYPES as proTypes } from './config';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

// ─── Model Selection ─────────────────────────────────────────────────────────

export function selectGeminiModel(
  imageType: ImageType,
  clientTier: ClientTier
): GeminiModel {
  // Premium/agency tiers always get Pro
  if (clientTier === 'premium' || clientTier === 'agency') return 'nano_banana_pro';
  // Text-heavy types always use Pro (accuracy critical)
  if (proTypes.includes(imageType)) return 'nano_banana_pro';
  // Everything else uses Nano Banana 2
  return 'nano_banana_2';
}

export function getPlatformSpec(platform: string): PlatformSpec {
  return PLATFORM_SPECS[platform.toLowerCase()] ?? PLATFORM_SPECS.default;
}

// ─── Gemini Image Generator ──────────────────────────────────────────────────

export async function generateWithGemini(
  imagePrompt: string,
  options: {
    model: GeminiModel;
    aspectRatio: '1:1' | '4:5' | '9:16' | '16:9' | '3:4';
    referenceImages?: Buffer[];
  }
): Promise<{ imageBuffer: Buffer; mimeType: string }> {

  const modelId = GEMINI_MODELS[options.model];
  const maxRetries = IMAGE_ENGINE_CONFIG.gemini.max_retries;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const model = genAI.getGenerativeModel({ model: modelId });

      const parts: Array<
        | { text: string }
        | { inlineData: { mimeType: string; data: string } }
      > = [{ text: imagePrompt }];

      // Add reference images if provided
      if (options.referenceImages?.length) {
        for (const imgBuffer of options.referenceImages) {
          parts.push({
            inlineData: {
              mimeType: 'image/jpeg',
              data: imgBuffer.toString('base64'),
            },
          });
        }
      }

      const result = await model.generateContent({
        contents: [{ role: 'user', parts }],
        generationConfig: {
          // @ts-expect-error — responseModalities is valid for gemini image models
          responseModalities: ['TEXT', 'IMAGE'],
        },
      });

      const response = result.response;
      const candidates = response.candidates ?? [];

      for (const candidate of candidates) {
        for (const part of candidate.content?.parts ?? []) {
          if (part.inlineData?.data) {
            return {
              imageBuffer: Buffer.from(part.inlineData.data, 'base64'),
              mimeType: part.inlineData.mimeType ?? 'image/png',
            };
          }
        }
      }

      throw new Error('No image data in Gemini response');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      console.error(`[Gemini] Attempt ${attempt}/${maxRetries} failed:`, message);
      if (attempt === maxRetries) throw err;
      await new Promise((r) => setTimeout(r, 1000 * attempt));
    }
  }

  throw new Error('[Gemini] All attempts exhausted');
}
