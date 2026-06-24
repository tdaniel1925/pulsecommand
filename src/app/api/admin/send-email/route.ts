import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendWelcomeEmail, sendReportEmail } from "@/lib/email";
import { requireAdmin } from "@/lib/auth/admin";

export async function POST(request: NextRequest) {
  try {
    const gate = await requireAdmin();
    if (gate.response) return gate.response;

    const { clientId, type } = await request.json();

    if (!clientId || !type) {
      return NextResponse.json({ error: "clientId and type are required" }, { status: 400 });
    }

    const admin = createAdminClient();
    const { data: client, error } = await admin
      .from("clients")
      .select("id, email, business_name, first_name, metadata")
      .eq("id", clientId)
      .single();

    if (error || !client) {
      return NextResponse.json({ error: "Client not found" }, { status: 404 });
    }

    const to = client.email ?? "";
    if (!to) return NextResponse.json({ error: "Client has no email" }, { status: 400 });

    const firstName = (client as Record<string, unknown>).first_name as string | null ?? client.business_name ?? "there";
    const businessName = client.business_name ?? "your business";
    const metadata = (client.metadata as Record<string, unknown>) ?? {};

    if (type === "welcome") {
      await sendWelcomeEmail({
        to,
        firstName,
        businessName,
        pin: (metadata.onboarding_pin as string | null) ?? "0000",
      });
    } else if (type === "report") {
      const now = new Date();
      const month = now.toLocaleString("en-US", { month: "long" });
      const year = now.getFullYear();
      await sendReportEmail({ to, firstName, month, year });
    } else {
      return NextResponse.json({ error: "Unknown email type" }, { status: 400 });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[admin/send-email]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
