// app/api/internal/pie/generate/route.ts
import { NextResponse } from "next/server";
import { generatePieForQuoteId } from "@/lib/pieEngine";

export const runtime = "nodejs";

function getQuoteIdFromUrl(req: Request) {
  const { searchParams } = new URL(req.url);
  return (searchParams.get("quoteId") || "").trim();
}

export async function POST(req: Request) {
  try {
    let body: any = {};
    try {
      body = await req.json();
    } catch {
      body = {};
    }

    const quoteId = String(body?.quoteId || getQuoteIdFromUrl(req) || "").trim();
    if (!quoteId) {
      return NextResponse.json({ ok: false, error: "Missing quoteId." }, { status: 400 });
    }

    const result = await generatePieForQuoteId(quoteId);

    return NextResponse.json({
      ok: true,
      created: result.created,
      quoteId,
      pieId: result.pie?.id || null,
      projectId: result.projectId || result.pie?.project_id || null,
      tier: result.pie?.tier || null,
      score: result.pie?.score ?? null,
      confidence: result.pie?.confidence || null,
      message: result.created ? "PIE generated." : "PIE already exists.",
    });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: e?.message || "Failed to generate PIE." },
      { status: 500 }
    );
  }
}

// Optional convenience for browser testing:
// /api/internal/pie/generate?quoteId=...
export async function GET(req: Request) {
  return POST(req);
}