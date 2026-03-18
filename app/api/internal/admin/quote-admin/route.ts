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

function cleanList(values: any) {
  if (Array.isArray(values)) {
    return values.map((v) => String(v || "").trim()).filter(Boolean);
  }

  if (typeof values === "string" && values.trim()) {
    return values
      .split(/[,|\n]/)
      .map((v) => v.trim())
      .filter(Boolean);
  }

  return [];
}

function cleanMilestones(values: any) {
  if (!Array.isArray(values)) return [];

  return values.map((m) => ({
    key: cleanString(m?.key),
    label: cleanString(m?.label) || cleanString(m?.key),
    done: !!m?.done,
    updatedAt: new Date().toISOString(),
  }));
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

    const [existingQuoteRes, existingPortalStateRes] = await Promise.all([
      supabaseAdmin
        .from("quotes")
        .select("id, status, debug, scope_snapshot")
        .eq("id", quoteId)
        .maybeSingle(),

      supabaseAdmin
        .from("quote_portal_state")
        .select("*")
        .eq("quote_id", quoteId)
        .maybeSingle(),
    ]);

    if (existingQuoteRes.error) {
      return NextResponse.json(
        { ok: false, error: existingQuoteRes.error.message },
        { status: 500 }
      );
    }

    const existing = existingQuoteRes.data;
    if (!existing) {
      return NextResponse.json(
        { ok: false, error: "Quote not found" },
        { status: 404 }
      );
    }

    if (
      existingPortalStateRes.error &&
      !String(existingPortalStateRes.error.message || "")
        .toLowerCase()
        .includes("no rows")
    ) {
      return NextResponse.json(
        { ok: false, error: existingPortalStateRes.error.message },
        { status: 500 }
      );
    }

    const currentDebug = safeObj(existing.debug);
    const nextDebug = { ...currentDebug };

    const currentScopeSnapshot = safeObj(existing.scope_snapshot);
    let nextScopeSnapshot: any = null;

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
        previewStatus:
          cleanString(body.portalAdmin.previewStatus) ||
          "Awaiting published preview",
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
          cleanString(body.portalAdmin.agreementModel) ||
          "Managed build agreement",
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

    if (body?.scopeSnapshot && typeof body.scopeSnapshot === "object") {
      nextScopeSnapshot = {
        ...currentScopeSnapshot,
        tierLabel: cleanString(body.scopeSnapshot.tierLabel),
        platform: cleanString(body.scopeSnapshot.platform),
        timeline: cleanString(body.scopeSnapshot.timeline),
        revisionPolicy: cleanString(body.scopeSnapshot.revisionPolicy),
        pagesIncluded: cleanList(body.scopeSnapshot.pagesIncluded),
        featuresIncluded: cleanList(body.scopeSnapshot.featuresIncluded),
        exclusions: cleanList(body.scopeSnapshot.exclusions),
      };
    }

    const quotePatch: any = {
      debug: nextDebug,
    };

    if (typeof body?.status === "string" && body.status.trim()) {
      quotePatch.status = body.status.trim();
    }

    if (nextScopeSnapshot) {
      quotePatch.scope_snapshot = nextScopeSnapshot;
    }

    const { error: quoteUpdateError } = await supabaseAdmin
      .from("quotes")
      .update(quotePatch)
      .eq("id", quoteId);

    if (quoteUpdateError) {
      return NextResponse.json(
        { ok: false, error: quoteUpdateError.message },
        { status: 500 }
      );
    }

    const existingPortalState = existingPortalStateRes.data || { quote_id: quoteId };

    const shouldUpdatePortalState =
      typeof body?.publicNote === "string" ||
      typeof body?.depositNotes === "string" ||
      body?.depositAmount != null ||
      (body?.portalStateAdmin && typeof body.portalStateAdmin === "object");

    if (shouldUpdatePortalState) {
      const portalStatePatch: any = {
        ...existingPortalState,
        quote_id: quoteId,
        updated_at: new Date().toISOString(),
      };

      if (typeof body?.publicNote === "string") {
        portalStatePatch.admin_public_note = body.publicNote;
      }

      if (typeof body?.depositNotes === "string") {
        portalStatePatch.deposit_notes = body.depositNotes;
      }

      if (body?.depositAmount != null) {
        portalStatePatch.deposit_amount = Number(body.depositAmount || 0);
      }

      if (body?.portalStateAdmin && typeof body.portalStateAdmin === "object") {
        if (typeof body.portalStateAdmin.clientStatus === "string") {
          portalStatePatch.client_status = body.portalStateAdmin.clientStatus;
        }

        if (typeof body.portalStateAdmin.clientNotes === "string") {
          portalStatePatch.client_notes = body.portalStateAdmin.clientNotes;
        }

        if (typeof body.portalStateAdmin.adminPublicNote === "string") {
          portalStatePatch.admin_public_note = body.portalStateAdmin.adminPublicNote;
        }

        if (typeof body.portalStateAdmin.depositNotes === "string") {
          portalStatePatch.deposit_notes = body.portalStateAdmin.depositNotes;
        }

        if (body.portalStateAdmin.depositAmount != null) {
          portalStatePatch.deposit_amount = Number(body.portalStateAdmin.depositAmount || 0);
        }

        if (Array.isArray(body.portalStateAdmin.milestones)) {
          portalStatePatch.milestones = cleanMilestones(body.portalStateAdmin.milestones);
        }

        portalStatePatch.client_updated_at = new Date().toISOString();
      }

      const { error: portalStateUpdateError } = await supabaseAdmin
        .from("quote_portal_state")
        .upsert(portalStatePatch, { onConflict: "quote_id" });

      if (portalStateUpdateError) {
        return NextResponse.json(
          { ok: false, error: portalStateUpdateError.message },
          { status: 500 }
        );
      }
    }

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, error: err?.message || "Unknown error" },
      { status: 500 }
    );
  }
}