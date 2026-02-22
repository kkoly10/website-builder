// app/api/internal/admin/status/route.ts
import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function toObj(v: any): Record<string, any> {
  if (!v) return {};
  if (typeof v === "object") return v;
  if (typeof v === "string") {
    try {
      const parsed = JSON.parse(v);
      return parsed && typeof parsed === "object" ? parsed : {};
    } catch {
      return {};
    }
  }
  return {};
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as {
      quoteId?: string;
      pipelineStatus?: string;
    };

    const quoteId = String(body.quoteId || "").trim();
    const pipelineStatus = String(body.pipelineStatus || "").trim();

    if (!quoteId) {
      return NextResponse.json({ ok: false, error: "quoteId is required" }, { status: 400 });
    }
    if (!pipelineStatus) {
      return NextResponse.json({ ok: false, error: "pipelineStatus is required" }, { status: 400 });
    }

    const { data: quote, error: qErr } = await supabaseAdmin
      .from("quotes")
      .select("id, debug")
      .eq("id", quoteId)
      .single();

    if (qErr || !quote) {
      return NextResponse.json(
        { ok: false, error: qErr?.message || "Quote not found" },
        { status: 404 }
      );
    }

    const debug = toObj(quote.debug);
    const admin = toObj(debug.admin_v15);

    admin.pipelineStatus = pipelineStatus;
    admin.pipelineUpdatedAt = new Date().toISOString();

    debug.admin_v15 = admin;

    const { error: updErr } = await supabaseAdmin
      .from("quotes")
      .update({ debug })
      .eq("id", quoteId);

    if (updErr) {
      return NextResponse.json({ ok: false, error: updErr.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true, admin });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: e?.message || "Unexpected error" },
      { status: 500 }
    );
  }
}