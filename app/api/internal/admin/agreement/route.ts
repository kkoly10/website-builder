import { NextRequest, NextResponse } from "next/server";
import { requireAdminRoute } from "@/lib/routeAuth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getIpFromHeaders } from "@/lib/rateLimit";
import {
  adminAcceptCustomerPortalAgreementByQuoteId,
  voidCustomerPortalAgreementByQuoteId,
} from "@/lib/customerPortal";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Admin agreement override surface. Two actions:
//   action="accept" — record an offline acceptance (signed in person,
//       email-relayed, etc.). Requires acceptedByEmail.
//   action="void"   — clear an existing acceptance. Requires reason.
//
// Publish / unpublish still flow through quote-admin's
// publishedAgreementText field; only manual accept and void are net-new
// here.
export async function POST(req: NextRequest) {
  const authErr = await requireAdminRoute();
  if (authErr) return authErr;

  let body: any = {};
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON body" }, { status: 400 });
  }

  const quoteId = String(body?.quoteId || "").trim();
  const action = String(body?.action || "").trim();
  if (!quoteId) return NextResponse.json({ ok: false, error: "quoteId required" }, { status: 400 });
  if (!action) return NextResponse.json({ ok: false, error: "action required" }, { status: 400 });

  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  const actor = {
    userId: user?.id ?? null,
    email: user?.email ?? null,
    ip: getIpFromHeaders(req.headers),
  };

  try {
    if (action === "accept") {
      const acceptedByEmail = String(body?.acceptedByEmail || "").trim();
      if (!acceptedByEmail) {
        return NextResponse.json(
          { ok: false, error: "acceptedByEmail required" },
          { status: 400 },
        );
      }
      await adminAcceptCustomerPortalAgreementByQuoteId({
        quoteId,
        acceptedByEmail,
        acceptedAt: typeof body?.acceptedAt === "string" ? body.acceptedAt : null,
        notes: typeof body?.notes === "string" ? body.notes : null,
        actor,
      });
      return NextResponse.json({ ok: true });
    }

    if (action === "void") {
      const reason = String(body?.reason || "").trim();
      if (!reason) {
        return NextResponse.json(
          { ok: false, error: "reason required" },
          { status: 400 },
        );
      }
      await voidCustomerPortalAgreementByQuoteId({ quoteId, reason, actor });
      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ ok: false, error: "Unknown action" }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, error: err?.message || "Failed" },
      { status: 500 },
    );
  }
}
