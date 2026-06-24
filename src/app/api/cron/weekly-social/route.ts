import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { generatePostForClient, getWeekTopic } from "@/lib/generate-post-for-client";

const CRON_SECRET = process.env.CRON_SECRET!;

export async function GET(req: NextRequest) {
  const auth = req.headers.get("authorization");
  if (auth !== `Bearer ${CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createAdminClient();
  const weekTopic = getWeekTopic();

  console.log(`[weekly-social] Topic: "${weekTopic}"`);

  // Fetch active clients
  const { data: clients, error } = await supabase
    .from("clients")
    .select("id, business_name")
    .eq("status", "active");

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!clients?.length) return NextResponse.json({ ok: true, message: "No active clients" });

  let generated = 0;
  let failed = 0;
  const errors: string[] = [];

  for (const client of clients) {
    try {
      const result = await generatePostForClient(client.id);
      if (result.ok) {
        generated++;
      } else {
        failed++;
        errors.push(`${client.business_name}: ${result.error}`);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error(`[weekly-social] ✗ ${client.business_name}:`, msg);
      errors.push(`${client.business_name}: ${msg}`);
      failed++;
    }

    // Small delay between clients to avoid rate limits
    await new Promise((r) => setTimeout(r, 1000));
  }

  return NextResponse.json({ ok: true, topic: weekTopic, generated, failed, total: clients.length, errors });
}
