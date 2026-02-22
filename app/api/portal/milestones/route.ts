// app/api/portal/milestones/route.ts
import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { resolvePortalAccess } from "@/lib/portalAccess";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const token = req.nextUrl.searchParams.get("token") || "";
    const resolved = await resolvePortalAccess(token);

    if (!resolved) {
      return NextResponse.json(
        { ok: false, error: "Invalid or expired portal token." },
        { status: 404 }
      );
    }

    const { data, error } = await supabaseAdmin
      .from("project_milestones")
      .select("*")
      .eq("quote_id", resolved.quoteId)
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: true });

    if (error) {
      return NextResponse.json(
        { ok: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ ok: true, milestones: data ?? [] });
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, error: err?.message || "Unexpected error" },
      { status: 500 }
    );
  }
}