// app/api/internal/save-pie/route.ts
import { NextResponse } from "next/server";
import { generatePieForQuoteId } from "@/lib/pie/ensurePie";
import { requireAdminRoute } from "@/lib/routeAuth";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const authErr = await requireAdminRoute();
  if (authErr) return authErr;

  const form = await req.formData();
  const quoteId = String(form.get("quoteId") ?? "").trim();

  if (!quoteId) {
    return NextResponse.json({ error: "Missing quoteId" }, { status: 400 });
  }

  const result = await generatePieForQuoteId(quoteId, { force: true });
  if (!result.ok) {
    return NextResponse.json(
      { error: result.error ?? "Quote not found" },
      { status: 404 }
    );
  }

  const redirectTo = `/internal/quotes/${quoteId}`;
  return NextResponse.redirect(new URL(redirectTo, req.url));
}
