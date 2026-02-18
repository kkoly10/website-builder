// app/api/internal/update-quote/route.ts
import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export const runtime = "nodejs";

function requireInternalKey(req: Request) {
  const key = req.headers.get("x-internal-key") || "";
  const expected = process.env.INTERNAL_DASH_KEY || "";
  if (!expected) return { ok: false, error: "Missing INTERNAL_DASH_KEY env var." };
  if (key !== expected) return { ok: false, error: "Unauthorized." };
  return { ok: true };
}

export async function POST(req: Request) {
  const auth = requireInternalKey(req);
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: 401 });

  try {
    const body = await req.json();
    const quoteId = String(body?.quoteId ?? "").trim();
    const patch = body?.patch ?? {};

    if (!quoteId) {
      return NextResponse.json({ error: "quoteId is required" }, { status: 400 });
    }

    // Only allow a safe set of fields to be updated
    const allowed: any = {};
    if ("status" in patch) allowed.status = patch.status;
    if ("deposit_link_url" in patch) allowed.deposit_link_url = patch.deposit_link_url;
    if ("deposit_amount" in patch) allowed.deposit_amount = patch.deposit_amount;
    if ("scope_snapshot" in patch) allowed.scope_snapshot = patch.scope_snapshot;
    if ("scope_locked_at" in patch) allowed.scope_locked_at = patch.scope_locked_at;

    const { data, error } = await supabaseAdmin
      .from("quotes")
      .update(allowed)
      .eq("id", quoteId)
      .select("id,status,deposit_link_url,deposit_amount,scope_locked_at")
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 400 });

    return NextResponse.json({ ok: true, data });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || "Unknown error" }, { status: 500 });
  }
}