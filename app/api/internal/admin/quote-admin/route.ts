import { NextRequest, NextResponse } from "next/server";
import {
  replacePortalMilestonesByQuoteId,
  savePortalClientSyncByQuoteId,
  updatePortalAdminByQuoteId,
} from "@/lib/customerPortal";
import { INTERNAL_HOURLY_RATE } from "@/lib/pricing/config";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { requireAdminRoute } from "@/lib/routeAuth";
import { sendEventNotification } from "@/lib/notifications";

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

function normalizeAssetStatus(value: any) {
  const v = cleanString(value).toLowerCase();
  if (["submitted", "received", "approved"].includes(v)) return v;
  return "submitted";
}

function normalizeRevisionStatus(value: any) {
  const v = cleanString(value).toLowerCase();
  if (["new", "reviewed", "scheduled", "done"].includes(v)) return v;
  return "new";
}

function normalizePriority(value: any) {
  const v = cleanString(value).toLowerCase();
  if (["low", "normal", "high"].includes(v)) return v;
  return "normal";
}

function normalizeChangeOrderStatus(value: any) {
  const v = cleanString(value).toLowerCase();
  if (["draft", "sent", "approved", "declined"].includes(v)) return v;
  return "draft";
}

function cleanAssets(values: any) {
  if (!Array.isArray(values)) return [];

  return values.map((asset, idx) => ({
    id: cleanString(asset?.id) || `asset-${Date.now()}-${idx}`,
    category: cleanString(asset?.category) || "General",
    label: cleanString(asset?.label) || `Asset ${idx + 1}`,
    url: cleanString(asset?.url),
    notes: typeof asset?.notes === "string" ? asset.notes : "",
    status: normalizeAssetStatus(asset?.status),
    createdAt: cleanString(asset?.createdAt) || new Date().toISOString(),
  }));
}

function cleanRevisions(values: any) {
  if (!Array.isArray(values)) return [];

  return values.map((rev, idx) => ({
    id: cleanString(rev?.id) || `revision-${Date.now()}-${idx}`,
    message: cleanString(rev?.message) || "",
    priority: normalizePriority(rev?.priority),
    status: normalizeRevisionStatus(rev?.status),
    createdAt: cleanString(rev?.createdAt) || new Date().toISOString(),
  }));
}

function cleanScopeVersions(values: any) {
  if (!Array.isArray(values)) return [];

  return values.map((item, idx) => ({
    id: cleanString(item?.id) || `scope-${Date.now()}-${idx}`,
    createdAt: cleanString(item?.createdAt) || new Date().toISOString(),
    label: cleanString(item?.label) || `Scope Version ${idx + 1}`,
    summary: cleanString(item?.summary),
    tierLabel: cleanString(item?.tierLabel),
    platform: cleanString(item?.platform),
    timeline: cleanString(item?.timeline),
    revisionPolicy: cleanString(item?.revisionPolicy),
    pagesIncluded: cleanList(item?.pagesIncluded),
    featuresIncluded: cleanList(item?.featuresIncluded),
    exclusions: cleanList(item?.exclusions),
  }));
}

function cleanChangeOrders(values: any) {
  if (!Array.isArray(values)) return [];

  return values.map((item, idx) => ({
    id: cleanString(item?.id) || `co-${Date.now()}-${idx}`,
    createdAt: cleanString(item?.createdAt) || new Date().toISOString(),
    title: cleanString(item?.title) || `Change Order ${idx + 1}`,
    summary: cleanString(item?.summary),
    priceImpact: cleanString(item?.priceImpact),
    timelineImpact: cleanString(item?.timelineImpact),
    scopeImpact: cleanString(item?.scopeImpact),
    status: normalizeChangeOrderStatus(item?.status),
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

    const existingQuoteRes = await supabaseAdmin
      .from("quotes")
      .select("id, status, debug, scope_snapshot")
      .eq("id", quoteId)
      .maybeSingle();

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

    const currentDebug = safeObj(existing.debug);
    const nextDebug = { ...currentDebug };

    const currentScopeSnapshot = safeObj(existing.scope_snapshot);
    let nextScopeSnapshot: any = null;

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

    if (typeof body?.preContractDraft === "string") {
      nextDebug.generatedPreContract = body.preContractDraft;
      nextDebug.generatedPreContractUpdatedAt = new Date().toISOString();
    }

    if (typeof body?.publishedAgreementText === "string") {
      nextDebug.publishedAgreementText = body.publishedAgreementText;
      nextDebug.publishedAgreementUpdatedAt = new Date().toISOString();
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

    if (body?.workspaceHistory && typeof body.workspaceHistory === "object") {
      const currentHistory = safeObj(currentDebug.workspaceHistory);
      const nextHistory: any = {
        ...currentHistory,
        updatedAt: new Date().toISOString(),
      };

      if (Array.isArray(body.workspaceHistory.scopeVersions)) {
        nextHistory.scopeVersions = cleanScopeVersions(body.workspaceHistory.scopeVersions);
      }

      if (Array.isArray(body.workspaceHistory.changeOrders)) {
        nextHistory.changeOrders = cleanChangeOrders(body.workspaceHistory.changeOrders);
      }

      nextDebug.workspaceHistory = nextHistory;
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

    const shouldUpdatePortalState =
      typeof body?.publicNote === "string" ||
      typeof body?.depositNotes === "string" ||
      body?.depositAmount != null ||
      (body?.portalAdmin && typeof body.portalAdmin === "object") ||
      (body?.portalStateAdmin && typeof body.portalStateAdmin === "object") ||
      (body?.clientSync && typeof body.clientSync === "object");

    if (shouldUpdatePortalState) {
      await updatePortalAdminByQuoteId(quoteId, {
        publicNote:
          typeof body?.publicNote === "string" ? body.publicNote : undefined,
        depositNotes:
          typeof body?.depositNotes === "string" ? body.depositNotes : undefined,
        depositAmount:
          body?.depositAmount != null ? Number(body.depositAmount || 0) : undefined,
        portalAdmin:
          body?.portalAdmin && typeof body.portalAdmin === "object"
            ? body.portalAdmin
            : undefined,
        portalStateAdmin:
          body?.portalStateAdmin && typeof body.portalStateAdmin === "object"
            ? body.portalStateAdmin
            : undefined,
        publishedAgreementText:
          typeof body?.publishedAgreementText === "string"
            ? body.publishedAgreementText
            : undefined,
      });

      if (
        body?.portalStateAdmin &&
        typeof body.portalStateAdmin === "object" &&
        Array.isArray(body.portalStateAdmin.milestones)
      ) {
        await replacePortalMilestonesByQuoteId(
          quoteId,
          cleanMilestones(body.portalStateAdmin.milestones)
        );
      }

      if (body?.clientSync && typeof body.clientSync === "object") {
        await savePortalClientSyncByQuoteId(quoteId, {
          assets: Array.isArray(body.clientSync.assets)
            ? cleanAssets(body.clientSync.assets)
            : undefined,
          revisions: Array.isArray(body.clientSync.revisions)
            ? cleanRevisions(body.clientSync.revisions)
            : undefined,
        });
      }
    }

    if (typeof body?._event === "string" && body._event) {
      const leadRow = await supabaseAdmin
        .from("quotes")
        .select("lead_name, lead_email, public_token")
        .eq("id", quoteId)
        .maybeSingle();

      const lead = leadRow.data;
      if (lead) {
        sendEventNotification({
          event: body._event,
          quoteId,
          leadName: lead.lead_name || "",
          leadEmail: lead.lead_email || "",
          workspaceUrl: lead.public_token
            ? `${process.env.NEXT_PUBLIC_BASE_URL || ""}/portal/${lead.public_token}`
            : undefined,
        }).catch((err) => {
          console.error("[quote-admin] notification error:", err);
        });
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
