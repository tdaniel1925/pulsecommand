import { lookup } from 'node:dns/promises'
import { isIP } from 'node:net'

/** RFC5322-ish, good enough to reject garbage without rejecting valid addresses. */
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function isValidEmail(email: unknown): email is string {
  return typeof email === 'string' && email.length <= 254 && EMAIL_RE.test(email.trim())
}

/** Normalize a user-supplied website into a validated absolute https/http URL. */
export function normalizeWebsiteUrl(input: unknown): URL | null {
  if (typeof input !== 'string') return null
  const trimmed = input.trim()
  if (!trimmed || trimmed.length > 2048) return null
  const withScheme = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`
  let url: URL
  try {
    url = new URL(withScheme)
  } catch {
    return null
  }
  if (url.protocol !== 'http:' && url.protocol !== 'https:') return null
  if (!url.hostname) return null
  return url
}

/** True for IPs that must never be fetched server-side (SSRF targets). */
function isPrivateIp(ip: string): boolean {
  const v = isIP(ip)
  if (v === 4) {
    const [a, b] = ip.split('.').map(Number)
    if (a === 10) return true
    if (a === 127) return true // loopback
    if (a === 0) return true
    if (a === 169 && b === 254) return true // link-local / cloud metadata (169.254.169.254)
    if (a === 172 && b >= 16 && b <= 31) return true
    if (a === 192 && b === 168) return true
    if (a === 100 && b >= 64 && b <= 127) return true // CGNAT
    return false
  }
  if (v === 6) {
    const lower = ip.toLowerCase()
    if (lower === '::1' || lower === '::') return true // loopback / unspecified
    if (lower.startsWith('fc') || lower.startsWith('fd')) return true // unique local
    if (lower.startsWith('fe80')) return true // link-local
    if (lower.startsWith('::ffff:')) return isPrivateIp(lower.slice(7)) // IPv4-mapped
    return false
  }
  return false
}

/** Validate an uploaded File against a max size and allowed MIME prefixes. */
export function validateUpload(
  file: File | null,
  opts: { maxBytes: number; allowedTypes: string[] },
): string | null {
  if (!file) return 'No file provided'
  if (file.size === 0) return 'File is empty'
  if (file.size > opts.maxBytes) {
    return `File too large (max ${Math.round(opts.maxBytes / 1024 / 1024)}MB)`
  }
  const type = (file.type || '').toLowerCase()
  // Match either an exact type ("image/png") or a family prefix ("image/").
  const ok = opts.allowedTypes.some((t) =>
    t.endsWith('/') ? type.startsWith(t) : type === t,
  )
  if (!ok) return `Unsupported file type: ${file.type || 'unknown'}`
  return null
}

const BLOCKED_HOSTNAMES = new Set(['localhost', 'metadata.google.internal'])

/**
 * SSRF guard. Resolves the hostname and rejects any URL that points at a private,
 * loopback, link-local, or cloud-metadata address. Returns null when safe, or a
 * reason string when the URL must not be fetched. Call right before fetching a
 * user-supplied URL server-side.
 */
export async function assertPublicUrl(url: URL): Promise<string | null> {
  const host = url.hostname.toLowerCase().replace(/^\[|\]$/g, '')

  if (BLOCKED_HOSTNAMES.has(host) || host.endsWith('.internal') || host.endsWith('.local')) {
    return 'Hostname is not publicly routable'
  }

  // Literal IP in the URL — check directly without DNS.
  if (isIP(host)) {
    return isPrivateIp(host) ? 'URL resolves to a private address' : null
  }

  // Resolve all A/AAAA records and reject if ANY is private (DNS-rebinding-resistant
  // at fetch time only when paired with a pinned-IP fetch; here we at least block
  // the obvious cases).
  try {
    const records = await lookup(host, { all: true })
    if (records.length === 0) return 'Hostname did not resolve'
    for (const { address } of records) {
      if (isPrivateIp(address)) return 'URL resolves to a private address'
    }
  } catch {
    return 'Hostname did not resolve'
  }

  return null
}
