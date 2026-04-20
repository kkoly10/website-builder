// app/api/internal/quote/run-pie/route.ts
import { NextResponse } from "next/server";
import { generatePieForQuoteId } from "@/lib/pie/ensurePie";
import { requireAdminRoute } from "@/lib/routeAuth";

export const runtime = "nodejs";

function pick(form: FormData, key: string) {
  return String(form.get(key) ?? "").trim();
}

export async function POST(req: Request) {
  const authErr = await requireAdminRoute();
  if (authErr) return authErr;

  const form = await req.formData();

  const quoteId = pick(form, "quoteId");
  if (!quoteId) return NextResponse.json({ error: "Missing quoteId" }, { status: 400 });

  const result = await generatePieForQuoteId(quoteId, { force: true });
  if (!result.ok) {
    return NextResponse.json(
      { error: result.error ?? "Failed to generate PIE report" },
      { status: 400 }
    );
  }

  const url = new URL(req.url);
  url.pathname = "/internal/dashboard";
  url.search = `quoteId=${encodeURIComponent(quoteId)}`;
  return NextResponse.redirect(url, { status: 303 });
}
