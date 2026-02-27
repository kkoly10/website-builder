// app/api/internal/pie/generate/route.ts
import { NextResponse } from "next/server";
import { createSupabaseServerClient, isAdminUser } from "@/lib/supabase/server";
import { generatePieForQuoteId } from "@/lib/pie/ensurePie";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

function isUuid(v: unknown) {
  if (typeof v !== "string") return false;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(v);
}

function getParams(req: Request) {
  const url = new URL(req.url);
  const quoteId = url.searchParams.get("quoteId") || "";
  const force = url.searchParams.get("force") === "1";
  return { quoteId, force };
}

async function requireAdmin() {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.auth.getUser();
  const user = data?.user;

  if (!user) {
    return { ok: false as const, status: 401, error: "Not signed in." };
  }

  const admin = await isAdminUser({ userId: user.id, email: user.email });
  if (!admin) {
    return { ok: false as const, status: 403, error: "Admin access required." };
  }

  return { ok: true as const, user };
}

export async function GET(req: Request) {
  try {
    const auth = await requireAdmin();
    if (!auth.ok) return NextResponse.json({ ok: false, error: auth.error }, { status: auth.status });

    const { quoteId, force } = getParams(req);
    if (!quoteId || !isUuid(quoteId)) {
      return NextResponse.json({ ok: false, error: "Invalid or missing quoteId." }, { status: 400 });
    }

    const result = await generatePieForQuoteId(quoteId, { force });

    if (!result.ok) {
      return NextResponse.json({ ok: false, error: result.error || "PIE generation failed." }, { status: 500 });
    }

    return NextResponse.json({
      ok: true,
      created: result.created,
      quoteId,
      pieReportId: result.pie?.id ?? null,
      pie: result.pie ?? null,
    });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err?.message || "Failed to generate PIE." }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const auth = await requireAdmin();
    if (!auth.ok) return NextResponse.json({ ok: false, error: auth.error }, { status: auth.status });

    const body = await req.json().catch(() => ({}));
    const quoteId = String(body?.quoteId ?? "").trim();
    const force = !!body?.force;

    if (!quoteId || !isUuid(quoteId)) {
      return NextResponse.json({ ok: false, error: "Invalid or missing quoteId." }, { status: 400 });
    }

    const result = await generatePieForQuoteId(quoteId, { force });

    if (!result.ok) {
      return NextResponse.json({ ok: false, error: result.error || "PIE generation failed." }, { status: 500 });
    }

    return NextResponse.json({
      ok: true,
      created: result.created,
      quoteId,
      pieReportId: result.pie?.id ?? null,
      pie: result.pie ?? null,
    });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err?.message || "Failed to generate PIE." }, { status: 500 });
  }
}