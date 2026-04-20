// app/api/internal/pie/generate/route.ts
import { NextResponse } from "next/server";
import { generatePieForQuoteId } from "@/lib/pie/ensurePie";
import { requireAdminRoute } from "@/lib/routeAuth";

export const maxDuration = 60;
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function isUuid(v: any) {
  if (typeof v !== "string") return false;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(v);
}

export async function POST(req: Request) {
  const authErr = await requireAdminRoute();
  if (authErr) return authErr;

  try {
    const body = await req.json().catch(() => null);
    if (!body) return NextResponse.json({ ok: false, error: "Could not parse request body." }, { status: 400 });

    const quoteId = body?.quoteId;
    if (!quoteId || !isUuid(quoteId)) return NextResponse.json({ ok: false, error: "Invalid or missing quoteId." }, { status: 400 });

    const result = await generatePieForQuoteId(quoteId, { force: true });
    if (!result.ok || !result.pie?.id) {
      return NextResponse.json(
        { ok: false, error: result.error || "Failed to generate PIE report." },
        { status: 500 }
      );
    }

    return NextResponse.json({ ok: true, pieReportId: result.pie.id });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err?.message || "An unexpected server error occurred." }, { status: 500 });
  }
}
