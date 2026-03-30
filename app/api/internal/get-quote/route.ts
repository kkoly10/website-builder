// app/api/internal/get-quote/route.ts
import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { requireAdminRoute } from "@/lib/routeAuth";

export const runtime = "nodejs";

export async function GET(req: Request) {
  try {
    const authErr = await requireAdminRoute();
    if (authErr) return authErr;

    const url = new URL(req.url);
    const quoteId = (url.searchParams.get("quoteId") || "").trim();

    if (!quoteId) {
      return NextResponse.json({ error: "quoteId is required" }, { status: 400 });
    }

    const { data, error } = await supabaseAdmin
      .from("quotes")
      .select(
        `
        id,
        created_at,
        status,
        tier_recommended,
        estimate_total,
        estimate_low,
        estimate_high,
        intake_normalized,
        scope_snapshot,
        debug,
        leads (
          email,
          phone,
          name
        )
      `
      )
      .eq("id", quoteId)
      .single();

    if (error || !data) {
      return NextResponse.json({ error: error?.message || "Not found" }, { status: 404 });
    }

    return NextResponse.json({ ok: true, quote: data });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Unknown error" }, { status: 500 });
  }
}