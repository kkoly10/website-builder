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

function cleanList(values: unknown): string[] {
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

function parsePages(value: unknown): string[] {
  const raw = String(value || "").trim();
  if (!raw) return [];

  if (raw.toLowerCase().includes("one pager")) {
    return ["Homepage / One-page flow"];
  }

  const match = raw.match(/\d+/);
  if (match) {
    const count = Number(match[0]);
    if (Number.isFinite(count) && count > 0) {
      return Array.from({ length: count }, (_, i) => `Page ${i + 1}`);
    }
  }

  return [raw];
}

function money(value?: number | null) {
  if (value == null || !Number.isFinite(Number(value))) return "TBD";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(Number(value));
}

function textOrFallback(value: unknown, fallback: string) {
  const s = typeof value === "string" ? value.trim() : "";
  return s || fallback;
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

    const [quoteRes, portalStateRes] = await Promise.all([
      supabaseAdmin
        .from("quotes")
        .select("*, leads(name,email)")
        .eq("id", quoteId)
        .maybeSingle(),

      supabaseAdmin
        .from("quote_portal_state")
        .select("*")
        .eq("quote_id", quoteId)
        .maybeSingle(),
    ]);

    if (quoteRes.error) {
      return NextResponse.json(
        { ok: false, error: quoteRes.error.message },
        { status: 500 }
      );
    }

    const quote = quoteRes.data;
    if (!quote) {
      return NextResponse.json(
        { ok: false, error: "Quote not found" },
        { status: 404 }
      );
    }

    const lead = Array.isArray(quote.leads) ? quote.leads[0] : quote.leads;
    const portalState = portalStateRes.data || null;

    const intake = safeObj(quote.intake_normalized);
    const scopeSnapshot = safeObj(quote.scope_snapshot);
    const debug = safeObj(quote.debug);
    const portalAdmin = safeObj(debug.portalAdmin);

    const estimateTarget =
      quote.estimate_total ||
      quote.quote_json?.estimateComputed?.total ||
      quote.quote_json?.estimate?.target ||
      null;

    const depositAmount =
      portalState?.deposit_amount ??
      (estimateTarget ? Math.round(Number(estimateTarget) * 0.5) : null);

    const pagesIncluded =
      cleanList(scopeSnapshot.pagesIncluded).length > 0
        ? cleanList(scopeSnapshot.pagesIncluded)
        : parsePages(intake.pages);

    const featuresIncluded =
      cleanList(scopeSnapshot.featuresIncluded).length > 0
        ? cleanList(scopeSnapshot.featuresIncluded)
        : cleanList(intake.integrations);

    const exclusions =
      cleanList(scopeSnapshot.exclusions).length > 0
        ? cleanList(scopeSnapshot.exclusions)
        : ["Third-party fees", "Custom post-launch growth work"];

    const clientName =
      lead?.name ||
      quote.quote_json?.contactName ||
      "Client";

    const clientEmail =
      lead?.email ||
      quote.lead_email ||
      quote.quote_json?.leadEmail ||
      "[client email]";

    const platform = textOrFallback(
      scopeSnapshot.platform || scopeSnapshot.stack || intake.domainHosting,
      "To be finalized"
    );

    const timeline = textOrFallback(
      scopeSnapshot.timeline || scopeSnapshot.timelineText || intake.timeline,
      "Timeline to be finalized during project kickoff"
    );

    const revisionPolicy = textOrFallback(
      scopeSnapshot.revisionPolicy || scopeSnapshot.revisions,
      "Revision structure aligned during scope approval"
    );

    const agreementModel = textOrFallback(
      portalAdmin.agreementModel,
      "Managed build agreement"
    );

    const ownershipModel = textOrFallback(
      portalAdmin.ownershipModel,
      "Managed with project handoff options"
    );

    const previewUrl =
      typeof portalAdmin.previewUrl === "string" && portalAdmin.previewUrl.trim()
        ? portalAdmin.previewUrl.trim()
        : "[preview URL pending]";

    const productionUrl =
      typeof portalAdmin.productionUrl === "string" && portalAdmin.productionUrl.trim()
        ? portalAdmin.productionUrl.trim()
        : "[production URL pending]";

    const launchNotes =
      typeof portalAdmin.launchNotes === "string" && portalAdmin.launchNotes.trim()
        ? portalAdmin.launchNotes.trim()
        : "Launch readiness items will be completed before go-live.";

    const depositNotes =
      typeof portalState?.deposit_notes === "string" && portalState.deposit_notes.trim()
        ? portalState.deposit_notes.trim()
        : "Deposit is required before project kickoff unless otherwise agreed in writing.";

    const draft = `WEBSITE PROJECT PRE-CONTRACT DRAFT

This draft is for internal review and refinement before being shared with the client.

1. PARTIES
This Website Project Pre-Contract (“Agreement”) is between CrecyStudio (“Provider”) and ${clientName} (“Client”).
Client contact email: ${clientEmail}

2. PROJECT SUMMARY
Client is engaging Provider for a website project currently categorized as:
- Tier / package: ${textOrFallback(scopeSnapshot.tierLabel || quote.tier_recommended, "Website Scope")}
- Platform: ${platform}
- Website type: ${textOrFallback(intake.websiteType, "To be finalized")}
- Timeline: ${timeline}

3. SCOPE OF WORK
Provider will design, build, and prepare the website project according to the current approved scope snapshot.

Pages included:
${pagesIncluded.length ? pagesIncluded.map((p) => `- ${p}`).join("\n") : "- To be finalized"}

Features included:
${featuresIncluded.length ? featuresIncluded.map((f) => `- ${f}`).join("\n") : "- To be finalized"}

Exclusions:
${exclusions.length ? exclusions.map((e) => `- ${e}`).join("\n") : "- No exclusions listed yet"}

4. REVISION FRAMEWORK
The current revision policy is:
${revisionPolicy}

Any work falling outside the agreed scope, revision structure, or exclusions may require a separate change order, separate approval, or separate pricing adjustment.

5. PREVIEW / REVIEW PROCESS
Provider may publish preview versions of the website for Client review.
Current preview reference:
${previewUrl}

Client feedback and revision requests will be handled through the project workspace and/or agreed communication channels.

6. COMMERCIAL TERMS
Current project investment target: ${money(estimateTarget)}
Current deposit amount: ${money(depositAmount)}

Deposit notes:
${depositNotes}

Remaining payments, milestone timing, and final billing terms should be finalized before the agreement is sent to the client.

7. OWNERSHIP / DELIVERY MODEL
Agreement model:
${agreementModel}

Ownership model:
${ownershipModel}

Production / launch reference:
${productionUrl}

8. LAUNCH / HANDOFF
Current launch notes:
${launchNotes}

Provider will prepare the site for launch according to the agreed launch checklist, including any applicable domain, analytics, forms, SEO basics, and handoff items reflected in the project workspace.

9. CLIENT RESPONSIBILITIES
Client is responsible for timely submission of required content, approvals, assets, access credentials, and feedback necessary to keep the project moving.

10. INTERNAL REVIEW NOTES
Before sharing this agreement draft externally, confirm:
- legal wording and final contract language
- payment schedule and remaining balance terms
- cancellation / pause / change-order terms
- IP ownership and post-launch support language
- signature block and governing terms

END OF DRAFT`;

    const currentDebug = safeObj(quote.debug);
    const nextDebug = {
      ...currentDebug,
      generatedPreContract: draft,
      generatedPreContractUpdatedAt: new Date().toISOString(),
    };

    const { error: updateError } = await supabaseAdmin
      .from("quotes")
      .update({ debug: nextDebug })
      .eq("id", quoteId);

    if (updateError) {
      return NextResponse.json(
        { ok: false, error: updateError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      ok: true,
      draft,
    });
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, error: err?.message || "Unknown error" },
      { status: 500 }
    );
  }
}