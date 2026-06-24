import { generateWithGemini } from '@/lib/image-engine/gemini-generator'
import { IMAGE_ENGINE_CONFIG } from '@/lib/image-engine/config'
import { createAdminClient } from '@/lib/supabase/admin'
import type { SlotShape } from '@/components/studio/Slot'

/**
 * Studio image generation — fills landing-page image slots with on-brand Gemini
 * images. Simpler than the social-post engine: no classifier/layout logic, just
 * "given a scene + brand, make an image that fits this slot's shape."
 *
 * Every call is best-effort: on any failure it returns null so the slot falls
 * back to a themed placeholder and the page still renders/publishes.
 */

// Map a kit slot shape to the nearest Gemini-supported aspect ratio.
const SHAPE_TO_ASPECT: Record<SlotShape, '1:1' | '4:5' | '9:16' | '16:9' | '3:4'> = {
  '1/1': '1:1',
  '4/5': '4:5',
  '3/4': '3:4',
  '16/9': '16:9',
  '21/9': '16:9', // closest supported
  '4/3': '16:9', // closest landscape
  '3/2': '16:9',
}

export interface StudioBrand {
  businessName: string
  description?: string
  primaryColor?: string | null
  vibe?: string
}

/**
 * Generate one image for a slot and return its public URL (or null on failure).
 * `scene` is a short description of what the image should depict (from the AI's
 * slot `alt` text); `brand` steers style/palette so it matches the page.
 */
export async function generateSlotImage(params: {
  clientId: string
  pageKey: string // stable key for storage path (e.g. "hero", "showcase")
  scene: string
  shape: SlotShape
  brand: StudioBrand
}): Promise<string | null> {
  const { clientId, pageKey, scene, shape, brand } = params

  const prompt = buildPrompt(scene, brand)
  try {
    const { imageBuffer, mimeType } = await generateWithGemini(prompt, {
      model: 'nano_banana_2',
      aspectRatio: SHAPE_TO_ASPECT[shape],
    })
    return await upload(clientId, pageKey, imageBuffer, mimeType)
  } catch (err) {
    console.error(`[studio/images] generation failed for ${pageKey}:`, err)
    return null
  }
}

function buildPrompt(scene: string, brand: StudioBrand): string {
  const palette = brand.primaryColor ? ` Use a palette that complements ${brand.primaryColor}.` : ''
  const ctx = brand.description ? ` The business: ${brand.description}.` : ''
  const vibe = brand.vibe ? ` Style: ${brand.vibe}.` : ' Style: clean, modern, professional.'
  return (
    `A high-quality, photorealistic marketing image for the brand "${brand.businessName}". ` +
    `Depict: ${scene}.${ctx}${vibe}${palette} ` +
    `No text, no logos, no watermarks. Composed to work as a website hero/feature image.`
  )
}

const UPLOAD_RETRIES = 3

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

async function upload(
  clientId: string,
  pageKey: string,
  imageBuffer: Buffer,
  mimeType: string,
): Promise<string> {
  const admin = createAdminClient()
  const ext = mimeType.includes('png') ? 'png' : 'jpg'
  const path = `studio/${clientId}/${pageKey}_${Date.now()}.${ext}`
  const bucket = IMAGE_ENGINE_CONFIG.storage.bucket

  // Storage uploads of large (~1-2MB) images occasionally hit transient network
  // failures ("fetch failed"); retry a few times with backoff before giving up.
  let lastErr = ''
  for (let attempt = 1; attempt <= UPLOAD_RETRIES; attempt++) {
    try {
      const { error } = await admin.storage.from(bucket).upload(path, imageBuffer, {
        contentType: mimeType,
        upsert: true,
      })
      if (!error) {
        const { data } = admin.storage.from(bucket).getPublicUrl(path)
        return data.publicUrl
      }
      lastErr = error.message
    } catch (err) {
      lastErr = err instanceof Error ? err.message : String(err)
    }
    if (attempt < UPLOAD_RETRIES) {
      console.warn(`[studio/images] upload attempt ${attempt} failed (${lastErr}); retrying...`)
      await sleep(attempt * 700)
    }
  }
  throw new Error(`Storage upload failed after ${UPLOAD_RETRIES} attempts: ${lastErr}`)
}
