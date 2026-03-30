// app/api/internal/list-quotes/route.ts
import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { requireAdminRoute } from "@/lib/routeAuth";

export const runtime = "nodejs";

export async function GET(req: Request) {
  try {
    const authErr = await requireAdminRoute();
    if (authErr) return authErr;

    const url = new URL(req.url);

    const status = (url.searchParams.get("status") || "").trim();

    let q = supabaseAdmin
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
        debug,
        leads (
          email,
          phone,
          name
        )
      `
      )
      .order("created_at", { ascending: false })
      .limit(50);

    if (status && status !== "all") {
      q = q.eq("status", status);
    }

    const { data, error } = await q;
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });

    return NextResponse.json({ ok: true, quotes: data ?? [] });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Unknown error" }, { status: 500 });
  }
}