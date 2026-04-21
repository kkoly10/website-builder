import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { getCustomerPortalBundleByQuoteId } from "@/lib/customerPortal";
import type { GhostLane, GhostProjectSnapshot } from "@/lib/ghost/types";

function d(value?: string | null) {
  if (!value) return "no date";
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? value : parsed.toLocaleString();
}

function normalizeRiskFlags(flags: Array<string | null | undefined | false>) {
  return Array.from(new Set(flags.filter(Boolean))) as string[];
}

function asArray(value: unknown) {
  return Array.isArray(value) ? value : [];
}

function text(value: unknown, fallback = "unknown") {
  const normalized = String(value ?? "").trim();
  return normalized || fallback;
}

function extractPreviewUrl(quote: any, portal: any) {
  const candidates = [
    portal?.preview_url,
    portal?.design_preview_url,
    portal?.live_preview_url,
    quote?.preview_url,
    quote?.design_preview_url,
    quote?.quote_json?.preview_url,
    quote?.quote_json?.previewUrl,
    quote?.quote_json?.designPreviewUrl,
    quote?.quote_json?.design_preview_url,
  ];

  for (const candidate of candidates) {
    const value = String(candidate || "").trim();
    if (value) return value;
  }

  return null;
}

function formatCurrency(value: unknown) {
  const num = Number(value);
  if (!Number.isFinite(num)) return null;
  return `$${num.toLocaleString()}`;
}

async function getWebsiteSnapshot(projectId: string): Promise<GhostProjectSnapshot | null> {
  const bundle = await getCustomerPortalBundleByQuoteId(projectId);
  const quote = bundle?.quote ?? null;
  const call = bundle?.callRequest ?? null;
  const portal = bundle?.portal ?? null;

  if (!quote) return null;

  const status = text(quote.status, "new");
  const depositStatus = text(portal?.deposit_status || quote.deposit_status, "unpaid");
  const revisions = asArray(bundle?.revisions);
  const milestones = asArray(bundle?.milestones);
  const assets = asArray(bundle?.assets);
  const previewUrl = extractPreviewUrl(quote, portal);
  const doneMilestones = milestones.filter((m: any) => String(m?.status) === "done").length;

  const riskFlags = normalizeRiskFlags([
    depositStatus !== "paid" && ["proposal", "deposit", "active"].includes(status)
      ? "Deposit not marked paid"
      : null,
    !call && ["new", "proposal"].includes(status) ? "No discovery call booked yet" : null,
    revisions.length > 3 ? "High revision volume" : null,
    assets.length === 0 && status === "active" ? "Missing client assets" : null,
  ]);

  const waitingOn =
    depositStatus !== "paid" && ["proposal", "deposit", "active"].includes(status)
      ? "Client deposit payment"
      : !call && ["new", "proposal"].includes(status)
      ? "Discovery call scheduling"
      : assets.length === 0 && status === "active"
      ? "Client asset uploads"
      : revisions.length > 0
      ? "Revision review / approval"
      : milestones.length > 0 && doneMilestones < milestones.length
      ? "Current milestone completion"
      : "Final confirmation / handoff readiness";

  const nextActionTitle =
    depositStatus !== "paid" && ["proposal", "deposit", "active"].includes(status)
      ? "Send deposit reminder"
      : !call && ["new", "proposal"].includes(status)
      ? "Confirm discovery call window"
      : assets.length === 0 && status === "active"
      ? "Request required content and assets"
      : revisions.length > 0
      ? "Review open revisions and lock next milestone"
      : "Confirm milestone owner + due date";

  const sourceFacts = [
    `quote.status=${status}`,
    `deposit_status=${depositStatus}`,
    `call_exists=${Boolean(call)}`,
    `revision_count=${revisions.length}`,
    `asset_count=${assets.length}`,
    `milestone_progress=${doneMilestones}/${milestones.length || 0}`,
  ];

  if (previewUrl) sourceFacts.push(`preview_url=${previewUrl}`);
  if (quote.deposit_amount != null) {
    const amount = formatCurrency(quote.deposit_amount);
    if (amount) sourceFacts.push(`deposit_amount=${amount}`);
  }

  return {
    lane: "website",
    projectId,
    phase: status,
    status,
    healthState: riskFlags.length > 1 ? "at-risk" : riskFlags.length === 1 ? "watch" : "healthy",
    waitingOn,
    nextActionTitle,
    riskFlags,
    latestActivitySummary: `Quote updated ${d(
      quote.updated_at || quote.created_at
    )}. Last call: ${d(call?.created_at)}. Milestones complete: ${doneMilestones}/${
      milestones.length || 0
    }.`,
    sourceFacts,
  };
}

async function getOpsSnapshot(projectId: string): Promise<GhostProjectSnapshot | null> {
  const [{ data: intake }, { data: call }, { data: pie }] = await Promise.all([
    supabaseAdmin.from("ops_intakes").select("*").eq("id", projectId).maybeSingle(),
    supabaseAdmin
      .from("ops_call_requests")
      .select("*")
      .eq("ops_intake_id", projectId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabaseAdmin
      .from("ops_pie_reports")
      .select("*")
      .eq("ops_intake_id", projectId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);

  if (!intake) return null;

  const status = text(intake.status, "new");
  const urgency = text(intake.urgency, "unknown");
  const callStatus = text(call?.status, call ? "submitted" : "not_requested");

  const riskFlags = normalizeRiskFlags([
    !call ? "No discovery call booked" : null,
    !pie ? "No PIE report generated" : null,
    urgency.toLowerCase() === "high" && status !== "completed" ? "High urgency client still open" : null,
  ]);

  const waitingOn = !call
    ? "Client scheduling confirmation"
    : !pie
    ? "Internal recommendations + scope proposal"
    : status === "completed"
    ? "Closeout confirmation"
    : "Internal rollout plan + next approval step";

  const nextActionTitle = !call
    ? "Confirm discovery call"
    : !pie
    ? "Generate PIE report"
    : "Review PIE and send ops action plan";

  return {
    lane: "ops",
    projectId,
    phase: status,
    status,
    healthState: riskFlags.length > 1 ? "at-risk" : riskFlags.length === 1 ? "watch" : "healthy",
    waitingOn,
    nextActionTitle,
    riskFlags,
    latestActivitySummary: `Intake submitted ${d(intake.created_at)}. Last call request: ${d(
      call?.created_at
    )}. Last PIE: ${d(pie?.created_at)}.`,
    sourceFacts: [
      `ops_intakes.status=${status}`,
      `call_status=${callStatus}`,
      `ops_call_exists=${Boolean(call)}`,
      `ops_pie_exists=${Boolean(pie)}`,
      `urgency=${urgency}`,
      `recommendation_tier=${text(intake.recommendation_tier, "unknown")}`,
      `recommendation_price_range=${text(intake.recommendation_price_range, "unknown")}`,
    ],
  };
}

async function getEcomSnapshot(projectId: string): Promise<GhostProjectSnapshot | null> {
  const [{ data: intake }, { data: call }, { data: quote }] = await Promise.all([
    supabaseAdmin.from("ecom_intakes").select("*").eq("id", projectId).maybeSingle(),
    supabaseAdmin
      .from("ecom_call_requests")
      .select("*")
      .eq("ecom_intake_id", projectId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabaseAdmin
      .from("ecom_quotes")
      .select("*")
      .eq("ecom_intake_id", projectId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);

  if (!intake) return null;

  const status = text(intake.status, "new");
  const callStatus = text(call?.status, call ? "submitted" : "not_requested");
  const quoteStatus = text(quote?.status, quote ? "draft" : "not_started");
  const setupFee = formatCurrency(quote?.estimate_setup_fee);
  const monthlyFee = formatCurrency(quote?.estimate_monthly_fee);
  const timeline = text(intake.timeline, "unknown");
  const budgetRange = text(intake.budget_range, "unknown");

  const riskFlags = normalizeRiskFlags([
    !call ? "No planning call booked" : null,
    !quote ? "No e-commerce quote drafted" : null,
    timeline.toLowerCase().includes("asap") && !call ? "Timeline urgency without planning call" : null,
    quoteStatus === "review" ? "Quote still in internal review" : null,
  ]);

  const waitingOn = !call
    ? "Client planning call scheduling"
    : !quote
    ? "Internal quote + service plan"
    : quoteStatus === "draft" || quoteStatus === "review"
    ? "Internal quote finalization"
    : quoteStatus === "sent"
    ? "Client review on quote"
    : quoteStatus === "accepted"
    ? "Onboarding kickoff"
    : "Next scope confirmation";

  const nextActionTitle = !call
    ? "Confirm planning call window"
    : !quote
    ? "Draft e-commerce quote"
    : quoteStatus === "draft" || quoteStatus === "review"
    ? "Finalize and send quote"
    : quoteStatus === "sent"
    ? "Follow up on quote acceptance"
    : "Confirm onboarding owner + next step";

  const sourceFacts = [
    `ecom_intakes.status=${status}`,
    `call_status=${callStatus}`,
    `ecom_call_exists=${Boolean(call)}`,
    `ecom_quote_exists=${Boolean(quote)}`,
    `ecom_quote_status=${quoteStatus}`,
    `budget_range=${budgetRange}`,
    `timeline=${timeline}`,
    `fulfillment_model=${text(quote?.estimate_fulfillment_model, "unknown")}`,
  ];

  if (setupFee) sourceFacts.push(`setup_fee=${setupFee}`);
  if (monthlyFee) sourceFacts.push(`monthly_fee=${monthlyFee}`);

  return {
    lane: "ecommerce",
    projectId,
    phase: status,
    status,
    healthState: riskFlags.length > 1 ? "at-risk" : riskFlags.length === 1 ? "watch" : "healthy",
    waitingOn,
    nextActionTitle,
    riskFlags,
    latestActivitySummary: `Intake submitted ${d(intake.created_at)}. Last planning call: ${d(
      call?.created_at
    )}. Last quote: ${d(quote?.created_at)}.`,
    sourceFacts,
  };
}

export async function getGhostProjectSnapshot(lane: GhostLane, projectId: string) {
  if (lane === "website") return getWebsiteSnapshot(projectId);
  if (lane === "ops") return getOpsSnapshot(projectId);
  return getEcomSnapshot(projectId);
}
