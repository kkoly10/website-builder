// app/api/internal/admin/quote-admin/route.ts
import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { requireAdminRoute } from "@/lib/routeAuth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

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

function cleanString(v: any) {
  return typeof v === "string" ? v.trim() : "";
}

export async function POST(req: NextRequest) {
  const authErr = await requireAdminRoute();
  if (authErr) return authErr;

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
        hourlyRate: Number(body.adminPricing.hourlyRate || 40),
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

    if (body?.portalAdmin && typeof body.portalAdmin === "object") {
      nextDebug.portalAdmin = {
        previewUrl: cleanString(body.portalAdmin.previewUrl),
        productionUrl: cleanString(body.portalAdmin.productionUrl),
        previewStatus: cleanString(body.portalAdmin.previewStatus) || "Awaiting published preview",
        previewNotes:
          typeof body.portalAdmin.previewNotes === "string"
            ? body.portalAdmin.previewNotes
            : "",
        previewUpdatedAt: new Date().toISOString(),
        clientReviewStatus:
          cleanString(body.portalAdmin.clientReviewStatus) || "Preview pending",
        agreementStatus:
          cleanString(body.portalAdmin.agreementStatus) || "Not published yet",
        agreementModel:
          cleanString(body.portalAdmin.agreementModel) || "Managed build agreement",
        ownershipModel:
          cleanString(body.portalAdmin.ownershipModel) ||
          "Managed with project handoff options",
        agreementPublishedAt: cleanString(body.portalAdmin.agreementPublishedAt),
        launchStatus: cleanString(body.portalAdmin.launchStatus) || "Not ready",
        domainStatus: cleanString(body.portalAdmin.domainStatus) || "Pending",
        analyticsStatus: cleanString(body.portalAdmin.analyticsStatus) || "Pending",
        formsStatus: cleanString(body.portalAdmin.formsStatus) || "Pending",
        seoStatus: cleanString(body.portalAdmin.seoStatus) || "Pending",
        handoffStatus: cleanString(body.portalAdmin.handoffStatus) || "Pending",
        launchNotes:
          typeof body.portalAdmin.launchNotes === "string"
            ? body.portalAdmin.launchNotes
            : "",
      };
    }

    const patch: any = {
      debug: nextDebug,
    };

    if (typeof body?.status === "string" && body.status.trim()) {
      patch.status = body.status.trim();
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