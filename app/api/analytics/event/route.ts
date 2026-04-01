import { NextResponse } from "next/server";
import { recordServerEvent } from "@/lib/analytics/server";
import { enforceRateLimitDurable, getIpFromHeaders, rateLimitResponse } from "@/lib/rateLimit";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const ip = getIpFromHeaders(req.headers);
    const rl = await enforceRateLimitDurable({ key: `analytics:${ip}`, limit: 120, windowMs: 60_000 });
    if (!rl.ok) return rateLimitResponse(rl.resetAt);

    const body = await req.json().catch(() => ({}));
    const event = String(body?.event ?? "").trim();
    if (!event) {
      return NextResponse.json({ ok: false, error: "Missing event name" }, { status: 400 });
    }

    const metadata = body?.metadata && typeof body.metadata === "object" ? body.metadata : {};
    const page = typeof body?.page === "string" ? body.page : null;

    await recordServerEvent({ event, page, metadata, ip });

    return NextResponse.json({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unexpected analytics error";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
