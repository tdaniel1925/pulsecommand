import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/admin";

export async function POST(request: NextRequest) {
  const gate = await requireAdmin();
  if (gate.response) return gate.response;

  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) {
    return NextResponse.json({ error: "CRON_SECRET not configured" }, { status: 500 });
  }

  // Optional: target a single client (admin client-detail "trigger" button posts
  // { clientId }). With no clientId, the orchestrator runs for all active clients.
  let clientId: string | null = null;
  try {
    const body = await request.json();
    if (body && typeof body.clientId === "string") clientId = body.clientId;
  } catch {
    // no body → run for all active clients
  }

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  const res = await fetch(`${baseUrl}/api/pipeline/monthly`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${cronSecret}`,
    },
    body: JSON.stringify(clientId ? { clientId } : {}),
  });

  const json = await res.json().catch(() => ({}));

  if (!res.ok) {
    return NextResponse.json(
      { error: json.error ?? `Pipeline responded with ${res.status}` },
      { status: res.status }
    );
  }

  return NextResponse.json({ ok: true, ...json });
}
