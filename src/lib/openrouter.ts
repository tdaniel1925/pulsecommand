/**
 * OpenRouter AI Client
 *
 * Centralized client for all content generation AI calls.
 * Uses free/cheap models via OpenRouter for social posts, newsletters,
 * scripts, and other content generation tasks.
 *
 * For tasks requiring stronger reasoning (website scanning, transcript analysis),
 * continue using the Anthropic SDK directly.
 */

const OPENROUTER_BASE_URL = 'https://openrouter.ai/api/v1';

// Real OpenRouter free-tier slugs, verified against the live model list.
// IMPORTANT: the free tier is heavily rate-limited — any given slug frequently
// returns 429. generateText() therefore tries each FREE_FALLBACKS slug in turn
// and only then falls back to PAID Anthropic. Re-verify these against
// https://openrouter.ai/models?max_price=0 periodically; free slugs rotate.
export type OpenRouterModel =
  | 'google/gemma-4-31b-it:free'
  | 'google/gemma-4-26b-a4b-it:free'
  | 'qwen/qwen3-next-80b-a3b-instruct:free'
  | 'meta-llama/llama-3.3-70b-instruct:free'
  | 'nousresearch/hermes-3-llama-3.1-405b:free';

// Default model for structured JSON / content generation.
export const DEFAULT_MODEL: OpenRouterModel = 'google/gemma-4-31b-it:free';

// Lighter model for simpler tasks (grading, short scripts, classification).
export const LIGHT_MODEL: OpenRouterModel = 'google/gemma-4-26b-a4b-it:free';

// Ordered free-model fallback chain. Tried in sequence on 429/404 before paying
// for Anthropic. Larger/stronger first; lighter ones are more often available.
const FREE_FALLBACKS: OpenRouterModel[] = [
  'google/gemma-4-31b-it:free',
  'qwen/qwen3-next-80b-a3b-instruct:free',
  'meta-llama/llama-3.3-70b-instruct:free',
  'google/gemma-4-26b-a4b-it:free',
];

interface OpenRouterMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface OpenRouterResponse {
  choices: Array<{
    message: {
      content: string;
    };
  }>;
}

/**
 * Generate text using OpenRouter API
 */
export async function generateText(params: {
  model?: OpenRouterModel;
  messages: OpenRouterMessage[];
  maxTokens?: number;
  temperature?: number;
  /** Internal: free models already attempted, to walk the fallback chain once. */
  _tried?: OpenRouterModel[];
}): Promise<string> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    throw new Error('OPENROUTER_API_KEY environment variable is not set');
  }

  const response = await fetch(`${OPENROUTER_BASE_URL}/chat/completions`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000',
      'X-Title': 'PulseCommand',
    },
    body: JSON.stringify({
      model: params.model ?? DEFAULT_MODEL,
      messages: params.messages,
      max_tokens: params.maxTokens ?? 2048,
      temperature: params.temperature ?? 0.7,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    const triedModel = params.model ?? DEFAULT_MODEL;

    // On rate-limit/not-found, walk the remaining free fallback chain before paying.
    if (response.status === 429 || response.status === 404) {
      const remaining = FREE_FALLBACKS.filter((m) => m !== triedModel && !(params._tried ?? []).includes(m));
      if (remaining.length > 0) {
        const next = remaining[0];
        console.warn(
          `[openrouter] free model ${triedModel} failed (status ${response.status}), ` +
          `trying next free model ${next}...`
        );
        await new Promise((r) => setTimeout(r, 800));
        return generateText({ ...params, model: next, _tried: [...(params._tried ?? []), triedModel] });
      }
    }

    // All free models exhausted — fall back to PAID Anthropic if available.
    const anthropicKey = process.env.ANTHROPIC_API_KEY;
    const ANTHROPIC_FALLBACK_MODEL = 'claude-sonnet-4-6';
    if (anthropicKey && (response.status === 429 || response.status === 404)) {
      console.warn(
        `[openrouter] all free models exhausted (last status ${response.status}), ` +
        `falling back to PAID Anthropic ${ANTHROPIC_FALLBACK_MODEL}. This call WILL incur cost.`
      );
      const anthropicRes = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'x-api-key': anthropicKey,
          'anthropic-version': '2023-06-01',
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          model: ANTHROPIC_FALLBACK_MODEL,
          max_tokens: params.maxTokens ?? 2048,
          messages: params.messages.map(m => ({ role: m.role === 'system' ? 'user' : m.role, content: m.content })),
        }),
      });
      if (anthropicRes.ok) {
        const data = await anthropicRes.json();
        return data.content?.[0]?.text ?? '';
      }
    }
    throw new Error(`OpenRouter API error (${response.status}): ${errorText}`);
  }

  const data = (await response.json()) as OpenRouterResponse;
  return data.choices[0]?.message?.content ?? '';
}

/**
 * Helper: Generate with a system prompt + user prompt (most common pattern)
 */
export async function generate(params: {
  system?: string;
  prompt: string;
  model?: OpenRouterModel;
  maxTokens?: number;
}): Promise<string> {
  const messages: OpenRouterMessage[] = [];
  if (params.system) {
    messages.push({ role: 'system', content: params.system });
  }
  messages.push({ role: 'user', content: params.prompt });

  return generateText({
    model: params.model,
    messages,
    maxTokens: params.maxTokens,
  });
}

/**
 * Helper: Generate and parse JSON response
 */
export async function generateJSON<T = unknown>(params: {
  system?: string;
  prompt: string;
  model?: OpenRouterModel;
  maxTokens?: number;
}): Promise<T> {
  const raw = await generate(params);

  // Strip markdown code fences if present
  const cleaned = raw
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```$/i, '')
    .trim();

  // Try to extract JSON object or array
  const jsonMatch = cleaned.match(/[\[{][\s\S]*[\]}]/);
  if (!jsonMatch) {
    throw new Error(`No JSON found in response: ${cleaned.slice(0, 200)}`);
  }

  return JSON.parse(jsonMatch[0]) as T;
}
