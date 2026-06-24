const AYRSHARE_API_KEY = process.env.AYRSHARE_API_KEY!;
const BASE = 'https://api.ayrshare.com/api';

function headers(profileKey?: string) {
  const h: Record<string, string> = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${AYRSHARE_API_KEY}`,
  };
  if (profileKey) h['Profile-Key'] = profileKey;
  return h;
}

// ─── Create a user profile for a new client ──────────────────────────────────

export async function createAyrshareProfile(params: {
  title: string;         // client business name
  email?: string;
}): Promise<{ profileKey: string; id: string }> {
  const res = await fetch(`${BASE}/profiles`, {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify({ title: params.title, email: params.email }),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Ayrshare createProfile failed: ${err}`);
  }
  const data = await res.json();
  return { profileKey: data.profileKey, id: data.id };
}

// ─── Generate JWT link for client to connect their social accounts ────────────

export async function generateAyrshareJWT(profileKey: string): Promise<string> {
  let privateKey = process.env.AYRSHARE_PRIVATE_KEY;
  if (!privateKey) {
    throw new Error('AYRSHARE_PRIVATE_KEY environment variable not set');
  }

  // Convert escaped newlines to actual newlines
  privateKey = privateKey.replace(/\\n/g, '\n');

  const res = await fetch(`${BASE}/profiles/generateJWT`, {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify({
      profileKey,
      domain: process.env.NEXT_PUBLIC_APP_DOMAIN || 'localhost',
      privateKey,
    }),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Ayrshare generateJWT failed: ${err}`);
  }
  const data = await res.json();
  return data.url as string;
}

// ─── Get connected platforms for a profile ───────────────────────────────────

export async function getAyrshareProfile(profileKey: string): Promise<{
  activeSocialAccounts: string[];
}> {
  const res = await fetch(`${BASE}/profiles`, {
    method: 'GET',
    headers: headers(profileKey),
  });
  if (!res.ok) return { activeSocialAccounts: [] };
  const data = await res.json();
  return { activeSocialAccounts: data.activeSocialAccounts ?? [] };
}

// ─── Post to social platforms ─────────────────────────────────────────────────

export type AyrsharePostParams = {
  profileKey: string;
  post: string;           // caption text
  platforms: string[];    // ['instagram', 'facebook', 'linkedin', 'twitter']
  mediaUrls?: string[];   // image URLs
  scheduleDate?: string;  // ISO date string for scheduled posts
};

export type AyrsharePostResult = {
  id: string;
  status: string;
  errors?: unknown[];
  postIds?: Record<string, string>;
};

export async function postToAyrshare(params: AyrsharePostParams): Promise<AyrsharePostResult> {
  const body: Record<string, unknown> = {
    post: params.post,
    platforms: params.platforms,
  };
  if (params.mediaUrls?.length) body.mediaUrls = params.mediaUrls;
  if (params.scheduleDate) body.scheduleDate = params.scheduleDate;

  const res = await fetch(`${BASE}/post`, {
    method: 'POST',
    headers: headers(params.profileKey),
    body: JSON.stringify(body),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(`Ayrshare post failed: ${JSON.stringify(data)}`);
  }
  return data as AyrsharePostResult;
}

// ─── Delete a user profile ───────────────────────────────────────────────────

export async function deleteAyrshareProfile(profileKey: string): Promise<void> {
  await fetch(`${BASE}/profiles`, {
    method: 'DELETE',
    headers: headers(),
    body: JSON.stringify({ profileKey }),
  });
}

// ─── Get engagement for a single post ────────────────────────────────────────

export async function getPostEngagement(profileKey: string, postId: string): Promise<{
  likes: number; comments: number; shares: number; impressions: number;
}> {
  try {
    const res = await fetch(`${BASE}/analytics/post?id=${postId}`, {
      headers: headers(profileKey),
    });
    if (!res.ok) return { likes: 0, comments: 0, shares: 0, impressions: 0 };
    const data = await res.json();
    return {
      likes: data.likes ?? 0,
      comments: data.comments ?? 0,
      shares: data.shares ?? 0,
      impressions: data.impressions ?? 0,
    };
  } catch {
    return { likes: 0, comments: 0, shares: 0, impressions: 0 };
  }
}

// ─── Get analytics summary for a profile ─────────────────────────────────────

export async function getProfileAnalyticsSummary(profileKey: string): Promise<{
  totalPosts: number;
  totalEngagement: number;
  platformBreakdown: Record<string, { posts: number; engagement: number }>;
}> {
  try {
    const res = await fetch(`${BASE}/analytics/social`, {
      headers: headers(profileKey),
    });
    if (!res.ok) return { totalPosts: 0, totalEngagement: 0, platformBreakdown: {} };
    const data = await res.json();
    return {
      totalPosts: data.totalPosts ?? 0,
      totalEngagement: data.totalEngagement ?? 0,
      platformBreakdown: data.platformBreakdown ?? {},
    };
  } catch {
    return { totalPosts: 0, totalEngagement: 0, platformBreakdown: {} };
  }
}
