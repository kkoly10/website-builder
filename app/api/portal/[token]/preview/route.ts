import { NextRequest, NextResponse } from "next/server";
import { markPreviewViewedByToken } from "@/lib/projectActivity";
import {
  enforceRateLimitDurable,
  getIpFromHeaders,
  rateLimitResponse,
} from "@/lib/rateLimit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function getParams(
  ctx: { params: Promise<{ token: string }> | { token: string } }
) {
  return await Promise.resolve(ctx.params);
}

export async function GET(
  req: NextRequest,
  ctx: { params: Promise<{ token: string }> | { token: string } }
) {
  try {
    // Tighter per-IP limit than message reads because each hit writes
    // an activity row via markPreviewViewedByToken — repeated calls
    // bloat the activity feed.
    const ip = getIpFromHeaders(req.headers);
    const rl = await enforceRateLimitDurable({
      key: `portal-preview:${ip}`,
      limit: 30,
      windowMs: 60_000,
    });
    if (!rl.ok) return rateLimitResponse(rl.resetAt);

    const { token } = await getParams(ctx);
    const previewUrl = await markPreviewViewedByToken(token);
    return NextResponse.redirect(previewUrl);
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, error: err?.message || "Preview not available." },
      { status: 404 }
    );
  }
}
