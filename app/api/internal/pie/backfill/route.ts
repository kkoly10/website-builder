// app/api/internal/pie/backfill/route.ts
import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { generatePieForQuoteId } from "@/lib/pie/ensurePie";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type BackfillMode = "all_missing" | "single";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);

    const mode = (searchParams.get("mode") || "all_missing") as BackfillMode;
    const limitRaw = Number(searchParams.get("limit") || "100");
    const limit = Number.isFinite(limitRaw)
      ? Math.max(1, Math.min(500, limitRaw))
      : 100;
    const quoteId = searchParams.get("quoteId");

    // Optional protection if you use an internal key
    // const key = searchParams.get("key");
    // if (process.env.INTERNAL_ADMIN_KEY && key !== process.env.INTERNAL_ADMIN_KEY) {
    //   return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    // }

    // Single quote mode
    if (mode === "single" && quoteId) {
      try {
        const result: any = await generatePieForQuoteId(quoteId);

        return NextResponse.json({
          ok: true,
          mode: "single",
          processed: 1,
          created: result?.skipped ? 0 : 1,
          skipped: result?.skipped ? 1 : 0,
          result: result ?? null,
          errors: [],
        });
      } catch (err: any) {
        return NextResponse.json(
          {
            ok: false,
            mode: "single",
            processed: 1,
            created: 0,
            skipped: 0,
            errors: [{ quoteId, error: err?.message || String(err) }],
          },
          { status: 500 }
        );
      }
    }

    // Get recent quotes
    const { data: quotes, error: quotesError } = await supabaseAdmin
      .from("quotes")
      .select("id, created_at")
      .order("created_at", { ascending: false })
      .limit(limit);

    if (quotesError) {
      return NextResponse.json(
        { ok: false, error: quotesError.message },
        { status: 500 }
      );
    }

    const quoteIds = (quotes || []).map((q: any) => q.id).filter(Boolean);

    if (!quoteIds.length) {
      return NextResponse.json({
        ok: true,
        mode: "all_missing",
        processed: 0,
        created: 0,
        skipped: 0,
        errors: [],
      });
    }

    // Find which quotes already have PIE
    const { data: pieRows, error: pieError } = await supabaseAdmin
      .from("pie_reports")
      .select("quote_id")
      .in("quote_id", quoteIds);

    if (pieError) {
      return NextResponse.json(
        { ok: false, error: pieError.message },
        { status: 500 }
      );
    }

    const existingPieQuoteIds = new Set(
      (pieRows || []).map((r: any) => r.quote_id).filter(Boolean)
    );

    const targets = (quotes || []).filter((q: any) => !existingPieQuoteIds.has(q.id));

    let created = 0;
    let skipped = 0;
    const errors: Array<{ quoteId: string; error: string }> = [];

    for (const q of targets) {
      try {
        const result: any = await generatePieForQuoteId(q.id);

        if (result?.skipped === true) {
          skipped += 1;
        } else {
          created += 1;
        }
      } catch (err: any) {
        errors.push({
          quoteId: q.id,
          error: err?.message || String(err),
        });
      }
    }

    return NextResponse.json({
      ok: true,
      mode: "all_missing",
      processed: targets.length,
      created,
      skipped,
      errors,
    });
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, error: err?.message || "Unknown error" },
      { status: 500 }
    );
  }
}