import { NextRequest, NextResponse } from "next/server";
import { requireAdminRoute, enforceAdminRateLimit } from "@/lib/routeAuth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getIpFromHeaders } from "@/lib/rateLimit";
import {
  deleteAssetByQuoteId,
  submitAssetByQuoteId,
} from "@/lib/customerPortal";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Schema-level enum on customer_portal_assets.status (see migration
// 20260420_create_customer_portal_tables.sql). Catching invalid values
// before the DB insert turns an opaque 500 (postgres check-constraint
// violation) into a clean 400 with the allowed values.
const VALID_ASSET_STATUSES = new Set(["submitted", "received", "approved"]);

// Admin asset surface. POST creates an asset on the client's behalf
// (e.g. studio uploaded a logo through email and wants it indexed in
// the portal); DELETE removes one. Editing existing asset metadata
// (label/notes/status) still flows through the quote-admin clientSync
// patch — only the create/delete gap is closed here.
export async function POST(req: NextRequest) {
  const authErr = await requireAdminRoute();
  if (authErr) return authErr;
  const rlErr = await enforceAdminRateLimit(req, { keyPrefix: "admin-assets", limit: 30 });
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

  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  const actor = {
    userId: user?.id ?? null,
    email: user?.email ?? null,
    ip: getIpFromHeaders(req.headers),
  };

  try {
    const requestedStatus =
      typeof body?.status === "string" && body.status.trim() ? body.status.trim() : undefined;
    if (requestedStatus && !VALID_ASSET_STATUSES.has(requestedStatus)) {
      return NextResponse.json(
        {
          ok: false,
          error: `Invalid status "${requestedStatus}". Allowed: ${Array.from(VALID_ASSET_STATUSES).join(", ")}`,
        },
        { status: 400 },
      );
    }

    const created = await submitAssetByQuoteId({
      quoteId,
      label: String(body?.label || "").trim(),
      assetType: typeof body?.assetType === "string" ? body.assetType : undefined,
      assetUrl: typeof body?.assetUrl === "string" ? body.assetUrl : undefined,
      notes: typeof body?.notes === "string" ? body.notes : undefined,
      source: typeof body?.source === "string" ? body.source : undefined,
      status: requestedStatus,
      storageBucket: typeof body?.storageBucket === "string" ? body.storageBucket : null,
      storagePath: typeof body?.storagePath === "string" ? body.storagePath : null,
      fileName: typeof body?.fileName === "string" ? body.fileName : null,
      mimeType: typeof body?.mimeType === "string" ? body.mimeType : null,
      fileSize: typeof body?.fileSize === "number" ? body.fileSize : null,
      actor,
    });
    return NextResponse.json({ ok: true, asset: created });
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, error: err?.message || "Failed to create asset" },
      { status: 500 },
    );
  }
}

export async function DELETE(req: NextRequest) {
  const authErr = await requireAdminRoute();
  if (authErr) return authErr;
  const rlErr = await enforceAdminRateLimit(req, { keyPrefix: "admin-assets", limit: 30 });
  if (rlErr) return rlErr;

  const quoteId = String(req.nextUrl.searchParams.get("quoteId") || "").trim();
  const assetId = String(req.nextUrl.searchParams.get("assetId") || "").trim();
  if (!quoteId || !assetId) {
    return NextResponse.json(
      { ok: false, error: "quoteId and assetId required" },
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
    await deleteAssetByQuoteId({ quoteId, assetId, actor });
    return NextResponse.json({ ok: true });
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, error: err?.message || "Failed to delete asset" },
      { status: 500 },
    );
  }
}
