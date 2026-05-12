import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { getCustomerPortalViewByQuoteId } from "@/lib/customerPortal";
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
    return values.split(/[,|\n]/).map((v) => v.trim()).filter(Boolean);
  }
  return [];
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

function listOrFallback(values: string[], fallback: string): string {
  return values.length ? values.map((v) => `- ${v}`).join("\n") : `- ${fallback}`;
}

// ─── Lane-aware helpers ────────────────────────────────────────────────────

function buildTitle(projectType: string): string {
  switch (projectType) {
    case "web_app":    return "CUSTOM WEB APP PRE-CONTRACT DRAFT";
    case "automation": return "WORKFLOW AUTOMATION PRE-CONTRACT DRAFT";
    case "ecommerce":  return "E-COMMERCE STORE PRE-CONTRACT DRAFT";
    case "rescue":     return "WEBSITE RESCUE PRE-CONTRACT DRAFT";
    default:           return "WEBSITE PROJECT PRE-CONTRACT DRAFT";
  }
}

function buildProjectSummaryBlock(workspace: any, projectType: string): string {
  const timeline = textOrFallback(
    workspace.scopeSnapshot?.timeline,
    "Timeline to be finalized during project kickoff"
  );

  switch (projectType) {
    case "web_app": {
      return `Client is engaging Provider for a custom web application project.
- Project type: Custom web application
- Timeline: ${timeline}`;
    }
    case "automation": {
      return `Client is engaging Provider for a workflow automation project.
- Project type: Workflow automation
- Timeline: ${timeline}`;
    }
    case "ecommerce": {
      const platform = textOrFallback(workspace.direction?.payload?.platform, "To be finalized");
      return `Client is engaging Provider for an e-commerce store build.
- Project type: E-commerce store
- Platform: ${platform}
- Timeline: ${timeline}`;
    }
    case "rescue": {
      const currentUrl = textOrFallback(workspace.direction?.payload?.currentUrl, "To be provided");
      const urgency = textOrFallback(workspace.direction?.payload?.urgency, "To be confirmed");
      return `Client is engaging Provider for a website rescue engagement.
- Project type: Website rescue
- Site URL: ${currentUrl}
- Urgency: ${urgency}
- Timeline: ${timeline}`;
    }
    default: {
      const tierLabel = workspace.scopeSnapshot?.tierLabel || workspace.quote?.tier;
      const platform = textOrFallback(workspace.scopeSnapshot?.platform, "To be finalized");
      const websiteType = textOrFallback(workspace.scope?.websiteType, "To be finalized");
      return `Client is engaging Provider for a website project currently categorized as:
- Tier / package: ${textOrFallback(tierLabel, "Website Scope")}
- Platform: ${platform}
- Website type: ${websiteType}
- Timeline: ${timeline}`;
    }
  }
}

function buildScopeBlock(workspace: any, projectType: string): string {
  const p = workspace.direction?.payload ?? {};

  switch (projectType) {
    case "web_app": {
      const appPurpose = textOrFallback(p.appPurpose, "To be finalized");
      const targetUsers = listOrFallback(cleanList(p.targetUsers), "To be finalized");
      const keyWorkflows = textOrFallback(p.keyWorkflows, "To be finalized");
      const integrations = listOrFallback(cleanList(p.integrations), "None specified yet");
      const acceptanceCriteria = textOrFallback(p.acceptanceCriteria, "To be finalized");
      return `Provider will design, build, and deliver the custom web application according to the current approved product direction.

App purpose:
${appPurpose}

Target users:
${targetUsers}

Key workflows:
${keyWorkflows}

Integrations:
${integrations}

MVP acceptance criteria:
${acceptanceCriteria}`;
    }

    case "automation": {
      const currentProcess = textOrFallback(p.currentProcess, "To be finalized");
      const trigger = textOrFallback(p.trigger, "To be finalized");
      const toolsInvolved = listOrFallback(cleanList(p.toolsInvolved), "To be finalized");
      const outputs = textOrFallback(p.outputs, "To be finalized");
      const successMetric = textOrFallback(p.successMetric, "To be confirmed");
      return `Provider will design, build, and deliver the workflow automation according to the current approved workflow direction.

Current manual process:
${currentProcess}

Trigger:
${trigger}

Tools involved:
${toolsInvolved}

Desired outputs:
${outputs}

Success metric:
${successMetric}`;
    }

    case "ecommerce": {
      const platform = textOrFallback(p.platform, "To be finalized");
      const catalogSize = textOrFallback(p.productCatalogSize, "To be confirmed");
      const categories = listOrFallback(cleanList(p.productCategories), "To be finalized");
      const payments = listOrFallback(cleanList(p.paymentNeeds), "To be finalized");
      const shipping = textOrFallback(p.shippingRules, "To be finalized");
      const policies = textOrFallback(p.policyNeeds, "To be finalized");
      return `Provider will design, build, and deliver the e-commerce store according to the current approved store direction.

Platform: ${platform}
Approximate product count: ${catalogSize}

Product categories:
${categories}

Payment methods:
${payments}

Shipping:
${shipping}

Returns / policies:
${policies}`;
    }

    case "rescue": {
      const currentUrl = textOrFallback(p.currentUrl, "To be provided");
      const issues = listOrFallback(cleanList(p.reportedIssues), "To be confirmed");
      const businessImpact = textOrFallback(p.businessImpact, "To be confirmed");
      const priorityFixes = textOrFallback(p.priorityFixes, "To be confirmed");
      const accessNeeded = listOrFallback(cleanList(p.accessNeeded), "To be confirmed");
      return `Provider will diagnose and resolve the reported issues on the Client's existing website according to the current approved rescue diagnosis.

Site URL: ${currentUrl}

Reported issues:
${issues}

Business impact:
${businessImpact}

Priority fixes:
${priorityFixes}

Access required:
${accessNeeded}`;
    }

    default: {
      const pagesIncluded = cleanList(workspace.scopeSnapshot?.pagesIncluded);
      const featuresIncluded = cleanList(workspace.scopeSnapshot?.featuresIncluded);
      const exclusions = cleanList(workspace.scopeSnapshot?.exclusions);
      const revisionPolicy = textOrFallback(
        workspace.scopeSnapshot?.revisionPolicy,
        "Revision structure aligned during scope approval"
      );
      return `Provider will design, build, and prepare the website project according to the current approved scope snapshot.

Pages included:
${listOrFallback(pagesIncluded, "To be finalized")}

Features included:
${listOrFallback(featuresIncluded, "To be finalized")}

Exclusions:
${listOrFallback(exclusions, "No exclusions listed yet")}

4. REVISION FRAMEWORK
The current revision policy is:
${revisionPolicy}

Any work falling outside the agreed scope, revision structure, or exclusions may require a separate change order, separate approval, or separate pricing adjustment.`;
    }
  }
}

function buildHandoffClause(projectType: string): string {
  switch (projectType) {
    case "web_app":
      return "production environment configuration, authentication and permissions testing, database write verification, integrations testing, UAT completion, and handoff documentation";
    case "automation":
      return "tool connection verification, test data confirmation, error handling review, rollback plan documentation, and automation handoff documentation";
    case "ecommerce":
      return "payment gateway configuration, shipping and tax rule verification, store policy review, test order completion, launch approval, and handoff documentation";
    case "rescue":
      return "critical issue resolution, forms and mobile testing, speed baseline review, final written report delivery, and handoff";
    default:
      return "domain, analytics, forms, SEO basics, and handoff items reflected in the project workspace";
  }
}

// ─── Route ────────────────────────────────────────────────────────────────

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

    const portalView = await getCustomerPortalViewByQuoteId(quoteId);
    if (!portalView.ok) {
      return NextResponse.json(
        { ok: false, error: portalView.error || "Portal project not found" },
        { status: 404 }
      );
    }

    const quoteRes = await supabaseAdmin
      .from("quotes")
      .select("id, debug")
      .eq("id", quoteId)
      .maybeSingle();

    if (quoteRes.error || !quoteRes.data) {
      return NextResponse.json(
        { ok: false, error: quoteRes.error?.message || "Quote not found" },
        { status: 404 }
      );
    }

    const workspace = portalView.data;
    const projectType = (workspace.projectType as string) || "website";

    const estimateTarget = workspace.quote.estimate.target;
    const depositAmount = workspace.quote.deposit.amount;
    const clientName = workspace.lead.name || "Client";
    const clientEmail = workspace.lead.email || "[client email]";
    const agreementModel = textOrFallback(workspace.agreement.model, "Managed build agreement");
    const ownershipModel = textOrFallback(workspace.agreement.ownershipModel, "Managed with project handoff options");
    const previewUrl = workspace.preview.url || "[preview URL pending]";
    const productionUrl = workspace.preview.productionUrl || "[production URL pending]";
    const launchNotes = workspace.launch.notes || "Launch readiness items will be completed before go-live.";
    const depositNotes = workspace.quote.deposit.notes || "Deposit is required before project kickoff unless otherwise agreed in writing.";

    const title = buildTitle(projectType);
    const projectSummary = buildProjectSummaryBlock(workspace, projectType);
    const scopeBlock = buildScopeBlock(workspace, projectType);
    const handoffClause = buildHandoffClause(projectType);

    // Website lane inlines section 4 (Revision Framework) inside buildScopeBlock
    // to preserve the existing document structure. All other lanes use a
    // standalone section 4 that covers change orders generically.
    const revisionsSection = projectType === "website" ? "" : `4. CHANGE ORDER FRAMEWORK
Any work falling outside the agreed scope or direction may require a separate change order, separate approval, or separate pricing adjustment.

`;

    const draft = `${title}

This draft is for internal review and refinement before being shared with the client.

1. PARTIES
This Pre-Contract ("Agreement") is between CrecyStudio ("Provider") and ${clientName} ("Client").
Client contact email: ${clientEmail}

2. PROJECT SUMMARY
${projectSummary}

3. SCOPE OF WORK
${scopeBlock}

${revisionsSection}5. PREVIEW / REVIEW PROCESS
Provider may publish preview or staging versions of the deliverable for Client review.
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

Production / delivery reference:
${productionUrl}

8. LAUNCH / HANDOFF
Current launch notes:
${launchNotes}

Provider will prepare the deliverable for handoff according to the agreed launch checklist, including ${handoffClause}.

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

    const currentDebug = safeObj(quoteRes.data.debug);
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

    return NextResponse.json({ ok: true, draft });
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, error: err?.message || "Unknown error" },
      { status: 500 }
    );
  }
}
