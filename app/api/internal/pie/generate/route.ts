// app/api/internal/pie/generate/route.ts
import { NextResponse } from "next/server";
import { generatePieForQuoteId } from "@/lib/pie/ensurePie";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function getQuoteIdFromUrl(req: Request) {
  const url = new URL(req.url);
  return url.searchParams.get("quoteId");
}

export async function GET(req: Request) {
  try {
    const quoteId = getQuoteIdFromUrl(req);
    const force = new URL(req.url).searchParams.get("force") === "1";

    if (!quoteId) {
      return NextResponse.json({ ok: false, error: "Missing quoteId" }, { status: 400 });
    }

    const result = await generatePieForQuoteId(quoteId, { force });

    return NextResponse.json({
      ok: true,
      created: result.created,
      quoteId,
      pieReportId: result.pie?.id ?? null,
      pie: result.pie ?? null,
    });
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, error: err?.message || "Failed to generate PIE" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const quoteId = body?.quoteId;
    const force = !!body?.force;

    if (!quoteId) {
      return NextResponse.json({ ok: false, error: "Missing quoteId" }, { status: 400 });
    }

    const result = await generatePieForQuoteId(quoteId, { force });

    return NextResponse.json({
      ok: true,
      created: result.created,
      quoteId,
      pieReportId: result.pie?.id ?? null,
      pie: result.pie ?? null,
    });
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, error: err?.message || "Failed to generate PIE" },
      { status: 500 }
    );
  }
}