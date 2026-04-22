import { NextRequest, NextResponse } from "next/server";
import { runNudgeEngine } from "@/lib/nudges/engine";
import { getBaseUrl } from "@/lib/stripeServer";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function isAuthorized(req: NextRequest) {
  const secret = process.env.CRON_SECRET || process.env.INTERNAL_DASHBOARD_TOKEN || "";
  if (!secret) return true;
  return req.headers.get("authorization") === `Bearer ${secret}`;
}

export async function GET(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await runNudgeEngine({ baseUrl: getBaseUrl(req) });
    return NextResponse.json(result);
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, error: err?.message || "Failed to run nudges." },
      { status: 500 }
    );
  }
}
