// app/api/internal/admin/quote-admin/route.ts
import { NextRequest, NextResponse } from "next/server";
import { INTERNAL_HOURLY_RATE } from "@/lib/pricing/config";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { requireAdminRoute, enforceAdminRateLimit } from "@/lib/routeAuth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Canonical quote status values. Mirrors the Set in
// app/api/internal/quote/update/route.ts — the proposal endpoint
// previously wrote any string here, but quotes.status has no schema
// check constraint so a typo would silently corrupt the row.
const VALID_QUOTE_STATUSES = new Set([
  "new",
  "awaiting_call",
  "call_scheduled",
  "scope_locked",
  "deposit_sent",
  "deposit_paid",
  "paid",
  "in_progress",
  "delivered",
  "closed_won",
  "closed_lost",
  "call_requested",
  "proposal",
  "active",
]);

function safeObj(v: any) {
  if (!v) return {};
  if (typeof v === "object") return v;
  if (typeof v === "string") {
    try {
      return JSON.parse(v);
    } catch {
      return {};
    }
  }
  return {};
}

export async function POST(req: NextRequest) {
  const authErr = await requireAdminRoute();
  if (authErr) return authErr;
  const rlErr = await enforceAdminRateLimit(req, { keyPrefix: "admin-proposal", limit: 30 });
  if (rlErr) return rlErr;

  try {
    const body = await req.json();
    const quoteId = String(body?.quoteId || "").trim();

    if (!quoteId) {
      return NextResponse.json(
        { ok: false, error: "quoteId is required" },
        { status: 400 }
      );
    }

    const { data: existing, error: existingError } = await supabaseAdmin
      .from("quotes")
      .select("id, status, debug")
      .eq("id", quoteId)
      .maybeSingle();

    if (existingError) {
      return NextResponse.json(
        { ok: false, error: existingError.message },
        { status: 500 }
      );
    }

    if (!existing) {
      return NextResponse.json(
        { ok: false, error: "Quote not found" },
        { status: 404 }
      );
    }

    const currentDebug = safeObj(existing.debug);
    const nextDebug = { ...currentDebug };

    if (body?.adminPricing && typeof body.adminPricing === "object") {
      nextDebug.adminPricing = {
        discountPercent: Number(body.adminPricing.discountPercent || 0),
        flatAdjustment: Number(body.adminPricing.flatAdjustment || 0),
        hourlyRate: Number(body.adminPricing.hourlyRate || INTERNAL_HOURLY_RATE),
        notes:
          typeof body.adminPricing.notes === "string"
            ? body.adminPricing.notes
            : "",
        updatedAt: new Date().toISOString(),
      };
    }

    if (typeof body?.proposalText === "string") {
      nextDebug.generatedProposal = body.proposalText;
      nextDebug.generatedProposalUpdatedAt = new Date().toISOString();
    }

    const patch: any = {
      debug: nextDebug,
    };

    if (typeof body?.status === "string" && body.status.trim()) {
      const next = body.status.trim();
      if (!VALID_QUOTE_STATUSES.has(next)) {
        // Reject typos like "payyd" before they reach the DB. quotes.status
        // has no check constraint at the schema level, so without this gate
        // a malformed value silently persists and breaks downstream lifecycle
        // logic that switches on the canonical enum.
        return NextResponse.json(
          {
            ok: false,
            error: `Invalid status "${next}". Allowed: ${Array.from(VALID_QUOTE_STATUSES).join(", ")}`,
          },
          { status: 400 },
        );
      }
      patch.status = next;
    }

    const { error: updateError } = await supabaseAdmin
      .from("quotes")
      .update(patch)
      .eq("id", quoteId);

    if (updateError) {
      return NextResponse.json(
        { ok: false, error: updateError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, error: err?.message || "Unknown error" },
      { status: 500 }
    );
  }
}
