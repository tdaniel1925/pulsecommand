import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireAdmin } from "@/lib/auth/admin";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const gate = await requireAdmin();
    if (gate.response) return gate.response;

    const { id } = await params;
    const { notes } = await request.json();

    const admin = createAdminClient();

    // Fetch existing metadata first
    const { data: client, error: fetchError } = await admin
      .from("clients")
      .select("metadata")
      .eq("id", id)
      .single();

    if (fetchError) return NextResponse.json({ error: fetchError.message }, { status: 500 });

    const merged = {
      ...((client?.metadata as Record<string, unknown>) ?? {}),
      admin_notes: notes,
    };

    const { error } = await admin
      .from("clients")
      .update({ metadata: merged })
      .eq("id", id);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[admin/clients/notes]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
