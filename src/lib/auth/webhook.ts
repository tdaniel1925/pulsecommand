import { NextResponse, type NextRequest } from 'next/server'
import { timingSafeEqual } from 'node:crypto'

/** Constant-time string compare that tolerates differing lengths. */
function safeEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a)
  const bufB = Buffer.from(b)
  if (bufA.length !== bufB.length) return false
  return timingSafeEqual(bufA, bufB)
}

/**
 * Verify an inbound webhook against a shared secret. Providers that can send a
 * custom header (VAPI, Predis) are configured to send `<secret>` in one of the
 * accepted headers. Returns null when authorized, or a 401 response to return.
 *
 * Configure the provider to send the secret and set the matching env var:
 *   - VAPI:   header `x-vapi-secret`,   env VAPI_WEBHOOK_SECRET
 *   - Predis: header `x-webhook-secret`, env PREDIS_WEBHOOK_SECRET
 */
export function verifyWebhookSecret(
  request: NextRequest,
  envVar: string,
  headerNames: string[],
): NextResponse | null {
  const expected = process.env[envVar]
  if (!expected) {
    // Fail closed: a missing secret is a misconfiguration, not an open door.
    console.error(`[webhook] ${envVar} is not configured — rejecting request`)
    return NextResponse.json({ error: 'Webhook not configured' }, { status: 503 })
  }

  for (const name of headerNames) {
    const provided = request.headers.get(name)
    if (provided && safeEqual(provided, expected)) {
      return null
    }
    // Also accept "Bearer <secret>" form on Authorization headers.
    if (provided && name.toLowerCase() === 'authorization') {
      const token = provided.replace(/^Bearer\s+/i, '')
      if (safeEqual(token, expected)) return null
    }
  }

  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
}
