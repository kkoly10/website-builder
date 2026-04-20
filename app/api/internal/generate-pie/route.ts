// app/api/internal/generate-pie/route.ts
import { NextResponse } from "next/server";
import { generatePieForQuoteId } from "@/lib/pie/ensurePie";
import { requireAdminRoute } from "@/lib/routeAuth";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const authErr = await requireAdminRoute();
  if (authErr) return authErr;

  const body = await req.json().catch(() => ({}));
  const quoteId = String(body?.quoteId || "").trim();
  if (!quoteId) {
    return NextResponse.json({ error: "Missing quoteId" }, { status: 400 });
  }

  const result = await generatePieForQuoteId(quoteId, { force: true });
  if (!result.ok || !result.pie?.id) {
    return NextResponse.json(
      { error: result.error || "Failed to generate pie report" },
      { status: 500 }
    );
  }

  return NextResponse.json({ pieReportId: result.pie.id }, { status: 200 });
}
