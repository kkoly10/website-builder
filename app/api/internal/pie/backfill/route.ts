// app/api/internal/pie/backfill/route.ts
import { NextResponse } from "next/server";
import { generatePieForQuoteId, pieDb } from "@/lib/pie/ensurePie";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const mode = body?.mode ?? "all_missing";
    const limit = Number(body?.limit ?? 500);

    if (mode !== "all_missing") {
      return NextResponse.json(
        { ok: false, error: "Only mode 'all_missing' is supported" },
        { status: 400 }
      );
    }

    const quotes = await pieDb.listQuotesMissingPie(limit);

    let created = 0;
    let skipped = 0;
    const errors: Array<{ quoteId: string; error: string }> = [];

    for (const q of quotes) {
      try {
        const res = await generatePieForQuoteId(q.id, { force: false });
        if (res.created) created += 1;
        else skipped += 1;
      } catch (e: any) {
        errors.push({ quoteId: q.id, error: e?.message || "Unknown error" });
      }
    }

    return NextResponse.json({
      ok: true,
      mode,
      processed: quotes.length,
      created,
      skipped,
      errors,
    });
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, error: err?.message || "Backfill failed" },
      { status: 500 }
    );
  }
}
