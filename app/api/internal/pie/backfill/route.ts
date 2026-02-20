// app/api/internal/pie/backfill/route.ts
import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { generatePieForQuoteId } from "@/lib/pieEngine";

export const runtime = "nodejs";

function sb() {
  return typeof supabaseAdmin === "function" ? supabaseAdmin() : supabaseAdmin;
}

function getMode(req: Request) {
  const { searchParams } = new URL(req.url);
  return (searchParams.get("mode") || "all_missing").trim();
}

export async function POST(req: Request) {
  try {
    let body: any = {};
    try {
      body = await req.json();
    } catch {
      body = {};
    }

    const mode = String(body?.mode || getMode(req) || "all_missing").trim();
    const limit = Math.min(Number(body?.limit || 200), 500);

    // Pull quotes
    const client = sb();
    const quotesRes = await client
      .from("quotes")
      .select("id, latest_pie_report_id, created_at")
      .order("created_at", { ascending: true })
      .limit(limit);

    if (quotesRes.error) {
      return NextResponse.json(
        { ok: false, error: quotesRes.error.message },
        { status: 500 }
      );
    }

    const allQuotes = quotesRes.data || [];
    const targets =
      mode === "all"
        ? allQuotes
        : allQuotes.filter((q: any) => !q.latest_pie_report_id);

    let created = 0;
    let skipped = 0;
    const errors: Array<{ quoteId: string; error: string }> = [];

    for (const q of targets) {
      try {
        const res = await generatePieForQuoteId(String(q.id));
        if (res.created) created += 1;
        else skipped += 1;
      } catch (e: any) {
        errors.push({
          quoteId: String(q.id),
          error: e?.message || "Unknown error",
        });
      }
    }

    return NextResponse.json({
      ok: true,
      mode,
      processed: targets.length,
      created,
      skipped,
      errors,
    });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: e?.message || "Backfill failed." },
      { status: 500 }
    );
  }
}

// Optional convenience for browser testing:
// /api/internal/pie/backfill?mode=all_missing
export async function GET(req: Request) {
  return POST(req);
}