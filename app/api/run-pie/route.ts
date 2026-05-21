// app/api/run-pie/route.ts
import { NextResponse } from "next/server";
import { generatePieForQuoteId } from "@/lib/pie/ensurePie";
import { enforceRateLimitDurable, getIpFromHeaders, rateLimitResponse } from "@/lib/rateLimit";
import { createSupabaseServerClient, isAdminUser } from "@/lib/supabase/server";

export const runtime = "nodejs";

type Body = { quoteId?: string };

function isUuid(v: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(v);
}

// PIE generation is admin-only — it spends OpenAI tokens and pulls
// internal quote details into the report. The parallel route at
// /api/pie/generate already gates on this; this one was missed and
// could be abused by anyone who knows or guesses a valid quote UUID.
async function requireAdmin() {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.auth.getUser();
  const user = data?.user;
  if (!user) return { ok: false as const, status: 401, error: "Not signed in." };
  const admin = await isAdminUser({ userId: user.id, email: user.email });
  if (!admin) return { ok: false as const, status: 403, error: "Admin access required." };
  return { ok: true as const };
}

export async function POST(req: Request) {
  try {
    const auth = await requireAdmin();
    if (!auth.ok) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

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
