// app/api/internal/backfill-pie/route.ts
import { NextRequest, NextResponse } from "next/server";
import { pieDb, ensurePieForQuoteId } from "@/lib/pie/ensurePie";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const oneQuoteId = url.searchParams.get("quoteId")?.trim();

    if (oneQuoteId) {
      const result = await ensurePieForQuoteId(oneQuoteId);
      return NextResponse.json({
        ok: true,
        mode: "single",
        quoteId: oneQuoteId,
        created: result.created,
        pieId: result.pie?.id ?? null,
      });
    }

    const { data: quotes, error } = await pieDb
      .from("quotes")
      .select("id, latest_pie_report_id")
      .is("latest_pie_report_id", null)
      .order("created_at", { ascending: false })
      .limit(500);

    if (error) {
      return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    }

    let created = 0;
    let skipped = 0;
    const errors: { quoteId: string; error: string }[] = [];

    for (const q of quotes || []) {
      try {
        const res = await ensurePieForQuoteId(q.id);
        if (res.created) created += 1;
        else skipped += 1;
      } catch (e: any) {
        errors.push({ quoteId: q.id, error: e?.message || "Unknown error" });
      }
    }

    return NextResponse.json({
      ok: true,
      mode: "all_missing",
      processed: (quotes || []).length,
      created,
      skipped,
      errors,
    });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: e?.message || "Unexpected error" },
      { status: 500 }
    );
  }
}
