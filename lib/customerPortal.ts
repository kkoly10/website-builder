import { randomBytes } from "crypto";
import { logProjectActivityByPortalId, logProjectActivityByQuoteId } from "@/lib/projectActivity";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import {
  type WebsiteDesignDirection,
  type WebsiteDesignDirectionInput,
  type WebsiteDesignDirectionStatus,
  DEFAULT_WEBSITE_DESIGN_DIRECTION,
  hasDesignDirection,
  mergeDesignDirection,
  readDesignDirection,
} from "@/lib/designDirection";
import { isProjectType, type ProjectType } from "@/lib/workflows/types";
import {
  getWorkflowTemplate,
  getDirectionApprovedMilestoneTitle,
} from "@/lib/workflows/templates";
import {
  buildDefaultDirection,
  hasDirection,
  readDirection,
} from "@/lib/directions/state";
import type { GenericDirection } from "@/lib/directions/types";
import {
  listRequiredActionsForPortal,
  seedRequiredActionsForPortal,
  updateRequiredActionStatusByPortalId,
  type RequiredAction,
} from "@/lib/requiredActions";

type AnyObj = Record<string, any>;
type CustomerPortalMilestoneInput = {
  key?: string;
  id?: string;
  label?: string;
  title?: string;
  done?: boolean;
  status?: string;
  notes?: string;
  due_date?: string | null;
  sort_order?: number;
};

type CustomerPortalAssetInput = {
  id?: string;
  category?: string;
  assetType?: string;
  label: string;
  url?: string;
  assetUrl?: string;
  notes?: string;
  status?: string;
  source?: string;
  storageBucket?: string | null;
  storagePath?: string | null;
  fileName?: string | null;
  mimeType?: string | null;
  fileSize?: number | null;
  createdAt?: string | null;
};

type CustomerPortalRevisionInput = {
  id?: string;
  message?: string;
  requestText?: string;
  priority?: string;
  status?: string;
  createdAt?: string | null;
};

type CustomerPortalMessageInput = {
  id?: string;
  senderRole?: string;
  senderName?: string;
  body?: string;
  attachmentUrl?: string | null;
  attachmentName?: string | null;
  attachmentType?: string | null;
  attachmentSize?: number | null;
  attachmentStorageBucket?: string | null;
  attachmentStoragePath?: string | null;
  readAt?: string | null;
  createdAt?: string | null;
};

// Phase 3.2: milestones for new portals come from the workflow template
// matching the project type. The website template intentionally mirrors
// the 8-step structure shipped in Phase 2A so existing portals — and
// regression tests — see the same titles in the same order.
function buildSeedMilestonesForProjectType(projectType: string | null | undefined) {
  const resolved = isProjectType(projectType) ? projectType : "website";
  const template = getWorkflowTemplate(resolved);
  return template.milestones.map((m) => ({
    title: m.title,
    status: "todo" as const,
    sort_order: m.sortOrder,
    notes: `Owner: ${m.owner}`,
  }));
}

function makeToken() {
  return randomBytes(24).toString("hex");
}

function safeObj(value: unknown): AnyObj {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as AnyObj)
    : {};
}

function safeArray<T = AnyObj>(value: unknown): T[] {
  return Array.isArray(value) ? (value as T[]) : [];
}

function toTitle(input: string) {
  return input
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (m) => m.toUpperCase());
}

function buildScopeSnapshotFromQuote(quote: AnyObj) {
  const quoteJson = safeObj(quote.quote_json);
  const pricingTruth = safeObj(quoteJson.pricingTruth);
  const answers = {
    ...safeObj(quote.answers),
    ...safeObj(quote.intake_raw),
    ...safeObj(quote.intake_normalized),
    ...safeObj(quoteJson.intakeRaw),
    ...safeObj(quoteJson.intakeNormalized),
  };
  const breakdown = Array.isArray(quote.breakdown) ? quote.breakdown : [];

  const enabledBooleans = Object.entries(answers)
    .filter(([, v]) => v === true || String(v).trim().toLowerCase() === "yes")
    .map(([k]) => toTitle(k))
    .slice(0, 20);

  const integrations = cleanTextList(answers.integrations);
  const automationTypes = cleanTextList(answers.automationTypes);
  const requestedFeatures = [
    ...enabledBooleans,
    ...integrations.map((item) => toTitle(item)),
    ...automationTypes.map((item) => toTitle(item)),
    typeof answers.integrationOther === "string" ? toTitle(answers.integrationOther) : "",
  ].filter(Boolean);

  const stringFields = Object.entries(answers)
    .filter(([, v]) => typeof v === "string" && String(v).trim().length > 0)
    .slice(0, 20)
    .map(([k, v]) => ({ label: toTitle(k), value: String(v) }));

  const arrayFields = Object.entries(answers)
    .filter(([, v]) => Array.isArray(v) && (v as unknown[]).length > 0)
    .slice(0, 20)
    .map(([k, v]) => ({
      label: toTitle(k),
      values: (v as unknown[]).map((x) => String(x)),
    }));

  const pagesIncluded = parsePages(answers.pagesWanted ?? answers.pages);
  const featuresIncluded = requestedFeatures.slice(0, 12);

  return {
    quoteId: quote.id,
    tier: quote.tier ?? quote.tier_recommended ?? pricingTruth.tierLabel ?? null,
    estimateCents:
      quote.estimate_cents ??
      (Number(quote.estimate_total ?? 0) ? Math.round(Number(quote.estimate_total) * 100) : null),
    estimateLowCents:
      quote.estimate_low_cents ??
      (Number(quote.estimate_low ?? 0) ? Math.round(Number(quote.estimate_low) * 100) : null),
    estimateHighCents:
      quote.estimate_high_cents ??
      (Number(quote.estimate_high ?? 0) ? Math.round(Number(quote.estimate_high) * 100) : null),
    status: quote.status ?? null,
    createdAt: quote.created_at ?? null,
    breakdown,
    requestedFeatures,
    formSelections: stringFields,
    listSelections: arrayFields,
    tierLabel: pricingTruth.tierLabel ?? quote.tier_recommended ?? "Website Scope",
    pagesIncluded,
    featuresIncluded,
    platform:
      cleanString(answers.platform || answers.stack) ||
      "Next.js custom build, fully owned by you",
    timeline: cleanString(answers.timeline) || "Aligned during scope approval",
    revisionPolicy:
      cleanString(answers.revisionPolicy || answers.revisions) ||
      "Revision structure aligned during scope approval",
    exclusions: ["Third-party fees", "Out-of-scope change orders"],
    notes:
      typeof answers.notes === "string"
        ? answers.notes
        : typeof answers.project_notes === "string"
        ? answers.project_notes
        : null,
  };
}

function cleanString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function cleanTextList(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.map((item) => cleanString(item)).filter(Boolean);
  }

  if (typeof value === "string" && value.trim()) {
    return value
      .split(/[,|\n]/)
      .map((item) => item.trim())
      .filter(Boolean);
  }

  return [];
}

function parsePages(value: unknown): string[] {
  const raw = cleanString(value);
  if (!raw) return [];
  if (raw.toLowerCase().includes("one pager")) {
    return ["Homepage / One-page flow"];
  }

  const match = raw.match(/\d+/);
  if (match) {
    const count = Number(match[0]);
    if (Number.isFinite(count) && count > 0) {
      return Array.from({ length: count }, (_, index) => `Page ${index + 1}`);
    }
  }

  return [raw];
}

function centsToDollars(value: unknown) {
  const amount = Number(value);
  if (!Number.isFinite(amount)) return null;
  return Math.round(amount) / 100;
}

function dollarsToCents(value: unknown) {
  const amount = Number(value);
  if (!Number.isFinite(amount)) return null;
  return Math.round(amount * 100);
}

function normalizeMilestoneStatus(value: unknown) {
  const normalized = cleanString(value).toLowerCase();
  if (normalized === "done") return "done";
  if (normalized === "in_progress" || normalized === "in progress") return "in_progress";
  return "todo";
}

function normalizeAssetStatus(value: unknown): "submitted" | "received" | "approved" {
  const normalized = cleanString(value).toLowerCase();
  if (normalized === "approved") return "approved";
  if (normalized === "received") return "received";
  return "submitted";
}

function normalizeRevisionStatus(value: unknown): "new" | "reviewed" | "scheduled" | "done" {
  const normalized = cleanString(value).toLowerCase();
  if (normalized === "done") return "done";
  if (normalized === "reviewed") return "reviewed";
  if (normalized === "scheduled") return "scheduled";
  return "new";
}

function normalizePriority(value: unknown): "low" | "normal" | "high" {
  const normalized = cleanString(value).toLowerCase();
  if (normalized === "low" || normalized === "high") return normalized;
  return "normal";
}

function normalizeSenderRole(value: unknown): "client" | "studio" | "internal" {
  const normalized = cleanString(value).toLowerCase();
  if (normalized === "studio" || normalized === "internal") return normalized;
  return "client";
}

function safeDate(value: unknown) {
  const raw = cleanString(value);
  if (!raw) return null;
  const parsed = new Date(raw);
  return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString();
}

function buildHistoryFromDebug(debug: AnyObj) {
  const workspaceHistory = safeObj(debug.workspaceHistory);

  const scopeVersions = safeArray(workspaceHistory.scopeVersions).map((item: AnyObj, index) => ({
    id: cleanString(item.id) || `scope-${index + 1}`,
    createdAt: cleanString(item.createdAt) || "",
    label: cleanString(item.label) || `Scope Version ${index + 1}`,
    summary: cleanString(item.summary),
    tierLabel: cleanString(item.tierLabel),
    platform: cleanString(item.platform),
    timeline: cleanString(item.timeline),
    revisionPolicy: cleanString(item.revisionPolicy),
    pagesIncluded: cleanTextList(item.pagesIncluded),
    featuresIncluded: cleanTextList(item.featuresIncluded),
    exclusions: cleanTextList(item.exclusions),
  }));

  const changeOrders = safeArray(workspaceHistory.changeOrders).map((item: AnyObj, index) => ({
    id: cleanString(item.id) || `change-${index + 1}`,
    createdAt: cleanString(item.createdAt) || "",
    title: cleanString(item.title) || `Change Order ${index + 1}`,
    summary: cleanString(item.summary),
    priceImpact: cleanString(item.priceImpact),
    timelineImpact: cleanString(item.timelineImpact),
    scopeImpact: cleanString(item.scopeImpact),
    status: cleanString(item.status) || "draft",
  }));

  return { scopeVersions, changeOrders };
}

async function signAssetUrl(asset: AnyObj) {
  const direct = cleanString(asset.asset_url);
  if (direct) return direct;

  const bucket = cleanString(asset.storage_bucket);
  const path = cleanString(asset.storage_path);
  if (!bucket || !path) return null;

  const signed = await supabaseAdmin.storage.from(bucket).createSignedUrl(path, 60 * 60);
  if (signed.error) return null;
  return signed.data?.signedUrl || null;
}

async function signMessageAttachment(message: AnyObj) {
  const direct = cleanString(message.attachment_url);
  if (direct) return direct;

  const bucket = cleanString(message.attachment_storage_bucket);
  const path = cleanString(message.attachment_storage_path);
  if (!bucket || !path) return null;

  const signed = await supabaseAdmin.storage.from(bucket).createSignedUrl(path, 60 * 60);
  if (signed.error) return null;
  return signed.data?.signedUrl || null;
}

// Exported for routes that need to know the project context before
// dispatching (e.g. direction_submit needs the lane's directionType to
// pick the validation schema).
export async function getPortalProjectByToken(token: string) {
  if (!token) return null;

  // Primary: look up by access_token (the canonical portal token)
  const { data, error } = await supabaseAdmin
    .from("customer_portal_projects")
    .select("*")
    .eq("access_token", token)
    .maybeSingle();

  if (error) throw error;
  if (data) return data;

  // Fallback: token may be quotes.public_token — find the portal project via the quote
  const { data: quote } = await supabaseAdmin
    .from("quotes")
    .select("id")
    .eq("public_token", token)
    .maybeSingle();

  if (!quote) return null;
  return getPortalProjectByQuoteId(quote.id);
}

async function getPortalProjectByQuoteId(quoteId: string) {
  if (!quoteId) return null;

  const { data, error } = await supabaseAdmin
    .from("customer_portal_projects")
    .select("*")
    .eq("quote_id", quoteId)
    .maybeSingle();

  if (error) throw error;
  return data ?? null;
}

async function loadPortalBundle(portal: AnyObj | null) {
  if (!portal) return null;

  const quoteId = cleanString(portal.quote_id);
  if (!quoteId) return null;

  const [quoteRes, milestonesRes, assetsRes, revisionsRes, messagesRes] = await Promise.all([
    supabaseAdmin.from("quotes").select("*").eq("id", quoteId).maybeSingle(),
    supabaseAdmin
      .from("customer_portal_milestones")
      .select("*")
      .eq("portal_project_id", portal.id)
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: true }),
    supabaseAdmin
      .from("customer_portal_assets")
      .select("*")
      .eq("portal_project_id", portal.id)
      .order("created_at", { ascending: false }),
    supabaseAdmin
      .from("customer_portal_revisions")
      .select("*")
      .eq("portal_project_id", portal.id)
      .order("created_at", { ascending: false }),
    supabaseAdmin
      .from("customer_portal_messages")
      .select("*")
      .eq("portal_project_id", portal.id)
      .order("created_at", { ascending: true }),
  ]);

  if (quoteRes.error) throw quoteRes.error;
  if (milestonesRes.error) throw milestonesRes.error;
  if (assetsRes.error) throw assetsRes.error;
  if (revisionsRes.error) throw revisionsRes.error;
  // PGRST205 = table not in schema cache (migration pending); treat as empty
  if (messagesRes.error && (messagesRes.error as any)?.code !== "PGRST205") throw messagesRes.error;

  const quote = quoteRes.data ?? null;

  const [leadRes, callRes, pieRes] = await Promise.all([
    quote?.lead_id
      ? supabaseAdmin.from("leads").select("*").eq("id", quote.lead_id).maybeSingle()
      : Promise.resolve({ data: null, error: null } as const),
    supabaseAdmin
      .from("call_requests")
      .select("*")
      .eq("quote_id", quoteId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabaseAdmin
      .from("pie_reports")
      .select("*")
      .eq("quote_id", quoteId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);

  if (leadRes.error) throw leadRes.error;
  if (callRes.error) throw callRes.error;
  if (pieRes.error) throw pieRes.error;

  const assets = await Promise.all(
    (assetsRes.data ?? []).map(async (asset) => ({
      ...asset,
      resolved_url: await signAssetUrl(asset),
    }))
  );

  const messages = await Promise.all(
    (messagesRes.data ?? []).map(async (message) => ({
      ...message,
      resolved_attachment_url: await signMessageAttachment(message),
    }))
  );

  // Phase 3.10: required actions are stored in their own table now.
  // Fetched in parallel with the rest. Helper logs and returns []
  // on failure so missing-table or RLS issues don't break the bundle.
  const requiredActions = await listRequiredActionsForPortal(portal.id);

  return {
    portal,
    quote,
    lead: leadRes.data ?? null,
    callRequest: callRes.data ?? null,
    pieReport: pieRes.data ?? null,
    milestones: milestonesRes.data ?? [],
    assets,
    revisions: revisionsRes.data ?? [],
    messages,
    requiredActions,
  };
}

function parsePieReport(rawPie: AnyObj | null) {
  const payload = safeObj(rawPie?.payload);
  const report = safeObj(rawPie?.report);

  if (cleanString(payload.version) === "3.0") {
    const complexity = safeObj(payload.complexity);
    const tier = safeObj(payload.tier);
    const capacity = safeObj(payload.capacity);
    const estimatedHours = safeObj(capacity.estimatedHours);
    const routing = safeObj(payload.routing);
    const negotiation = safeObj(payload.negotiation);

    return {
      exists: true,
      id: rawPie?.id ?? null,
      score: Number(complexity.score ?? rawPie?.score ?? 0) || null,
      tier: cleanString(tier.recommended) || cleanString(rawPie?.tier) || null,
      confidence: cleanString(complexity.confidence) || cleanString(rawPie?.confidence) || null,
      summary:
        cleanString(tier.rationale) ||
        cleanString(payload.summary) ||
        cleanString(rawPie?.summary) ||
        "No PIE summary yet.",
      risks: safeArray(payload.risks).map((risk: AnyObj) => cleanString(risk.flag || risk)).filter(Boolean),
      pitch: {
        emphasize: safeArray(negotiation.priceDefense).map((item) => cleanString(item)).filter(Boolean).slice(0, 3),
        recommend: cleanString(tier.rationale) || cleanString(payload.summary) || null,
        objections: safeArray(negotiation.lowerCostOptions).map((item) => cleanString(item)).filter(Boolean).slice(0, 3),
      },
      pricing: {
        target: Number(tier.targetPrice ?? 0) || null,
        minimum: Number(safeObj(tier.priceBand).min ?? 0) || null,
        maximum: Number(safeObj(tier.priceBand).max ?? 0) || null,
      },
      hours: {
        min: Number(estimatedHours.min ?? 0) || null,
        max: Number(estimatedHours.max ?? 0) || null,
      },
      timelineText:
        capacity.estimatedWeeks && safeObj(capacity.estimatedWeeks).target
          ? `About ${safeObj(capacity.estimatedWeeks).target} week(s)`
          : null,
      discoveryQuestions: safeArray(payload.discoveryQuestions).map((question) => cleanString(question)).filter(Boolean),
      routing: {
        path: cleanString(routing.finalPath || routing.path) || null,
        reason: cleanString(routing.reason) || null,
        triggers: safeArray(routing.triggers).map((trigger) => cleanString(trigger)).filter(Boolean),
      },
      payload,
    };
  }

  const legacy = Object.keys(payload).length > 0 ? payload : report;
  const pricing = safeObj(legacy.pricing);
  const quote = safeObj(pricing.quote);
  const hours = safeObj(legacy.hours);

  return {
    exists: !!rawPie,
    id: rawPie?.id ?? null,
    score: Number(legacy.score ?? rawPie?.score ?? 0) || null,
    tier: cleanString(legacy.tier || rawPie?.tier) || null,
    confidence: cleanString(legacy.confidence || rawPie?.confidence) || null,
    summary: cleanString(legacy.summary || rawPie?.summary) || "No PIE summary yet.",
    risks: safeArray(legacy.risks).map((risk) => cleanString(risk)).filter(Boolean),
    pitch: {
      emphasize: safeArray(safeObj(legacy.pitch).emphasize).map((item) => cleanString(item)).filter(Boolean),
      recommend: cleanString(safeObj(legacy.pitch).recommend) || null,
      objections: safeArray(safeObj(legacy.pitch).objections).map((item) => cleanString(item)).filter(Boolean),
    },
    pricing: {
      target: Number(quote.target ?? pricing.target ?? 0) || null,
      minimum: Number(quote.minimum ?? pricing.minimum ?? 0) || null,
      maximum: Number(quote.upper ?? pricing.maximum ?? 0) || null,
    },
    hours: {
      min: Number(hours.min ?? 0) || null,
      max: Number(hours.max ?? 0) || null,
    },
    timelineText: cleanString(safeObj(legacy.timeline).text || legacy.timelineText) || null,
    discoveryQuestions: safeArray(legacy.discovery_questions || legacy.discoveryQuestions)
      .map((question) => cleanString(question))
      .filter(Boolean),
    routing: null,
    payload: legacy,
  };
}

function buildWorkspaceMilestones(milestones: AnyObj[]) {
  return milestones.map((milestone) => ({
    key: cleanString(milestone.id) || cleanString(milestone.title),
    label: cleanString(milestone.title) || "Milestone",
    done: cleanString(milestone.status) === "done",
    updatedAt: cleanString(milestone.updated_at) || cleanString(milestone.completed_at) || null,
  }));
}

// Lane-aware label for "client design direction"-style waiting state.
// Mirrors the title shown in the direction card for the lane.
function clientDirectionLabel(projectType: string | null | undefined): string {
  switch (projectType) {
    case "web_app": return "Client product direction";
    case "automation": return "Client workflow direction";
    case "ecommerce": return "Client store direction";
    case "rescue": return "Client rescue diagnosis";
    case "website":
    default: return "Client design direction";
  }
}

function studioDirectionReviewLabel(projectType: string | null | undefined): string {
  switch (projectType) {
    case "web_app": return "CrecyStudio product direction review";
    case "automation": return "CrecyStudio workflow direction review";
    case "ecommerce": return "CrecyStudio store direction review";
    case "rescue": return "CrecyStudio rescue diagnosis review";
    case "website":
    default: return "CrecyStudio design direction review";
  }
}

function deriveWaitingOn(input: {
  depositStatus: string;
  assetsCount: number;
  previewUrl?: string | null;
  clientReviewStatus?: string | null;
  clientStatus?: string | null;
  // Either-or depending on lane. designDirectionStatus comes from Phase 2A's
  // record (website only). directionStatus comes from Phase 3.3's generic
  // record (other lanes). At most one is non-null.
  designDirectionStatus?: WebsiteDesignDirectionStatus | null;
  directionStatus?: string | null;
  projectType?: string | null;
}) {
  if (input.depositStatus !== "paid") {
    if (input.clientStatus === "deposit_sent") return "Studio payment verification";
    return "Client deposit step";
  }

  // Direction gates the build for every lane. Use the lane's record:
  //   website → designDirectionStatus (Phase 2A)
  //   other lanes → directionStatus (Phase 3.3)
  // Legacy portals (no record on either path) skip this gate entirely
  // — their pre-Phase-2 workspace flow continues unchanged. Clients
  // see normal asset/preview/revision waiting-on labels rather than
  // a confusing "Direction not enabled" message.
  const isWebsite = input.projectType === "website" || !input.projectType;
  const status = isWebsite ? input.designDirectionStatus : input.directionStatus;
  const hasDirectionRecord = status !== null && status !== undefined;

  if (hasDirectionRecord) {
    if (status === "waiting_on_client" || status === "not_started") {
      return clientDirectionLabel(input.projectType);
    }
    if (status === "submitted" || status === "under_review") {
      return studioDirectionReviewLabel(input.projectType);
    }
    if (status === "changes_requested") {
      return clientDirectionLabel(input.projectType) + " (clarification)";
    }
    // status is approved or locked — fall through to asset/preview gating.
    // Approved means client did their part; locked means build is in
    // progress. Either way, proceed to the next non-direction signal.
  }
  // No direction record: legacy portal. Skip direction gating entirely.

  if (input.assetsCount === 0) return "Client assets / content";
  if (input.previewUrl && input.clientReviewStatus === "Pending review") {
    return "Client preview review";
  }
  if (input.clientReviewStatus === "Changes requested") {
    return "CrecyStudio revisions";
  }
  return "CrecyStudio next build step";
}

function buildWorkspaceView(
  bundle: AnyObj,
  options?: { includeInternal?: boolean }
) {
  const portal = safeObj(bundle.portal);
  const quote = safeObj(bundle.quote);
  const lead = safeObj(bundle.lead);
  const intake = safeObj(quote.intake_normalized);
  const scopeSnapshot = safeObj(portal.scope_snapshot);
  const debug = safeObj(quote.debug);
  const pie = parsePieReport(bundle.pieReport);
  const milestones = buildWorkspaceMilestones(safeArray(bundle.milestones));
  const assets = safeArray(bundle.assets).map((asset: AnyObj) => ({
    id: cleanString(asset.id),
    category: cleanString(asset.asset_type) || "General",
    label: cleanString(asset.label) || "Client file",
    url: cleanString(asset.resolved_url) || cleanString(asset.asset_url),
    notes: cleanString(asset.notes) || "",
    status: normalizeAssetStatus(asset.status),
    createdAt: cleanString(asset.created_at) || "",
  }));
  const revisions = safeArray(bundle.revisions).map((revision: AnyObj) => ({
    id: cleanString(revision.id),
    message: cleanString(revision.request_text),
    priority: normalizePriority(revision.priority),
    status: normalizeRevisionStatus(revision.status),
    createdAt: cleanString(revision.created_at) || "",
  }));
  const messages = safeArray(bundle.messages)
    .filter((message: AnyObj) => {
      if (options?.includeInternal) return true;
      return cleanString(message.sender_role) !== "internal";
    })
    .map((message: AnyObj) => {
      const attachmentUrl =
        cleanString(message.resolved_attachment_url) || cleanString(message.attachment_url) || null;
      const attachmentName = cleanString(message.attachment_name) || null;
      const attachmentType = cleanString(message.attachment_type) || null;
      const attachmentSize = Number(message.attachment_size ?? 0) || null;

      return {
        id: cleanString(message.id),
        senderRole: normalizeSenderRole(message.sender_role),
        senderName: cleanString(message.sender_name) || "Studio",
        body: cleanString(message.body),
        readAt: safeDate(message.read_at),
        createdAt: cleanString(message.created_at) || "",
        attachment:
          attachmentUrl || attachmentName || attachmentType || attachmentSize
            ? {
                url: attachmentUrl,
                name: attachmentName,
                type: attachmentType,
                size: attachmentSize,
              }
            : null,
      };
    });

  const pagesIncluded =
    cleanTextList(scopeSnapshot.pagesIncluded).length > 0
      ? cleanTextList(scopeSnapshot.pagesIncluded)
      : parsePages(intake.pages);
  const featuresIncluded =
    cleanTextList(scopeSnapshot.featuresIncluded).length > 0
      ? cleanTextList(scopeSnapshot.featuresIncluded)
      : cleanTextList(intake.integrations);
  const exclusions =
    cleanTextList(scopeSnapshot.exclusions).length > 0
      ? cleanTextList(scopeSnapshot.exclusions)
      : ["Third-party fees", "Custom post-launch growth work"];

  const previewStatus = cleanString(portal.preview_status) || "Awaiting published preview";
  const agreementStatus = cleanString(portal.agreement_status) || "Not published yet";
  const launchStatus = cleanString(portal.launch_status) || "Not ready";
  const clientReviewStatus = cleanString(portal.client_review_status) || "Preview pending";
  const depositStatus =
    cleanString(portal.deposit_status || quote.deposit_status).toLowerCase() || "pending";

  return {
    quote: {
      id: cleanString(quote.id),
      publicToken: cleanString(portal.access_token),
      createdAt: cleanString(quote.created_at),
      status: cleanString(quote.status) || "new",
      tier: cleanString(quote.tier_recommended) || "growth",
      estimate: {
        target: Number(quote.estimate_total ?? 0) || null,
        min: Number(quote.estimate_low ?? 0) || null,
        max: Number(quote.estimate_high ?? 0) || null,
      },
      deposit: {
        status: depositStatus,
        paidAt: cleanString(portal.deposit_paid_at || quote.deposit_paid_at) || null,
        link: cleanString(portal.deposit_checkout_url || quote.deposit_link) || null,
        amount:
          centsToDollars(portal.deposit_amount_cents) ??
          (Number(quote.estimate_total ?? 0) ? Math.round(Number(quote.estimate_total) * 0.5) : null),
        notes: cleanString(portal.deposit_notes) || null,
      },
    },
    lead: {
      email: cleanString(lead.email) || null,
      phone: cleanString(lead.phone) || null,
      name: cleanString(lead.name) || null,
    },
    scope: {
      websiteType: cleanString(intake.websiteType) || null,
      pages: cleanString(intake.pages) || null,
      intent: cleanString(intake.intent) || null,
      timeline: cleanString(intake.timeline) || null,
      contentReady: cleanString(intake.contentReady || intake.contentReadiness) || null,
      domainHosting: cleanString(intake.domainHosting) || null,
      integrations: cleanTextList(intake.integrations),
      notes: cleanString(intake.notes) || null,
    },
    scopeSnapshot: {
      tierLabel: cleanString(scopeSnapshot.tierLabel || scopeSnapshot.packageName) || cleanString(quote.tier_recommended) || "Website Scope",
      platform: cleanString(scopeSnapshot.platform || scopeSnapshot.stack || intake.domainHosting) || "To be finalized",
      pagesIncluded,
      featuresIncluded,
      timeline: cleanString(scopeSnapshot.timeline || scopeSnapshot.timelineText || intake.timeline) || "Aligned during scoping",
      revisionPolicy: cleanString(scopeSnapshot.revisionPolicy || scopeSnapshot.revisions) || "Revision structure aligned during scope approval",
      exclusions,
    },
    history: buildHistoryFromDebug(debug),
    callRequest: bundle.callRequest
      ? {
          status: cleanString(bundle.callRequest.status) || null,
          bestTime: cleanString(bundle.callRequest.best_time_to_call || bundle.callRequest.preferred_times) || null,
          timezone: cleanString(bundle.callRequest.timezone) || null,
          notes: cleanString(bundle.callRequest.notes) || null,
        }
      : null,
    pie,
    preview: {
      url: cleanString(portal.preview_url) || null,
      productionUrl: cleanString(portal.production_url) || null,
      status: previewStatus,
      updatedAt: cleanString(portal.preview_updated_at) || null,
      notes: cleanString(portal.preview_notes) || null,
      clientReviewStatus,
    },
    agreement: {
      status: agreementStatus,
      model: cleanString(portal.agreement_model) || "Managed build agreement",
      ownershipModel: cleanString(portal.ownership_model) || "Managed with project handoff options",
      publishedAt: cleanString(portal.agreement_published_at) || null,
      publishedText: cleanString(portal.agreement_text || debug.publishedAgreementText) || "",
    },
    launch: {
      status: launchStatus,
      productionUrl: cleanString(portal.production_url) || null,
      domainStatus: cleanString(portal.domain_status) || "Pending",
      analyticsStatus: cleanString(portal.analytics_status) || "Pending",
      formsStatus: cleanString(portal.forms_status) || "Pending",
      seoStatus: cleanString(portal.seo_status) || "Pending",
      handoffStatus: cleanString(portal.handoff_status) || "Pending",
      notes: cleanString(portal.launch_notes) || null,
    },
    portalState: {
      clientStatus: cleanString(portal.client_status) || "new",
      clientUpdatedAt: cleanString(portal.client_updated_at) || null,
      clientNotes: cleanString(portal.client_notes) || "",
      adminPublicNote: cleanString(portal.admin_public_note) || null,
      milestones,
      assets,
      revisions,
      waitingOn: deriveWaitingOn({
        depositStatus,
        assetsCount: assets.length,
        previewUrl: cleanString(portal.preview_url) || null,
        clientReviewStatus,
        clientStatus: cleanString(portal.client_status).toLowerCase() || null,
        // Lane-aware: website uses designDirection, others use direction.
        // Legacy portals with no record on either path skip direction
        // gating entirely (null status falls through).
        designDirectionStatus: readDesignDirection(scopeSnapshot)?.status ?? null,
        directionStatus: readDirection(scopeSnapshot)?.status ?? null,
        projectType: cleanString(portal.project_type) || cleanString(quote.project_type) || "website",
      }),
    },
    projectType:
      cleanString(portal.project_type) || cleanString(quote.project_type) || "website",
    designDirection: readDesignDirection(scopeSnapshot),
    direction: readDirection(scopeSnapshot),
    requiredActions: safeArray<RequiredAction>(bundle.requiredActions),
    messages,
  };
}

export async function ensureCustomerPortalForQuoteId(quoteId: string) {
  if (!quoteId) throw new Error("quoteId is required");

  const { data: existing, error: existingErr } = await supabaseAdmin
    .from("customer_portal_projects")
    .select("*")
    .eq("quote_id", quoteId)
    .maybeSingle();

  if (existingErr) throw existingErr;

  if (existing) {
    return existing;
  }

  const { data: quote, error: quoteErr } = await supabaseAdmin
    .from("quotes")
    .select("*")
    .eq("id", quoteId)
    .single();

  if (quoteErr) throw quoteErr;
  if (!quote) throw new Error("Quote not found");

  // Single canonical resolution for project_type. All three downstream
  // usages — the column insert, the design-direction seed gate, and the
  // milestone template seed — must agree on the same answer. isProjectType
  // returns false for anything not in the enum, so unexpected values fall
  // back to "website" rather than producing a portal with mismatched
  // project_type / milestones / direction record.
  const projectType: ProjectType = isProjectType(quote.project_type)
    ? quote.project_type
    : "website";
  const scopeSnapshot = {
    ...buildScopeSnapshotFromQuote(quote),
    // Website lane: Phase 2A's rich design direction record at
    // scope_snapshot.designDirection (form renders on first visit).
    // Non-website lanes: Phase 3.3 generic direction record at
    // scope_snapshot.direction, seeded from the workflow template's
    // default payload. The two records are mutually exclusive — the
    // resolver picks the one that exists.
    ...(projectType === "website"
      ? { designDirection: { ...DEFAULT_WEBSITE_DESIGN_DIRECTION } }
      : { direction: buildDefaultDirection(projectType) }),
  };

  const { data: created, error: createErr } = await supabaseAdmin
    .from("customer_portal_projects")
    .insert({
      quote_id: quoteId,
      access_token: makeToken(),
      // Persist project_type explicitly so downstream gates (e.g. design
      // direction) don't rely on the column default of 'website' for
      // non-website quotes. The DB default is a safety net, not the
      // source of truth.
      project_type: projectType,
      project_status: "new",
      client_status: "new",
      deposit_status: "pending",
      deposit_amount_cents:
        Math.round(
          Number(
            quote.estimate_cents ??
              (Number(quote.estimate_total ?? 0) ? Number(quote.estimate_total) * 100 : 0)
          ) * 0.5
        ) || null,
      deposit_checkout_url: quote.deposit_link ?? null,
      scope_snapshot: scopeSnapshot,
    })
    .select("*")
    .single();

  if (createErr) throw createErr;

  const seedMilestones = buildSeedMilestonesForProjectType(projectType);
  const { error: milestoneErr } = await supabaseAdmin
    .from("customer_portal_milestones")
    .insert(
      seedMilestones.map((m) => ({
        portal_project_id: created.id,
        ...m,
      }))
    );

  if (milestoneErr) {
    console.error("Milestone seed error:", milestoneErr);
  }

  // Phase 3.10: seed required actions from the workflow template. The
  // helper handles missing-table fallback (logs and continues) so this
  // doesn't block portal creation if the migration hasn't run yet.
  await seedRequiredActionsForPortal({
    portalProjectId: created.id,
    projectType,
  });

  return created;
}

export async function getCustomerPortalBundleByToken(token: string) {
  const portal = await getPortalProjectByToken(token);
  return loadPortalBundle(portal);
}

export async function getCustomerPortalBundleByQuoteId(quoteId: string) {
  const existing = await getPortalProjectByQuoteId(quoteId);
  const portal = existing ?? (await ensureCustomerPortalForQuoteId(quoteId));
  return loadPortalBundle(portal);
}

async function markPortalMessagesRead(
  portalProjectId: string,
  viewerRole: "client" | "studio"
) {
  const senderRole = viewerRole === "client" ? "studio" : "client";
  const readAt = new Date().toISOString();

  const { error } = await supabaseAdmin
    .from("customer_portal_messages")
    .update({ read_at: readAt })
    .eq("portal_project_id", portalProjectId)
    .eq("sender_role", senderRole)
    .is("read_at", null);

  if (error) throw error;

  return readAt;
}

function applyReadReceiptToBundle(
  bundle: AnyObj | null,
  senderRole: "client" | "studio",
  readAt: string
) {
  if (!bundle) return bundle;
  return {
    ...bundle,
    messages: safeArray(bundle.messages).map((message: AnyObj) =>
      normalizeSenderRole(message.sender_role) === senderRole && !safeDate(message.read_at)
        ? { ...message, read_at: readAt }
        : message
    ),
  };
}

export async function getCustomerPortalViewByToken(
  token: string,
  options?: { includeInternal?: boolean; markReadAs?: "client" | "studio" }
) {
  const bundle = await getCustomerPortalBundleByToken(token);
  if (!bundle) return { ok: false as const, error: "Portal link not found." };

  let nextBundle: AnyObj = bundle;
  if (options?.markReadAs && cleanString(bundle.portal?.id)) {
    const senderRole = options.markReadAs === "client" ? "studio" : "client";
    const readAt = await markPortalMessagesRead(cleanString(bundle.portal.id), options.markReadAs);
    nextBundle = applyReadReceiptToBundle(bundle, senderRole, readAt);
  }

  return {
    ok: true as const,
    data: buildWorkspaceView(nextBundle, { includeInternal: options?.includeInternal }),
  };
}

export async function getCustomerPortalViewByQuoteId(
  quoteId: string,
  options?: { includeInternal?: boolean; markReadAs?: "client" | "studio" }
) {
  const bundle = await getCustomerPortalBundleByQuoteId(quoteId);
  if (!bundle) return { ok: false as const, error: "Portal project not found." };

  let nextBundle: AnyObj = bundle;
  if (options?.markReadAs && cleanString(bundle.portal?.id)) {
    const senderRole = options.markReadAs === "client" ? "studio" : "client";
    const readAt = await markPortalMessagesRead(cleanString(bundle.portal.id), options.markReadAs);
    nextBundle = applyReadReceiptToBundle(bundle, senderRole, readAt);
  }

  return {
    ok: true as const,
    data: buildWorkspaceView(nextBundle, { includeInternal: options?.includeInternal }),
  };
}

export async function createCustomerPortalMessageByToken(input: {
  token: string;
  senderRole?: string;
  senderName?: string;
  body?: string;
  attachmentUrl?: string | null;
  attachmentName?: string | null;
  attachmentType?: string | null;
  attachmentSize?: number | null;
  attachmentStorageBucket?: string | null;
  attachmentStoragePath?: string | null;
}) {
  const portal = await getPortalProjectByToken(input.token);
  if (!portal) throw new Error("Portal not found");

  return createCustomerPortalMessageByPortalId(portal.id, input);
}

export async function createCustomerPortalMessageByQuoteId(input: {
  quoteId: string;
  senderRole?: string;
  senderName?: string;
  body?: string;
  attachmentUrl?: string | null;
  attachmentName?: string | null;
  attachmentType?: string | null;
  attachmentSize?: number | null;
  attachmentStorageBucket?: string | null;
  attachmentStoragePath?: string | null;
}) {
  const portal = await ensureCustomerPortalForQuoteId(input.quoteId);
  return createCustomerPortalMessageByPortalId(portal.id, input);
}

async function createCustomerPortalMessageByPortalId(
  portalProjectId: string,
  input: Omit<CustomerPortalMessageInput, "id" | "readAt" | "createdAt">
) {
  const body = cleanString(input.body);
  const senderRole = normalizeSenderRole(input.senderRole);
  const hasAttachment =
    !!cleanString(input.attachmentUrl) ||
    !!cleanString(input.attachmentStorageBucket) ||
    !!cleanString(input.attachmentStoragePath) ||
    !!cleanString(input.attachmentName);

  if (!body && !hasAttachment) {
    throw new Error("Message body or attachment is required.");
  }

  const { data, error } = await supabaseAdmin
    .from("customer_portal_messages")
    .insert({
      portal_project_id: portalProjectId,
      sender_role: senderRole,
      sender_name:
        cleanString(input.senderName) ||
        (senderRole === "client"
          ? "Client"
          : senderRole === "internal"
          ? "Internal note"
          : "CrecyStudio"),
      body,
      attachment_url: cleanString(input.attachmentUrl) || null,
      attachment_name: cleanString(input.attachmentName) || null,
      attachment_type: cleanString(input.attachmentType) || null,
      attachment_size: Number(input.attachmentSize ?? 0) || null,
      attachment_storage_bucket: cleanString(input.attachmentStorageBucket) || null,
      attachment_storage_path: cleanString(input.attachmentStoragePath) || null,
    })
    .select("*")
    .single();

  if (error) throw error;

  const patch: AnyObj = {
    updated_at: new Date().toISOString(),
  };
  if (senderRole === "client") {
    patch.client_updated_at = new Date().toISOString();
  }

  const { error: projectError } = await supabaseAdmin
    .from("customer_portal_projects")
    .update(patch)
    .eq("id", portalProjectId);

  if (projectError) throw projectError;

  await logProjectActivityByPortalId({
    portalProjectId,
    actorRole: senderRole === "client" ? "client" : "studio",
    eventType: "message_sent",
    summary:
      senderRole === "client"
        ? "Client sent a message."
        : senderRole === "internal"
        ? "Studio saved an internal note."
        : "Studio sent a message.",
    payload: {
      senderRole,
      hasAttachment,
    },
    clientVisible: senderRole !== "internal",
  });

  return {
    ...data,
    resolved_attachment_url: await signMessageAttachment(data),
  };
}

export async function listCustomerPortalMessageConversations() {
  const portalsRes = await supabaseAdmin
    .from("customer_portal_projects")
    .select("id, quote_id, access_token, updated_at")
    .order("updated_at", { ascending: false });

  if (portalsRes.error) throw portalsRes.error;

  const portals = portalsRes.data ?? [];
  const quoteIds = portals.map((portal) => cleanString(portal.quote_id)).filter(Boolean);

  const [quotesRes, messagesRes] = await Promise.all([
    quoteIds.length
      ? supabaseAdmin
          .from("quotes")
          .select("id, status, tier_recommended, lead_id")
          .in("id", quoteIds)
      : Promise.resolve({ data: [], error: null } as const),
    portals.length
      ? supabaseAdmin
          .from("customer_portal_messages")
          .select(
            "id, portal_project_id, sender_role, sender_name, body, attachment_name, read_at, created_at"
          )
          .in(
            "portal_project_id",
            portals.map((portal) => portal.id)
          )
          .order("created_at", { ascending: true })
      : Promise.resolve({ data: [], error: null } as const),
  ]);

  if (quotesRes.error) throw quotesRes.error;
  if (messagesRes.error) throw messagesRes.error;

  const quotes = quotesRes.data ?? [];
  const leadIds = quotes.map((quote) => cleanString(quote.lead_id)).filter(Boolean);
  const leadsRes = leadIds.length
    ? await supabaseAdmin.from("leads").select("id, name, email").in("id", leadIds)
    : ({ data: [], error: null } as const);

  if (leadsRes.error) throw leadsRes.error;

  const quoteMap = new Map(
    quotes.map((quote) => [cleanString(quote.id), quote] as const)
  );
  const leadMap = new Map(
    (leadsRes.data ?? []).map((lead) => [cleanString(lead.id), lead] as const)
  );
  const messagesByPortal = new Map<string, AnyObj[]>();

  for (const message of messagesRes.data ?? []) {
    const key = cleanString(message.portal_project_id);
    const group = messagesByPortal.get(key) ?? [];
    group.push(message);
    messagesByPortal.set(key, group);
  }

  return portals.map((portal) => {
    const quoteId = cleanString(portal.quote_id);
    const quote = quoteMap.get(quoteId);
    const lead = leadMap.get(cleanString(quote?.lead_id));
    const messages = messagesByPortal.get(cleanString(portal.id)) ?? [];
    const lastMessage = messages[messages.length - 1];
    const lastPreview =
      cleanString(lastMessage?.body) ||
      (cleanString(lastMessage?.attachment_name)
        ? `Attachment: ${cleanString(lastMessage.attachment_name)}`
        : "");

    return {
      quoteId,
      portalToken: cleanString(portal.access_token),
      leadName: cleanString(lead?.name) || "Unknown Lead",
      leadEmail: cleanString(lead?.email) || "",
      status: cleanString(quote?.status) || "new",
      tier: cleanString(quote?.tier_recommended) || "growth",
      lastMessagePreview: lastPreview,
      lastMessageAt: cleanString(lastMessage?.created_at) || "",
      lastMessageRole: lastMessage ? normalizeSenderRole(lastMessage.sender_role) : null,
      unreadCount: messages.filter(
        (message) =>
          normalizeSenderRole(message.sender_role) === "client" && !safeDate(message.read_at)
      ).length,
    };
  });
}

export async function submitAssetByPortalToken(input: {
  token: string;
  label: string;
  assetType?: string;
  assetUrl?: string;
  notes?: string;
  source?: string;
  status?: string;
  storageBucket?: string | null;
  storagePath?: string | null;
  fileName?: string | null;
  mimeType?: string | null;
  fileSize?: number | null;
}) {
  const portal = await getPortalProjectByToken(input.token);
  if (!portal) throw new Error("Portal not found");

  const { data, error } = await supabaseAdmin
    .from("customer_portal_assets")
    .insert({
      portal_project_id: portal.id,
      label: input.label.trim(),
      asset_type: cleanString(input.assetType) || "general",
      asset_url: cleanString(input.assetUrl) || null,
      notes: cleanString(input.notes) || null,
      status: normalizeAssetStatus(input.status),
      source: cleanString(input.source) || "portal_link",
      storage_bucket: cleanString(input.storageBucket) || null,
      storage_path: cleanString(input.storagePath) || null,
      file_name: cleanString(input.fileName) || null,
      mime_type: cleanString(input.mimeType) || null,
      file_size: Number(input.fileSize ?? 0) || null,
    })
    .select("*")
    .single();

  if (error) throw error;

  await supabaseAdmin
    .from("customer_portal_projects")
    .update({
      client_status: "content_submitted",
      client_updated_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", portal.id);

  await logProjectActivityByPortalId({
    portalProjectId: cleanString(portal.id),
    actorRole: "client",
    eventType: "asset_uploaded",
    summary: `Client uploaded "${input.label.trim()}".`,
    payload: {
      assetType: cleanString(input.assetType) || "general",
      source: cleanString(input.source) || "portal_link",
    },
    clientVisible: true,
  });

  return data;
}

export async function submitDesignDirectionByPortalToken(input: {
  token: string;
  direction: WebsiteDesignDirectionInput;
  actor?: { userId?: string | null; email?: string | null; ip?: string | null };
}) {
  const portal = await getPortalProjectByToken(input.token);
  if (!portal) throw new Error("Portal not found");

  // Resolve project type with explicit fallback chain. portal.project_type
  // can be the column default ("website") even for non-website quotes if
  // legacy code paths inserted without setting it explicitly, so we also
  // check the source quote.
  const portalProjectType =
    typeof portal.project_type === "string" && portal.project_type
      ? portal.project_type
      : null;
  let quoteProjectType: string | null = null;
  if (portal.quote_id) {
    const { data: q } = await supabaseAdmin
      .from("quotes")
      .select("project_type")
      .eq("id", portal.quote_id)
      .maybeSingle();
    quoteProjectType =
      q && typeof q.project_type === "string" && q.project_type ? q.project_type : null;
  }
  // Both must agree (or be missing) for this to be a website project.
  // If either says something else, refuse.
  const projectType = quoteProjectType ?? portalProjectType ?? "website";
  if (projectType !== "website" || (portalProjectType && portalProjectType !== "website")) {
    throw new Error("Design direction is only available for website projects.");
  }

  const existingScope = safeObj(portal.scope_snapshot);

  // Legacy portals (created before Phase 2) don't have a designDirection
  // record. Don't retroactively enable the feature for them — admin can
  // regenerate via a future tool if they want to opt in.
  if (!hasDesignDirection(existingScope)) {
    throw new Error(
      "Design direction is not enabled for this project. Contact CrecyStudio to opt in.",
    );
  }

  const existing = readDesignDirection(existingScope) ?? DEFAULT_WEBSITE_DESIGN_DIRECTION;

  // Once locked, the direction is immutable from the client side.
  if (existing.status === "locked") {
    throw new Error("Design direction is locked. Reach out to CrecyStudio to request a change.");
  }

  const merged: WebsiteDesignDirection = {
    ...mergeDesignDirection(existing, input.direction),
    status: "submitted",
    submittedAt: new Date().toISOString(),
    // Resubmissions after changes_requested keep approvedAt / lockedAt null
    // since they were never set in those states. Don't clear adminPublicNote
    // — admin may have left clarification copy that's still useful context.
    changesRequestedAt:
      existing.status === "changes_requested" ? null : existing.changesRequestedAt,
  };

  const nextScope = { ...existingScope, designDirection: merged };

  const { error } = await supabaseAdmin
    .from("customer_portal_projects")
    .update({
      scope_snapshot: nextScope,
      client_updated_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", portal.id);

  if (error) throw error;

  await logProjectActivityByPortalId({
    portalProjectId: cleanString(portal.id),
    actorRole: "client",
    eventType: "design_direction_submitted",
    summary: "Client submitted website design direction.",
    payload: {
      controlLevel: merged.controlLevel,
      visualStyle: merged.visualStyle,
      brandMoodCount: merged.brandMood.length,
      // Phase-gate audit trail — see launch QA runbook.
      actorUserId: input.actor?.userId ?? null,
      actorEmail: input.actor?.email ?? null,
      actorIp: input.actor?.ip ?? null,
    },
    clientVisible: true,
  });

  // Phase 3.9 sync: client submitting the form completes their part of
  // the corresponding required action. If admin requests changes later,
  // the transition helper re-opens the action.
  await updateRequiredActionStatusByPortalId({
    portalProjectId: cleanString(portal.id),
    actionKey: "complete_design_direction",
    status: "complete",
  });

  return merged;
}

export type DesignDirectionAdminAction =
  | "mark_under_review"
  | "request_changes"
  | "approve"
  | "lock"
  // Admin override: revert from `locked` back to `approved`. Used when
  // an accidental lock needs to be reversed or a client requests
  // post-lock revisions. The "design direction approved" milestone is
  // re-opened in the same operation so the journey map stays in sync.
  | "unlock";

// Admin transitions for the design direction. Each move is logged to the
// activity feed with the actor audit. `lock` additionally marks the
// "Design direction approved" milestone complete so the journey map
// reflects the gate.
export async function transitionDesignDirectionByQuoteId(input: {
  quoteId: string;
  action: DesignDirectionAdminAction;
  publicNote?: string | null;
  internalNote?: string | null;
  actor: {
    userId?: string | null;
    email?: string | null;
    ip?: string | null;
    userAgent?: string | null;
  };
}) {
  const { data: portal, error: portalErr } = await supabaseAdmin
    .from("customer_portal_projects")
    .select("*")
    .eq("quote_id", input.quoteId)
    .maybeSingle();
  if (portalErr) throw portalErr;
  if (!portal) throw new Error("Portal not found");

  const existingScope = safeObj(portal.scope_snapshot);
  if (!hasDesignDirection(existingScope)) {
    throw new Error(
      "Design direction is not enabled for this project. The portal predates Phase 2.",
    );
  }

  const existing = readDesignDirection(existingScope) ?? DEFAULT_WEBSITE_DESIGN_DIRECTION;

  const now = new Date().toISOString();
  const cleanPublicNote = input.publicNote != null ? String(input.publicNote).trim() : null;
  const cleanInternalNote = input.internalNote != null ? String(input.internalNote).trim() : null;

  const next: WebsiteDesignDirection = { ...existing };

  // Set status + timestamps based on the requested transition.
  switch (input.action) {
    case "mark_under_review":
      if (existing.status !== "submitted" && existing.status !== "changes_requested") {
        throw new Error("Direction can only be marked under review after submission.");
      }
      next.status = "under_review";
      next.reviewedAt = now;
      break;
    case "request_changes":
      if (existing.status === "locked") {
        throw new Error("Direction is locked; unlock before requesting changes.");
      }
      // Precondition: only request changes against something the client
      // has actually submitted. Re-opening from waiting_on_client /
      // not_started would set a "changes requested" state on an empty
      // payload, which is meaningless — the client never submitted
      // anything to revise.
      if (
        existing.status !== "submitted" &&
        existing.status !== "under_review" &&
        existing.status !== "approved" &&
        existing.status !== "changes_requested"
      ) {
        throw new Error(
          "Direction must be submitted before changes can be requested.",
        );
      }
      next.status = "changes_requested";
      next.changesRequestedAt = now;
      // If the direction was previously approved, clear approvedAt so
      // the audit trail doesn't claim "approved at X" on a record whose
      // current status is changes_requested. The original approval is
      // still recoverable from project_activity events.
      if (existing.status === "approved") {
        next.approvedAt = null;
      }
      break;
    case "approve":
      if (existing.status === "locked") {
        throw new Error("Direction is already locked.");
      }
      if (existing.status !== "submitted" && existing.status !== "under_review") {
        throw new Error("Direction must be submitted before it can be approved.");
      }
      next.status = "approved";
      next.approvedAt = now;
      break;
    case "lock":
      // Lock requires the client to have at least submitted the form so
      // the studio is locking on something the client filled in (or
      // already approved). Locking from "waiting_on_client" /
      // "not_started" / "changes_requested" would be locking against
      // empty payload, leaving the required action stuck open while the
      // direction shows "locked" — a state-machine inconsistency.
      // "locked" is allowed here as a no-op so retries (e.g. milestone
      // recovery) still work; the if-block below skips the actual
      // status mutation when already locked.
      if (
        existing.status !== "submitted" &&
        existing.status !== "under_review" &&
        existing.status !== "approved" &&
        existing.status !== "locked"
      ) {
        throw new Error(
          "Direction must be submitted (or approved) before it can be locked.",
        );
      }
      // Idempotent — if already locked we still attempt the milestone
      // update below so a retry can recover from a previous partial
      // write where status flipped but the milestone update errored.
      // The activity event is suppressed when there's no status change.
      if (existing.status !== "locked") {
        next.status = "locked";
        next.lockedAt = now;
        // Approved is implicit on lock if it wasn't already set.
        next.approvedAt = next.approvedAt ?? now;
      }
      break;
    case "unlock":
      // Only meaningful from "locked". From any other state this is a
      // no-op — error rather than silently flipping status backward.
      if (existing.status !== "locked") {
        throw new Error("Direction is not locked.");
      }
      next.status = "approved";
      next.lockedAt = null;
      // Keep approvedAt: the original approval still happened.
      break;
  }

  if (cleanPublicNote !== null) next.adminPublicNote = cleanPublicNote || null;
  if (cleanInternalNote !== null) next.adminInternalNote = cleanInternalNote || null;

  const statusChanged = next.status !== existing.status;
  const notesChanged =
    (cleanPublicNote !== null && cleanPublicNote !== (existing.adminPublicNote ?? "")) ||
    (cleanInternalNote !== null && cleanInternalNote !== (existing.adminInternalNote ?? ""));

  if (statusChanged || notesChanged) {
    const nextScope = { ...existingScope, designDirection: next };
    const { error: updErr } = await supabaseAdmin
      .from("customer_portal_projects")
      .update({
        scope_snapshot: nextScope,
        updated_at: now,
      })
      .eq("id", portal.id);
    if (updErr) throw updErr;
  }

  // On lock, mark the "Design direction approved" milestone complete so
  // the journey map reflects the phase-gate. Idempotent at the row level
  // (the .neq filter ensures we only update todo rows). Surface DB errors
  // rather than swallowing them — otherwise a partial-write between the
  // scope update and the milestone update would leave the journey map out
  // of sync with the direction status, with no signal to the admin.
  if (input.action === "lock" || input.action === "unlock") {
    // Look up the website lane's "direction approved" milestone title
    // from the workflow template rather than hardcoding "Design direction
    // approved". Mirrors the same pattern used for non-website lanes in
    // transitionDirectionByQuoteId — keeps the milestone title in one
    // place (the template) so a future label change doesn't silently
    // break this auto-complete.
    const milestoneTitle = getDirectionApprovedMilestoneTitle("website");
    if (!milestoneTitle) {
      throw new Error(
        "Workflow template is missing the website direction-approved milestone.",
      );
    }
    if (input.action === "lock") {
      const { error: msErr } = await supabaseAdmin
        .from("customer_portal_milestones")
        .update({ status: "done", completed_at: now, updated_at: now })
        .eq("portal_project_id", portal.id)
        .ilike("title", milestoneTitle)
        .neq("status", "done");
      if (msErr) {
        throw new Error(
          `Direction status saved but milestone auto-complete failed: ${msErr.message}. Retry to reconcile.`,
        );
      }
    } else {
      // Reopen the milestone on unlock so the journey map reflects that
      // the gate is no longer cleared.
      const { error: msErr } = await supabaseAdmin
        .from("customer_portal_milestones")
        .update({ status: "todo", completed_at: null, updated_at: now })
        .eq("portal_project_id", portal.id)
        .ilike("title", milestoneTitle)
        .eq("status", "done");
      if (msErr) {
        throw new Error(
          `Direction unlocked but milestone reopen failed: ${msErr.message}. Retry to reconcile.`,
        );
      }
    }
  }

  // Skip the activity event on idempotent retries (e.g. lock-after-lock)
  // where nothing actually changed. Note changes alone don't fire an event;
  // only state transitions do.
  if (!statusChanged) {
    return next;
  }

  const eventByAction: Record<DesignDirectionAdminAction, string> = {
    mark_under_review: "design_direction_under_review",
    request_changes: "design_direction_changes_requested",
    approve: "design_direction_approved",
    lock: "design_direction_locked",
    unlock: "design_direction_unlocked",
  };
  const summaryByAction: Record<DesignDirectionAdminAction, string> = {
    mark_under_review: "CrecyStudio is reviewing the design direction.",
    request_changes: "CrecyStudio requested clarification on the design direction.",
    approve: "Design direction approved.",
    lock: "Design direction locked. Build can begin.",
    unlock: "CrecyStudio reopened the design direction for changes.",
  };

  await logProjectActivityByPortalId({
    portalProjectId: cleanString(portal.id),
    actorRole: "studio",
    eventType: eventByAction[input.action],
    summary: summaryByAction[input.action],
    payload: {
      action: input.action,
      previousStatus: existing.status,
      newStatus: next.status,
      // Phase-gate audit trail — see launch QA runbook.
      actorUserId: input.actor.userId ?? null,
      actorEmail: input.actor.email ?? null,
      actorIp: input.actor.ip ?? null,
      actorUserAgent: input.actor.userAgent ?? null,
      // Public note is client-visible context; internal note isn't echoed
      // back into payloads to avoid leaking it via the client activity feed.
      publicNote: cleanPublicNote ?? null,
    },
    // request_changes and lock should be visible to the client; under_review
    // and approve are too (clients want to see "we're reviewing" and
    // "approved"). All four are client-visible.
    clientVisible: true,
  });

  // Phase 3.9 sync: keep the design-direction required action in step
  // with the admin transition.
  // - request_changes re-opens the action ("action needed" again).
  // - approve / lock force the action to complete defensively. Normally
  //   the client's own submit already marked it complete, but if admin
  //   reaches approve/lock through any path where the action wasn't
  //   already complete (e.g. admin entered direction data on the
  //   client's behalf via direct DB edit), this keeps the journey map
  //   and required-actions card consistent with the direction state.
  if (input.action === "request_changes" || input.action === "unlock") {
    await updateRequiredActionStatusByPortalId({
      portalProjectId: cleanString(portal.id),
      actionKey: "complete_design_direction",
      status: "waiting_on_client",
      clearCompletedAt: true,
    });
  } else if (input.action === "approve" || input.action === "lock") {
    await updateRequiredActionStatusByPortalId({
      portalProjectId: cleanString(portal.id),
      actionKey: "complete_design_direction",
      status: "complete",
    });
  }

  return next;
}

// Phase 3.5: generic admin transition for non-website directions. Mirrors
// transitionDesignDirectionByQuoteId but operates on scope_snapshot.direction
// and uses the lane's "direction approved" milestone title (looked up from
// the workflow template) rather than hardcoding "Design direction approved".
export type DirectionAdminAction = DesignDirectionAdminAction;

export async function transitionDirectionByQuoteId(input: {
  quoteId: string;
  action: DirectionAdminAction;
  publicNote?: string | null;
  internalNote?: string | null;
  actor: {
    userId?: string | null;
    email?: string | null;
    ip?: string | null;
    userAgent?: string | null;
  };
}) {
  const { data: portal, error: portalErr } = await supabaseAdmin
    .from("customer_portal_projects")
    .select("*")
    .eq("quote_id", input.quoteId)
    .maybeSingle();
  if (portalErr) throw portalErr;
  if (!portal) throw new Error("Portal not found");

  // Resolve project type from quote first, then portal column. Legacy
  // portal rows may carry the DB default of "website" while the actual
  // lane lives on the quote — prefer the quote so non-website transitions
  // aren't wrongly rejected.
  const portalProjectType =
    typeof portal.project_type === "string" && portal.project_type
      ? portal.project_type
      : null;
  let quoteProjectType: string | null = null;
  if (portal.quote_id) {
    const { data: q } = await supabaseAdmin
      .from("quotes")
      .select("project_type")
      .eq("id", portal.quote_id)
      .maybeSingle();
    quoteProjectType =
      q && typeof q.project_type === "string" && q.project_type ? q.project_type : null;
  }
  const resolvedType = quoteProjectType ?? portalProjectType ?? "website";
  if (!isProjectType(resolvedType)) {
    throw new Error("Direction transitions are not available for this project type.");
  }
  const projectType: ProjectType = resolvedType;
  if (projectType === "website") {
    throw new Error(
      "Use transitionDesignDirectionByQuoteId for website projects.",
    );
  }

  const existingScope = safeObj(portal.scope_snapshot);
  if (!hasDirection(existingScope)) {
    throw new Error(
      "Direction is not enabled for this project. The portal predates Phase 3.3.",
    );
  }

  const existing = readDirection(existingScope);
  if (!existing) {
    throw new Error("Direction record could not be read.");
  }

  const now = new Date().toISOString();
  const cleanPublicNote = input.publicNote != null ? String(input.publicNote).trim() : null;
  const cleanInternalNote = input.internalNote != null ? String(input.internalNote).trim() : null;

  const next: GenericDirection = { ...existing };

  switch (input.action) {
    case "mark_under_review":
      if (existing.status !== "submitted" && existing.status !== "changes_requested") {
        throw new Error("Direction can only be marked under review after submission.");
      }
      next.status = "under_review";
      next.reviewedAt = now;
      break;
    case "request_changes":
      if (existing.status === "locked") {
        throw new Error("Direction is locked; unlock before requesting changes.");
      }
      // Precondition: only request changes against something the client
      // has actually submitted. Re-opening from waiting_on_client /
      // not_started would set a "changes requested" state on an empty
      // payload, which is meaningless — the client never submitted
      // anything to revise.
      if (
        existing.status !== "submitted" &&
        existing.status !== "under_review" &&
        existing.status !== "approved" &&
        existing.status !== "changes_requested"
      ) {
        throw new Error(
          "Direction must be submitted before changes can be requested.",
        );
      }
      next.status = "changes_requested";
      next.changesRequestedAt = now;
      // If the direction was previously approved, clear approvedAt so
      // the audit trail doesn't claim "approved at X" on a record whose
      // current status is changes_requested. The original approval is
      // still recoverable from project_activity events.
      if (existing.status === "approved") {
        next.approvedAt = null;
      }
      break;
    case "approve":
      if (existing.status === "locked") {
        throw new Error("Direction is already locked.");
      }
      if (existing.status !== "submitted" && existing.status !== "under_review") {
        throw new Error("Direction must be submitted before it can be approved.");
      }
      next.status = "approved";
      next.approvedAt = now;
      break;
    case "lock":
      if (existing.status !== "locked") {
        next.status = "locked";
        next.lockedAt = now;
        next.approvedAt = next.approvedAt ?? now;
      }
      break;
    case "unlock":
      // Mirrors the website-lane unlock — only meaningful from "locked".
      if (existing.status !== "locked") {
        throw new Error("Direction is not locked.");
      }
      next.status = "approved";
      next.lockedAt = null;
      break;
  }

  if (cleanPublicNote !== null) next.adminPublicNote = cleanPublicNote || null;
  if (cleanInternalNote !== null) next.adminInternalNote = cleanInternalNote || null;

  const statusChanged = next.status !== existing.status;
  const notesChanged =
    (cleanPublicNote !== null && cleanPublicNote !== (existing.adminPublicNote ?? "")) ||
    (cleanInternalNote !== null && cleanInternalNote !== (existing.adminInternalNote ?? ""));

  if (statusChanged || notesChanged) {
    const nextScope = { ...existingScope, direction: next };
    const { error: updErr } = await supabaseAdmin
      .from("customer_portal_projects")
      .update({ scope_snapshot: nextScope, updated_at: now })
      .eq("id", portal.id);
    if (updErr) throw updErr;
  }

  // Lock auto-completes the lane's "direction approved" milestone (looked
  // up from the template, not hardcoded). Unlock reverses it.
  if (input.action === "lock" || input.action === "unlock") {
    const milestoneTitle = getDirectionApprovedMilestoneTitle(projectType);
    if (milestoneTitle) {
      if (input.action === "lock") {
        const { error: msErr } = await supabaseAdmin
          .from("customer_portal_milestones")
          .update({ status: "done", completed_at: now, updated_at: now })
          .eq("portal_project_id", portal.id)
          .ilike("title", milestoneTitle)
          .neq("status", "done");
        if (msErr) {
          throw new Error(
            `Direction status saved but milestone auto-complete failed: ${msErr.message}. Retry to reconcile.`,
          );
        }
      } else {
        const { error: msErr } = await supabaseAdmin
          .from("customer_portal_milestones")
          .update({ status: "todo", completed_at: null, updated_at: now })
          .eq("portal_project_id", portal.id)
          .ilike("title", milestoneTitle)
          .eq("status", "done");
        if (msErr) {
          throw new Error(
            `Direction unlocked but milestone reopen failed: ${msErr.message}. Retry to reconcile.`,
          );
        }
      }
    }
  }

  // Skip activity event on idempotent retries.
  if (!statusChanged) {
    return next;
  }

  // Lane-aware event names. Same pattern as Phase 2B's events but
  // namespaced by directionType so they don't collide with website's.
  const eventByAction: Record<DirectionAdminAction, string> = {
    mark_under_review: `${existing.type}_under_review`,
    request_changes: `${existing.type}_changes_requested`,
    approve: `${existing.type}_approved`,
    lock: `${existing.type}_locked`,
    unlock: `${existing.type}_unlocked`,
  };
  const directionLabel = existing.type.replace(/_/g, " ");
  const summaryByAction: Record<DirectionAdminAction, string> = {
    mark_under_review: `CrecyStudio is reviewing the ${directionLabel}.`,
    request_changes: `CrecyStudio requested clarification on the ${directionLabel}.`,
    approve: `${directionLabel.charAt(0).toUpperCase()}${directionLabel.slice(1)} approved.`,
    lock: `${directionLabel.charAt(0).toUpperCase()}${directionLabel.slice(1)} locked. Build can begin.`,
    unlock: `CrecyStudio reopened the ${directionLabel} for changes.`,
  };

  await logProjectActivityByPortalId({
    portalProjectId: cleanString(portal.id),
    actorRole: "studio",
    eventType: eventByAction[input.action],
    summary: summaryByAction[input.action],
    payload: {
      action: input.action,
      directionType: existing.type,
      previousStatus: existing.status,
      newStatus: next.status,
      actorUserId: input.actor.userId ?? null,
      actorEmail: input.actor.email ?? null,
      actorIp: input.actor.ip ?? null,
      actorUserAgent: input.actor.userAgent ?? null,
      publicNote: cleanPublicNote ?? null,
    },
    clientVisible: true,
  });

  // Phase 3.9 sync: keep the lane's required-action in step. Action key
  // follows the convention complete_${directionType} (matches all 4
  // non-website templates' first required action).
  // Same defensive sync pattern as the website lane transition above:
  // request_changes re-opens the action; approve/lock force-complete it
  // to keep the journey map consistent if any path bypassed the client
  // submit's own sync.
  const directionActionKey = `complete_${existing.type}`;
  if (input.action === "request_changes" || input.action === "unlock") {
    await updateRequiredActionStatusByPortalId({
      portalProjectId: cleanString(portal.id),
      actionKey: directionActionKey,
      status: "waiting_on_client",
      clearCompletedAt: true,
    });
  } else if (input.action === "approve" || input.action === "lock") {
    await updateRequiredActionStatusByPortalId({
      portalProjectId: cleanString(portal.id),
      actionKey: directionActionKey,
      status: "complete",
    });
  }

  return next;
}

// ─────────────────────────────────────────────────────────────────
// Admin-side payload edits. The transition helpers above only flip
// status fields — they don't let admin fix typos in what the client
// submitted, or fill in missing fields if the client sent direction
// over email instead of through the portal.
//
// These helpers update the editable subset of fields on the existing
// direction record, leaving status/timestamps/notes alone. The full
// edit (including timestamps) is reserved for the dedicated direction
// transition flow above.
// ─────────────────────────────────────────────────────────────────

const DESIGN_DIRECTION_EDITABLE_KEYS = [
  "controlLevel",
  "brandMood",
  "visualStyle",
  "brandColorsKnown",
  "preferredColors",
  "colorsToAvoid",
  "letCrecyChoosePalette",
  "typographyFeel",
  "imageryDirection",
  "likedWebsites",
  "dislikedWebsites",
  "contentTone",
  "hasLogo",
  "hasBrandGuide",
  "brandAssetsNotes",
  "clientNotes",
] as const;

export async function editDesignDirectionPayloadByQuoteId(input: {
  quoteId: string;
  patch: Partial<WebsiteDesignDirectionInput>;
  actor: { userId?: string | null; email?: string | null; ip?: string | null };
}): Promise<WebsiteDesignDirection> {
  const { data: portal, error: portalErr } = await supabaseAdmin
    .from("customer_portal_projects")
    .select("*")
    .eq("quote_id", input.quoteId)
    .maybeSingle();
  if (portalErr) throw portalErr;
  if (!portal) throw new Error("Portal not found");

  const existingScope = safeObj(portal.scope_snapshot);
  if (!hasDesignDirection(existingScope)) {
    throw new Error("Design direction is not enabled for this project.");
  }

  const existing = readDesignDirection(existingScope) ?? DEFAULT_WEBSITE_DESIGN_DIRECTION;
  const next: WebsiteDesignDirection = { ...existing };

  // Only copy whitelisted fields. Prevents an admin accidentally
  // overwriting status/timestamps via the same endpoint.
  const changedKeys: string[] = [];
  for (const key of DESIGN_DIRECTION_EDITABLE_KEYS) {
    if (key in input.patch) {
      const value = (input.patch as Record<string, unknown>)[key];
      if (value !== undefined) {
        (next as Record<string, unknown>)[key] = value;
        changedKeys.push(key);
      }
    }
  }
  if (changedKeys.length === 0) return existing;

  const now = new Date().toISOString();
  const nextScope = { ...existingScope, designDirection: next };
  const { error: updErr } = await supabaseAdmin
    .from("customer_portal_projects")
    .update({ scope_snapshot: nextScope, updated_at: now })
    .eq("id", portal.id);
  if (updErr) throw updErr;

  await logProjectActivityByPortalId({
    portalProjectId: cleanString(portal.id),
    actorRole: "studio",
    eventType: "design_direction_payload_edited",
    summary: "CrecyStudio edited the design direction on the client's behalf.",
    payload: {
      changedKeys,
      actorUserId: input.actor.userId ?? null,
      actorEmail: input.actor.email ?? null,
      actorIp: input.actor.ip ?? null,
    },
    clientVisible: false,
  });

  return next;
}

export async function editDirectionPayloadByQuoteId(input: {
  quoteId: string;
  payload: Record<string, unknown>;
  actor: { userId?: string | null; email?: string | null; ip?: string | null };
}): Promise<GenericDirection> {
  const { data: portal, error: portalErr } = await supabaseAdmin
    .from("customer_portal_projects")
    .select("*")
    .eq("quote_id", input.quoteId)
    .maybeSingle();
  if (portalErr) throw portalErr;
  if (!portal) throw new Error("Portal not found");

  const existingScope = safeObj(portal.scope_snapshot);
  if (!hasDirection(existingScope)) {
    throw new Error("Direction is not enabled for this project.");
  }
  const existing = readDirection(existingScope);
  if (!existing) {
    throw new Error("Direction record could not be read.");
  }

  // Generic direction stores everything inside `payload`. Merge over
  // existing so partial edits work; pass {} to clear nothing.
  const mergedPayload = { ...(existing.payload || {}), ...input.payload };
  const next: GenericDirection = { ...existing, payload: mergedPayload };

  const now = new Date().toISOString();
  const nextScope = { ...existingScope, direction: next };
  const { error: updErr } = await supabaseAdmin
    .from("customer_portal_projects")
    .update({ scope_snapshot: nextScope, updated_at: now })
    .eq("id", portal.id);
  if (updErr) throw updErr;

  await logProjectActivityByPortalId({
    portalProjectId: cleanString(portal.id),
    actorRole: "studio",
    eventType: `${existing.type}_payload_edited`,
    summary: `CrecyStudio edited the ${existing.type.replace(/_/g, " ")} on the client's behalf.`,
    payload: {
      directionType: existing.type,
      changedKeys: Object.keys(input.payload),
      actorUserId: input.actor.userId ?? null,
      actorEmail: input.actor.email ?? null,
      actorIp: input.actor.ip ?? null,
    },
    clientVisible: false,
  });

  return next;
}

// Phase 3.3: generic direction submit for non-website lanes (web_app,
// automation, ecommerce, rescue). Mirrors submitDesignDirectionByPortalToken
// but operates on scope_snapshot.direction with a generic payload.
export async function submitDirectionByPortalToken(input: {
  token: string;
  payload: Record<string, unknown>;
  approvedDirectionTerms: boolean;
  actor?: { userId?: string | null; email?: string | null; ip?: string | null };
}) {
  if (!input.approvedDirectionTerms) {
    throw new Error("Direction terms must be approved before submitting.");
  }

  const portal = await getPortalProjectByToken(input.token);
  if (!portal) throw new Error("Portal not found");

  // Lane gate. Resolve project type from portal column (source of truth
  // post-Phase-3.2) with quote fallback. Refuse website lane — that's
  // handled by Phase 2A's submitDesignDirectionByPortalToken.
  const portalProjectType =
    typeof portal.project_type === "string" && portal.project_type
      ? portal.project_type
      : null;
  let quoteProjectType: string | null = null;
  if (portal.quote_id) {
    const { data: q } = await supabaseAdmin
      .from("quotes")
      .select("project_type")
      .eq("id", portal.quote_id)
      .maybeSingle();
    quoteProjectType =
      q && typeof q.project_type === "string" && q.project_type ? q.project_type : null;
  }
  // Prefer quote over portal column. Phase 3.2 set the portal column on
  // new portals, but legacy portals still carry the DB default of "website"
  // which would otherwise wrongly reject non-website submissions whenever
  // the lane lives only on the quote row.
  const resolvedType = quoteProjectType ?? portalProjectType ?? "website";
  if (resolvedType === "website") {
    throw new Error(
      "Use the design direction submit endpoint for website projects.",
    );
  }
  if (!isProjectType(resolvedType)) {
    throw new Error("Direction is not available for this project type.");
  }

  const existingScope = safeObj(portal.scope_snapshot);
  if (!hasDirection(existingScope)) {
    throw new Error(
      "Direction is not enabled for this project. Contact CrecyStudio to opt in.",
    );
  }

  const existing = readDirection(existingScope);
  if (!existing) {
    throw new Error("Direction record could not be read.");
  }
  if (existing.status === "locked") {
    throw new Error("Direction is locked. Reach out to CrecyStudio to request a change.");
  }

  const merged: GenericDirection = {
    ...existing,
    payload: { ...existing.payload, ...input.payload },
    status: "submitted",
    submittedAt: new Date().toISOString(),
    // Resubmissions after changes_requested clear the timestamp so the
    // workflow shows the resubmit as the latest state. approvedAt /
    // lockedAt stay null since we never reached those states.
    changesRequestedAt:
      existing.status === "changes_requested" ? null : existing.changesRequestedAt,
  };

  const nextScope = { ...existingScope, direction: merged };

  const { error } = await supabaseAdmin
    .from("customer_portal_projects")
    .update({
      scope_snapshot: nextScope,
      client_updated_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", portal.id);
  if (error) throw error;

  await logProjectActivityByPortalId({
    portalProjectId: cleanString(portal.id),
    actorRole: "client",
    eventType: `${merged.type}_submitted`,
    summary: `Client submitted ${merged.type.replace(/_/g, " ")}.`,
    payload: {
      directionType: merged.type,
      // Phase-gate audit trail.
      actorUserId: input.actor?.userId ?? null,
      actorEmail: input.actor?.email ?? null,
      actorIp: input.actor?.ip ?? null,
    },
    clientVisible: true,
  });

  // Phase 3.9 sync: complete the direction-completion required action
  // for the lane. Action key is the first requiredAction in the
  // template (always "complete_${directionType}" by convention).
  const directionActionKey = `complete_${merged.type}`;
  await updateRequiredActionStatusByPortalId({
    portalProjectId: cleanString(portal.id),
    actionKey: directionActionKey,
    status: "complete",
  });

  return merged;
}

export async function submitRevisionByPortalToken(input: {
  token: string;
  requestText: string;
  priority?: string;
}) {
  const portal = await getPortalProjectByToken(input.token);
  if (!portal) throw new Error("Portal not found");

  const { data, error } = await supabaseAdmin
    .from("customer_portal_revisions")
    .insert({
      portal_project_id: portal.id,
      request_text: input.requestText.trim(),
      priority: normalizePriority(input.priority),
      status: "new",
    })
    .select("*")
    .single();

  if (error) throw error;

  await supabaseAdmin
    .from("customer_portal_projects")
    .update({
      client_status: "revision_requested",
      client_updated_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", portal.id);

  await logProjectActivityByPortalId({
    portalProjectId: cleanString(portal.id),
    actorRole: "client",
    eventType: "revision_submitted",
    summary: "Client submitted a revision request.",
    payload: {
      priority: normalizePriority(input.priority),
    },
    clientVisible: true,
  });

  return data;
}

// ─────────────────────────────────────────────────────────────────
// Admin-side asset/revision actions. Mirror the *ByPortalToken
// variants but accept a quoteId, log as actorRole="studio", and skip
// the client_status side-effects that don't make sense when the
// admin is acting on the client's behalf.
// ─────────────────────────────────────────────────────────────────

export async function submitAssetByQuoteId(input: {
  quoteId: string;
  label: string;
  assetType?: string;
  assetUrl?: string;
  notes?: string;
  source?: string;
  status?: string;
  storageBucket?: string | null;
  storagePath?: string | null;
  fileName?: string | null;
  mimeType?: string | null;
  fileSize?: number | null;
  actor: { userId?: string | null; email?: string | null; ip?: string | null };
}) {
  const portal = await getPortalProjectByQuoteId(input.quoteId);
  if (!portal) throw new Error("Portal not found");

  const { data, error } = await supabaseAdmin
    .from("customer_portal_assets")
    .insert({
      portal_project_id: portal.id,
      label: input.label.trim(),
      asset_type: cleanString(input.assetType) || "general",
      asset_url: cleanString(input.assetUrl) || null,
      notes: cleanString(input.notes) || null,
      // Default approved when admin uploads on behalf — the studio is
      // the one curating the asset, so it's already vetted.
      status: normalizeAssetStatus(input.status || "approved"),
      source: cleanString(input.source) || "admin_upload",
      storage_bucket: cleanString(input.storageBucket) || null,
      storage_path: cleanString(input.storagePath) || null,
      file_name: cleanString(input.fileName) || null,
      mime_type: cleanString(input.mimeType) || null,
      file_size: Number(input.fileSize ?? 0) || null,
    })
    .select("*")
    .single();

  if (error) throw error;

  await logProjectActivityByPortalId({
    portalProjectId: cleanString(portal.id),
    actorRole: "studio",
    eventType: "asset_uploaded_by_admin",
    summary: `CrecyStudio added asset on client's behalf: "${input.label.trim()}".`,
    payload: {
      assetType: cleanString(input.assetType) || "general",
      source: cleanString(input.source) || "admin_upload",
      actorUserId: input.actor.userId ?? null,
      actorEmail: input.actor.email ?? null,
      actorIp: input.actor.ip ?? null,
    },
    clientVisible: true,
  });

  return data;
}

export async function deleteAssetByQuoteId(input: {
  quoteId: string;
  assetId: string;
  actor: { userId?: string | null; email?: string | null; ip?: string | null };
}): Promise<void> {
  const portal = await getPortalProjectByQuoteId(input.quoteId);
  if (!portal) throw new Error("Portal not found");

  // Read first so we can log a useful summary after the row is gone.
  const { data: existing } = await supabaseAdmin
    .from("customer_portal_assets")
    .select("id, label, asset_type")
    .eq("id", input.assetId)
    .eq("portal_project_id", portal.id)
    .maybeSingle();

  const { error } = await supabaseAdmin
    .from("customer_portal_assets")
    .delete()
    .eq("id", input.assetId)
    .eq("portal_project_id", portal.id);
  if (error) throw error;

  if (existing?.id) {
    await logProjectActivityByPortalId({
      portalProjectId: cleanString(portal.id),
      actorRole: "studio",
      eventType: "asset_deleted_by_admin",
      summary: `CrecyStudio removed asset: "${existing.label}".`,
      payload: {
        assetId: input.assetId,
        assetType: existing.asset_type,
        actorUserId: input.actor.userId ?? null,
        actorEmail: input.actor.email ?? null,
        actorIp: input.actor.ip ?? null,
      },
      // Client-visible so the audit trail shows them what disappeared.
      clientVisible: true,
    });
  }
}

export async function submitRevisionByQuoteId(input: {
  quoteId: string;
  requestText: string;
  priority?: string;
  actor: { userId?: string | null; email?: string | null; ip?: string | null };
}) {
  const portal = await getPortalProjectByQuoteId(input.quoteId);
  if (!portal) throw new Error("Portal not found");

  const { data, error } = await supabaseAdmin
    .from("customer_portal_revisions")
    .insert({
      portal_project_id: portal.id,
      request_text: input.requestText.trim(),
      priority: normalizePriority(input.priority),
      status: "new",
    })
    .select("*")
    .single();

  if (error) throw error;

  // Skip the client_status flip — that triggers client-facing nudges
  // that wouldn't make sense when the admin is logging call-in
  // feedback ("revision_requested" implies the client did the action).

  await logProjectActivityByPortalId({
    portalProjectId: cleanString(portal.id),
    actorRole: "studio",
    eventType: "revision_recorded_by_admin",
    summary: "CrecyStudio recorded a revision on the client's behalf.",
    payload: {
      priority: normalizePriority(input.priority),
      actorUserId: input.actor.userId ?? null,
      actorEmail: input.actor.email ?? null,
      actorIp: input.actor.ip ?? null,
    },
    clientVisible: true,
  });

  return data;
}

export async function deleteRevisionByQuoteId(input: {
  quoteId: string;
  revisionId: string;
  actor: { userId?: string | null; email?: string | null; ip?: string | null };
}): Promise<void> {
  const portal = await getPortalProjectByQuoteId(input.quoteId);
  if (!portal) throw new Error("Portal not found");

  const { data: existing } = await supabaseAdmin
    .from("customer_portal_revisions")
    .select("id, priority, status")
    .eq("id", input.revisionId)
    .eq("portal_project_id", portal.id)
    .maybeSingle();

  const { error } = await supabaseAdmin
    .from("customer_portal_revisions")
    .delete()
    .eq("id", input.revisionId)
    .eq("portal_project_id", portal.id);
  if (error) throw error;

  if (existing?.id) {
    await logProjectActivityByPortalId({
      portalProjectId: cleanString(portal.id),
      actorRole: "studio",
      eventType: "revision_deleted_by_admin",
      summary: "CrecyStudio removed a revision request.",
      payload: {
        revisionId: input.revisionId,
        priority: existing.priority,
        previousStatus: existing.status,
        actorUserId: input.actor.userId ?? null,
        actorEmail: input.actor.email ?? null,
        actorIp: input.actor.ip ?? null,
      },
      clientVisible: true,
    });
  }
}

export async function toggleMilestone(token: string, milestoneId: string, done: boolean) {
  const portal = await getPortalProjectByToken(token);
  if (!portal) throw new Error("Portal not found");

  const milestoneRes = await supabaseAdmin
    .from("customer_portal_milestones")
    .select("id, title")
    .eq("portal_project_id", portal.id)
    .eq("id", milestoneId)
    .maybeSingle();

  if (milestoneRes.error) throw milestoneRes.error;

  const { error } = await supabaseAdmin
    .from("customer_portal_milestones")
    .update({
      status: done ? "done" : "todo",
      completed_at: done ? new Date().toISOString() : null,
      updated_at: new Date().toISOString(),
    })
    .eq("portal_project_id", portal.id)
    .eq("id", milestoneId);

  if (error) throw error;

  await logProjectActivityByPortalId({
    portalProjectId: cleanString(portal.id),
    actorRole: "client",
    eventType: "milestone_toggled",
    summary: `${done ? "Completed" : "Reopened"} milestone "${cleanString(
      milestoneRes.data?.title
    ) || "project step"}".`,
    payload: {
      milestoneId,
      done,
    },
    clientVisible: true,
  });
}

export async function updateClientStatus(token: string, status: string, notes?: string) {
  const portal = await getPortalProjectByToken(token);
  if (!portal) throw new Error("Portal not found");

  const nextStatus = cleanString(status) || "new";

  const { error } = await supabaseAdmin
    .from("customer_portal_projects")
    .update({
      client_status: nextStatus,
      client_notes: typeof notes === "string" ? notes : portal.client_notes || "",
      client_updated_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", portal.id);

  if (error) throw error;

  await logProjectActivityByPortalId({
    portalProjectId: cleanString(portal.id),
    actorRole: "client",
    eventType: nextStatus === "deposit_sent" ? "deposit_notice_sent" : "client_status_updated",
    summary:
      nextStatus === "deposit_sent"
        ? "Client reported that the deposit was sent."
        : `Client updated project status to "${nextStatus}".`,
    payload: {
      status: nextStatus,
    },
    clientVisible: true,
  });
}

export async function updateAdminNote(token: string, note: string) {
  const portal = await getPortalProjectByToken(token);
  if (!portal) throw new Error("Portal not found");

  const { error } = await supabaseAdmin
    .from("customer_portal_projects")
    .update({
      admin_public_note: note,
      updated_at: new Date().toISOString(),
    })
    .eq("id", portal.id);

  if (error) throw error;
}

export async function acceptCustomerPortalAgreement(token: string) {
  const portal = await getPortalProjectByToken(token);
  if (!portal) throw new Error("Portal not found");

  const now = new Date().toISOString();
  const { error } = await supabaseAdmin
    .from("customer_portal_projects")
    .update({
      agreement_status: "accepted",
      agreement_accepted_at: now,
      updated_at: now,
    })
    .eq("id", portal.id);

  if (error) throw error;

  await logProjectActivityByPortalId({
    portalProjectId: cleanString(portal.id),
    actorRole: "client",
    eventType: "agreement_accepted",
    summary: "Client accepted the project agreement.",
    payload: {},
    clientVisible: true,
  });
}

// Admin override: record an offline acceptance (signed-in-person, sent
// over email, etc.). Mirrors the client-side accept but stamps the
// audit trail with the admin actor + a flag that distinguishes
// admin-recorded acceptance from client-clicked acceptance.
export async function adminAcceptCustomerPortalAgreementByQuoteId(input: {
  quoteId: string;
  acceptedByEmail: string;
  acceptedAt?: string | null;
  notes?: string | null;
  actor: { userId?: string | null; email?: string | null; ip?: string | null };
}) {
  const portal = await getPortalProjectByQuoteId(input.quoteId);
  if (!portal) throw new Error("Portal not found");

  const acceptedAt = safeDate(input.acceptedAt) || new Date().toISOString();
  const now = new Date().toISOString();

  const { error } = await supabaseAdmin
    .from("customer_portal_projects")
    .update({
      agreement_status: "accepted",
      agreement_accepted_at: acceptedAt,
      updated_at: now,
    })
    .eq("id", portal.id);
  if (error) throw error;

  // Mirror the agreements row pattern used for client-side accepts so
  // certificate generation and downstream consumers see consistent data.
  // Doesn't replay an existing row — admin accept assumes there isn't
  // one yet (otherwise call void first).
  const { data: existingAgreement } = await supabaseAdmin
    .from("agreements")
    .select("id")
    .eq("portal_project_id", portal.id)
    .eq("status", "accepted")
    .maybeSingle();

  if (!existingAgreement) {
    const { data: scope } = await supabaseAdmin
      .from("customer_portal_projects")
      .select("agreement_text")
      .eq("id", portal.id)
      .maybeSingle();
    const bodyText = String(scope?.agreement_text || "");
    if (bodyText) {
      await supabaseAdmin
        .from("agreements")
        .insert({
          portal_project_id: portal.id,
          body_text: bodyText,
          body_hash: "",
          published_at: acceptedAt,
          accepted_at: acceptedAt,
          accepted_by_email: input.acceptedByEmail.trim(),
          accepted_ip: input.actor.ip ?? null,
          accepted_user_agent: "admin-recorded",
          status: "accepted",
        });
    }
  }

  await logProjectActivityByPortalId({
    portalProjectId: cleanString(portal.id),
    actorRole: "studio",
    eventType: "agreement_accepted_by_admin",
    summary: `CrecyStudio recorded that ${input.acceptedByEmail.trim()} accepted the agreement offline.`,
    payload: {
      acceptedBy: input.acceptedByEmail.trim(),
      acceptedAt,
      notes: input.notes || null,
      actorUserId: input.actor.userId ?? null,
      actorEmail: input.actor.email ?? null,
      actorIp: input.actor.ip ?? null,
    },
    clientVisible: true,
  });
}

// Void an accepted agreement. Clears the acceptance fields on the
// portal row and marks the most-recent accepted agreement row as
// "voided" (preserved for audit, not deleted). Use sparingly —
// every void is logged with the reason.
export async function voidCustomerPortalAgreementByQuoteId(input: {
  quoteId: string;
  reason: string;
  actor: { userId?: string | null; email?: string | null; ip?: string | null };
}) {
  const portal = await getPortalProjectByQuoteId(input.quoteId);
  if (!portal) throw new Error("Portal not found");

  const reason = input.reason.trim();
  if (!reason) throw new Error("A reason is required to void an agreement.");

  const now = new Date().toISOString();
  const { error: projectErr } = await supabaseAdmin
    .from("customer_portal_projects")
    .update({
      agreement_status: "draft",
      agreement_accepted_at: null,
      updated_at: now,
    })
    .eq("id", portal.id);
  if (projectErr) throw projectErr;

  // Mark the most-recent accepted agreements row as voided. Preserves
  // history rather than deleting (the original signature audit is
  // recoverable from the row).
  const { data: latest } = await supabaseAdmin
    .from("agreements")
    .select("id")
    .eq("portal_project_id", portal.id)
    .eq("status", "accepted")
    .order("accepted_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (latest?.id) {
    await supabaseAdmin
      .from("agreements")
      .update({ status: "voided" })
      .eq("id", latest.id);
  }

  await logProjectActivityByPortalId({
    portalProjectId: cleanString(portal.id),
    actorRole: "studio",
    eventType: "agreement_voided",
    summary: `CrecyStudio voided the accepted agreement: ${reason}`,
    payload: {
      reason,
      voidedAgreementId: latest?.id ?? null,
      actorUserId: input.actor.userId ?? null,
      actorEmail: input.actor.email ?? null,
      actorIp: input.actor.ip ?? null,
    },
    clientVisible: true,
  });
}

export async function markDepositPaid(
  token: string,
  paymentData?: {
    amountCents?: number | null;
    checkoutUrl?: string | null;
    paidAt?: string | null;
    reference?: string | null;
  }
) {
  const portal = await getPortalProjectByToken(token);
  if (!portal) throw new Error("Portal not found");
  await markDepositPaidForQuoteId(cleanString(portal.quote_id), paymentData);
}

export async function markDepositPaidForQuoteId(
  quoteId: string,
  paymentData?: {
    amountCents?: number | null;
    checkoutUrl?: string | null;
    paidAt?: string | null;
    reference?: string | null;
  }
) {
  const portal = await ensureCustomerPortalForQuoteId(quoteId);

  const paidAt = safeDate(paymentData?.paidAt) || new Date().toISOString();
  const amountCents =
    Number(paymentData?.amountCents ?? portal.deposit_amount_cents ?? 0) || null;

  const { error: projectError } = await supabaseAdmin
    .from("customer_portal_projects")
    .update({
      deposit_status: "paid",
      deposit_paid_at: paidAt,
      deposit_amount_cents: amountCents,
      deposit_checkout_url: cleanString(paymentData?.checkoutUrl) || portal.deposit_checkout_url || null,
      payment_reference: cleanString(paymentData?.reference) || portal.payment_reference || null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", portal.id);

  if (projectError) throw projectError;

  const { error: quoteError } = await supabaseAdmin
    .from("quotes")
    .update({
      deposit_status: "paid",
      deposit_paid_at: paidAt,
      deposit_link: cleanString(paymentData?.checkoutUrl) || portal.deposit_checkout_url || null,
      status: "paid",
    })
    .eq("id", quoteId);

  if (quoteError) throw quoteError;

  await logProjectActivityByQuoteId({
    quoteId,
    actorRole: "system",
    eventType: "deposit_paid",
    summary: "Deposit payment was recorded.",
    payload: {
      amountCents,
      reference: cleanString(paymentData?.reference) || null,
    },
    clientVisible: true,
  });
}

export async function updatePortalAdminByQuoteId(
  quoteId: string,
  input: {
    publicNote?: string;
    depositNotes?: string;
    depositAmount?: number | null;
    portalAdmin?: AnyObj;
    portalStateAdmin?: AnyObj;
    publishedAgreementText?: string;
  }
) {
  const portal = await ensureCustomerPortalForQuoteId(quoteId);
  const portalAdmin = safeObj(input.portalAdmin);
  const portalStateAdmin = safeObj(input.portalStateAdmin);
  const patch: AnyObj = {
    updated_at: new Date().toISOString(),
  };

  if (typeof input.publicNote === "string") patch.admin_public_note = input.publicNote;
  if (typeof input.depositNotes === "string") patch.deposit_notes = input.depositNotes;
  if (input.depositAmount != null) patch.deposit_amount_cents = dollarsToCents(input.depositAmount);
  if (typeof input.publishedAgreementText === "string") patch.agreement_text = input.publishedAgreementText;

  if (typeof portalStateAdmin.clientStatus === "string") patch.client_status = portalStateAdmin.clientStatus;
  if (typeof portalStateAdmin.clientNotes === "string") patch.client_notes = portalStateAdmin.clientNotes;
  if (typeof portalStateAdmin.adminPublicNote === "string") patch.admin_public_note = portalStateAdmin.adminPublicNote;
  if (typeof portalStateAdmin.depositNotes === "string") patch.deposit_notes = portalStateAdmin.depositNotes;
  if (portalStateAdmin.depositAmount != null) patch.deposit_amount_cents = dollarsToCents(portalStateAdmin.depositAmount);
  if (typeof portalStateAdmin.depositStatus === "string") patch.deposit_status = portalStateAdmin.depositStatus;
  if (patch.client_status || patch.client_notes) patch.client_updated_at = new Date().toISOString();

  if (Object.keys(portalAdmin).length > 0) {
    const nextPreviewUrl = cleanString(portalAdmin.previewUrl) || null;
    const nextPreviewStatus =
      cleanString(portalAdmin.previewStatus) || "Awaiting published preview";
    const nextPreviewNotes =
      typeof portalAdmin.previewNotes === "string" ? portalAdmin.previewNotes : "";
    const previewChanged =
      nextPreviewUrl !== (portal.preview_url || null) ||
      nextPreviewStatus !== (portal.preview_status || "Awaiting published preview") ||
      nextPreviewNotes !== (portal.preview_notes || "");

    patch.preview_url = cleanString(portalAdmin.previewUrl) || null;
    patch.production_url = cleanString(portalAdmin.productionUrl) || null;
    patch.preview_status = nextPreviewStatus;
    patch.preview_notes = nextPreviewNotes;
    if (previewChanged) {
      patch.preview_updated_at = new Date().toISOString();
    }
    patch.client_review_status = cleanString(portalAdmin.clientReviewStatus) || "Preview pending";
    patch.agreement_status = cleanString(portalAdmin.agreementStatus) || "Not published yet";
    patch.agreement_model = cleanString(portalAdmin.agreementModel) || "Managed build agreement";
    patch.ownership_model =
      cleanString(portalAdmin.ownershipModel) || "Managed with project handoff options";
    patch.agreement_published_at = safeDate(portalAdmin.agreementPublishedAt);
    patch.launch_status = cleanString(portalAdmin.launchStatus) || "Not ready";
    patch.domain_status = cleanString(portalAdmin.domainStatus) || "Pending";
    patch.analytics_status = cleanString(portalAdmin.analyticsStatus) || "Pending";
    patch.forms_status = cleanString(portalAdmin.formsStatus) || "Pending";
    patch.seo_status = cleanString(portalAdmin.seoStatus) || "Pending";
    patch.handoff_status = cleanString(portalAdmin.handoffStatus) || "Pending";
    patch.launch_notes = typeof portalAdmin.launchNotes === "string" ? portalAdmin.launchNotes : "";
  }

  const { error } = await supabaseAdmin
    .from("customer_portal_projects")
    .update(patch)
    .eq("id", portal.id);

  if (error) throw error;
}

export async function replacePortalMilestonesByQuoteId(
  quoteId: string,
  milestones: CustomerPortalMilestoneInput[]
) {
  const portal = await ensureCustomerPortalForQuoteId(quoteId);

  const { error: deleteError } = await supabaseAdmin
    .from("customer_portal_milestones")
    .delete()
    .eq("portal_project_id", portal.id);

  if (deleteError) throw deleteError;

  if (!Array.isArray(milestones) || milestones.length === 0) return;

  const rows = milestones.map((milestone, index) => ({
    portal_project_id: portal.id,
    title: cleanString(milestone.label || milestone.title) || `Milestone ${index + 1}`,
    status:
      typeof milestone.done === "boolean"
        ? milestone.done
          ? "done"
          : "todo"
        : normalizeMilestoneStatus(milestone.status),
    notes: cleanString(milestone.notes) || null,
    due_date: safeDate(milestone.due_date),
    sort_order: Number(milestone.sort_order ?? (index + 1) * 10) || (index + 1) * 10,
    completed_at:
      typeof milestone.done === "boolean" && milestone.done ? new Date().toISOString() : null,
  }));

  const { error: insertError } = await supabaseAdmin
    .from("customer_portal_milestones")
    .insert(rows);

  if (insertError) throw insertError;
}

export async function savePortalClientSyncByQuoteId(
  quoteId: string,
  input: {
    assets?: CustomerPortalAssetInput[];
    revisions?: CustomerPortalRevisionInput[];
  }
) {
  const portal = await ensureCustomerPortalForQuoteId(quoteId);

  if (Array.isArray(input.assets)) {
    for (const asset of input.assets) {
      const payload = {
        portal_project_id: portal.id,
        asset_type: cleanString(asset.category || asset.assetType) || "general",
        label: cleanString(asset.label) || "Client asset",
        asset_url: cleanString(asset.url || asset.assetUrl) || null,
        notes: cleanString(asset.notes) || null,
        status: normalizeAssetStatus(asset.status),
        source: cleanString(asset.source) || "portal_link",
        storage_bucket: cleanString(asset.storageBucket) || null,
        storage_path: cleanString(asset.storagePath) || null,
        file_name: cleanString(asset.fileName) || null,
        mime_type: cleanString(asset.mimeType) || null,
        file_size: Number(asset.fileSize ?? 0) || null,
        updated_at: new Date().toISOString(),
      };

      if (cleanString(asset.id)) {
        const { error } = await supabaseAdmin
          .from("customer_portal_assets")
          .update(payload)
          .eq("portal_project_id", portal.id)
          .eq("id", asset.id);

        if (error) throw error;
      }
    }
  }

  if (Array.isArray(input.revisions)) {
    for (const revision of input.revisions) {
      const payload = {
        portal_project_id: portal.id,
        request_text: cleanString(revision.message || revision.requestText),
        priority: normalizePriority(revision.priority),
        status: normalizeRevisionStatus(revision.status),
        updated_at: new Date().toISOString(),
      };

      if (cleanString(revision.id)) {
        const { error } = await supabaseAdmin
          .from("customer_portal_revisions")
          .update(payload)
          .eq("portal_project_id", portal.id)
          .eq("id", revision.id);

        if (error) throw error;
      }
    }
  }
}
