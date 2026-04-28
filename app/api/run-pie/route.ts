// app/api/run-pie/route.ts
import { NextResponse } from "next/server";
import { generatePieForQuoteId } from "@/lib/pie/ensurePie";
import { enforceRateLimitDurable, getIpFromHeaders, rateLimitResponse } from "@/lib/rateLimit";

export const runtime = "nodejs";

type Body = { quoteId?: string };

function isUuid(v: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(v);
}

function firstLead(leads: any) {
  if (!leads) return null;
  return Array.isArray(leads) ? leads[0] ?? null : leads;
}

export async function POST(req: Request) {
  try {
    const ip = getIpFromHeaders(req.headers);
    const rl = await enforceRateLimitDurable({ key: `run-pie:${ip}`, limit: 5, windowMs: 60_000 });
    if (!rl.ok) return rateLimitResponse(rl.resetAt);

    const body = (await req.json()) as Body;
    const quoteId = String(body?.quoteId ?? "").trim();

    if (!quoteId || !isUuid(quoteId)) {
      return NextResponse.json({ error: "Missing or invalid quoteId." }, { status: 400 });
    }

    const result = await generatePieForQuoteId(quoteId, { force: true });
    if (!result.ok || !result.pie?.id) {
      return NextResponse.json(
        { error: result.error ?? "Failed to generate PIE report." },
        { status: 400 }
      );
    }

    return NextResponse.json({ ok: true, pieReportId: result.pie.id });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || "Unknown error" }, { status: 500 });
  }
}
