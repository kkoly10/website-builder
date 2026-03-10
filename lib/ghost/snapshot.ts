import { supabaseAdmin } from "@/lib/supabaseAdmin";
import type { GhostLane, GhostProjectSnapshot } from "@/lib/ghost/types";

function d(value?: string | null) {
  if (!value) return "no date";
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? value : parsed.toLocaleString();
}

function normalizeRiskFlags(flags: string[]) {
  return Array.from(new Set(flags.filter(Boolean)));
}

async function getWebsiteSnapshot(projectId: string): Promise<GhostProjectSnapshot | null> {
  const [{ data: quote }, { data: call }, { data: portal }] = await Promise.all([
    supabaseAdmin.from("quotes").select("*").eq("id", projectId).maybeSingle(),
    supabaseAdmin.from("call_requests").select("*").eq("quote_id", projectId).order("created_at", { ascending: false }).limit(1).maybeSingle(),
    supabaseAdmin.from("quote_portal_state").select("*").eq("quote_id", projectId).maybeSingle(),
  ]);

  if (!quote) return null;

  const status = String(quote.status || "new");
  const depositStatus = String(quote.deposit_status || "unpaid");
  const revisions = Array.isArray(portal?.revision_requests) ? portal.revision_requests : [];
  const milestones = Array.isArray(portal?.milestones) ? portal.milestones : [];
  const assets = Array.isArray(portal?.assets) ? portal.assets : [];
  const doneMilestones = milestones.filter((m: any) => !!m?.done).length;

  const riskFlags: string[] = [];
  if (depositStatus !== "paid" && ["proposal", "deposit", "active"].includes(status)) riskFlags.push("Deposit not marked paid");
  if (revisions.length > 3) riskFlags.push("High revision volume");
  if (assets.length === 0 && status === "active") riskFlags.push("Missing client assets");

  const waitingOn =
    depositStatus !== "paid"
      ? "Client deposit payment"
      : assets.length === 0
      ? "Client asset uploads"
      : call
      ? "Internal follow-up after call"
      : "Discovery call scheduling";

  return {
    lane: "website",
    projectId,
    phase: status,
    status,
    healthState: riskFlags.length > 1 ? "at-risk" : riskFlags.length === 1 ? "watch" : "healthy",
    waitingOn,
    nextActionTitle: depositStatus !== "paid" ? "Send deposit reminder" : "Confirm next milestone + owner",
    riskFlags: normalizeRiskFlags(riskFlags),
    latestActivitySummary: `Quote updated ${d(quote.updated_at || quote.created_at)}. Last call: ${d(call?.created_at)}. Milestones complete: ${doneMilestones}/${milestones.length || 0}.`,
    sourceFacts: [
      `quote.status=${status}`,
      `deposit_status=${depositStatus}`,
      `revision_count=${revisions.length}`,
      `asset_count=${assets.length}`,
    ],
  };
}

async function getOpsSnapshot(projectId: string): Promise<GhostProjectSnapshot | null> {
  const [{ data: intake }, { data: call }, { data: pie }] = await Promise.all([
    supabaseAdmin.from("ops_intakes").select("*").eq("id", projectId).maybeSingle(),
    supabaseAdmin.from("ops_call_requests").select("*").eq("ops_intake_id", projectId).order("created_at", { ascending: false }).limit(1).maybeSingle(),
    supabaseAdmin.from("ops_pie_reports").select("*").eq("ops_intake_id", projectId).order("created_at", { ascending: false }).limit(1).maybeSingle(),
  ]);

  if (!intake) return null;

  const status = String(intake.status || "new");
  const riskFlags: string[] = [];
  if (!call) riskFlags.push("No discovery call booked");
  if (!pie) riskFlags.push("No PIE report generated");
  if ((intake.urgency || "").toLowerCase() === "high" && status !== "completed") riskFlags.push("High urgency client still open");

  return {
    lane: "ops",
    projectId,
    phase: status,
    status,
    healthState: riskFlags.length > 1 ? "at-risk" : riskFlags.length === 1 ? "watch" : "healthy",
    waitingOn: call ? "Internal recommendations + scope proposal" : "Client scheduling confirmation",
    nextActionTitle: pie ? "Review PIE and send ops action plan" : "Generate PIE report",
    riskFlags: normalizeRiskFlags(riskFlags),
    latestActivitySummary: `Intake submitted ${d(intake.created_at)}. Last call request: ${d(call?.created_at)}. Last PIE: ${d(pie?.created_at)}.`,
    sourceFacts: [
      `ops_intakes.status=${status}`,
      `ops_call_exists=${Boolean(call)}`,
      `ops_pie_exists=${Boolean(pie)}`,
      `urgency=${intake.urgency || "unknown"}`,
    ],
  };
}

async function getEcomSnapshot(projectId: string): Promise<GhostProjectSnapshot | null> {
  const [{ data: intake }, { data: call }, { data: quote }] = await Promise.all([
    supabaseAdmin.from("ecom_intakes").select("*").eq("id", projectId).maybeSingle(),
    supabaseAdmin.from("ecom_call_requests").select("*").eq("ecom_intake_id", projectId).order("created_at", { ascending: false }).limit(1).maybeSingle(),
    supabaseAdmin.from("ecom_quotes").select("*").eq("ecom_intake_id", projectId).order("created_at", { ascending: false }).limit(1).maybeSingle(),
  ]);

  if (!intake) return null;

  const status = String(intake.status || "new");
  const riskFlags: string[] = [];
  if (!call) riskFlags.push("No e-commerce call request yet");
  if (!quote) riskFlags.push("No e-commerce quote drafted");

  return {
    lane: "ecommerce",
    projectId,
    phase: status,
    status,
    healthState: riskFlags.length > 1 ? "at-risk" : riskFlags.length === 1 ? "watch" : "healthy",
    waitingOn: !call ? "Client to request/confirm planning call" : !quote ? "Internal quote draft" : "Client review on quote",
    nextActionTitle: !quote ? "Draft or update quote in admin" : "Follow up on quote acceptance",
    riskFlags: normalizeRiskFlags(riskFlags),
    latestActivitySummary: `Intake submitted ${d(intake.created_at)}. Last call: ${d(call?.created_at)}. Last quote: ${d(quote?.created_at)}.`,
    sourceFacts: [
      `ecom_intakes.status=${status}`,
      `ecom_call_exists=${Boolean(call)}`,
      `ecom_quote_exists=${Boolean(quote)}`,
    ],
  };
}

export async function getGhostProjectSnapshot(lane: GhostLane, projectId: string) {
  if (lane === "website") return getWebsiteSnapshot(projectId);
  if (lane === "ops") return getOpsSnapshot(projectId);
  return getEcomSnapshot(projectId);
}
