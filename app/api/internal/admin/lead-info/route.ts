import { NextRequest, NextResponse } from "next/server";
import { requireAdminRoute, enforceAdminRateLimit } from "@/lib/routeAuth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getIpFromHeaders } from "@/lib/rateLimit";
import { editLeadInfoByQuoteId } from "@/lib/customerPortal";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// PATCH name / email / phone on the lead linked to a quote. Mirrors
// the changed fields onto quotes.lead_email / lead_name and re-derives
// owner_email_norm so portal access control still works after an
// email change.
export async function PATCH(req: NextRequest) {
  const authErr = await requireAdminRoute();
  if (authErr) return authErr;
  const rlErr = await enforceAdminRateLimit(req, { keyPrefix: "admin-lead-info", limit: 30 });
  if (rlErr) return rlErr;

  let body: any = {};
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON body" }, { status: 400 });
  }

  const quoteId = String(body?.quoteId || "").trim();
  if (!quoteId) {
    return NextResponse.json({ ok: false, error: "quoteId required" }, { status: 400 });
  }

  const patch: { name?: string; email?: string; phone?: string } = {};
  if (typeof body?.name === "string") patch.name = body.name;
  if (typeof body?.email === "string") patch.email = body.email;
  if (typeof body?.phone === "string") patch.phone = body.phone;

  if (Object.keys(patch).length === 0) {
    return NextResponse.json(
      { ok: false, error: "At least one of name/email/phone required" },
      { status: 400 },
    );
  }

  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  const actor = {
    userId: user?.id ?? null,
    email: user?.email ?? null,
    ip: getIpFromHeaders(req.headers),
  };

  try {
    const result = await editLeadInfoByQuoteId({ quoteId, patch, actor });
    return NextResponse.json({ ok: true, ...result });
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, error: err?.message || "Failed" },
      { status: 500 },
    );
  }
}
