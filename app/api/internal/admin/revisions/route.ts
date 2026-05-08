import { NextRequest, NextResponse } from "next/server";
import { requireAdminRoute } from "@/lib/routeAuth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getIpFromHeaders } from "@/lib/rateLimit";
import {
  deleteRevisionByQuoteId,
  submitRevisionByQuoteId,
} from "@/lib/customerPortal";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Admin revision surface. POST creates a revision row on the client's
// behalf (call-in feedback, email-relayed notes). DELETE removes one.
// Status/text edits on existing rows still go through the quote-admin
// clientSync patch.
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
  const requestText = String(body?.requestText || body?.message || "").trim();
  if (!quoteId) return NextResponse.json({ ok: false, error: "quoteId required" }, { status: 400 });
  if (!requestText) return NextResponse.json({ ok: false, error: "requestText required" }, { status: 400 });

  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  const actor = {
    userId: user?.id ?? null,
    email: user?.email ?? null,
    ip: getIpFromHeaders(req.headers),
  };

  try {
    const created = await submitRevisionByQuoteId({
      quoteId,
      requestText,
      priority: typeof body?.priority === "string" ? body.priority : undefined,
      actor,
    });
    return NextResponse.json({ ok: true, revision: created });
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, error: err?.message || "Failed to create revision" },
      { status: 500 },
    );
  }
}

export async function DELETE(req: NextRequest) {
  const authErr = await requireAdminRoute();
  if (authErr) return authErr;

  const quoteId = String(req.nextUrl.searchParams.get("quoteId") || "").trim();
  const revisionId = String(req.nextUrl.searchParams.get("revisionId") || "").trim();
  if (!quoteId || !revisionId) {
    return NextResponse.json(
      { ok: false, error: "quoteId and revisionId required" },
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
    await deleteRevisionByQuoteId({ quoteId, revisionId, actor });
    return NextResponse.json({ ok: true });
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, error: err?.message || "Failed to delete revision" },
      { status: 500 },
    );
  }
}
